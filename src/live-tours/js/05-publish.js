  // ---- publish: one shared page (index.html) + .htaccess + tours/<address>/config.json and the files ----
  async function outDir(ask) {
    let d = null;
    try { d = await db.kget('outDir'); } catch (e) {}
    if (!d) d = await studioDirHandle();
    if (d && !ask) { try { const p = await d.queryPermission({ mode: 'readwrite' }); if (p === 'granted' || (await d.requestPermission({ mode: 'readwrite' })) === 'granted') return d; } catch (e) {} }
    d = await g360Pick.dir({ id: 'g360live', mode: 'readwrite' });
    try { await db.kset('outDir', d); } catch (e) {}
    return d;
  }
  async function outDirQuiet() {   // the output folder only if it is already there: with the upload to the server a local copy is optional (another computer, the Studio online)
    if (!window.showDirectoryPicker) return null;
    let d = null; try { d = await db.kget('outDir'); } catch (e) {} if (!d) d = await studioDirHandle(); if (!d) return null;
    try { if ((await d.queryPermission({ mode: 'readwrite' })) === 'granted' || (await d.requestPermission({ mode: 'readwrite' })) === 'granted') return d; } catch (e) {}
    return null;
  }
  async function writeFile(dir, name, data) { const fh = await dir.getFileHandle(name, { create: true }); const w = await fh.createWritable(); await w.write(data); await w.close(); }
  function wrapperHtml() { return $('g360LiveTpl').textContent.replace(/<\\\/script>/g, '<' + '/script>'); }
  const HTACCESS = '# Gambit360 live tours: /address or /address/ opens index.html with that tour\nOptions -Indexes\nDirectoryIndex index.php index.html\n<IfModule mod_rewrite.c>\nRewriteEngine On\nRewriteCond %{REQUEST_FILENAME} !-f\nRewriteCond %{REQUEST_FILENAME} !-d\nRewriteRule ^([A-Za-z0-9][A-Za-z0-9_-]*)/?$ index.php?t=$1 [QSA,L]\n</IfModule>\n<IfModule mod_headers.c>\n<FilesMatch "config\\.json$">\nHeader set Cache-Control "no-cache"\n</FilesMatch>\n</IfModule>\n<IfModule mod_alias.c>\nRedirectMatch 404 /_backup(/|$)\nRedirectMatch 404 /_stats(/|$)\nRedirectMatch 404 \\.part$\n</IfModule>\n';
  // index.php: the same page, plus the link preview (WhatsApp / Facebook read the page without running it, so the tour's title,
  // description and picture are written into it on the server). Rewrites go to index.php; index.html stays the page itself.
  const INDEX_PHP = () => $('g360IndexTpl').textContent;   // live-tours/index.php
  const README = 'Gambit360 – סיורים חיים\r\n\r\nהעלה את כל התוכן של התיקייה הזו (index.html, .htaccess, upload.php והתיקייה tours) לתיקיית השורש של הסאב-דומיין,\r\nאו לתיקיית בדיקה כמו gambit360.co.il/vr-test/.\r\n\r\nכל סיור נפתח בכתובת: <כתובת האתר>/<הכתובת של הסיור>\r\nמצב כיול מיני-מפה: <כתובת האתר>/<הכתובת של הסיור>?calib=1\r\n\r\nעדכון של סיור קיים: מספיק להעלות מחדש את התיקייה tours/<הכתובת של הסיור>.\r\n';
  async function sha256hex(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
  const G360_LOGO = (document.querySelector('#logo img') || {}).src || '';   // read now, before a client logo can take its place
  async function uploadPhp() { return $('g360UploadTpl').textContent.replace('@@KEYHASH@@', settings.upKey ? await sha256hex(settings.upKey) : '').replace('@@LOGO@@', () => /^data:image\/[a-z+]+;base64,[A-Za-z0-9+/=]+$/.test(G360_LOGO) ? G360_LOGO : ''); }
  const upUrl = () => settings.base.replace(/\/?$/, '/') + 'upload.php';
  async function upPost(fields, blob) {
    const fd = new FormData(); Object.keys(fields).forEach(k => fd.append(k, fields[k])); if (blob) fd.append('file', blob, (fields.path || 'f').split('/').pop());
    const r = await fetch(upUrl(), { method: 'POST', body: fd, cache: 'no-store' });
    let j = null; try { j = await r.json(); } catch (e) {}
    if (!j) throw new Error('HTTP ' + r.status);
    return j;
  }
  async function writePath(dir, path, data) { const parts = path.split('/'); let d = dir; for (let i = 0; i < parts.length - 1; i++) d = await d.getDirectoryHandle(parts[i], { create: true }); await writeFile(d, parts[parts.length - 1], data); }
  async function publish(list) {
    const toSrv = !!(settings.upKey && settings.upOn !== false);
    if (!window.showDirectoryPicker && !toSrv) { msg(L('needFS'), true); return; }
    const seen = {}, ok = list.filter(t => { const s = slugOf(t); if (!t.model || !slugOk(s) || seen[s]) return false; seen[s] = 1; return true; }), skipped = list.length - ok.length;
    if (!ok.length) { msg(list.length ? L('pubSkip', skipped) : L('pubNone'), true); return; }
    let root;
    try {
      const files = [];   // [path inside Live Tours, data, goes to the server]
      files.push(['index.html', new Blob([wrapperHtml()], { type: 'text/html' }), true]);
      files.push(['index.php', new Blob([INDEX_PHP()], { type: 'text/plain' }), true]);   // before .htaccess: an old upload.php refuses it, and then the rewrite to it is not sent either
      files.push(['.htaccess', new Blob([HTACCESS], { type: 'text/plain' }), true]);
      files.push(['README.txt', new Blob(['\ufeff' + README], { type: 'text/plain' }), false]);
      if (settings.upKey) files.push(['upload.php', new Blob([await uploadPhp()], { type: 'text/plain' }), false]);
      for (const t of ok) {
        const pre = 'tours/' + slugOf(t) + '/';
        const cfg = { v: 1, name: t.name, title: t.title || t.name || '', model: t.model, sdkKey: settings.sdk || '', mp: t.mp, extra: t.extra || '', logo: null, music: null, nadir: null, mini: null, published: new Date().toISOString() };
        const put = async (k, base, def) => { const m = await fileMeta(t.id + ':' + k); if (!m) return ''; const n = base + '.' + ext(m, def); files.push([pre + n, m.blob, true]); return n; };
        { const sp = await fileMeta(t.logo.on && t.logo.asSplash ? t.id + ':logo' : 'splash'); if (sp && sp.blob) { files.push([pre + 'splash.png', sp.blob, true]); cfg.splash = 'splash.png'; cfg.splashW = +settings.splW || 260; } }
        cfg.icons = t.icons; cfg.btnPos = t.btnPos; cfg.btnOff = t.btnOff; cfg.vidMode = t.vidMode === 'menu' ? 'menu' : 'player'; cfg.uiLang = ['he', 'en'].includes(t.uiLang) ? t.uiLang : 'auto'; cfg.btnLbl = t.btnLbl === 'icon' ? 'icon' : 'both'; cfg.btnSty = t.btnSty; cfg.btnOrder = t.btnOrder;
        { const inCard = !!(t.info && t.info.on && t.contact && t.contact.on), asBtn = !!(t.btnSty.contact && t.btnSty.contact.on);   // the contact button: in the details card, as a round button in the row, or both
          cfg.contact = (inCard || asBtn) && t.contact && String(t.contact.value || '').trim() ? { type: t.contact.type, value: String(t.contact.value).trim(), msg: t.contact.msg || '', label: t.contact.label || '' } : null;
          if (cfg.contact && !inCard) cfg.contactCard = false; }   /* a page published earlier reads every contact as one for the card */
        cfg.spotOn = !!t.spots.on; cfg.spots = t.spots.on ? t.spots.list.filter(x => x && x.ss).map(x => ({ name: x.name || '', ss: x.ss, sr: x.sr || '', m: x.m || '' })) : [];   // jump points
        cfg.mainName = t.mainName || t.name || '';
        cfg.welcome = t.welcome && t.welcome.on && (String(t.welcome.title || '').trim() || String(t.welcome.text || '').trim()) ? { title: String(t.welcome.title || '').trim(), text: String(t.welcome.text || '').trim(), pos: t.welcome.pos === 'r' ? 'r' : 'l', secs: +t.welcome.secs || 6, bottom: t.welcome.bottom == null ? 64 : +t.welcome.bottom } : null;
        cfg.tourOn = !!t.tourSec.on; cfg.vidOn = !!t.vidSec.on;
        cfg.tours = t.tourSec.on ? (t.tours || []).filter(x => x.model).map(x => ({ name: x.name || x.model, model: x.model })) : [];
        cfg.info = null; cfg.photos = null;
        if (t.info && t.info.on) {
          cfg.info = { title: t.info.title, text: t.info.text, phone: t.info.phone, mail: t.info.mail, link: t.info.link, linkTxt: t.info.linkTxt, address: String(t.info.address || '').trim(), layout: G360Card.LAYOUTS.includes(t.info.layout) ? t.info.layout : 'rows' };
          const im = await put('infoimg', 'info-image', 'jpg'); if (im) cfg.info.image = im;
          if (t.photos && t.photos.on) cfg.photos = { only360: !!t.photos.only360 };
        }
        cfg.videos = [];
        if (t.vidSec.on) for (const v of (t.videos || [])) { const f = await put('video:' + v.id, 'video-' + (cfg.videos.length + 1), 'mp4'); if (f) cfg.videos.push({ name: v.name || '', file: f }); }
        if (t.logo.on) { const f = await put('logo', 'logo', 'png'); if (f) cfg.logo = { file: f, pos: t.logo.pos, w: t.logo.w, card: !!t.logo.card, link: t.logo.link || '', top: t.logo.top, side: t.logo.side, tr: t.logo.tr || 0, mw: +t.logo.mw || 0 }; }
        if (t.music.on) { const f = await put('music', 'music', 'mp3'); cfg.music = { file: f || '', vol: t.music.vol / 100 }; }
        if (t.nadir.on) { const f = await put('nadir', 'nadir', 'png'); if (f) cfg.nadir = { file: f, size: t.nadir.size, opacity: t.nadir.opacity / 100 }; }
        if (t.mini.on && t.mini.floors.length) {
          const fl = [];
          for (let i = 0; i < t.mini.floors.length; i++) { const f = await put('floor:' + i, 'floor-' + (i + 1), 'png'); fl.push(f ? { label: t.mini.floors[i].label || L('floorN', i + 1), file: f, calib: t.mini.floors[i].calib || null } : null); }
          if (fl.some(Boolean)) cfg.mini = { pos: t.mini.pos, w: t.mini.w, open: t.mini.open !== false, floors: fl };
        }
        { const im = await put('share', 'share', 'jpg'); cfg.share = { image: im || '', desc: String(t.shareDesc || '').trim() }; }   // the link preview, read by index.php
        files.push([pre + 'config.json', new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' }), true]);
        { const ml = String(t.model || '').toLowerCase();   /* the old MPEmbed link /show/?m=MODEL finds a tour published under another name through this pointer */
          if (ml !== slugOf(t) && slugOk(ml) && !tours.some(o => slugOf(o) === ml) && !seen['@' + ml]) { seen['@' + ml] = 1; files.push(['tours/' + ml + '/config.json', new Blob([JSON.stringify({ v: 1, alias: slugOf(t) })], { type: 'application/json' }), true]); } }
      }
      root = toSrv ? await outDirQuiet() : await outDir(false);
      const gone = t => !tours.some(o => slugOf(o) === t);
      if (root) { const dir = await exportDir(root, 'Live Tours', true);
      for (const [p, b] of files) await writePath(dir, p, b);
      try { const td = await dir.getDirectoryHandle('tours'); for (const t of ok) if (t.pubSlug && t.pubSlug !== slugOf(t) && gone(t.pubSlug) && t.pubSlug !== String(t.model || '').toLowerCase()) { try { await td.removeEntry(t.pubSlug, { recursive: true }); } catch (e) {} } } catch (e) {} }
      ok.forEach(t => { if (!t.slug) t.slug = slugOf(t); t.pubSlug = slugOf(t); t.publishedAt = t.updated = Date.now(); db.put(t).catch(() => {}); }); syncActs(); bkSoon(800);
      if (!toSrv) { msg(L('pubDone', ok.length, root.name) + (skipped ? ' ' + L('pubSkip', skipped) : '')); return; }
      await srvCheck(false);   // an older upload.php on the server is replaced first
      const up = files.filter(f => f[2]);
      let idxOld = false;
      for (let i = 0; i < up.length; i++) {
        msg(L('upBusy', i + 1, up.length));
        let j;
        try { j = await upPost({ key: settings.upKey, action: 'put', path: up[i][0] }, up[i][1]); } catch (e) { msg(L('upFail', up[i][0], e.message || e) + ' · ' + L('pingNo') + upUrl(), true); return; }
        if (!j.ok && up[i][0] === 'index.php' && j.error === 'path') { idxOld = true; up.splice(i + 1, 1); continue; }   // an old upload.php: skip the preview and its rewrite (.htaccess, right after it), the tours keep working
        if (!j.ok) { msg(L('upFail', up[i][0], j.error === 'key' ? L('pingKey') : j.error), true); return; }
      }
      const bad = {}; let rmN = 0, rmErr = '';
      for (const t of ok) if (t.upSlug && t.upSlug !== slugOf(t) && gone(t.upSlug) && t.upSlug !== String(t.model || '').toLowerCase()) {
        try { const j = await upPost({ key: settings.upKey, action: 'rmtour', slug: t.upSlug }); if (j.ok) rmN++; else { bad[t.id] = 1; rmErr = j.error === 'action' ? L('srvOld') : String(j.error); } } catch (e) { bad[t.id] = 1; rmErr = e.message || String(e); }
      }
      ok.forEach(t => { t.uploadedAt = t.updated = Date.now(); if (!bad[t.id]) t.upSlug = slugOf(t); db.put(t).catch(() => {}); }); syncActs();
      msg(L('upDone', up.length) + (ok.length === 1 ? ' · ' + siteLink(ok[0]) : '') + (rmN ? ' · ' + L('rmDone', rmN) : '') + (rmErr ? ' · ' + L('rmFail', rmErr) : '') + (idxOld ? ' · ' + L('idxOld') : ''), !!rmErr || idxOld);
    } catch (e) { if (e && e.name === 'AbortError') return; msg(L('pubFail') + (e && e.message || e), true); }
  }

