  // ---- Low walls: parapets and half-height partitions are below the 1.2 m cut. The floor is also cut lower down (30 cm ... 1.05 m);
  // what shows there but not at 1.2 m, and is long enough, is a low wall. Its height is where it stops showing in the higher cuts. ----
  const LOW_CUTS = [0.3, 0.5, 0.7, 0.9, 1.05];
  async function detectLowWalls(hiSegs, lv) {
    const L0 = lv[0]; if (!L0 || L0.length < 16) return { segs: [], items: [] };
    let x0 = 1e30, x1 = -1e30, z0 = 1e30, z1 = -1e30;
    for (const A of [L0, hiSegs]) for (let i = 0; i < A.length; i += 2) { const x = A[i], z = A[i + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (z < z0) z0 = z; if (z > z1) z1 = z; }
    x0 -= 0.5 * scale; z0 -= 0.5 * scale; x1 += 0.5 * scale; z1 += 0.5 * scale;
    let c = 0.1 * scale; while (((x1 - x0) / c + 3) * ((z1 - z0) / c + 3) > 4e6) c *= 1.25;
    const W = Math.ceil((x1 - x0) / c) + 2, H = Math.ceil((z1 - z0) / c) + 2, N = W * H;
    const stamp = A => {
      const g = new Uint8Array(N);
      for (let i = 0; i < A.length; i += 4) {
        const ax = A[i], az = A[i + 1], bx = A[i + 2], bz = A[i + 3], st = Math.max(1, Math.ceil(Math.max(Math.abs(bx - ax), Math.abs(bz - az)) / (c * 0.5)));
        for (let q = 0; q <= st; q++) { const u = q / st; g[Math.floor((az + (bz - az) * u - z0) / c) * W + Math.floor((ax + (bx - ax) * u - x0) / c)] = 1; }
      }
      return g;
    };
    const grow = (g, n) => { for (let it = 0; it < n; it++) { const o = new Uint8Array(N); for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const j = y * W + x; if (g[j] || g[j - 1] || g[j + 1] || g[j - W] || g[j + W] || g[j - W - 1] || g[j - W + 1] || g[j + W - 1] || g[j + W + 1]) o[j] = 1; } g = o; } return g; };
    const hiN = grow(stamp(hiSegs), 2); await sleep(0);
    const l0 = grow(stamp(L0), 1), lo = new Uint8Array(N);
    for (let j = 0; j < N; j++) if (l0[j] && !hiN[j]) lo[j] = 1;
    const lab = new Int32Array(N), pieces = [], qu = new Int32Array(N);
    for (let j0 = 0; j0 < N; j0++) {
      if (!lo[j0] || lab[j0]) continue;
      const id = pieces.length + 1; let qh = 0, qt = 0; qu[qt++] = j0; lab[j0] = id;
      let mnx = 1e9, mxx = -1, mny = 1e9, mxy = -1;
      while (qh < qt) {
        const j = qu[qh++], x = j % W, y = (j - x) / W;
        if (x < mnx) mnx = x; if (x > mxx) mxx = x; if (y < mny) mny = y; if (y > mxy) mxy = y;
        for (const dy of [-1, 0, 1]) for (const dx of [-1, 0, 1]) { const nj = j + dy * W + dx; if (nj >= 0 && nj < N && lo[nj] && !lab[nj]) { lab[nj] = id; qu[qt++] = nj; } }
      }
      pieces.push({ id, cells: Array.from(qu.subarray(0, qt)), diag: Math.hypot(mxx - mnx, mxy - mny) * c });
    }
    const keep = pieces.filter(pc => pc.cells.length >= 12 && pc.diag >= 1.5 * scale && pc.cells.length / (pc.diag / c) <= 6).sort((a, b) => b.cells.length - a.cells.length).slice(0, 40);
    if (!keep.length) return { segs: [], items: [] };
    const lvN = [];
    for (let i = 1; i < lv.length; i++) { lvN.push(grow(stamp(lv[i]), 1)); await sleep(0); }
    const items = [], mine = new Map();
    for (const pc of keep) {
      let top = 0;
      for (let i = 0; i < lvN.length; i++) { let n = 0; for (const j of pc.cells) n += lvN[i][j]; if (n / pc.cells.length >= 0.5) top = i + 1; else break; }
      if (top >= lv.length - 1 && lvN.length) { /* still there at the highest low cut: only just below 1.2 m */ }
      const upper = top + 1 < LOW_CUTS.length ? LOW_CUTS[top + 1] : PDF_CUT;
      let sx = 0, sz = 0; for (const j of pc.cells) { sx += j % W; sz += Math.floor(j / W); }
      sx /= pc.cells.length; sz /= pc.cells.length;
      let bj = pc.cells[0], bd = 1e30; for (const j of pc.cells) { const d = Math.hypot(j % W - sx, Math.floor(j / W) - sz); if (d < bd) { bd = d; bj = j; } }
      items.push({ cx: x0 + (bj % W + 0.5) * c, cz: z0 + (Math.floor(bj / W) + 0.5) * c, h: (LOW_CUTS[top] + upper) / 2 * scale, len: pc.diag });
      for (const j of pc.cells) mine.set(j, pc.id);
    }
    const segs = [];
    for (let i = 0; i < L0.length; i += 4) {
      const mx = (L0[i] + L0[i + 2]) / 2, mz = (L0[i + 1] + L0[i + 3]) / 2;
      if (mine.has(Math.floor((mz - z0) / c) * W + Math.floor((mx - x0) / c)) && !hiN[Math.floor((mz - z0) / c) * W + Math.floor((mx - x0) / c)]) segs.push(L0[i], L0[i + 1], L0[i + 2], L0[i + 3]);
    }
    return { segs, items };
  }
  // Labels that would sit on top of each other are moved aside: every label tries its own spot first, then spots around it, and keeps the first one that is free.
  function spreadLabels(items, pad) {   // items: { x, y, w, h } (x, y = lower left), moved in place; earlier items keep their place
    const hit = (a, b) => a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad, placed = [];
    for (const it of items) {
      const x0 = it.x, y0 = it.y; let ok = placed.every(q => !hit(it, q));
      for (let ring = 1; !ok && ring <= 4; ring++) {
        for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
          it.x = x0 + dx * ring * (it.w + pad); it.y = y0 + dy * ring * (it.h + pad);
          if (placed.every(q => !hit(it, q))) { ok = true; break; }
        }
      }
      if (!ok) { it.x = x0; it.y = y0; }
      placed.push(it);
    }
  }
  function roomLabelJpeg(lines) {
    const S = 2, fs = 17 * S, pad = 7 * S, cv = document.createElement('canvas'), g = cv.getContext('2d');
    g.font = '600 ' + fs + 'px "Segoe UI", Arial, sans-serif';
    const w = Math.ceil(Math.max(...lines.map(l => g.measureText(l.txt).width))) + 2 * pad, lh = fs * 1.28, h = Math.ceil(lines.length * lh + 2 * pad - fs * 0.1);
    cv.width = w; cv.height = h;
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.strokeStyle = '#999'; g.lineWidth = 1.5; g.strokeRect(0.75, 0.75, w - 1.5, h - 1.5);
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    lines.forEach((l, i) => { g.font = (l.b ? '700 ' : '500 ') + fs + 'px "Segoe UI", Arial, sans-serif'; g.fillStyle = l.b ? '#000' : '#333'; g.direction = /[֐-׿]/.test(l.txt) ? 'rtl' : 'ltr'; g.fillText(l.txt, w / 2, pad + fs * 0.88 + i * lh); });
    const d = cv.toDataURL('image/jpeg', 0.92).split(',')[1], bin = atob(d), u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return { bytes:u, w, h };
  }
  async function buildPdf(floorSegs, labels, title, onProg, floorRooms, floorLow) {
    const enc = new TextEncoder(), parts = [], offs = []; let len = 0;
    const push = x => { const b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); len += b.length; };
    const obj = (n, body) => { offs[n] = len; push(n + ' 0 obj\n'); push(body); push('\nendobj\n'); };
    const streamObj = (n, dict, bytes) => { offs[n] = len; push(n + ' 0 obj\n<< ' + dict + ' /Length ' + bytes.length + ' >>\nstream\n'); push(bytes); push('\nendstream\nendobj\n'); };
    push('%PDF-1.5\n%\xE2\xE3\xCF\xD3\n');
    const N = floorSegs.length, pageIds = [], A3 = [841.89, 1190.55], M = 36, HEAD = 56;
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(3, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    let next = 4;
    const date = new Date().toISOString().slice(0, 10);
    for (let f = 0; f < N; f++) {
      onProg(f / N);
      const sg = floorSegs[f]; let x0 = 1e30, x1 = -1e30, z0 = 1e30, z1 = -1e30;
      for (let i = 0; i < sg.length; i += 2) { const x = sg[i], z = sg[i + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (z < z0) z0 = z; if (z > z1) z1 = z; }
      if (!sg.length) { x0 = z0 = 0; x1 = z1 = scale; }
      const wm = (x1 - x0) / scale, hm = (z1 - z0) / scale, land = wm >= hm;
      const PW = land ? A3[1] : A3[0], PH = land ? A3[0] : A3[1];
      const aw = PW - 2 * M, ah = PH - 2 * M - HEAD - 40;
      let ratio = 500; for (const r of [20, 25, 50, 75, 100, 125, 150, 200, 250, 300, 400, 500, 750, 1000, 1500, 2000]) { const k = 2834.646 / r; if (wm * k <= aw && hm * k <= ah) { ratio = r; break; } }
      const k = 2834.646 / ratio;   // PDF points per metre
      const ox = M + (aw - wm * k) / 2, oy = M + 40 + (ah - hm * k) / 2;
      const X = x => (ox + (x - x0) / scale * k).toFixed(2), Y = z => (oy + (z1 - z) / scale * k).toFixed(2);
      let c = '1 J 1 j 0.45 w 0.1 0.1 0.1 RG\n';
      let n = 0; const flush = () => { if (n) { c += 'S\n'; n = 0; } };
      for (let i = 0; i < sg.length; i += 4) { c += X(sg[i]) + ' ' + Y(sg[i + 1]) + ' m ' + X(sg[i + 2]) + ' ' + Y(sg[i + 3]) + ' l\n'; if (++n >= 4000) flush(); }
      flush();
      const lw0 = floorLow && floorLow[f];
      if (lw0 && lw0.segs.length) {   // low walls: dashed grey
        c += 'q 0.35 0.35 0.35 RG 0.9 w [4 2.5] 0 d\n'; let n2 = 0;
        for (let i = 0; i < lw0.segs.length; i += 4) { c += X(lw0.segs[i]) + ' ' + Y(lw0.segs[i + 1]) + ' m ' + X(lw0.segs[i + 2]) + ' ' + Y(lw0.segs[i + 3]) + ' l\n'; if (++n2 >= 4000) { c += 'S\n'; n2 = 0; } }
        if (n2) c += 'S\n'; c += 'Q\n';
      }
      const rimgs = [];   // one small picture per room: name, size, area, height
      (floorRooms && floorRooms[f] || []).forEach(r => {
        const m = v => (v / scale).toFixed(2), lines = [];
        if (r.name) lines.push({ txt:r.name, b:true });
        lines.push({ txt:m(r.w) + ' x ' + m(r.d) + ' m', b:!r.name });   // numbers and units in Latin letters so they read the same in every language
        lines.push({ txt:(r.area / (scale * scale)).toFixed(1) + ' m² · H ' + m(r.h) + ' m' });
        if (r.beam) lines.push({ txt:'H ' + m(r.beam) + ' m (beam)' });
        const im = roomLabelJpeg(lines), lw = Math.max(56, Math.min(150, Math.sqrt(r.area) / scale * k * 0.8)), lhh = lw * im.h / im.w;
        rimgs.push({ im, lw, lhh, x:ox + (r.cx - x0) / scale * k - lw / 2, y:oy + (z1 - r.cz) / scale * k - lhh / 2 });
      });
      (lw0 ? lw0.items : []).forEach(r => {
        const im = roomLabelJpeg([{ txt:'H ' + (r.h / scale).toFixed(2) + ' m', b:false }]), lw = 40, lhh = lw * im.h / im.w;
        rimgs.push({ im, lw, lhh, x:ox + (r.cx - x0) / scale * k - lw / 2, y:oy + (z1 - r.cz) / scale * k + 4 });
      });
      spreadLabels(rimgs.map(r => ({ get x() { return r.x; }, set x(v) { r.x = v; }, get y() { return r.y; }, set y(v) { r.y = v; }, w: r.lw, h: r.lhh })), 3);
      rimgs.forEach((r, i) => { c += 'q ' + r.lw.toFixed(2) + ' 0 0 ' + r.lhh.toFixed(2) + ' ' + r.x.toFixed(2) + ' ' + r.y.toFixed(2) + ' cm /R' + i + ' Do Q\n'; });
      // scale bar (1 m / 5 m) and a north arrow, plus a small footer
      const bx = M, by = M + 14, m5 = 5 * k;
      c += '0 0 0 RG 0.8 w ' + bx + ' ' + by + ' m ' + (bx + m5) + ' ' + by + ' l S\n';
      for (let i = 0; i <= 5; i++) c += (bx + i * k).toFixed(2) + ' ' + by + ' m ' + (bx + i * k).toFixed(2) + ' ' + (by + (i % 5 === 0 ? 7 : 4)) + ' l S\n';
      c += 'BT /F1 8 Tf ' + bx + ' ' + (by - 11) + ' Td (0) Tj ET\nBT /F1 8 Tf ' + (bx + m5 - 6) + ' ' + (by - 11) + ' Td (5 m) Tj ET\n';
      c += 'BT /F1 9 Tf ' + (bx + m5 + 18) + ' ' + (by - 2) + ' Td (Scale 1:' + ratio + '  -  A3  -  cut at ' + PDF_CUT + ' m) Tj ET\n';
      const nx = PW - M - 14, ny = M + 12;
      c += '0 0 0 rg ' + nx + ' ' + (ny + 24) + ' m ' + (nx - 6) + ' ' + ny + ' l ' + (nx + 6) + ' ' + ny + ' l f BT /F1 9 Tf ' + (nx - 3) + ' ' + (ny + 28) + ' Td (N) Tj ET\n';
      if (!customLogo) c += 'BT /F1 7 Tf 0.4 g ' + (PW / 2 - 90) + ' 14 Td (Gambit360 - gambit360.co.il) Tj ET\n';
      const hd = headerJpeg(title, labels[f] + '   |   ' + date, 1800), hw = PW - 2 * M, hh = hw * hd.h / hd.w;
      c += 'q ' + hw + ' 0 0 ' + hh.toFixed(2) + ' ' + M + ' ' + (PH - M - hh).toFixed(2) + ' cm /Im0 Do Q\n';
      const cb = enc.encode(c), z = await deflate(cb);
      const pid = next++, cid = next++, iid = next++, rids = rimgs.map(() => next++);
      streamObj(cid, z ? '/Filter /FlateDecode' : '', z || cb);
      rimgs.forEach((r, i) => streamObj(rids[i], '/Type /XObject /Subtype /Image /Width ' + r.im.w + ' /Height ' + r.im.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode', r.im.bytes));
      streamObj(iid, '/Type /XObject /Subtype /Image /Width ' + hd.w + ' /Height ' + hd.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode', hd.bytes);
      obj(pid, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + PW.toFixed(2) + ' ' + PH.toFixed(2) + '] /Resources << /Font << /F1 3 0 R >> /XObject << /Im0 ' + iid + ' 0 R' + rids.map((id, i) => ' /R' + i + ' ' + id + ' 0 R').join('') + ' >> >> /Contents ' + cid + ' 0 R >>');
      pageIds.push(pid);
      await sleep(0);
    }
    obj(2, '<< /Type /Pages /Kids [' + pageIds.map(i => i + ' 0 R').join(' ') + '] /Count ' + N + ' >>');
    const xref = len; push('xref\n0 ' + next + '\n0000000000 65535 f \n');
    for (let i = 1; i < next; i++) push(String(offs[i] || 0).padStart(10, '0') + ' 00000 n \n');
    push('trailer\n<< /Size ' + next + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
    return new Blob(parts, { type:'application/pdf' });
  }
  let pdfBusy = false;
  async function computePlans() {   // cut lines, rooms and low walls of every floor (shared by the PDF and the DXF)
    const bases = floors.length ? floors.slice() : [modelBox.min.y];
    const labels = bases.map((_, i) => bases.length > 1 ? floorLabel(i) : '');
    say(t('pdfBusy', 0));
    const slicer = pointMode ? (b, pr, c) => sliceFloorsPC(b, pr, c, c === PDF_CUT ? 0.2 : 0.08) : sliceFloors, nst = 1 + LOW_CUTS.length;
    let segs = await slicer(bases, p => say(t('pdfBusy', Math.round(p * 80 / nst))), PDF_CUT);
    segs = segs.map(dedupeSegs);
    const lowLv = [];   // lowLv[k][floor] = cut lines at LOW_CUTS[k]
    for (let k = 0; k < LOW_CUTS.length; k++) { try { lowLv.push((await slicer(bases, p => say(t('pdfBusy', Math.round(80 * (k + 1 + p) / nst))), LOW_CUTS[k])).map(dedupeSegs)); } catch (err) { console.error('low', err); lowLv.push(bases.map(() => [])); } }
    const lows = [];
    for (let f = 0; f < segs.length; f++) { try { lows.push(await detectLowWalls(segs[f], lowLv.map(l => l[f]))); } catch (err) { console.error('lowwalls', err); lows.push({ segs: [], items: [] }); } }
    const rooms = [];
    for (let f = 0; f < segs.length; f++) { try { rooms.push(await detectRooms(segs[f], bases[f], f)); } catch (err) { console.error('rooms', err); rooms.push([]); } say(t('pdfBusy', 80 + Math.round(10 * (f + 1) / segs.length))); }
    return { bases, labels, segs, rooms, lows };
  }
  function saveBlob(blob, ext) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'Gambit360-plans-' + (window.PROJ_TITLE || currentName || 'tour').replace(/[\\/:*?"<>|]+/g, '_') + '.' + ext;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 8000);
  }
  // DXF (AutoCAD R12 text format, opens in every AutoCAD version): metres, 1:1, north up. One layer set per floor; floors sit side by side so they do not overlap.
  function buildDxf(plans) {
    const { segs, labels, rooms, lows } = plans, out = [];
    const g = (code, v) => out.push(String(code), String(v));
    const f3 = v => (v / scale).toFixed(4);
    const lay = [];
    segs.forEach((_, f) => { const p = 'F' + (f + 1) + '_'; lay.push([p + 'WALLS', 7, 'CONTINUOUS'], [p + 'LOW_WALLS', 8, 'DASHED'], [p + 'ROOMS', 3, 'CONTINUOUS']); });
    g(0, 'SECTION'); g(2, 'HEADER'); g(9, '$ACADVER'); g(1, 'AC1009'); g(9, '$INSUNITS'); g(70, 6); g(9, '$LTSCALE'); g(40, 1); g(0, 'ENDSEC');
    g(0, 'SECTION'); g(2, 'TABLES');
    g(0, 'TABLE'); g(2, 'LTYPE'); g(70, 2);
    g(0, 'LTYPE'); g(2, 'CONTINUOUS'); g(70, 0); g(3, 'Solid line'); g(72, 65); g(73, 0); g(40, 0);
    g(0, 'LTYPE'); g(2, 'DASHED'); g(70, 0); g(3, 'Dashed'); g(72, 65); g(73, 2); g(40, 0.3); g(49, 0.2); g(49, -0.1);
    g(0, 'ENDTAB');
    g(0, 'TABLE'); g(2, 'LAYER'); g(70, lay.length);
    lay.forEach(([n, col, lt]) => { g(0, 'LAYER'); g(2, n); g(70, 0); g(62, col); g(6, lt); });
    g(0, 'ENDTAB');
    g(0, 'TABLE'); g(2, 'STYLE'); g(70, 1); g(0, 'STYLE'); g(2, 'STANDARD'); g(70, 0); g(40, 0); g(41, 1); g(50, 0); g(71, 0); g(42, 0.2); g(3, 'txt'); g(4, ''); g(0, 'ENDTAB');
    g(0, 'ENDSEC');
    g(0, 'SECTION'); g(2, 'ENTITIES');
    const esc = txt => String(txt).replace(/[^\x20-\x7e]/g, ch => '\\U+' + ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0'));
    const text = (layer, x, y, h, txt) => { g(0, 'TEXT'); g(8, layer); g(10, x); g(20, y); g(30, 0); g(40, h); g(1, esc(txt)); g(72, 1); g(11, x); g(21, y); g(31, 0); };
    const line = (layer, ax, az, bx, bz, ox) => { g(0, 'LINE'); g(8, layer); g(10, ((ax - ox) / scale).toFixed(4)); g(20, (-az / scale).toFixed(4)); g(30, 0); g(11, ((bx - ox) / scale).toFixed(4)); g(21, (-bz / scale).toFixed(4)); g(31, 0); };
    let shift = 0;
    segs.forEach((sg, f) => {
      let x0 = 1e30, x1 = -1e30, zmin = 1e30;
      for (let i = 0; i < sg.length; i += 2) { if (sg[i] < x0) x0 = sg[i]; if (sg[i] > x1) x1 = sg[i]; if (sg[i + 1] < zmin) zmin = sg[i + 1]; }
      if (!sg.length) { x0 = 0; x1 = scale; }
      const ox = x0 - shift * scale, P = 'F' + (f + 1) + '_';   // this floor starts at x = shift metres
      for (let i = 0; i < sg.length; i += 4) line(P + 'WALLS', sg[i], sg[i + 1], sg[i + 2], sg[i + 3], ox);
      const blocks = [];   // text blocks (room labels first, then the low-wall heights) placed so none covers another
      (rooms[f] || []).forEach(r => {
        const m = v => (v / scale).toFixed(2), L = []; if (r.name) L.push(r.name); L.push(m(r.w) + ' x ' + m(r.d) + ' m'); L.push((r.area / (scale * scale)).toFixed(1) + ' m2   H ' + m(r.h) + ' m'); if (r.beam) L.push('H ' + m(r.beam) + ' m (beam)');
        const w = Math.max(...L.map(l => l.length)) * 0.115, h = L.length * 0.22;
        blocks.push({ layer: P + 'ROOMS', lines: L, ht: 0.14, step: 0.22, cx: (r.cx - ox) / scale, x: (r.cx - ox) / scale - w / 2, y: -r.cz / scale - h / 2, w, h });
      });
      const lw = lows[f];
      if (lw) {
        for (let i = 0; i < lw.segs.length; i += 4) line(P + 'LOW_WALLS', lw.segs[i], lw.segs[i + 1], lw.segs[i + 2], lw.segs[i + 3], ox);
        lw.items.forEach(r => { const L = ['H ' + (r.h / scale).toFixed(2) + ' m'], w = L[0].length * 0.1, h = 0.16; blocks.push({ layer: P + 'LOW_WALLS', lines: L, ht: 0.12, step: 0.16, x: (r.cx - ox) / scale - w / 2, y: -r.cz / scale + 0.15, w, h }); });
      }
      spreadLabels(blocks, 0.05);
      blocks.forEach(bk => { let y = bk.y + bk.h - bk.step * 0.85; bk.lines.forEach(txt => { text(bk.layer, (bk.x + bk.w / 2).toFixed(4), y.toFixed(4), bk.ht, txt); y -= bk.step; }); });
      if (labels[f]) text(P + 'ROOMS', ((x1 - ox) / scale / 2).toFixed(4), ((-zmin) / scale + 1.2).toFixed(4), 0.4, 'Floor ' + (f + 1));
      shift += (x1 - x0) / scale + 6;
    });
    g(0, 'ENDSEC'); g(0, 'EOF');
    return new Blob([out.join('\r\n') + '\r\n'], { type: 'application/dxf' });
  }
  async function exportPlans() {
    if (pdfBusy || !model) return;
    const wantPdf = $('planPdf').checked, wantDxf = $('planDxf').checked;
    if (!wantPdf && !wantDxf) { note(t('planNone')); return; }
    try { localStorage.setItem('tourViewerPlanFmt', JSON.stringify({ pdf: wantPdf, dxf: wantDxf })); } catch (err) {}
    pdfBusy = true; $('planGo').disabled = true;
    try {
      const plans = await computePlans();
      if (wantPdf) { try { saveBlob(await buildPdf(plans.segs, plans.labels, window.PROJ_TITLE || currentName || 'Gambit360', p => say(t('pdfBusy', 90 + Math.round(p * 10))), plans.rooms, plans.lows), 'pdf'); note(t('pdfDone')); } catch (err) { console.error(err); note(t('pdfFail') + err.message); } }
      if (wantDxf) { if (wantPdf) await sleep(600); try { saveBlob(buildDxf(plans), 'dxf'); note(t('dxfDone')); } catch (err) { console.error(err); note(t('dxfFail') + err.message); } }
    } catch (err) { console.error(err); note(t('pdfFail') + err.message); }
    finally { pdfBusy = false; $('planGo').disabled = false; }
  }
  try { const f = JSON.parse(localStorage.getItem('tourViewerPlanFmt') || 'null'); if (f) { $('planPdf').checked = !!f.pdf; $('planDxf').checked = !!f.dxf; } } catch (err) {}
  $('planGo').onclick = exportPlans;
  $('pdfBtn').onclick = e => { e.stopPropagation(); $('colorPanel').hidden = true; $('viewsPanel').hidden = true; $('mpPanel').hidden = true; $('pkgPanel').hidden = true; $('planPanel').hidden = !$('planPanel').hidden; alignTopPanels();
    const pp = $('planPanel'); pp.style.left = '';
    if (!pp.hidden && !window.G360_CLIENT && !$('optMenu').hidden) { const r = $('optMenu').getBoundingClientRect(); pp.style.right = 'auto'; pp.style.left = Math.round(r.right + 8) + 'px'; pp.style.top = Math.round(r.top) + 'px'; }   // the Studio keeps the Options menu open: the plan export opens beside it
  };
  /*@/STUDIO*/

