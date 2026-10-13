// ===== E57 reader + point-cloud pick grid (plain functions, no THREE needed) =====
/*@STUDIO*/
// The file layout helpers are plain top-level functions: the background reader (a Worker) is built from their source.
const E57_PH = 1024, E57_PL = 1020;
function e57P2L(p) { return Math.floor(p / E57_PH) * E57_PL + (p % E57_PH); }   // physical offset -> offset without the 4-byte page checksums
function e57U64(dv, o) { return dv.getUint32(o, true) + dv.getUint32(o + 4, true) * 4294967296; }
async function e57ReadLogical(file, l0, len) {
  const PH = E57_PH, PL = E57_PL, total = file.size;
  const p0 = Math.floor(l0 / PL), p1 = Math.floor((l0 + len - 1) / PL);
  const raw = new Uint8Array(await file.slice(p0 * PH, Math.min(total, (p1 + 1) * PH)).arrayBuffer());
  const out = new Uint8Array(len);
  let o = 0, pos = l0;
  for (let p = p0; p <= p1 && o < len; p++) {
    const inPage = pos - p * PL, base = (p - p0) * PH + inPage;
    const n = Math.min(PL - inPage, len - o, raw.length - base);
    if (n <= 0) break;
    out.set(raw.subarray(base, base + n), o);
    o += n; pos += n;
  }
  return o < len ? out.subarray(0, o) : out;
}

