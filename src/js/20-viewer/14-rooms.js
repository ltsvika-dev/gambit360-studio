  // ---- Rooms: the inside size and the floor-to-ceiling height of every space, written on the PDF plan ----
  // The cut lines of a floor are drawn on a grid. Free space is pulled away from the walls by about 35 cm, so rooms joined only through doors or windows fall apart;
  // the pieces that do not touch the edge are the rooms, and they are grown back to the walls to measure them.
  function wallAngle(sg) {
    const h = new Float64Array(90);
    for (let i = 0; i < sg.length; i += 4) { const dx = sg[i + 2] - sg[i], dz = sg[i + 3] - sg[i + 1], L = Math.hypot(dx, dz); if (L < 1e-9) continue; let a = Math.atan2(dz, dx) * 180 / Math.PI; a = ((a % 90) + 90) % 90; h[Math.floor(a) % 90] += L; }
    let b = 0, bv = -1; for (let i = 0; i < 90; i++) { const v = h[(i + 89) % 90] + h[i] + h[(i + 1) % 90]; if (v > bv) { bv = v; b = i; } }
    let sw = 0, sa = 0; for (let k = -2; k <= 2; k++) { const w = h[(b + k + 90) % 90]; sw += w; sa += w * (b + k + 0.5); }
    return sw ? sa / sw * Math.PI / 180 : 0;
  }
  async function detectRooms(sg, base, fi) {
    if (sg.length < 16) return [];
    let x0 = 1e30, x1 = -1e30, z0 = 1e30, z1 = -1e30;
    for (let i = 0; i < sg.length; i += 2) { const x = sg[i], z = sg[i + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (z < z0) z0 = z; if (z > z1) z1 = z; }
    const mar = 1.2 * scale; x0 -= mar; x1 += mar; z0 -= mar; z1 += mar;
    let c = 0.05 * scale; while (((x1 - x0) / c + 3) * ((z1 - z0) / c + 3) > 5e6) c *= 1.25;
    const W = Math.ceil((x1 - x0) / c) + 2, H = Math.ceil((z1 - z0) / c) + 2, N = W * H;
    const w1 = new Uint8Array(N);
    for (let i = 0; i < sg.length; i += 4) {
      const ax = sg[i], az = sg[i + 1], bx = sg[i + 2], bz = sg[i + 3], st = Math.max(1, Math.ceil(Math.max(Math.abs(bx - ax), Math.abs(bz - az)) / (c * 0.5)));
      for (let s = 0; s <= st; s++) { const t = s / st, gx = Math.floor((ax + (bx - ax) * t - x0) / c), gy = Math.floor((az + (bz - az) * t - z0) / c); w1[gy * W + gx] = 1; }
      if ((i & 0xfffff) === 0) await sleep(0);
    }
    // walls are made fatter (about 15 cm each side) which closes gaps in the scan of up to ~30 cm; doors stay open
    const fat = Math.max(1, Math.round(0.15 * scale / c));
    let wall = w1;
    for (let it = 0; it < fat; it++) {
      const nw = new Uint8Array(N);
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const j = y * W + x; if (wall[j] || wall[j - 1] || wall[j + 1] || wall[j - W] || wall[j + W] || wall[j - W - 1] || wall[j - W + 1] || wall[j + W - 1] || wall[j + W + 1]) nw[j] = 1; }
      wall = nw; await sleep(0);
    }
    const D = new Int32Array(N).fill(1e9);   // distance to the nearest wall, in thirds of a cell (3-4 chamfer)
    for (let j = 0; j < N; j++) if (wall[j]) D[j] = 0;
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const j = y * W + x; let d = D[j]; d = Math.min(d, D[j - 1] + 3, D[j - W] + 3, D[j - W - 1] + 4, D[j - W + 1] + 4); D[j] = d; }
    for (let y = H - 2; y >= 1; y--) for (let x = W - 2; x >= 1; x--) { const j = y * W + x; let d = D[j]; d = Math.min(d, D[j + 1] + 3, D[j + W] + 3, D[j + W + 1] + 4, D[j + W - 1] + 4); D[j] = d; }
    await sleep(0);
    const rr = Math.round(0.30 * scale / c * 3);
    const lab = new Int32Array(N), comps = [null], qu = new Int32Array(N);
    for (let j0 = 0; j0 < N; j0++) {
      if (lab[j0] || D[j0] <= rr) continue;
      const id = comps.length; let qh = 0, qt = 0, edge = false, cnt = 0; qu[qt++] = j0; lab[j0] = id;
      while (qh < qt) {
        const j = qu[qh++], x = j % W, y = (j - x) / W; cnt++;
        if (x <= 1 || y <= 1 || x >= W - 2 || y >= H - 2) edge = true;
        for (const nj of [j - 1, j + 1, j - W, j + W]) if (nj >= 0 && nj < N && !lab[nj] && D[nj] > rr) { lab[nj] = id; qu[qt++] = nj; }
      }
      comps.push({ edge, cnt });
    }
    // grow every piece back toward the walls (a few cells, never through a wall)
    const lvl = new Uint16Array(N); let qh = 0, qt = 0;
    for (let j = 0; j < N; j++) if (lab[j]) qu[qt++] = j;
    const maxL = Math.ceil(rr / 3) + 3;
    while (qh < qt) {
      const j = qu[qh++], l = lvl[j]; if (l >= maxL) continue;
      for (const nj of [j - 1, j + 1, j - W, j + W]) if (nj >= 0 && nj < N && !lab[nj] && !wall[nj]) { lab[nj] = lab[j]; lvl[nj] = l + 1; qu[qt++] = nj; }
    }
    const lat = Math.max(1, Math.round(0.4 * scale / c));
    const th = wallAngle(sg), ct = Math.cos(th), sn = Math.sin(th);
    const reg = comps.map(() => ({ u:[], v:[], n:0, best:-1, bd:-1, cells:[], all:[] }));
    for (let j = 0; j < N; j++) {
      const id = lab[j]; if (!id || comps[id].edge) continue;
      const x = j % W, y = (j - x) / W, wx = x0 + (x + 0.5) * c, wz = z0 + (y + 0.5) * c, r = reg[id];
      r.u.push(wx * ct + wz * sn); r.v.push(-wx * sn + wz * ct); r.n++;
      if (D[j] > r.bd) { r.bd = D[j]; r.best = j; }
      if (D[j] > 0.75 * rr + 30) r.cells.push(j);
      if (D[j] > 6 && ((x % lat) === 0) && ((y % lat) === 0)) r.all.push(j);   // a lattice about 40 cm apart, for the ceiling profile
    }
    const up = new THREE.Vector3(0, 1, 0), out = [];
    const tags = views.filter(v => v.room && v.p), tagAt = v => lab[Math.floor((v.p[2] - z0) / c) * W + Math.floor((v.p[0] - x0) / c)] || 0;
    const nextBase = fi + 1 < floors.length ? floors[fi + 1] : 1e30;
    for (let id = 1; id < comps.length; id++) {
      const r = reg[id]; if (comps[id].edge || r.n * c * c < 1.5 * scale * scale) continue;
      const trim = a => { a.sort((p, q) => p - q); const lo = a[Math.floor(a.length * 0.01)], hi = a[Math.min(a.length - 1, Math.floor(a.length * 0.99))]; return hi - lo + 2 * fat * c; };   // + what the walls were fattened by
      let w = trim(r.u), d = trim(r.v); if (d > w) [w, d] = [d, w];
      const bx = r.best % W, by = (r.best - bx) / W, cx = x0 + (bx + 0.5) * c, cz = z0 + (by + 0.5) * c;
      const pick = []; const cl = r.cells.length ? r.cells : [r.best];
      for (let k = 0; k < Math.min(5, cl.length); k++) { const j = cl[Math.floor(k * cl.length / Math.min(5, cl.length))], gx = j % W, gy = (j - gx) / W; pick.push([x0 + (gx + 0.5) * c, z0 + (gy + 0.5) * c]); }
      const keepClip = clipY; clipY = Infinity;
      const hs = [];
      let lp = r.all.length > 60 ? Array.from({ length: 60 }, (_, k) => r.all[Math.floor(k * r.all.length / 60)]) : r.all.slice();
      if (lp.length < 5) lp = lp.concat(cl.slice(0, 5));
      const pts = lp.map(j => { const gx = j % W, gy = (j - gx) / W; return [x0 + (gx + 0.5) * c, z0 + (gy + 0.5) * c]; });
      for (const [px, pz] of pts) {
        ray.set(new THREE.Vector3(px, base + 1.2 * scale, pz), up); ray.far = Math.min(6 * scale, nextBase - base - 1.25 * scale + 0.3 * scale);
        const hit = pointMode ? pcCast()[0] : ray.intersectObject(model, true)[0];
        if (hit) hs.push(hit.point.y - base);
      }
      clipY = keepClip;
      hs.sort((p, q) => p - q);
      const hgt = hs.length ? hs[Math.min(hs.length - 1, Math.floor(hs.length * 0.7))] : 0;   // the ceiling itself: beams and pipes only pull the low end down
      // a beam: a group of clearly lower readings (at least 12 cm under the ceiling); the clear height under it is their median
      const lows = hs.filter(v => v < hgt - 0.12 * scale && v > 1.5 * scale);
      const beam = lows.length >= Math.max(3, Math.ceil(hs.length * 0.06)) ? lows[lows.length >> 1] : 0;
      const tag = tags.find(v => tagAt(v) === id);
      out.push({ cx, cz, w, d, area:r.n * c * c, h:hgt, beam, name:tag ? tag.n : '' });
      await sleep(0);
    }
    return out;
  }

