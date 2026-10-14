  // ---- Client package: a model folder next to the viewer (works from file:// because it is made of script files) ----
  const loadScript = src => new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.onload = () => { s.remove(); res(); }; s.onerror = () => { s.remove(); rej(new Error('missing ' + src)); };
    document.head.appendChild(s);
  });
  async function b64ToBlob(b64) {
    try { return await (await fetch('data:application/octet-stream;base64,' + b64)).blob(); }
    catch (err) {
      const bin = atob(b64), parts = [];
      for (let i = 0; i < bin.length; i += 1 << 20) {
        const chunk = bin.slice(i, i + (1 << 20)), u = new Uint8Array(chunk.length);
        for (let j = 0; j < chunk.length; j++) u[j] = chunk.charCodeAt(j);
        parts.push(u);
      }
      return new Blob(parts);
    }
  }
  async function loadE57Pkg(pk) {
    try {
      msg(t('pkgLoading'));
      window.G360F = window.G360F || {};
      const N = pk.pc.n, pos = new Float32Array(N * 3), col = new Uint8Array(N * 3), mn = pk.pc.min, sc = pk.pc.scale;
      let o = 0;
      for (let i = 0; i < pk.pc.chunks.length; i++) {
        const c = pk.pc.chunks[i];
        await loadScript('model/' + c.src);
        const b64 = window.G360F[c.src]; delete window.G360F[c.src];
        const buf = await (await b64ToBlob(b64)).arrayBuffer(), n = c.n, u = new Uint16Array(buf, 0, n * 3);
        for (let j = 0; j < n * 3; j++) pos[o * 3 + j] = mn[j % 3] + u[j] * sc[j % 3];
        col.set(new Uint8Array(buf, n * 6, n * 3), o * 3); o += n;
        msg(t('pkgLoadingN', i + 1, pk.pc.chunks.length));
      }
      fromPkg = true; currentName = pk.name; lastObjFiles = null; lastE57 = null;
      startPC({ pos, col, n:N, stations:pk.stations || [], k:1, total:N, hasColor:true });
      const pa = pk.pano;
      if (pa && pa.stations && pa.stations.length) setPanoSource({ size:pa.size || 2048, conv:pa.conv >= 0 ? pa.conv : -1, stations:pa.stations.map(ps => ({
        p:new THREE.Vector3(pk.stations[ps.st][0], pk.stations[ps.st][1], pk.stations[ps.st][2]),
        faces:ps.faces.map(f => ({ R:f.R, blob:async () => { await loadScript('model/' + f.src); const b = window.G360F[f.src]; delete window.G360F[f.src]; return new Blob([await b64ToBlob(b)], { type:'image/jpeg' }); } })) })) });
      onModelLoaded({ kind:'e57', name:currentName, handle:null });
      setPackageViews(Array.isArray(pk.views) ? pk.views : []); if (window.G360_pkgExtras) window.G360_pkgExtras(pk);
      try { if (pk.link) localStorage.setItem(mpKey(), pk.link); else if (window.G360_CLIENT) localStorage.removeItem(mpKey()); } catch (err) {} syncMpUI();
      return true;
    } catch (err) { console.error(err); fromPkg = false; msg(t('loadFail') + err.message, true); return false; }
  }
  async function tryPackage() {
    try { await loadScript('model/manifest.js'); } catch (err) { return false; }
    try {   // settings newer than the package: the ones embedded in a replaced viewer file, or a settings update the client loaded
      const E = window.G360_EMBED || null, M = window.G360PKG;   // E: settings baked into this viewer file; M: the package's manifest
      let u = null;
      if (E) u = E;
      if (u && u.pkg && M && u.name === M.name && (u.ts || 0) >= (M.built || 0)) {
        ['logo', 'brand', 'brandW', 'tags', 'tagTypes', 'start', 'hide', 'floors', 'miniClosed', 'clientTags', 'noCloud', 'promoMode'].forEach(k => { if (!(k in u.pkg)) delete M[k]; });
        Object.assign(M, u.pkg, { built:M.built });
      }
    } catch (err) { console.error(err); }
    const pk = window.G360PKG;
    if (!pk || !pk.files || !pk.files.length) return false;
    if (pk.brand) setBrand(pk.brand, pk.brandW);   // my logo, from the Options screen
    if (pk.logo) applyLogo(pk.logo);
    if (pk.miniClosed && window.G360_miniDefault) window.G360_miniDefault();
    if (pk.title) setProjectTitle(pk.title, pk.manager);
    window.PKG_TERMS = pk.terms || '';
    setExpiry(pk.expires || '');
    if (pk.kind === 'e57') return await withBoot(() => loadE57Pkg(pk));
    try {
      msg(t('pkgLoading'));
      window.G360F = window.G360F || {};
      const files = [];
      for (let i = 0; i < pk.files.length; i++) {
        const f = pk.files[i];
        await loadScript('model/' + f.src);
        const b64 = window.G360F[f.src]; delete window.G360F[f.src];
        files.push(new File([await b64ToBlob(b64)], f.n));
        msg(t('pkgLoadingN', i + 1, pk.files.length));
      }
      fromPkg = true;
      const ok = await loadObj(files, null, pk.name);
      if (ok) { setPackageViews(Array.isArray(pk.views) ? pk.views : []); if (window.G360_pkgExtras) window.G360_pkgExtras(pk); }
      if (ok) { try { if (pk.link) localStorage.setItem(mpKey(), pk.link); else if (window.G360_CLIENT) localStorage.removeItem(mpKey()); } catch (err) {} syncMpUI(); }
      else fromPkg = false;
      return ok;
    } catch (err) { console.error(err); fromPkg = false; msg(t('loadFail') + err.message, true); return false; }
  }
  let pkgBusy = false, pkgFloatT = 0;
  // While a package is being built the progress also shows on the main screen when the panel is closed (with a stop button).
  const pkgMsg = text => {
    $('pkgMsgBox').textContent = text;
    const f = $('pkgFloat'); if (!f) return;
    if (pkgBusy) { $('pkgFloatTxt').textContent = text; f.hidden = !$('pkgPanel').hidden; }
  };
  const readB64 = blob => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(',')[1] || '');
    r.onerror = () => rej(r.error); r.readAsDataURL(blob);
  });
  /*@STUDIO*/
  async function findViewer(dir) {
    let html = null, lib = [], obf = null;
    try {
      for await (const [name, h] of dir.entries()) {
        if (h.kind === 'file' && /\.html?$/i.test(name) && (!html || /studio|viewer/i.test(name))) html = h;
        if (h.kind === 'directory' && name.toLowerCase() === 'lib') for await (const [n2, h2] of h.entries()) if (h2.kind === 'file' && /\.js$/i.test(n2)) lib.push(h2);
        if (h.kind === 'directory' && name.toLowerCase() === 'tools') for await (const [n2, h2] of h.entries()) if (h2.kind === 'file' && /obfuscator.*\.js$/i.test(n2)) obf = h2;   // the code-scrambling tool lives in "tools", never in "lib": everything in "lib" is copied into the client packages
      }
    } catch (err) { return { html:null, lib:[], obf:null, name:dir.name }; }
    return { html, lib, obf, name:dir.name };
  }
  /*@/STUDIO*/
  const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  function expiryEnd() {   // last day of storage from the three fields, '' when no period is set
    const st = $('pkgStart').value, n = parseInt($('pkgDur').value, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(st) || !(n > 0)) return '';
    const d = new Date(+st.slice(0, 4), +st.slice(5, 7) - 1, +st.slice(8, 10));
    if ($('pkgUnit').value === 'd') d.setDate(d.getDate() + n); else d.setMonth(d.getMonth() + n);
    return ymd(d);
  }
  const refreshExpiry = () => { if (!window.G360_CLIENT && !fromPkg) setExpiry(expiryEnd()); };
  $('pkgStart').addEventListener('input', () => {   // the browser lets a date field take a 5 or 6 digit year: keep it to 4
    const v = $('pkgStart').value, m = /^\+?(\d{5,})-(\d{2})-(\d{2})$/.exec(v);
    if (m) $('pkgStart').value = m[1].slice(0, 4) + '-' + m[2] + '-' + m[3];
  });
  ['pkgStart', 'pkgDur', 'pkgUnit'].forEach(id => { $(id).addEventListener('input', refreshExpiry); $(id).addEventListener('change', refreshExpiry); });
  ['pkgStart', 'pkgDur'].forEach(id => $(id).addEventListener('keydown', e => e.stopPropagation()));
  /*@STUDIO*/
  // The text of the viewer file made for a client: creation tools off, update address and version baked in.
  function stampClient(text, upUrl, version, embed) {
    let out = text.replace(/window\.G360_CLIENT\s*=\s*false/, 'window.G360_CLIENT=true');
    out = out.replace(/[ \t]*\/\*@STUDIO\*\/[\s\S]*?\/\*@\/STUDIO\*\/\n?/g, '').replace(/<!--@STUDIO-->[\s\S]*?<!--@\/STUDIO-->\n?/g, '');   // the Studio's own tools (package maker, project file, promo recorder, PDF plans) never reach the client
    if (version && version > window.G360_VERSION) out = out.replace(/window\.G360_VERSION\s*=\s*'[^']*'/, () => "window.G360_VERSION='" + String(version).replace(/[^0-9.]/g, '') + "'");
    if (embed) out = out.replace(/(<script>window\.G360_CLIENT=[^<]*<\/script>)/, (m, a) => a + '<script>window.G360_EMBED=' + JSON.stringify(embed).replace(/</g, '\\u003c') + ';<\/script>');
    return out;
  }
  // Scrambles the viewer's code so that a copy cannot be read or developed further: names become meaningless and the texts are encoded. The tool is a file the user puts in the Studio folder (tools).
  async function loadObfuscator(found) {
    if (window.JavaScriptObfuscator) return window.JavaScriptObfuscator;
    if (!found || !found.obf) return null;
    const code = await (await found.obf.getFile()).text();
    const sc = document.createElement('script'); sc.textContent = code; document.head.appendChild(sc); sc.remove();
    return window.JavaScriptObfuscator || null;
  }
  async function protectHtml(html, found) {
    if (!$('pkgObf').checked) return html;
    const JO = await loadObfuscator(found).catch(() => null);
    if (!JO) throw new Error(t('obfMissing'));
    pkgMsg(t('obfBusy')); await new Promise(r => setTimeout(r, 40));
    const full = { compact:true, controlFlowFlattening:false, deadCodeInjection:false, debugProtection:false, disableConsoleOutput:false, identifierNamesGenerator:'hexadecimal', log:false, renameGlobals:false, selfDefending:false, stringArray:true, stringArrayEncoding:['base64'], stringArrayThreshold:0.75, target:'browser', transformObjectKeys:false, unicodeEscapeSequence:false };
    const safe = { compact:true, renameGlobals:false, stringArray:true, target:'browser' };
    const run = code => { let r; try { r = JO.obfuscate(code, full); } catch (err) { console.warn('obfuscation options', err); r = JO.obfuscate(code, safe); } return r.getObfuscatedCode().replace(/<\/(script)/gi, '<\\/$1').replace(new RegExp('<' + '!--', 'g'), '<' + '\\!--'); };
    return html.replace(/<script>([\s\S]*?)<\/script>/g, (m, code) => (code.length < 2000 || /^\s*window\.G360_(CLIENT|EMBED|VERSION)/.test(code)) ? m : '<' + 'script>' + run(code) + '<\/script>');   // the tiny settings scripts stay as they are
  }
  /*@/STUDIO*/
  function refreshPanoOpts() {
    const sel = $('pkgPano'); if (!sel || !lastE57 || !lastE57.d.pano) return;
    const prev = sel.value || 'mid', nf = lastE57.d.pano.stations.length * 6, hi = lastE57.d.pano.stations.reduce((a, ps) => a + ps.faces.reduce((b, f) => b + f.len, 0), 0) / 1e6;
    const mb = v => Math.max(1, Math.round(v * 1.34));   // the package stores the pictures as text, about a third larger
    sel.innerHTML = '';
    [['off', t('pkgPanoOff')], ['low', t('pkgPanoOpt', t('pQLow') + ' 1024', mb(nf * 0.12))], ['mid', t('pkgPanoOpt', t('pQMid') + ' 2048', mb(nf * 0.45))], ['high', t('pkgPanoOpt', t('pQHigh'), mb(hi))]].forEach(o => {
      const op = document.createElement('option'); op.value = o[0]; op.textContent = o[1]; sel.appendChild(op); });
    sel.value = prev;
  }
  /*@STUDIO*/
  // Point cloud as compact binary pieces (3 x 16 bit position + RGB per point) and, if chosen, the panorama pictures at the chosen quality. Both are stored as scripts so the package opens straight from a folder.
  async function writeE57Model(md, put, list) {
    const d = lastE57.d, N = d.n, pos = d.pos, mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < N; i++) for (let a = 0; a < 3; a++) { const v = pos[i * 3 + a]; if (v < mn[a]) mn[a] = v; if (v > mx[a]) mx[a] = v; }
    const sc = mn.map((m, a) => (mx[a] - m) / 65535 || 1e-6), CH = 400000, chunks = [];
    for (let o = 0, ci = 0; o < N; o += CH, ci++) {
      const n = Math.min(CH, N - o), u = new Uint16Array(n * 3);
      for (let j = 0; j < n * 3; j++) u[j] = Math.round((pos[o * 3 + j] - mn[j % 3]) / sc[j % 3]);
      const b64 = await readB64(new Blob([u, d.col.subarray(o * 3, (o + n) * 3)])), fname = 'pc' + ci + '.js';
      pkgMsg(t('pkgPcN', ci + 1, Math.ceil(N / CH)));
      await put(md, fname, new Blob(['window.G360F=window.G360F||{};window.G360F[' + JSON.stringify(fname) + ']="', b64, '";']), 'model/' + fname);
      chunks.push({ src:fname, n }); list.push({ n:fname, src:fname });
    }
    const out = { kind:'e57', pc:{ n:N, min:mn, scale:sc, chunks }, stations:d.stations.map(p => p.map(v => +v.toFixed(4))) };
    const q = $('pkgPano').value;
    if (q !== 'off' && panoSrc && d.pano) {
      pkgMsg(t('pkgPanoPrep'));
      for (let w = 0; panoSrc.conv < 0 && w < 100; w++) await sleep(200);
      const size = q === 'low' ? 1024 : q === 'mid' ? 2048 : d.pano.stations[0].faces[0].size, total = d.pano.stations.length * 6, stations = [];
      let done = 0;
      for (const ps of d.pano.stations) {
        const faces = [];
        for (let f = 0; f < 6; f++) {
          const fc = ps.faces[f];
          let blob = await d.pano.readBlob(fc.off, fc.len);
          if (q !== 'high') { const c = await panoCanvas(blob, size, false); blob = await new Promise(r => c.toBlob(r, 'image/jpeg', q === 'low' ? 0.8 : 0.82)); }
          const fname = 'p' + ps.st + '_' + f + '.js';
          await put(md, fname, new Blob(['window.G360F=window.G360F||{};window.G360F[' + JSON.stringify(fname) + ']="', await readB64(blob), '";']), 'model/' + fname);
          faces.push({ src:fname, R:fc.R.map(x => +x.toFixed(7)) });
          pkgMsg(t('pkgPanoN', ++done, total));
        }
        stations.push({ st:ps.st, faces });
      }
      out.pano = { conv:panoSrc.conv >= 0 ? panoSrc.conv : PANO_DEF, size, stations };
    }
    return out;
  }
  let pkgAbort = false;
  async function siteViewer() {   // the Studio online has no Studio folder: its own page and lib/*.js are read back from the site (signed in, so the page comes back)
    const get = async u => { const r = await fetch(u, { cache:'no-store', credentials:'same-origin' }); if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + u); return r.blob(); };
    const page = await get(location.href.split('#')[0]), lib = [];
    if (!/G360_CLIENT\s*=\s*false/.test(await page.slice(0, 4000).text())) throw new Error(t('pkgNeedSrc'));
    for (const sc of document.querySelectorAll('script[src]')) {
      const u = new URL(sc.getAttribute('src'), location.href); if (!/\/lib\/[^/]+\.js$/i.test(u.pathname)) continue;
      const b = await get(u.href), n = decodeURIComponent(u.pathname.split('/').pop()); lib.push({ name:n, getFile:async () => new File([b], n) });
    }
    return { html:{ getFile:async () => new File([page], 'Gambit360 Studio.html') }, lib, obf:null, name:'' };
  }
  async function makePackage() {
    if ((!lastObjFiles && !lastE57) || !window.showDirectoryPicker) { pkgMsg(t('pkgNoFS')); return; }
    // The viewer file and its lib folder are copied too. The page cannot read its own file, so the folder that holds them is chosen once and remembered.
    let src = null, found = null, root = null;
    if (CP_HOSTED) {   // the Studio online: the viewer and its lib come from the site, and the package goes into a folder picked on this computer
      try { found = await siteViewer(); } catch (err) { pkgMsg(t('pkgFail') + err.message); return; }
      try { root = await g360Pick.dir({ id:'g360pkg', mode:'readwrite' }); } catch (err) { if (!(err && err.name === 'AbortError')) pkgMsg(t('pkgNeedRW')); return; }
    } else {
      try { src = await idb.get('srcDir'); } catch (err) {}
      if (src) {
        try {
          let p = await src.queryPermission({ mode:'readwrite' });
          if (p !== 'granted') p = await src.requestPermission({ mode:'readwrite' });
          if (p !== 'granted') src = null;
        } catch (err) { pkgMsg(t('pkgAgain')); return; }
        if (src) src = await alignSrc(src);
      }
      if (!src) { pkgMsg(t('pkgNeedSrc')); return; }
      found = await findViewer(src);
      if (!found.html || !found.lib.length) { try { await idb.del('srcDir'); } catch (err) {} pkgMsg(t('pkgBadSrc', found.name, !!found.html, found.lib.length)); return; }
      try { root = await exportDir(src, 'Client Packages', true); }
      catch (err) { pkgMsg(t('pkgNeedRW')); return; }
    }
    const projName = $('pkgName').value.trim();
    const mgr = $('pkgMgr').value.trim();
    const expires = expiryEnd();
    try { localStorage.setItem('tourViewerExp:' + currentName, JSON.stringify({ start:$('pkgStart').value, dur:$('pkgDur').value, unit:$('pkgUnit').value })); } catch (err) {}
    try { localStorage.setItem('tourViewerTitle:' + currentName, projName); localStorage.setItem('tourViewerMgr:' + currentName, mgr); } catch (err) {}
    const use = lastObjFiles ? lastObjFiles.filter(f => /\.(obj|mtl|jpe?g|png|webp|bmp|gif)$/i.test(f.name)) : [];
    const safe = (projName || currentName || 'Gambit360-project').replace(/[\\/:*?"<>|]+/g, '_').trim() || 'Gambit360-project';
    const entries = [];   // everything that goes into the ZIP
    try {
      const pdir = await root.getDirectoryHandle(safe, { create:true });
      const put = async (dir, name, data, path) => {
        if (pkgAbort) throw new Error('cancelled');
        const fh = await dir.getFileHandle(name, { create:true });
        const w = await fh.createWritable(); await w.write(data); await w.close();
        entries.push({ path:safe + '/' + path, fh });
      };
      $('pkgOpen').hidden = true; pkgBusy = true; pkgMsg(t('pkgCopying')); pkgAbort = false; $('pkgCancelBtn').hidden = false; $('pkgFloatStop').hidden = false;
      // The client's file is generated from this one: same viewer, with the creation tools switched off.
      const upUrl = '', pubV = '';
      savePkgOpt();
      const html = await protectHtml(stampClient(await (await found.html.getFile()).text(), upUrl, pubV), found);
      const viewerName = safe + '.html';   // the client's file is named after the project
      try { await pdir.removeEntry('Gambit360 Viewer.html'); } catch (err) {}   // an old package made before the rename: remove the old file name
      await put(pdir, viewerName, html, viewerName);
      const ld = await pdir.getDirectoryHandle('lib', { create:true });
      for (const fh of found.lib) await put(ld, fh.name, await fh.getFile(), 'lib/' + fh.name);
      const md = await pdir.getDirectoryHandle('model', { create:true });
      const old = [];
      for await (const [name] of md.entries()) if (/^(manifest|f\d+|pc\d+|p\d+_\d+)\.js$/i.test(name) || /^promo\.(mp4|webm|mov|m4v)$/i.test(name)) old.push(name);
      // The old files stay until the new ones are written (same names are overwritten); a stopped or failed run then leaves the previous package usable.
      const list = [];
      const extra = lastE57 ? await writeE57Model(md, put, list) : {};
      if (lastPromo) { const pn = 'promo.' + lastPromo.ext; await put(md, pn, lastPromo.blob, 'model/' + pn); extra.promo = pn; }
      for (let i = 0; i < use.length; i++) {
        pkgMsg(t('pkgWriting', i + 1, use.length));
        const fname = 'f' + i + '.js';
        const b64 = await readB64(use[i]);
        await put(md, fname, new Blob(['window.G360F=window.G360F||{};window.G360F[' + JSON.stringify(fname) + ']="', b64, '";']), 'model/' + fname);
        list.push({ n:use[i].name, src:fname });
      }
      await put(md, 'manifest.js', 'window.G360PKG=' + JSON.stringify(Object.assign({ name:currentName, built:Date.now(), logo:customLogo || undefined, ...brandFields(), title:projName, manager:mgr, expires, terms:(window.G360_getTerms ? window.G360_getTerms(true) : ''), link:$('pkgMpShow').checked ? getLink() : '', miniClosed:$('pkgMini').checked ? 1 : undefined, clientTags:$('pkgClientTags').checked ? 1 : undefined, noCloud:$('pkgCloud').checked ? undefined : 1, promoMode:promoModeVal(), tags:(window.G360_extrasData().tags.length ? window.G360_extrasData().tags : undefined), start:window.G360_extrasData().start, hide:window.G360_extrasData().hide, floors:window.G360_extrasData().floors, views:views.map(v => ({ n:v.n, p:v.p, yaw:v.yaw, pitch:v.pitch, room:v.room ? 1 : undefined })), files:list }, extra)) + ';', 'model/manifest.js');
      { const fresh = new Set(entries.filter(e => e.path.startsWith(safe + '/model/')).map(e => e.path.slice((safe + '/model/').length)));   // leftovers of an older package are removed only now
        for (const name of old) if (!fresh.has(name)) { try { await md.removeEntry(name); } catch (err) {} } }
      let zipped = false;
      if ($('pkgZip').checked) {
        await writeZip(root, safe + '.zip', entries, n => { if (pkgAbort) throw new Error('cancelled'); pkgMsg(t('pkgZipping', n, entries.length)); });
        zipped = true;
      }
      setProjectTitle(projName, mgr); pkgMsg(t('pkgDone', root.name, safe, zipped) + (lastPromo || promoModeVal() ? '' : ' ' + t('pkgNoPromo')));
      await showPkgPath(src, root, safe);
      if (typeof pkgPublish === 'function') await pkgPublish(entries, safe, viewerName);   // asks whether the client should also get it as a link on the site
    } catch (err) { console.error(err); pkgMsg(pkgAbort ? t('pkgCancelledMsg') : t('pkgFail') + err.message); }
    finally {
      $('pkgCancelBtn').hidden = true; pkgBusy = false;
      const f = $('pkgFloat'); if (!$('pkgPanel').hidden) f.hidden = true; else { $('pkgFloatTxt').textContent = $('pkgMsgBox').textContent; $('pkgFloatStop').hidden = true; f.hidden = false; clearTimeout(pkgFloatT); pkgFloatT = setTimeout(() => { f.hidden = true; }, 9000); }   // the result stays visible for a few seconds
    }
  }
  // The browser cannot open Windows Explorer or tell a folder's real path. The helper started by the launcher (.bat) can: the page leaves a small request file
  // in the Studio folder, the helper reads it, opens the folder (unless the request starts with "?") and writes the real path back into a result file.
  async function helperReq(src, rel) {
    try {
      try { await src.removeEntry('.open-folder6.result.txt'); } catch (err) {}
      const fh = await src.getFileHandle('.open-folder6.txt', { create:true }); const w = await fh.createWritable(); await w.write(rel); await w.close();
      for (let i = 0; i < 12; i++) {
        await new Promise(r => setTimeout(r, 300));
        try { const f = await (await src.getFileHandle('.open-folder6.result.txt')).getFile(); const txt = (await f.text()).replace(/^\ufeff/, '').trim(); try { await src.removeEntry('.open-folder6.result.txt'); } catch (err) {} if (txt) return txt; } catch (err) {}
      }
      try { await src.removeEntry('.open-folder6.txt'); } catch (err) {}   // nobody picked it up: no helper is running
    } catch (err) { console.error(err); }
    return null;
  }
  const pageDir = () => { try { if (location.protocol !== 'file:') return ''; const p = decodeURIComponent(location.pathname).replace(/^\/([A-Za-z]:)/, '$1'); return p.slice(0, p.lastIndexOf('/')).replace(/\//g, '\\'); } catch (err) { return ''; } };
  // Saves go to the folder the Studio runs from: when the remembered Studio folder is another one, ask for the right one once.
  async function alignSrc(src) {
    const here = pageDir(); if (!here || !src) return src;
    const real = await helperReq(src, '?.');
    if (real && real !== srcReal) refreshSrc(real);
    if (!real || real.replace(/\\+$/, '').toLowerCase() === here.replace(/\\+$/, '').toLowerCase()) return src;
    pkgMsg(t('srcMismatch', here));
    try {
      const dir = await g360Pick.dir({ id:'g360studio', mode:'readwrite' });
      const f0 = await findViewer(dir);
      if (f0.html && f0.lib.length) { try { await idb.set('srcDir', dir); } catch (err) {} refreshSrc(await helperReq(dir, '?.') || ''); return dir; }
    } catch (err) {}
    return src;
  }
  async function showPkgPath(src, root, safe, sub) {
    $('pkgOpen').hidden = true;
    let rel = null;
    try { rel = await src.resolve(root); } catch (err) {}
    if (!rel || location.protocol !== 'file:') { $('pkgMsgBox').textContent += ' ' + t('pkgTipPath'); return; }
    const relStr = rel.concat([safe], sub ? [sub] : []).join('\\');
    let path = await helperReq(src, ($('pkgOpenDir').checked ? '' : '?') + relStr);   // the real path, and the folder is opened when asked
    if (!path) { path = pageDir() + '\\' + relStr; }   // no helper: the best guess is the folder the Studio runs from
    $('pkgPath').textContent = path;
    $('pkgCopy').onclick = async () => {
      try { await navigator.clipboard.writeText(path); }
      catch (err) { const ta = document.createElement('textarea'); ta.value = path; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); }
      pkgMsg(t('pkgCopied'));
    };
    $('pkgOpen').hidden = false;
  }
  const openPkgFolder = async (src, safe, sub) => { try { await showPkgPath(src, await exportDir(src, 'Client Packages'), safe, sub); } catch (err) { console.error(err); } };
  try { $('pkgOpenDir').checked = localStorage.getItem('g360OpenDir') !== '0'; } catch (err) {}
  $('pkgOpenDir').onchange = () => { try { localStorage.setItem('g360OpenDir', $('pkgOpenDir').checked ? '1' : '0'); } catch (err) {} };
  // A plain ZIP (stored, no compression) written straight to disk, so large models do not fill the memory.
  const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  async function crc32(file) {
    let c = 0xFFFFFFFF;
    for (let off = 0; off < file.size; off += 8 << 20) {
      const b = new Uint8Array(await file.slice(off, off + (8 << 20)).arrayBuffer());
      for (let i = 0; i < b.length; i++) c = CRC_T[(c ^ b[i]) & 255] ^ (c >>> 8);
    }
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  async function writeZip(dir, zipName, entries, progress) {
    const w = await (await dir.getFileHandle(zipName, { create:true })).createWritable();
    const enc = new TextEncoder(), d = new Date();
    const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    const central = []; let offset = 0;
    try {
      for (let i = 0; i < entries.length; i++) {
        progress(i + 1);
        const file = await entries[i].fh.getFile(), name = enc.encode(entries[i].path), size = file.size;
        if (size > 0xFFFFFFF0 || offset > 0xFFFFFFF0) throw new Error('too large for a ZIP file');
        const crc = await crc32(file);
        const h = new DataView(new ArrayBuffer(30));
        h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
        h.setUint16(10, time, true); h.setUint16(12, date, true); h.setUint32(14, crc, true); h.setUint32(18, size, true); h.setUint32(22, size, true);
        h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
        await w.write(h.buffer); await w.write(name); await w.write(file);
        central.push({ name, crc, size, offset }); offset += 30 + name.length + size;
      }
      const start = offset;
      for (const c of central) {
        const h = new DataView(new ArrayBuffer(46));
        h.setUint32(0, 0x02014b50, true); h.setUint16(4, 20, true); h.setUint16(6, 20, true); h.setUint16(8, 0x0800, true); h.setUint16(10, 0, true);
        h.setUint16(12, time, true); h.setUint16(14, date, true); h.setUint32(16, c.crc, true); h.setUint32(20, c.size, true); h.setUint32(24, c.size, true);
        h.setUint16(28, c.name.length, true); h.setUint32(42, c.offset, true);
        await w.write(h.buffer); await w.write(c.name); offset += 46 + c.name.length;
      }
      const e = new DataView(new ArrayBuffer(22));
      e.setUint32(0, 0x06054b50, true); e.setUint16(8, central.length, true); e.setUint16(10, central.length, true);
      e.setUint32(12, offset - start, true); e.setUint32(16, start, true);
      await w.write(e.buffer); await w.close();
    } catch (err) { try { await w.abort(); } catch (e2) {} throw err; }
  }
  $('pkgCancelBtn').onclick = () => { pkgAbort = true; $('pkgCancelBtn').hidden = true; $('pkgFloatStop').hidden = true; pkgMsg(t('pkgCancelling')); };
  $('pkgFloatStop').onclick = () => $('pkgCancelBtn').click();
  // Brings an existing client package up to date (points, names, tags, start point, settings and the viewer file) without writing the model again.
  async function syncPackage(noOpen) {
    if ((!lastObjFiles && !lastE57) || !window.showDirectoryPicker) { pkgMsg(t('pkgNoFS')); return false; }
    let src = null;
    try { src = await idb.get('srcDir'); } catch (err) {}
    if (src) {
      try {
        let p = await src.queryPermission({ mode:'readwrite' });
        if (p !== 'granted') p = await src.requestPermission({ mode:'readwrite' });
        if (p !== 'granted') src = null;
      } catch (err) { pkgMsg(t('pkgAgain')); return false; }
      if (src) src = await alignSrc(src);
    }
    if (!src) { pkgMsg(t('pkgNeedSrc')); return false; }
    const projName = $('pkgName').value.trim(), mgr = $('pkgMgr').value.trim(), expires = expiryEnd();
    const safe = (projName || currentName || 'Gambit360-project').replace(/[\\/:*?"<>|]+/g, '_').trim() || 'Gambit360-project';
    let pdir, md, mfh;
    try {
      const root = await exportDir(src, 'Client Packages');
      pdir = await root.getDirectoryHandle(safe); md = await pdir.getDirectoryHandle('model');
    } catch (err) { pkgMsg(t('pkgSyncMissing', safe)); await makePackage(); return 'full'; }   // no package yet: create it in full
    try { mfh = await md.getFileHandle('manifest.js'); } catch (err) { pkgMsg(t('pkgSyncMissing', safe)); await makePackage(); return 'full'; }   // a broken package (no manifest): rebuild it in full
    try {
      pkgMsg(t('pkgCopying'));
      const txt = await (await mfh.getFile()).text();
      const a = txt.indexOf('{'), b = txt.lastIndexOf('}');
      const man = JSON.parse(txt.slice(a, b + 1));
      const ex = window.G360_extrasData ? window.G360_extrasData() : {};
      Object.assign(man, { built:Date.now(), logo:customLogo || undefined, ...brandFields(), title:projName, manager:mgr, expires, terms:(window.G360_getTerms ? window.G360_getTerms(true) : ''),
        link:$('pkgMpShow').checked ? getLink() : '', miniClosed:$('pkgMini').checked ? 1 : undefined, clientTags:$('pkgClientTags').checked ? 1 : undefined, noCloud:$('pkgCloud').checked ? undefined : 1, promoMode:promoModeVal(),
        tags:(ex.tags && ex.tags.length ? ex.tags : undefined), tagTypes:ex.tagTypes, floors:ex.floors, start:ex.start, hide:ex.hide,
        views:views.map(v => ({ n:v.n, p:v.p, yaw:v.yaw, pitch:v.pitch, room:v.room ? 1 : undefined })) });
      savePkgOpt();
      const wr = async (dir, name, data) => { const fh = await dir.getFileHandle(name, { create:true }); const w = await fh.createWritable(); await w.write(data); await w.close(); };
      await wr(md, 'manifest.js', 'window.G360PKG=' + JSON.stringify(man) + ';');
      pkgMsg(t('pkgSyncOk', safe)); if (!noOpen) openPkgFolder(src, safe, 'model');
      return true;
    } catch (err) { console.error(err); pkgMsg(t('pkgSyncFail') + err.message); return false; }
  }
  

  // The settings a client package carries (the same ones the manifest holds).
  function clientFields() {
    const ex = window.G360_extrasData ? window.G360_extrasData() : {};
    return { logo:customLogo || undefined, ...brandFields(), title:$('pkgName').value.trim(), manager:$('pkgMgr').value.trim(), expires:expiryEnd(), terms:(window.G360_getTerms ? window.G360_getTerms(true) : ''),
      link:$('pkgMpShow').checked ? getLink() : '', miniClosed:$('pkgMini').checked ? 1 : undefined, clientTags:$('pkgClientTags').checked ? 1 : undefined, noCloud:$('pkgCloud').checked ? undefined : 1, promoMode:promoModeVal(),
      tags:(ex.tags && ex.tags.length ? ex.tags : undefined), tagTypes:ex.tagTypes, floors:ex.floors, start:ex.start, hide:ex.hide, views:views.map(v => ({ n:v.n, p:v.p, yaw:v.yaw, pitch:v.pitch, room:v.room ? 1 : undefined })) };
  }
  async function srcForFiles(needHtml) {
    if ((!lastObjFiles && !lastE57) || !window.showDirectoryPicker) { pkgMsg(t('pkgNoFS')); return null; }
    let src = null;
    try { src = await idb.get('srcDir'); } catch (err) {}
    if (src) {
      try {
        let p = await src.queryPermission({ mode:'readwrite' });
        if (p !== 'granted') p = await src.requestPermission({ mode:'readwrite' });
        if (p !== 'granted') src = null;
      } catch (err) { pkgMsg(t('pkgAgain')); return null; }
      if (src) src = await alignSrc(src);
    }
    if (!src) {   // first time: no need to look for a button, the folder is asked for right here (once; it is remembered)
      pkgMsg(t('pkgPickSrc'));
      try {
        const dir = await g360Pick.dir({ id:'g360studio', mode:'readwrite' });
        const f0 = await findViewer(dir);
        if (!f0.html || !f0.lib.length) { pkgMsg(t('pkgBadSrc', f0.name, !!f0.html, f0.lib.length)); return null; }
        try { await idb.set('srcDir', dir); } catch (err) {}
        refreshSrc(await helperReq(dir, '?.') || ''); src = dir;
      } catch (err) { if (!(err && err.name === 'AbortError')) pkgMsg(t('pkgFail') + err.message); return null; }
    }
    const found = await findViewer(src);
    if (needHtml && !found.html) { pkgMsg(t('pkgBadSrc', found.name, false, found.lib.length)); return null; }
    return { src, found };
  }
  const stamp = () => { const d = new Date(), z = n => String(n).padStart(2, '0'); return d.getFullYear() + '.' + z(d.getMonth() + 1) + '.' + z(d.getDate()) + '.' + z(d.getHours()) + z(d.getMinutes()) + z(d.getSeconds()); };
  const safeName = () => ($('pkgName').value.trim() || currentName || 'Gambit360-project').replace(/[\\/:*?"<>|]+/g, '_').trim() || 'Gambit360-project';
  // A new viewer file alone (no model files): the client replaces his HTML file with it. The current settings are inside it.
  async function createHtmlFile(o) {
    o = o || {};
    const sf = await srcForFiles(true); if (!sf) return false;
    try {
      const safe = safeName(), V = stamp(); savePkgOpt();
      const html = await protectHtml(stampClient(await (await sf.found.html.getFile()).text(), '', V, { name:currentName, ts:Date.now(), pkg:o.noSettings ? undefined : clientFields() }), sf.found);
      const root = await exportDir(sf.src, 'Client Packages', true);
      const dir = await root.getDirectoryHandle(safe, { create:true });   // the project's own package folder: the old viewer file is replaced
      const fh = await dir.getFileHandle(safe + '.html', { create:true }); const w = await fh.createWritable(); await w.write(html); await w.close();
      pkgMsg(t(o.noSettings ? 'pkgUiDone' : o.both ? 'pkgBothDone' : 'htmlFileDone', safe + '.html', safe)); openPkgFolder(sf.src, safe);
      return true;
    } catch (err) { console.error(err); pkgMsg(t('pkgFail') + err.message); return false; }
  }
    // Model ticked = the whole package (model, viewer and settings are all written, so those two boxes are shown ticked and locked).
  let partSaved = { ui:true, set:true, model:true };
  try { Object.assign(partSaved, JSON.parse(localStorage.getItem('g360Parts') || '{}')); } catch (err) {}
  const showParts = () => { const m = $('pkgPartModel').checked; $('pkgPartModel').checked = !!partSaved.model; const mm = $('pkgPartModel').checked;
    $('pkgPartUi').checked = mm ? true : !!partSaved.ui; $('pkgPartSet').checked = mm ? true : !!partSaved.set; $('pkgPartUi').disabled = $('pkgPartSet').disabled = mm;
    $('pkgPartUi').parentElement.style.opacity = $('pkgPartSet').parentElement.style.opacity = mm ? .5 : ''; };
  showParts();
  $('pkgPartModel').onchange = () => { partSaved.model = $('pkgPartModel').checked; try { localStorage.setItem('g360Parts', JSON.stringify(partSaved)); } catch (err) {} showParts(); };
  $('pkgPartUi').onchange = () => { partSaved.ui = $('pkgPartUi').checked; try { localStorage.setItem('g360Parts', JSON.stringify(partSaved)); } catch (err) {} };
  $('pkgPartSet').onchange = () => { partSaved.set = $('pkgPartSet').checked; try { localStorage.setItem('g360Parts', JSON.stringify(partSaved)); } catch (err) {} };
  // One button: model = the whole package; otherwise the viewer and/or the settings of an existing package are rewritten (the model files stay as they are).
  $('pkgBtn').onclick = async () => {
    const md = $('pkgPartModel').checked, ui = $('pkgPartUi').checked, st = $('pkgPartSet').checked;
    if (md) return makePackage();
    if (!ui && !st) { pkgMsg(t('pkgPartNone')); return; }
    if (ui && st) { const r = await syncPackage(true); if (r === true) await createHtmlFile({ both:true }); return; }   // 'full' = the package was missing and has just been built whole
    if (st) return syncPackage();
    return createHtmlFile({ noSettings:true });
  };
  try { $('pkgObf').checked = localStorage.getItem('g360Obf') !== '0'; } catch (err) {}
  const obfSync = () => { $('obfWarn').hidden = $('pkgObf').checked; };   // unticked: a warning stays on the screen
  $('pkgObf').onchange = () => { try { localStorage.setItem('g360Obf', $('pkgObf').checked ? '1' : '0'); } catch (err) {} obfSync(); };
  obfSync();
  $('pkgMineBtn').onclick = () => $('mineFile').click();
  /*@/STUDIO*/