// Reads an E57 point cloud. The small XML part is read here; the heavy part (decoding millions of points) runs in the background,
// so the screen keeps moving and the progress shows. If a background reader cannot be started, the same code runs here as before.
async function readE57(file, budget, onProgress, tr) {
  tr = tr || (k => k);
  const p2l = e57P2L, u64 = e57U64, readLogical = (l0, len) => e57ReadLogical(file, l0, len);
  const head = new Uint8Array(await file.slice(0, 48).arrayBuffer());
  if (head.length < 48 || String.fromCharCode(...head.subarray(0, 8)) !== 'ASTM-E57') throw new Error(tr('e57NotE57'));
  const hdv = new DataView(head.buffer);
  if (u64(hdv, 40) !== E57_PH) throw new Error(tr('e57Unsupported') + 'page size');
  const xmlBytes = await readLogical(p2l(u64(hdv, 24)), u64(hdv, 32));
  const doc = new DOMParser().parseFromString(new TextDecoder('utf-8').decode(xmlBytes), 'application/xml');
  if (!doc.documentElement || doc.getElementsByTagName('parsererror').length) throw new Error(tr('e57NotE57'));

  const kids = n => Array.from(n.childNodes).filter(c => c.nodeType === 1);
  const kid = (n, name) => n ? kids(n).find(c => (c.localName || c.nodeName) === name) : undefined;
  const attr = (n, a, d) => n.hasAttribute(a) ? parseFloat(n.getAttribute(a)) : d;
  const tnum = (n, d) => n && n.textContent.trim() !== '' ? parseFloat(n.textContent) : d;   // an empty element (e.g. <x type="Float"/>) means its default, 0

  function parseField(f) {
    const type = f.getAttribute('type'), name = f.localName || f.nodeName;
    if (type === 'Float') {
      const dbl = (f.getAttribute('precision') || 'double') !== 'single';
      return { name, kind: 'float', bits: dbl ? 64 : 32, min: attr(f, 'minimum', 0), max: attr(f, 'maximum', 1), scale: 1, offset: 0 };
    }
    if (type === 'Integer' || type === 'ScaledInteger') {
      const min = attr(f, 'minimum', 0), max = attr(f, 'maximum', 4294967295);
      const bits = max > min ? Math.ceil(Math.log2(max - min + 1)) : 0;
      if (bits > 53) throw new Error(tr('e57Unsupported') + name);
      return { name, kind: 'int', bits, min, max, scale: type === 'ScaledInteger' ? attr(f, 'scale', 1) : 1, offset: type === 'ScaledInteger' ? attr(f, 'offset', 0) : 0 };
    }
    return { name, kind: 'other', bits: 0, min: 0, max: 1, scale: 1, offset: 0 };   // e.g. strings: has no data stream we use
  }

  function parsePose(p) {
    const q = { w: 1, x: 0, y: 0, z: 0 }, tr3 = { x: 0, y: 0, z: 0 };
    if (!p) return { has: false, q, t: tr3 };
    const r = kid(p, 'rotation'), tt = kid(p, 'translation');
    if (r) { q.w = tnum(kid(r, 'w'), 1); q.x = tnum(kid(r, 'x'), 0); q.y = tnum(kid(r, 'y'), 0); q.z = tnum(kid(r, 'z'), 0); }
    if (tt) { tr3.x = tnum(kid(tt, 'x'), 0); tr3.y = tnum(kid(tt, 'y'), 0); tr3.z = tnum(kid(tt, 'z'), 0); }
    return { has: !!(r || tt), q, t: tr3 };
  }

  const d3 = kid(doc.documentElement, 'data3D');
  const scans = (d3 ? kids(d3) : []).map(sc => {
    const pts = kid(sc, 'points');
    if (!pts || !kid(pts, 'prototype')) return null;
    const gd = kid(sc, 'guid');
    return { offset: +pts.getAttribute('fileOffset'), count: +pts.getAttribute('recordCount'), guid: gd ? gd.textContent.trim() : '',
             fields: kids(kid(pts, 'prototype')).map(parseField), pose: parsePose(kid(sc, 'pose')) };
  }).filter(s => s && s.count > 0);
  if (!scans.length) throw new Error(tr('e57NoPoints'));

  const scanInfo = scans.map(S => ({ offset:S.offset, count:S.count, fields:S.fields, pose:S.pose }));
  const pts = await e57PointsAnywhere(file, scanInfo, budget, onProgress, tr);
  scans.forEach((S, i) => { if (pts.stIdx[i] !== undefined) S.stIdx = pts.stIdx[i]; });
  const { pos, col, n: cnt, stations, k, total: totalRecords, hasColor: anyColor } = pts;
  // The six cube pictures of each station (Matterport writes them as 4096 x 4096 JPEGs, 90 degrees each): only where they are stored is noted, the pictures are read when needed.
  let pano = null;
  try {
    const i2 = kid(doc.documentElement, 'images2D'), byGuid = {};
    (i2 ? kids(i2) : []).forEach(im => {
      const ph = kid(im, 'pinholeRepresentation'), jp = ph && kid(ph, 'jpegImage'); if (!jp) return;
      const w = tnum(kid(ph, 'imageWidth'), 0), h = tnum(kid(ph, 'imageHeight'), 0), fl = tnum(kid(ph, 'focalLength'), 0), pw = tnum(kid(ph, 'pixelWidth'), 0);
      if (!(w > 0 && w === h && Math.abs(w * pw / (2 * fl) - 1) < 0.02)) return;   // only an exact 90 degree cube face
      const g = kid(im, 'associatedData3DGuid'), nm = kid(im, 'name'), ps = parsePose(kid(im, 'pose'));
      let { w: qw, x: qx, y: qy, z: qz } = ps.q; const qn = Math.hypot(qw, qx, qy, qz) || 1; qw /= qn; qx /= qn; qy /= qn; qz /= qn;
      (byGuid[g ? g.textContent.trim() : ''] = byGuid[g ? g.textContent.trim() : ''] || []).push({ off: +jp.getAttribute('fileOffset'), len: +jp.getAttribute('length'), size: w, name: nm ? nm.textContent : '',
        R: [1 - 2 * (qy * qy + qz * qz), 2 * (qx * qy - qw * qz), 2 * (qx * qz + qw * qy), 2 * (qx * qy + qw * qz), 1 - 2 * (qx * qx + qz * qz), 2 * (qy * qz - qw * qx), 2 * (qx * qz - qw * qy), 2 * (qy * qz + qw * qx), 1 - 2 * (qx * qx + qy * qy)] });
    });
    const list = [];
    scans.forEach(S => { const f = byGuid[S.guid]; if (S.stIdx !== undefined && f && f.length === 6) list.push({ st: S.stIdx, faces: f.sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true })) }); });
    if (list.length) pano = { stations: list, readBlob: async (off, len) => new Blob([await readLogical(p2l(off) + 16, len)], { type: 'image/jpeg' }) };   // a blob has a 16-byte section header in front of the data
  } catch (err) { console.warn('no panoramas', err); pano = null; }
  return { pos, col, n: cnt, stations, k, total: totalRecords, hasColor: anyColor, pano };
}

