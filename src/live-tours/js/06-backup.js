  // ---- backup: the tours live in the browser's storage, which "clear cache / site data" wipes, so a copy is kept on disk in Live Tours/_backup ----
  let bkT = 0, bkBusy = false, sbT = 0, sbBusy = false;
  const bkSt = { local: null, srv: null };   // result of the last automatic backups: { ok, err, n, at }
  const bkErr = e => { const m = e && e.message || String(e || ''); if (m === 'action') return L('srvOld'); if (m === 'key') return L('pingKey'); if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return L('pingNo') + upUrl(); return m; };
  async function bkLocalAuto() {
    if (bkBusy) return;
    if (!window.showDirectoryPicker) { bkSt.local = { ok: false, err: L('needFS') }; checkBk(); return; }
    try { const n = await backup(false); bkSt.local = n === false ? { ok: false, err: L('bkNoDirAuto') } : { ok: true, n, at: Date.now() }; } catch (e) { bkSt.local = { ok: false, err: bkErr(e) }; }
    checkBk();
  }
  async function bkSrvAuto() {
    if (settings.srvBk === false) { bkSt.srv = null; checkBk(); return; }
    if (!settings.upKey) { bkSt.srv = { ok: false, err: L('bkNoKey') }; checkBk(); return; }
    try { const n = await srvBackup(false, true); if (n !== false) { bkSt.srv = { ok: true, n, at: Date.now() }; srvSt(); } } catch (e) { bkSt.srv = { ok: false, err: bkErr(e) }; }
    checkBk();
  }
  function bkSoon(ms) { clearTimeout(bkT); bkT = setTimeout(bkLocalAuto, ms || 5000); clearTimeout(sbT); sbT = setTimeout(bkSrvAuto, ms ? ms + 2000 : 4000); }
  async function readJson(dir, name) { try { const fh = await dir.getFileHandle(name); return JSON.parse(await (await fh.getFile()).text()); } catch (e) { return null; } }
  async function subDir(d, n) { try { return await d.getDirectoryHandle(n); } catch (e) { return null; } }
  // returns the number of tours backed up, or false when no folder / permission is available (quietly, unless interactive)
  async function backup(interactive) {
    if (bkBusy || !window.showDirectoryPicker) return false;
    bkBusy = true;
    try {
      let d = null; try { d = await db.kget('outDir'); } catch (e) {} if (!d) d = await studioDirHandle();
      if (!d) return false;
      let p = await d.queryPermission({ mode: 'readwrite' });
      if (p !== 'granted') { if (!interactive) return false; p = await d.requestPermission({ mode: 'readwrite' }); if (p !== 'granted') return false; }
      const live = await exportDir(d, 'Live Tours', true), bk = await live.getDirectoryHandle('_backup', { create: true }), fd = await bk.getDirectoryHandle('files', { create: true });
      const list = await db.all(), prev = (await readJson(bk, 'tours.json')) || {}, pf = prev.files || {}, files = {};
      for (const t of list) {
        normTour(t);
        for (const k of fileKeys(t)) {
          const key = t.id + ':' + k, m = await fileMeta(key); if (!m || !m.blob) continue;
          const fn = key.replace(/[^A-Za-z0-9_.-]/g, '_') + '.bin';
          files[key] = { name: m.name || '', type: m.type || '', size: m.blob.size, ts: m.ts || 0, file: fn };
          const o = pf[key];
          if (!(o && o.size === files[key].size && o.ts === files[key].ts && o.name === files[key].name)) await writeFile(fd, fn, m.blob);
        }
      }
      for (const k of ['splash', 'splashLive']) { const m = await fileMeta(k); if (m && m.blob) { const o = pf[k], e = files[k] = { name: m.name || '', type: m.type || '', size: m.blob.size, ts: m.ts || 0, file: k + '.bin' }; if (!(o && o.size === e.size && o.ts === e.ts && o.name === e.name)) await writeFile(fd, k + '.bin', m.blob); } }
      await writeFile(bk, 'tours.json', new Blob([JSON.stringify({ v: 1, at: Date.now(), settings, tours: list, files }, null, 1)], { type: 'application/json' }));
      try { await db.kset('bkAt', Date.now()); } catch (e) {} checkBk();
      return list.length;
    } catch (e) { if (interactive) throw e; return false; }
    finally { bkBusy = false; }
  }
  async function restore() {
    if (!window.showDirectoryPicker) { msg(L('needFS'), true); return; }
    let root; try { root = await g360Pick.dir({ id: 'g360live', mode: 'readwrite' }); } catch (e) { return; }
    try {
      let bk = null, viaLive = false;
      let live = null; try { live = await exportDir(root, 'Live Tours'); } catch (e) {}   // the Studio folder (Export\Live Tours, or the older Live Tours) or the Export folder itself
      if (live) { bk = await subDir(live, '_backup'); viaLive = !!bk; }
      if (!bk) bk = await subDir(root, '_backup');
      if (!bk && root.name === '_backup') bk = root;
      const data = bk && await readJson(bk, 'tours.json');
      if (!data || !Array.isArray(data.tours)) { msg(L('rsNone'), true); return; }
      const fd = await subDir(bk, 'files');
      for (const k of Object.keys(data.files || {})) {
        const e = data.files[k];
        try { const f = await (await fd.getFileHandle(e.file)).getFile(); await db.fset(k, { blob: new Blob([await f.arrayBuffer()], { type: e.type || f.type }), name: e.name, type: e.type, ts: e.ts || 0 }); forgetUrl(k); } catch (x) {}
      }
      for (const t of data.tours) await db.put(normTour(t));
      if (data.settings) { Object.keys(data.settings).forEach(k => { if (settings[k] === undefined || settings[k] === '' || k === 'base') settings[k] = data.settings[k]; }); if (Array.isArray(data.settings.folders)) settings.folders = [...new Set((settings.folders || []).concat(data.settings.folders))]; try { await db.kset('settings', settings); } catch (e) {} }
      if (viaLive) { try { await db.kset('outDir', root); } catch (e) {} }
      await load(); cur = tours[0] || null; pvModel = null; texts(); renderList(); renderEdit(); preview(true); await refreshBk(); checkBk();
      msg(L('rsDone', data.tours.length));
    } catch (e) { msg(L('rsFail') + (e && e.message || e), true); }
  }
