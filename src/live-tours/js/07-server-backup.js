  // ---- server backup: the same data as the local backup, sent through upload.php (needs the upload key); the key itself is never sent as data ----
  async function srvPost(a, name, blob, extra) {
    const fd = new FormData(); fd.append('key', settings.upKey); fd.append('action', a); fd.append('name', name); if (extra) Object.keys(extra).forEach(k => fd.append(k, extra[k])); if (blob) fd.append('file', blob, 'f');
    const r = await fetch(upUrl(), { method: 'POST', body: fd, cache: 'no-store' });
    if (a === 'bkput') { let j = null; try { j = await r.json(); } catch (e) {} if (!(j && j.ok)) throw new Error(j && j.error === 'action' ? 'action' : (j && j.error) || 'HTTP ' + r.status); return j; }
    if (!r.ok) throw new Error(r.status === 400 ? 'action' : 'HTTP ' + r.status);
    return r;
  }
  async function srvBackup(interactive, strict) {   // = a sync with the server (07a-cloud.js): what changed on another computer comes in, then this computer's copy goes up
    try { return await srvSync(interactive); } catch (e) { if (interactive || strict) throw e; return false; }
  }
  async function srvRestore() {
    if (!settings.upKey || !settings.base) { msg(L('srvNeed'), true); return; }
    try {
      const data = await (await srvPost('bkget', 'tours.json')).json();
      if (!data || !Array.isArray(data.tours)) { msg(L('rsNone'), true); return; }
      for (const k of Object.keys(data.files || {})) {
        const e = data.files[k];
        try { const b = await (await srvPost('bkget', 'files/' + e.file)).blob(); await db.fset(k, { blob: new Blob([b], { type: e.type || b.type }), name: e.name, type: e.type, ts: e.ts || 0 }); forgetUrl(k); } catch (x) {}
      }
      for (const t of data.tours) await db.put(normTour(t));
      if (data.settings) { Object.keys(data.settings).forEach(k => { if (settings[k] === undefined || settings[k] === '' || k === 'base') settings[k] = data.settings[k]; }); if (Array.isArray(data.settings.folders)) settings.folders = [...new Set((settings.folders || []).concat(data.settings.folders))]; try { await db.kset('settings', settings); } catch (e) {} }
      await load(); cur = tours[0] || null; pvModel = null; texts(); renderList(); renderEdit(); preview(true);
      msg(L('rsDone', data.tours.length));
    } catch (e) { msg(e && e.message === 'action' ? L('srvOld') : L('rsFail') + (e && e.message || e), true); }
  }
  function srvTexts() { $('lvSrvBkL').textContent = L('srvBkOn'); $('lvSrvRestore').textContent = L('srvRestore'); $('lvSrvPhp').textContent = L('srvPhp'); }
  async function srvSt() { let at = 0; try { at = await db.kget('srvBkAt'); } catch (e) {} $('lvSrvBkSt').textContent = at ? L('srvLast', new Date(at).toLocaleString()) : L('srvNone'); }
  $('lvSrvRestore').onclick = () => { readSet(); if (confirm(L('srvRsConfirm'))) srvRestore(); };
  $('lvSrvPhp').onclick = async () => {
    readSet(); if (!settings.upKey) { msg(L('srvNeed'), true); return; }
    try { const root = await outDir(false), dir = await exportDir(root, 'Live Tours', true); await writeFile(dir, 'upload.php', await uploadPhp()); msg(L('srvPhpDone')); }
    catch (e) { if (e && e.name !== 'AbortError') msg(L('pubFail') + (e.message || e), true); }
  };
  async function refreshBk() { let at = 0; try { at = await db.kget('bkAt'); } catch (e) {} $('lvBkSt').textContent = at ? L('bkLast', new Date(at).toLocaleString()) : L('bkNone'); }
  async function bkNowClick() {
    const done = [], bad = [];
    try {
      let n = await backup(true);
      if (n === false) { await outDir(true); n = await backup(true); }
      if (n === false) { bkSt.local = { ok: false, err: L('bkNoDirAuto') }; bad.push(L('bkLocFail', L('bkNoDirAuto'))); }
      else { bkSt.local = { ok: true, n, at: Date.now() }; done.push(L('bkOkLocal', n)); await refreshBk(); }
    } catch (e) { bkSt.local = { ok: false, err: e && e.name === 'AbortError' ? L('bkNoDirAuto') : bkErr(e) }; bad.push(L('bkLocFail', bkSt.local.err)); }
    if (!settings.upKey) { bkSt.srv = { ok: false, err: L('bkNoKey') }; bad.push(L('srvBkFail', L('bkNoKey'))); }
    else { try { const n = await srvBackup(true); if (n !== false) { bkSt.srv = { ok: true, n, at: Date.now() }; done.push(L('bkOkSrv', n)); srvSt(); } } catch (e) { bkSt.srv = { ok: false, err: bkErr(e) }; bad.push(L('srvBkFail', bkSt.srv.err)); } }
    msg(done.concat(bad).join('  \u00b7  '), bad.length > 0); checkBk();
  }







  $('lvBkNow').onclick = bkNowClick;
  $('lvBkRestore').onclick = restore;
  async function refreshSplash() {
    const m = await fileMeta('splash'), im = $('lvSplImg'); forgetUrl('splash');
    if (m && m.blob) { im.src = await fileUrl('splash'); im.hidden = false; } else { im.removeAttribute('src'); im.hidden = true; }
    $('lvSplRm').hidden = !(m && m.blob); $('lvSplW').value = +settings.splW || 260; splWTxt();
  }
  $('lvSplPick').onclick = () => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/png,.png';
    inp.onchange = async () => { const f = inp.files && inp.files[0]; if (!f) return; if (!pngOk(f)) { msg(L('pngBad'), true); return; } await db.fset('splash', { blob: f, name: f.name, type: f.type, ts: Date.now() }); bkSoon(); refreshSplash(); };
    inp.click();
  };
  // the loading-screen logo's size (all tours; the page keeps it inside the screen)
  const splWTxt = () => { const v = +settings.splW || 260; $('lvSplWL').textContent = L('splW', v); };
  $('lvSplW').oninput = () => { settings.splW = +$('lvSplW').value; splWTxt(); saveSet(); };
  $('lvSplRm').onclick = async () => { try { await db.fdel('splash'); } catch (e) {} forgetUrl('splash'); bkSoon(); refreshSplash(); };