// Decodes the points of every scan (keeps every k-th point to stay within the budget). No DOM here: this also runs inside the Worker.
async function e57Points(file, scans, budget, onProgress, tr) {
  const p2l = e57P2L, u64 = e57U64, readLogical = (l0, len) => e57ReadLogical(file, l0, len);
  const yieldUI = () => new Promise(r => setTimeout(r, 0));
  const totalRecords = scans.reduce((a, s) => a + s.count, 0);
  const k = Math.max(1, Math.ceil(totalRecords / budget));      // keep every k-th point
  const cap = scans.reduce((a, s) => a + Math.ceil(s.count / k) + 2, 0);
  const P = new Float32Array(cap * 3), C = new Uint8Array(cap * 3);
  let cnt = 0, org = null, anyColor = false;
  const stations = [];
  const XYZ = ['cartesianX', 'cartesianY', 'cartesianZ'], SPH = ['sphericalRange', 'sphericalAzimuth', 'sphericalElevation'];
  const COLOR = ['colorRed', 'colorGreen', 'colorBlue'];
  const ROLE = { cartesianX: 'x', cartesianY: 'y', cartesianZ: 'z', sphericalRange: 'x', sphericalAzimuth: 'y', sphericalElevation: 'z',
                 cartesianInvalidState: 'inv', sphericalInvalidState: 'inv', colorRed: 'cr', colorGreen: 'cg', colorBlue: 'cb', intensity: 'it' };

  function readBits(arr, bitPos, bits) {
    let v = 0, got = 0, bp = bitPos >> 3, sh = bitPos & 7;
    while (got < bits) {
      const take = Math.min(8 - sh, bits - got);
      v += ((arr[bp] >> sh) & ((1 << take) - 1)) * Math.pow(2, got);
      got += take; bp++; sh = 0;
    }
    return v;
  }

  let lastYield = 0, doneRecords = 0;

  for (let si = 0; si < scans.length; si++) {
    const S = scans[si];
    const names = S.fields.map(f => f.name);
    const cart = XYZ.every(n => names.includes(n)), sph = SPH.every(n => names.includes(n));
    if (!cart && !sph) throw new Error(tr('e57NoCoords'));
    const want = new Set([...(cart ? XYZ : SPH), cart ? 'cartesianInvalidState' : 'sphericalInvalidState', ...COLOR, 'intensity']);
    const scanCap = Math.ceil(S.count / k) + 2;
    const st = S.fields.map(f => {
      if (!want.has(f.name) || f.kind === 'other') return null;
      const o = Object.assign({}, f, { role: ROLE[f.name], n: 0, idx: 0, carry: new Uint8Array(0), bitOff: 0 });
      if (f.kind === 'int' && f.bits === 0) o.constant = true;
      else o.out = (o.role === 'x' || o.role === 'y' || o.role === 'z') ? new Float64Array(scanCap) : new Float32Array(scanCap);
      return o;
    });
    const active = st.filter(f => f && !f.constant);
    const finished = () => active.every(f => f.idx >= S.count);

    function feed(f, bytes) {
      let buf = bytes;
      if (f.carry.length) { buf = new Uint8Array(f.carry.length + bytes.length); buf.set(f.carry); buf.set(bytes, f.carry.length); }
      const totalBits = buf.length * 8, bits = f.bits;
      let bp = f.bitOff;
      const dv = f.kind === 'float' ? new DataView(buf.buffer, buf.byteOffset, buf.byteLength) : null;
      while (f.idx < S.count) {
        const avail = Math.floor((totalBits - bp) / bits);
        if (avail <= 0) break;
        const r = f.idx % k;
        if (r !== 0) { const sk = Math.min(k - r, avail); bp += sk * bits; f.idx += sk; continue; }
        let v;
        if (f.kind === 'float') v = bits === 32 ? dv.getFloat32(bp >> 3, true) : dv.getFloat64(bp >> 3, true);
        else v = (readBits(buf, bp, bits) + f.min) * f.scale + f.offset;
        f.out[f.n++] = v;
        bp += bits; f.idx++;
      }
      f.carry = buf.slice(bp >> 3); f.bitOff = bp & 7;
    }

    // Stream the binary section in big chunks instead of loading the whole file.
    let buf = new Uint8Array(0), bstart = 0;
    const bytesAt = async (p, n) => {
      if (p < bstart || p + n > bstart + buf.length) {
        buf = await readLogical(p, Math.max(n, 16 * 1024 * 1024)); bstart = p;
        if (buf.length < n) throw new Error(tr('e57Truncated'));
      }
      return buf.subarray(p - bstart, p - bstart + n);
    };
    const sh = await bytesAt(p2l(S.offset), 32);
    const sdv = new DataView(sh.buffer, sh.byteOffset, 32);
    const secLen = u64(sdv, 8), dataPhys = u64(sdv, 16), indexPhys = u64(sdv, 24);
    let pos = p2l(dataPhys);
    const endLog = Math.min(indexPhys > 0 ? p2l(indexPhys) : Infinity, p2l(S.offset) + secLen);

    while (pos < endLog && !finished()) {
      const h = await bytesAt(pos, 6);
      const type = h[0], len = (h[2] | (h[3] << 8)) + 1;
      if (type === 1) {
        const pk = await bytesAt(pos, len);
        const nStreams = pk[4] | (pk[5] << 8);
        let o = 6 + 2 * nStreams;
        for (let i = 0; i < nStreams; i++) {
          const L = pk[6 + 2 * i] | (pk[7 + 2 * i] << 8);
          if (st[i] && !st[i].constant && L > 0) feed(st[i], pk.subarray(o, o + L));
          o += L;
        }
      } else if (type !== 0 && type !== 2) throw new Error(tr('e57BadPacket'));
      pos += len;
      const now = performance.now();
      if (now - lastYield > 120) {
        lastYield = now;
        const frac = Math.min(1, (pos - p2l(S.offset)) / Math.max(1, secLen));
        if (onProgress) onProgress(si + 1, scans.length, Math.round(frac * 100));
        await yieldUI();
      }
    }

    // Combine this scan's streams into global, Y-up, origin-shifted points.
    const F = role => st.find(f => f && f.role === role);
    const fx = F('x'), fy = F('y'), fz = F('z'), inv = F('inv'), cr = F('cr'), cg = F('cg'), cb = F('cb'), it = F('it');
    const n = Math.min(fx.n, fy.n, fz.n);
    const val = (f, j) => f.constant ? (f.min * f.scale + f.offset) : f.out[j];
    const hasRGB = !!(cr && cg && cb) && [cr, cg, cb].every(f => f.constant || f.n >= n);
    let iLo = Infinity, iHi = -Infinity;
    if (!hasRGB && it && it.n >= n) for (let j = 0; j < n; j++) { const v = it.out[j]; if (v < iLo) iLo = v; if (v > iHi) iHi = v; }
    const useI = !hasRGB && it && it.n >= n && iHi > iLo;
    if (hasRGB || useI) anyColor = true;
    let { w, x: qx, y: qy, z: qz } = S.pose.q;
    const qn = Math.hypot(w, qx, qy, qz) || 1; w /= qn; qx /= qn; qy /= qn; qz /= qn;
    const R = [1 - 2 * (qy * qy + qz * qz), 2 * (qx * qy - w * qz), 2 * (qx * qz + w * qy),
               2 * (qx * qy + w * qz), 1 - 2 * (qx * qx + qz * qz), 2 * (qy * qz - w * qx),
               2 * (qx * qz - w * qy), 2 * (qy * qz + w * qx), 1 - 2 * (qx * qx + qy * qy)];
    const T = S.pose.t;
    const nrm = (f, v) => Math.max(0, Math.min(255, 255 * (v - f.min) / ((f.max - f.min) || 1)));

    for (let j = 0; j < n; j++) {
      if (inv && val(inv, j) !== 0) continue;
      let x = fx.out[j], y = fy.out[j], z = fz.out[j];
      if (!cart) {  // spherical: range, azimuth, elevation
        const r = x, az = y, el = z, ce = Math.cos(el);
        x = r * ce * Math.cos(az); y = r * ce * Math.sin(az); z = r * Math.sin(el);
      }
      if (!(isFinite(x) && isFinite(y) && isFinite(z))) continue;
      const gx = R[0] * x + R[1] * y + R[2] * z + T.x, gy = R[3] * x + R[4] * y + R[5] * z + T.y, gz = R[6] * x + R[7] * y + R[8] * z + T.z;
      if (!org) org = [Math.round(gx), Math.round(gy), Math.round(gz)];
      const o = cnt * 3;
      P[o] = gx - org[0]; P[o + 1] = gz - org[2]; P[o + 2] = -(gy - org[1]);   // E57 is Z-up, the viewer is Y-up
      if (hasRGB) { C[o] = nrm(cr, val(cr, j)); C[o + 1] = nrm(cg, val(cg, j)); C[o + 2] = nrm(cb, val(cb, j)); }
      else if (useI) { const g = Math.round(40 + 215 * (it.out[j] - iLo) / (iHi - iLo)); C[o] = C[o + 1] = C[o + 2] = g; }
      else { C[o] = C[o + 1] = C[o + 2] = 150; }
      cnt++;
    }
    if (S.pose.has && org) { S.stIdx = stations.length; stations.push([T.x - org[0], T.z - org[2], -(T.y - org[1])]); }
    doneRecords += S.count;
    await yieldUI();
  }

  if (!cnt) throw new Error(tr('e57NoPoints'));
  const pos = P.slice(0, cnt * 3), col = C.slice(0, cnt * 3);
  if (!anyColor) {   // no colour or intensity in the file: colour by height
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < cnt; i++) { const y = pos[i * 3 + 1]; if (y < lo) lo = y; if (y > hi) hi = y; }
    for (let i = 0; i < cnt; i++) {
      const u = (pos[i * 3 + 1] - lo) / ((hi - lo) || 1);
      col[i * 3] = 40 + 200 * u; col[i * 3 + 1] = 90 + 130 * (1 - Math.abs(2 * u - 1)); col[i * 3 + 2] = 230 - 190 * u;
    }
  }
  return { pos, col, n: cnt, stations, k, total: totalRecords, hasColor: anyColor, stIdx: scans.map(S => S.stIdx) };
}

