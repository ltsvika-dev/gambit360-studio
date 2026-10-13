  // ---- Snapshot: the current view with the logo and project name ----
  function screenshot() {
    renderer.render(scene, camera);
    const src = renderer.domElement, W = src.width, H = src.height, k = W / innerWidth;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'); g.drawImage(src, 0, 0);
    const img = document.querySelector('#logo img'), m = 16 * k, pad = 10 * k;
    if (img && img.naturalWidth) {
      const lw = Math.min(190 * k, W * 0.22), lh = lw * img.naturalHeight / img.naturalWidth;
      g.fillStyle = '#fff'; g.beginPath();
      if (g.roundRect) g.roundRect(m, H - m - lh - 2 * pad, lw + 2 * pad, lh + 2 * pad, 8 * k); else g.rect(m, H - m - lh - 2 * pad, lw + 2 * pad, lh + 2 * pad);
      g.fill(); g.drawImage(img, m + pad, H - m - lh - pad, lw, lh);
    }
    const d = new Date(), stamp = d.toLocaleDateString(LANG === 'he' ? 'he-IL' : 'en-GB');
    g.font = (15 * k) + 'px sans-serif'; g.textAlign = 'right'; g.fillStyle = '#fff';
    g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = 4 * k;
    g.fillText(((window.PROJ_TITLE || currentName) ? (window.PROJ_TITLE || currentName) + '  ·  ' : '') + stamp, W - m, H - m);
    c.toBlob(b => {
      if (!b) return;
      const a = document.createElement('a'), p2 = n => String(n).padStart(2, '0');
      a.href = URL.createObjectURL(b);
      a.download = 'Gambit360-' + (currentName || 'tour').replace(/[\\/:*?"<>|]+/g, '_') + '-' + d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + '-' + p2(d.getHours()) + p2(d.getMinutes()) + '.png';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }, 'image/png');
  }

  //<<AUTOROUTE
  // Automatic walk through a mesh: finds the floor, marks where a person fits, and plans a path through the open areas.
  // tris: Float32Array of triangles (x,y,z * 3), Y up, in the model's own units; unit = size of 1 metre in those units.
  function autoRoute(tris, unit, maxLen, forceY0) {
    const U = unit || 1, cs = 0.25 * U, nT = tris.length / 9;
    let x0 = 1e30, x1 = -1e30, y0 = 1e30, y1 = -1e30, z0 = 1e30, z1 = -1e30;
    for (let i = 0; i < tris.length; i += 3) {
      const x = tris[i], y = tris[i + 1], z = tris[i + 2];
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z;
    }
    // 1. the floor: the height with the most upward-facing horizontal area (looking at the lower part of the building)
    const bin = 0.15 * U, nb = Math.ceil((y1 - y0) / bin) + 2, up = new Float64Array(nb);
    const nrm = (k, o) => {
      const ax = tris[k + 3] - tris[k], ay = tris[k + 4] - tris[k + 1], az = tris[k + 5] - tris[k + 2];
      const bx = tris[k + 6] - tris[k], by = tris[k + 7] - tris[k + 1], bz = tris[k + 8] - tris[k + 2];
      o[0] = ay * bz - az * by; o[1] = az * bx - ax * bz; o[2] = ax * by - ay * bx; return Math.hypot(o[0], o[1], o[2]);
    };
    const n = [0, 0, 0];
    for (let t = 0; t < nT; t++) {
      const k = t * 9, len = nrm(k, n);
      if (len < 1e-12 || Math.abs(n[1] / len) < 0.9) continue;
      const yy = (tris[k + 1] + tris[k + 4] + tris[k + 7]) / 3;
      up[Math.floor((yy - y0) / bin)] += len / 2;
    }
    // winding may be flipped: also count downward faces and use the better of the two, preferring the lowest strong peak
    const dn = new Float64Array(nb);
    for (let t = 0; t < nT; t++) {
      const k = t * 9, len = nrm(k, n);
      if (len < 1e-12 || Math.abs(n[1] / len) < 0.9) continue;
      if (n[1] < 0) dn[Math.floor((((tris[k + 1] + tris[k + 4] + tris[k + 7]) / 3) - y0) / bin)] += len / 2;
    }
    const best = h => { const s = h.map((_, i) => (h[i - 1] || 0) + h[i] + (h[i + 1] || 0)); let top = Math.max(...s), pick = -1; for (let i = 0; i < nb; i++) if (s[i] >= 0.5 * top && s[i] >= (s[i - 1] || 0) && s[i] >= (s[i + 1] || 0)) { pick = i; break; } return { i:pick, w:top }; };
    let fl = best(up);
    let Y0 = y0 + (fl.i + 0.5) * bin;
    if (forceY0 !== undefined) {   // a floor chosen by the caller: the strongest floor surface within ~0.5 m of that height
      let bi = -1, bw = 0; for (let i = 0; i < nb; i++) { if (Math.abs(y0 + (i + 0.5) * bin - forceY0) > 0.5 * U) continue; const w = (up[i - 1] || 0) + up[i] + (up[i + 1] || 0); if (w > bw) { bw = w; bi = i; } }
      if (bi < 0) return [];
      Y0 = y0 + (bi + 0.5) * bin;
    }   // forceY0: the walk of one chosen floor of a building with several floors
    // 2. grids
    const NX = Math.ceil((x1 - x0) / cs) + 3, NZ = Math.ceil((z1 - z0) / cs) + 3;
    if (NX * NZ > 4e6) return [];
    const floorM = new Uint8Array(NX * NZ), blk = new Uint8Array(NX * NZ);   // blk counts how many wall samples fall in a cell
    const cx = x => Math.floor((x - x0) / cs) + 1, cz = z => Math.floor((z - z0) / cs) + 1;
    const hLo = Y0 + 0.30 * U, hHi = Y0 + 1.8 * U;
    const p = [0, 0, 0];
    for (let t = 0; t < nT; t++) {
      const k = t * 9, len = nrm(k, n);
      if (len < 1e-14) continue;
      const ymin = Math.min(tris[k + 1], tris[k + 4], tris[k + 7]), ymax = Math.max(tris[k + 1], tris[k + 4], tris[k + 7]);
      const isFlat = Math.abs(n[1] / len) > 0.9;
      if (isFlat && ymax < Y0 + 0.2 * U && ymin > Y0 - 0.2 * U) {   // floor: mark the cells the triangle covers
        const m = Math.max(1, Math.ceil(Math.max(Math.hypot(tris[k + 3] - tris[k], tris[k + 5] - tris[k + 2]), Math.hypot(tris[k + 6] - tris[k], tris[k + 8] - tris[k + 2]), Math.hypot(tris[k + 6] - tris[k + 3], tris[k + 8] - tris[k + 5])) / (cs * 0.5)));
        for (let a = 0; a <= m; a++) for (let b = 0; b <= m - a; b++) {
          const u = a / m, v = b / m, w = 1 - u - v;
          const X = tris[k] * w + tris[k + 3] * u + tris[k + 6] * v, Z = tris[k + 2] * w + tris[k + 5] * u + tris[k + 8] * v;
          floorM[cz(Z) * NX + cx(X)] = 1;
        }
        continue;
      }
      if (ymax < hLo || ymin > hHi || Math.abs(n[1] / len) > 0.5) continue;   // does not reach body height (or is a flat ceiling/table top)
      const m = Math.max(1, Math.ceil(Math.max(Math.hypot(tris[k + 3] - tris[k], tris[k + 4] - tris[k + 1], tris[k + 5] - tris[k + 2]), Math.hypot(tris[k + 6] - tris[k], tris[k + 7] - tris[k + 1], tris[k + 8] - tris[k + 2]), Math.hypot(tris[k + 6] - tris[k + 3], tris[k + 7] - tris[k + 4], tris[k + 8] - tris[k + 5])) / (cs * 0.5)));
      for (let a = 0; a <= m; a++) for (let b = 0; b <= m - a; b++) {
        const u = a / m, v = b / m, w = 1 - u - v;
        const Y = tris[k + 1] * w + tris[k + 4] * u + tris[k + 7] * v;
        if (Y < hLo || Y > hHi) continue;
        const X = tris[k] * w + tris[k + 3] * u + tris[k + 6] * v, Z = tris[k + 2] * w + tris[k + 5] * u + tris[k + 8] * v;
        { const ci = cz(Z) * NX + cx(X); if (blk[ci] < 255) blk[ci]++; }
      }
    }
    // 3. free cells and clearance (distance to the nearest blocked or missing floor cell, in cells)
    const free = new Uint8Array(NX * NZ); let nFree = 0;
    for (let i = 0; i < NX * NZ; i++) if (floorM[i] && blk[i] < 2) { free[i] = 1; nFree++; }
    if (nFree < 20) return [];
    const INF = 1e9, d = new Float32Array(NX * NZ);
    for (let i = 0; i < NX * NZ; i++) d[i] = free[i] ? INF : 0;
    const S2 = Math.SQRT2;
    for (let z = 1; z < NZ - 1; z++) for (let x = 1; x < NX - 1; x++) { const i = z * NX + x; if (!d[i]) continue; d[i] = Math.min(d[i], d[i - 1] + 1, d[i - NX] + 1, d[i - NX - 1] + S2, d[i - NX + 1] + S2); }
    for (let z = NZ - 2; z > 0; z--) for (let x = NX - 2; x > 0; x--) { const i = z * NX + x; if (!d[i]) continue; d[i] = Math.min(d[i], d[i + 1] + 1, d[i + NX] + 1, d[i + NX + 1] + S2, d[i + NX - 1] + S2); }
    const MINC = 1.5;   // at least ~0.4 m from anything
    const ok = i => free[i] && d[i] >= MINC;
    // 4. biggest connected open area
    const comp = new Int32Array(NX * NZ); let bestC = 0, bestN = 0, cid = 0;
    const q = new Int32Array(NX * NZ);
    for (let s = 0; s < NX * NZ; s++) {
      if (!ok(s) || comp[s]) continue;
      cid++; let h = 0, tl = 0; q[tl++] = s; comp[s] = cid;
      while (h < tl) { const i = q[h++]; for (const j of [i - 1, i + 1, i - NX, i + NX]) if (ok(j) && !comp[j]) { comp[j] = cid; q[tl++] = j; } }
      if (tl > bestN) { bestN = tl; bestC = cid; }
    }
    if (bestN < 12) return [];
    const inC = i => comp[i] === bestC;
    // 5. Dijkstra over the open area; cost favours staying away from walls
    const cost = i => 1 + 3 / Math.max(1, d[i] - 1);
    const dijkstra = (srcs) => {
      const dist = new Float64Array(NX * NZ).fill(INF), prev = new Int32Array(NX * NZ).fill(-1);
      const heap = []; const push = (c, i) => { heap.push([c, i]); let k = heap.length - 1; while (k > 0) { const pa = (k - 1) >> 1; if (heap[pa][0] <= heap[k][0]) break; [heap[pa], heap[k]] = [heap[k], heap[pa]]; k = pa; } };
      const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { let l = 2 * k + 1, r = l + 1, m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
      srcs.forEach(s => { dist[s] = 0; push(0, s); });
      while (heap.length) {
        const [c, i] = pop(); if (c > dist[i]) continue;
        for (const [j, w] of [[i - 1, 1], [i + 1, 1], [i - NX, 1], [i + NX, 1], [i - NX - 1, S2], [i - NX + 1, S2], [i + NX - 1, S2], [i + NX + 1, S2]]) {
          if (!inC(j)) continue;
          const nc = c + w * cost(j); if (nc < dist[j]) { dist[j] = nc; prev[j] = i; push(nc, j); }
        }
      }
      return { dist, prev };
    };
    // The walk goes from one end of the open area to the other (the two places farthest apart along the way), and is cut to the length budget.
    const far = from => { const { dist, prev } = dijkstra([from]); let t = from, m = -1; for (let i = 0; i < NX * NZ; i++) if (inC(i) && dist[i] < INF && dist[i] > m) { m = dist[i]; t = i; } return { t, prev }; };
    let mid = -1, bd = -1;
    for (let i = 0; i < NX * NZ; i++) if (inC(i) && d[i] > bd) { bd = d[i]; mid = i; }
    const A = far(mid).t, fb = far(A), B = fb.t;
    let path = []; for (let i = B; i >= 0; i = fb.prev[i]) path.push(i);   // prev leads back to A
    path.reverse();
    const limit = (maxLen || 32) * U / cs;   // length budget in cells
    if (path.length > limit) path = path.slice(0, Math.floor(limit));
    // 6. cells -> world points, thinned to one point per metre; the corners are rounded off only as far as the straight pieces still stay on free floor
    const pts = path.map(i => [x0 + ((i % NX) - 0.5) * cs, 0, z0 + (Math.floor(i / NX) - 0.5) * cs]);
    const thin = (arr, step) => { const o = [arr[0]]; let acc = 0; for (let i = 1; i < arr.length; i++) { acc += Math.hypot(arr[i][0] - arr[i - 1][0], arr[i][2] - arr[i - 1][2]); if (acc >= step || i === arr.length - 1) { o.push(arr[i]); acc = 0; } } return o; };
    const clear = (a, b) => { const L = Math.hypot(b[0] - a[0], b[2] - a[2]), m = Math.max(1, Math.ceil(L / (cs * 0.5))); for (let k = 0; k <= m; k++) { const x = a[0] + (b[0] - a[0]) * k / m, z = a[2] + (b[2] - a[2]) * k / m; if (!free[cz(z) * NX + cx(x)]) return false; } return true; };
    const valid = arr => { for (let i = 1; i < arr.length; i++) if (!clear(arr[i - 1], arr[i])) return false; return true; };
    let out = null;
    for (const w of [4, 3, 2, 1, 0]) {
      const sm = pts.map((pt, i) => { if (!w) return pt; let sx = 0, sz = 0, c = 0; for (let k = -w; k <= w; k++) { const q2 = pts[Math.max(0, Math.min(pts.length - 1, i + k))]; sx += q2[0]; sz += q2[2]; c++; } return [sx / c, 0, sz / c]; });
      sm[0] = pts[0]; sm[sm.length - 1] = pts[pts.length - 1];
      const cand = thin(sm, 1.0 * U);
      if (valid(cand)) { out = cand; break; }
    }
    if (!out) out = thin(pts, 1.0 * U);
    const eye = Y0 + 1.6 * U;
    return out.map(a => { const dv = d[cz(a[2]) * NX + cx(a[0])]; return [a[0], eye, a[2], dv < INF ? dv * cs / U : 0]; });   // 4th value: free space around the point in metres (how big the room is)
  }
  //>>AUTOROUTE
  // The triangles of the loaded model in world coordinates (for planning the walk of the promo video).
  function meshTris() {
    model.updateMatrixWorld(true);
    const list = []; let n = 0;
    model.traverse(m => { if (m.isMesh && m.geometry && m.geometry.attributes.position) { const idx = m.geometry.index; n += idx ? idx.count : m.geometry.attributes.position.count; list.push(m); } });
    const out = new Float32Array(n * 3), v = new THREE.Vector3(); let o = 0;
    list.forEach(m => {
      const pos = m.geometry.attributes.position, idx = m.geometry.index, cnt = idx ? idx.count : pos.count, mw = m.matrixWorld;
      for (let i = 0; i < cnt; i++) { v.fromBufferAttribute(pos, idx ? idx.getX(i) : i).applyMatrix4(mw); out[o++] = v.x; out[o++] = v.y; out[o++] = v.z; }
    });
    return out.subarray(0, o - (o % 9));
  }
