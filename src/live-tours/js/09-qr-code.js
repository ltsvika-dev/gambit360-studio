  // ---- QR code: byte mode, error correction M, versions 1-10 (plenty for a page address), drawn on a canvas ----
  function qrMatrix(text) {
    const bytes = Array.from(new TextEncoder().encode(text));
    const EC = [10, 16, 26, 18, 24, 16, 18, 22, 22, 26], NB = [1, 1, 1, 2, 2, 4, 4, 4, 5, 5];
    const raw = v => { let r = (16 * v + 128) * v + 64; if (v >= 2) { const a = Math.floor(v / 7) + 2; r -= (25 * a - 10) * a - 55; if (v >= 7) r -= 36; } return r; };
    let ver = 0;
    for (let v = 1; v <= 10; v++) { const cap = Math.floor(raw(v) / 8) - EC[v - 1] * NB[v - 1]; if (4 + (v < 10 ? 8 : 16) + bytes.length * 8 <= cap * 8) { ver = v; break; } }
    if (!ver) return null;
    const total = Math.floor(raw(ver) / 8), ecLen = EC[ver - 1], nb = NB[ver - 1], dataCw = total - ecLen * nb;
    const bits = [], put = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
    put(4, 4); put(bytes.length, ver < 10 ? 8 : 16); bytes.forEach(b => put(b, 8));
    put(0, Math.min(4, dataCw * 8 - bits.length));
    while (bits.length % 8) bits.push(0);
    for (let pad = 0xEC; bits.length < dataCw * 8; pad ^= 0xEC ^ 0x11) put(pad, 8);
    const data = []; for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2));
    const mul = (x, y) => { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z; };
    const div = new Array(ecLen).fill(0); div[ecLen - 1] = 1;
    let root = 1; for (let i = 0; i < ecLen; i++) { for (let j = 0; j < ecLen; j++) { div[j] = mul(div[j], root); if (j + 1 < ecLen) div[j] ^= div[j + 1]; } root = mul(root, 2); }
    const rem = d => { const r = new Array(ecLen).fill(0); d.forEach(b => { const f = b ^ r.shift(); r.push(0); div.forEach((c, i) => { r[i] ^= mul(c, f); }); }); return r; };
    const nShort = nb - total % nb, shortLen = Math.floor(total / nb), blocks = [];
    for (let i = 0, k = 0; i < nb; i++) { const d = data.slice(k, k + shortLen - ecLen + (i < nShort ? 0 : 1)); k += d.length; const e = rem(d); if (i < nShort) d.push(0); blocks.push(d.concat(e)); }
    const cw = []; for (let i = 0; i < blocks[0].length; i++) blocks.forEach((b, j) => { if (i !== shortLen - ecLen || j >= nShort) cw.push(b[i]); });
    const size = ver * 4 + 17, M = [], F = [];
    for (let i = 0; i < size; i++) { M.push(new Array(size).fill(false)); F.push(new Array(size).fill(false)); }
    const setF = (x, y, d) => { M[y][x] = d; F[y][x] = true; };
    for (let i = 0; i < size; i++) { setF(6, i, i % 2 === 0); setF(i, 6, i % 2 === 0); }
    const finder = (cx, cy) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const d = Math.max(Math.abs(dx), Math.abs(dy)), x = cx + dx, y = cy + dy; if (x >= 0 && x < size && y >= 0 && y < size) setF(x, y, d !== 2 && d !== 4); } };
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    const al = []; if (ver > 1) { const n = Math.floor(ver / 7) + 2, step = Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2; al.push(6); for (let p = size - 7; al.length < n; p -= step) al.splice(1, 0, p); }
    al.forEach((ax, i) => al.forEach((ay, j) => { if ((i === 0 && j === 0) || (i === 0 && j === al.length - 1) || (i === al.length - 1 && j === 0)) return; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) setF(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); }));
    const fmt = mask => {
      const d = mask; let r = d; for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      const b = ((d << 10) | r) ^ 0x5412, g = i => ((b >>> i) & 1) !== 0;
      for (let i = 0; i <= 5; i++) setF(8, i, g(i)); setF(8, 7, g(6)); setF(8, 8, g(7)); setF(7, 8, g(8));
      for (let i = 9; i < 15; i++) setF(14 - i, 8, g(i));
      for (let i = 0; i < 8; i++) setF(size - 1 - i, 8, g(i));
      for (let i = 8; i < 15; i++) setF(8, size - 15 + i, g(i));
      setF(8, size - 8, true);
    };
    fmt(0);
    if (ver >= 7) { let r = ver; for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1F25); const b = (ver << 12) | r; for (let i = 0; i < 18; i++) { const bit = ((b >>> i) & 1) !== 0, a = size - 11 + i % 3, c = Math.floor(i / 3); setF(a, c, bit); setF(c, a, bit); } }
    let k = 0;
    for (let right = size - 1; right >= 1; right -= 2) { if (right === 6) right = 5; for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) { const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert; if (!F[y][x] && k < cw.length * 8) { M[y][x] = ((cw[k >>> 3] >>> (7 - (k & 7))) & 1) !== 0; k++; } } }
    const inv = (m, x, y) => [(x + y) % 2 === 0, y % 2 === 0, x % 3 === 0, (x + y) % 3 === 0, (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, x * y % 2 + x * y % 3 === 0, (x * y % 2 + x * y % 3) % 2 === 0, ((x + y) % 2 + x * y % 3) % 2 === 0][m];
    const apply = m => { for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!F[y][x] && inv(m, x, y)) M[y][x] = !M[y][x]; };
    const penalty = () => {
      let p = 0;
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { if (x + 1 < size && y + 1 < size && M[y][x] === M[y][x + 1] && M[y][x] === M[y + 1][x] && M[y][x] === M[y + 1][x + 1]) p += 3; }
      for (let a = 0; a < size; a++) for (const row of [true, false]) { let run = 1; for (let b = 1; b <= size; b++) { const cur2 = b < size ? (row ? M[a][b] : M[b][a]) : null, prv = row ? M[a][b - 1] : M[b - 1][a]; if (cur2 === prv) run++; else { if (run >= 5) p += 3 + run - 5; run = 1; } } }
      return p;
    };
    let best = 0, bp = Infinity;
    for (let m = 0; m < 8; m++) { apply(m); fmt(m); const pn = penalty(); if (pn < bp) { bp = pn; best = m; } apply(m); }
    apply(best); fmt(best);
    return M;
  }
  function drawQr(cv, text) {
    const M = qrMatrix(text); if (!M) return false;
    const n = M.length, sc = 8, q = 4; cv.width = cv.height = (n + q * 2) * sc;
    const c = cv.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, cv.width, cv.height); c.fillStyle = '#000';
    M.forEach((row, y) => row.forEach((v, x) => { if (v) c.fillRect((x + q) * sc, (y + q) * sc, sc, sc); }));
    return true;
  }
  async function copyText(txt, okMsg) {
    try { await navigator.clipboard.writeText(txt); msg(okMsg); }
    catch (e) { const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); msg(okMsg); } catch (x) { msg(L('copyFail'), true); } ta.remove(); }
  }
  // share: link, QR code (PNG download) and an iframe snippet for the client's website
  function openShare(t) {
    const url = siteLink(t), emb = '<iframe src="' + url + '" width="100%" height="600" style="border:0" allow="fullscreen; autoplay; xr-spatial-tracking" allowfullscreen loading="lazy"></iframe>';
    $('lvDlgH').textContent = L('shareH'); $('lvDlg').querySelector('.box').classList.remove('wide');
    const b = $('lvDlgB');
    b.innerHTML = '<h4></h4><input type="text" readonly><div class="row"><button type="button" data-u></button></div><h4></h4><canvas></canvas><div class="row" style="justify-content:center"><button type="button" data-q></button></div><h4></h4><textarea readonly></textarea><div class="row"><button type="button" data-e></button></div>';
    const hs = b.querySelectorAll('h4'); hs[0].textContent = L('shareLink'); hs[1].textContent = L('shareQr'); hs[2].textContent = L('shareEmb');
    const inp = b.querySelector('input'), ta = b.querySelector('textarea'), cv = b.querySelector('canvas');
    inp.value = url; ta.value = emb; cv.style.width = '240px'; cv.style.height = '240px';
    b.querySelector('[data-u]').textContent = L('shCopy'); b.querySelector('[data-e]').textContent = L('shCopy'); b.querySelector('[data-q]').textContent = L('shDown');
    if (!drawQr(cv, url)) { cv.hidden = true; b.querySelector('[data-q]').disabled = true; }
    b.querySelector('[data-u]').onclick = () => copyText(url, L('shCopied'));
    b.querySelector('[data-e]').onclick = () => copyText(emb, L('shCopied'));
    b.querySelector('[data-q]').onclick = () => cv.toBlob(bl => { const a = document.createElement('a'); a.href = URL.createObjectURL(bl); a.download = (t.slug || 'tour') + '-qr.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); });
    $('lvDlg').hidden = false;
  }
  $('lvDlgX').onclick = () => { $('lvDlg').hidden = true; };
  $('lvDlg').addEventListener('click', e => { if (e.target === $('lvDlg')) $('lvDlg').hidden = true; });