// Runs e57Points in a Worker made from the functions above (works from file:// too); falls back to running it here.
async function e57PointsAnywhere(file, scans, budget, onProgress, tr) {
  const keys = ['e57NoCoords', 'e57Truncated', 'e57BadPacket', 'e57NoPoints'], words = {};
  keys.forEach(k => words[k] = tr(k));
  let w = null, url = '';
  try {
    const src = 'const E57_PH = ' + E57_PH + ', E57_PL = ' + E57_PL + ';\n' + [e57P2L, e57U64, e57ReadLogical, e57Points].map(f => f.toString()).join('\n') +
      '\nonmessage = async e => { const m = e.data, words = m.words; try { const r = await e57Points(m.file, m.scans, m.budget, (i, n, p) => postMessage({ prog:[i, n, p] }), k => words[k] || k);' +
      ' postMessage({ done:r }, [r.pos.buffer, r.col.buffer]); } catch (err) { postMessage({ err:String(err && err.message || err) }); } };';
    url = URL.createObjectURL(new Blob([src], { type:'text/javascript' }));
    w = new Worker(url);
  } catch (err) { console.warn('E57: no background reader, reading on the page', err); if (url) URL.revokeObjectURL(url); return e57Points(file, scans, budget, onProgress, tr); }
  try {
    return await new Promise((res, rej) => {
      let any = false;
      w.onmessage = e => { const m = e.data; any = true;
        if (m.prog) { if (onProgress) onProgress(m.prog[0], m.prog[1], m.prog[2]); }
        else if (m.done) res(m.done); else rej(Object.assign(new Error(m.err), { fromWorker:true })); };
      w.onerror = e => { e.preventDefault(); rej(Object.assign(new Error(e.message || 'worker'), { startFail:!any })); };
      w.postMessage({ file, scans, budget, words });
    });
  } catch (err) {
    if (err.fromWorker) throw err;   // a real problem in the file: same message as before
    console.warn('E57: background reader failed, reading on the page', err);
    return e57Points(file, scans, budget, onProgress, tr);
  } finally { w.terminate(); URL.revokeObjectURL(url); }
}
/*@/STUDIO*/

