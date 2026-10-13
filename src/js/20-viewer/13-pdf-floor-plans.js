  // ---- Vector PDF of the floor plans (Studio only): each floor is cut at 1.2 m, and the cut lines are written as real PDF vector paths ----
  const PDF_CUT = 1.2;
  async function deflate(bytes) {
    if (typeof CompressionStream === 'undefined') return null;
    try { return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer()); } catch (err) { return null; }
  }
  async function sliceFloors(bases, onProg, cut = PDF_CUT) {
    model.updateMatrixWorld(true);
    const hs = bases.map(b => b + cut * scale), segs = bases.map(() => []), P = new Float64Array(9);
    let done = 0, total = 0;
    const meshes = []; model.traverse(o => { if (o.isMesh && o.geometry && o.geometry.attributes.position) { meshes.push(o); const g = o.geometry; total += g.index ? g.index.count / 3 : g.attributes.position.count / 3; } });
    for (const o of meshes) {
      const g = o.geometry, e = o.matrixWorld.elements, a = g.attributes.position.array, idx = g.index ? g.index.array : null;
      const tri = idx ? idx.length / 3 : g.attributes.position.count / 3;
      for (let ti = 0; ti < tri; ti++) {
        if ((++done & 0x3ffff) === 0) { onProg(done / total); await sleep(0); }
        let ymin = 1e30, ymax = -1e30;
        for (let v = 0; v < 3; v++) {
          const vi = idx ? idx[3 * ti + v] : 3 * ti + v, x = a[3 * vi], y = a[3 * vi + 1], z = a[3 * vi + 2];
          P[3 * v] = e[0] * x + e[4] * y + e[8] * z + e[12]; P[3 * v + 1] = e[1] * x + e[5] * y + e[9] * z + e[13]; P[3 * v + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
          if (P[3 * v + 1] < ymin) ymin = P[3 * v + 1]; if (P[3 * v + 1] > ymax) ymax = P[3 * v + 1];
        }
        for (let f = 0; f < hs.length; f++) {
          const h = hs[f]; if (h < ymin || h > ymax) continue;
          const pts = [];
          for (let i = 0; i < 3; i++) {
            const j = (i + 1) % 3, da = P[3 * i + 1] - h, db = P[3 * j + 1] - h;
            if ((da >= 0) === (db >= 0)) continue;
            const u = da / (da - db); pts.push(P[3 * i] + (P[3 * j] - P[3 * i]) * u, P[3 * i + 2] + (P[3 * j + 2] - P[3 * i + 2]) * u);
          }
          if (pts.length === 4) segs[f].push(pts[0], pts[1], pts[2], pts[3]);
        }
      }
    }
    return segs;
  }
  // Point clouds have no triangles to cut, so each floor takes the points in a thin slab around the cut height, drops them on a grid (cell size follows the point density) and writes the edges of the filled cells as vector lines.
  async function sliceFloorsPC(bases, onProg, cut = PDF_CUT, half = 0.2) {
    model.updateMatrixWorld(true);
    const g = ptsMain.geometry, a = g.attributes.position.array, n = a.length / 3, e = ptsMain.matrixWorld.elements;
    const lo = bases.map(b => b + (cut - half) * scale), hi = bases.map(b => b + (cut + half) * scale);
    const pts = bases.map(() => []);
    for (let i = 0; i < n; i++) {
      if ((i & 0xfffff) === 0 && i) { onProg(0.5 * i / n); await sleep(0); }
      const x = a[3 * i], y = a[3 * i + 1], z = a[3 * i + 2], wy = e[1] * x + e[5] * y + e[9] * z + e[13];
      for (let f = 0; f < lo.length; f++) if (wy >= lo[f] && wy <= hi[f]) { pts[f].push(e[0] * x + e[4] * y + e[8] * z + e[12], e[2] * x + e[6] * y + e[10] * z + e[14]); break; }
    }
    const out = [];
    for (let f = 0; f < pts.length; f++) {
      onProg(0.5 + 0.5 * f / pts.length); await sleep(0);
      const P = pts[f], m = P.length / 2, segs = [];
      if (m < 50) { out.push(segs); continue; }
      let x0 = 1e30, x1 = -1e30, z0 = 1e30, z1 = -1e30;
      for (let i = 0; i < m; i++) { const x = P[2 * i], z = P[2 * i + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (z < z0) z0 = z; if (z > z1) z1 = z; }
      let c = 0.03 * scale, W = 0, H = 0, cnt = null, med = 0;
      for (const k of [0.03, 0.04, 0.05, 0.06, 0.08, 0.1, 0.14, 0.2]) {
        c = k * scale; W = Math.ceil((x1 - x0) / c) + 3; H = Math.ceil((z1 - z0) / c) + 3;
        if (W * H > 2.5e7) continue;
        cnt = new Uint16Array(W * H);
        for (let i = 0; i < m; i++) { const j = (Math.floor((P[2 * i + 1] - z0) / c) + 1) * W + Math.floor((P[2 * i] - x0) / c) + 1; if (cnt[j] < 65535) cnt[j]++; }
        const nz = []; for (let j = 0; j < cnt.length; j++) if (cnt[j]) nz.push(cnt[j]);
        nz.sort((p, q) => p - q); med = nz.length ? nz[nz.length >> 1] : 0;
        if (med >= 3) break;
      }
      if (!cnt) { out.push(segs); continue; }
      const th = Math.max(2, Math.round(med * 0.4)), occ = new Uint8Array(W * H);
      for (let j = 0; j < cnt.length; j++) occ[j] = cnt[j] >= th ? 1 : 0;
      const keep = new Uint8Array(W * H);   // a filled cell needs at least two filled neighbours, which removes loose specks
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
        const j = y * W + x; if (!occ[j]) continue;
        if (occ[j - 1] + occ[j + 1] + occ[j - W] + occ[j + W] + occ[j - W - 1] + occ[j - W + 1] + occ[j + W - 1] + occ[j + W + 1] >= 2) keep[j] = 1;
      }
      const X = gx => x0 + (gx - 1) * c, Z = gy => z0 + (gy - 1) * c;
      for (let y = 1; y < H - 1; y++) {   // horizontal edges, runs merged
        for (const d of [-1, 1]) {
          let s0 = -1;
          for (let x = 1; x <= W - 1; x++) {
            const on = x < W - 1 && keep[y * W + x] && !keep[(y + d) * W + x];
            if (on && s0 < 0) s0 = x;
            if (!on && s0 >= 0) { const ly = d < 0 ? y : y + 1; segs.push(X(s0), Z(ly), X(x), Z(ly)); s0 = -1; }
          }
        }
      }
      for (let x = 1; x < W - 1; x++) {   // vertical edges, runs merged
        for (const d of [-1, 1]) {
          let s0 = -1;
          for (let y = 1; y <= H - 1; y++) {
            const on = y < H - 1 && keep[y * W + x] && !keep[y * W + x + d];
            if (on && s0 < 0) s0 = y;
            if (!on && s0 >= 0) { const lx = d < 0 ? x : x + 1; segs.push(X(lx), Z(s0), X(lx), Z(y)); s0 = -1; }
          }
        }
      }
      out.push(segs);
    }
    return out;
  }
  function dedupeSegs(arr) {   // identical wall edges seen from several triangles are drawn once (millimetre precision)
    if (arr.length > 4 * 700000) return arr;
    const q = 1000 / scale, seen = new Set(), out = [];
    for (let i = 0; i < arr.length; i += 4) {
      let a = [Math.round(arr[i] * q), Math.round(arr[i + 1] * q), Math.round(arr[i + 2] * q), Math.round(arr[i + 3] * q)];
      if (a[0] === a[2] && a[1] === a[3]) continue;
      if (a[0] > a[2] || (a[0] === a[2] && a[1] > a[3])) a = [a[2], a[3], a[0], a[1]];
      const k = a.join(','); if (seen.has(k)) continue; seen.add(k); out.push(arr[i], arr[i + 1], arr[i + 2], arr[i + 3]);
    }
    return out;
  }
  function headerJpeg(title, sub, wpx) {   // text as a picture, so Hebrew and any other language print correctly
    const c = document.createElement('canvas'); c.width = wpx; c.height = Math.round(wpx * 0.075); const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
    const draw = (txt, y, size, bold, col) => {
      g.font = (bold ? '700 ' : '400 ') + size + 'px "Segoe UI", Arial, sans-serif'; g.fillStyle = col; g.textBaseline = 'alphabetic';
      const rtl = /[֐-׿]/.test(txt); g.direction = rtl ? 'rtl' : 'ltr'; g.textAlign = rtl ? 'right' : 'left';
      g.fillText(txt, rtl ? c.width - 4 : 4, y);
    };
    draw(title, c.height * 0.52, c.height * 0.46, true, '#111'); draw(sub, c.height * 0.92, c.height * 0.3, false, '#555');
    const d = c.toDataURL('image/jpeg', 0.92).split(',')[1], bin = atob(d), u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return { bytes:u, w:c.width, h:c.height };
  }