function buildPickGrid(P, n) {
  let minX = Infinity, minY = Infinity, minZ = Infinity, maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < n; i++) {
    const x = P[3 * i], y = P[3 * i + 1], z = P[3 * i + 2];
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
  }
  const diag = Math.hypot(maxX - minX, maxY - minY, maxZ - minZ);
  const vs = diag > 220 ? 0.1 : 0.05;
  const g = { vs, minX, minY, minZ, diag, midX: (minX + maxX) / 2, midY: (minY + maxY) / 2, midZ: (minZ + maxZ) / 2,
              NX: Math.floor((maxX - minX) / vs) + 3, NY: Math.floor((maxY - minY) / vs) + 3, NZ: Math.floor((maxZ - minZ) / vs) + 3,
              map: new Map(), nv: 0, sx: new Float64Array(1 << 18), sy: new Float64Array(1 << 18), sz: new Float64Array(1 << 18), cn: new Uint16Array(1 << 18) };
  const grow = () => {
    const c = g.sx.length * 2;
    for (const k of ['sx', 'sy', 'sz']) { const a = new Float64Array(c); a.set(g[k]); g[k] = a; }
    const cn = new Uint16Array(c); cn.set(g.cn); g.cn = cn;
  };
  for (let i = 0; i < n; i++) {
    const x = P[3 * i] - minX, y = P[3 * i + 1] - minY, z = P[3 * i + 2] - minZ;
    const key = (Math.floor(x / vs) + 1) + g.NX * ((Math.floor(y / vs) + 1) + g.NY * (Math.floor(z / vs) + 1));
    let id = g.map.get(key);
    if (id === undefined) { id = g.nv++; if (id >= g.sx.length) grow(); g.map.set(key, id); }
    g.sx[id] += x; g.sy[id] += y; g.sz[id] += z;
    if (g.cn[id] < 65535) g.cn[id]++;
  }
  return g;
}

function gridOcc(g, ix, iy, iz) {   // voxel id, or -1 when empty / outside
  if (ix < 0 || iy < 0 || iz < 0 || ix >= g.NX || iy >= g.NY || iz >= g.NZ) return -1;
  const id = g.map.get(ix + g.NX * (iy + g.NY * iz));
  return (id !== undefined && g.cn[id] >= 2) ? id : -1;
}

// First occupied voxel along a ray (points above clipY are ignored). Returns the voxel's centroid.
function gridCast(g, ox, oy, oz, dx, dy, dz, far, clipY) {
  const vs = g.vs, step = vs * 0.5;
  const lim = Math.min(far, Math.hypot(ox - g.midX, oy - g.midY, oz - g.midZ) + g.diag);
  for (let t = vs; t < lim; t += step) {
    const y = oy + dy * t;
    if (y > clipY) continue;
    const id = gridOcc(g, Math.floor((ox + dx * t - g.minX) / vs) + 1, Math.floor((y - g.minY) / vs) + 1, Math.floor((oz + dz * t - g.minZ) / vs) + 1);
    if (id >= 0) {
      const c = g.cn[id];
      return { x: g.sx[id] / c + g.minX, y: g.sy[id] / c + g.minY, z: g.sz[id] / c + g.minZ, t,
               ix: Math.floor((ox + dx * t - g.minX) / vs) + 1, iy: Math.floor((y - g.minY) / vs) + 1, iz: Math.floor((oz + dz * t - g.minZ) / vs) + 1 };
    }
  }
  return null;
}

// Is the surface around this voxel a horizontal one (floor-like)?
function gridFlat(g, ix, iy, iz) {
  let H = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    if (!dx && !dz) continue;
    if (gridOcc(g, ix + dx, iy, iz + dz) >= 0 || gridOcc(g, ix + dx, iy + 1, iz + dz) >= 0 || gridOcc(g, ix + dx, iy - 1, iz + dz) >= 0) H++;
  }
  return H >= 6 && !(gridOcc(g, ix, iy + 1, iz) >= 0 && gridOcc(g, ix, iy - 1, iz) >= 0);
}

