  // ---- Remembering the last file (File System Access API: Chrome / Edge). Only a pointer is stored, the file is not copied. ----
  const idb = {
    db: null,
    open() {
      if (this.db) return Promise.resolve(this.db);
      return new Promise((res, rej) => {
        const r = indexedDB.open('gambit360viewer', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('kv');
        r.onsuccess = () => { this.db = r.result; res(r.result); };
        r.onerror = () => rej(r.error);
      });
    },
    async run(mode, fn) {
      const db = await this.open();
      return new Promise((res, rej) => { const q = fn(db.transaction('kv', mode).objectStore('kv')); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
    },
    get(k) { return this.run('readonly', st => st.get(k)); },
    set(k, v) { return this.run('readwrite', st => st.put(v, k)); },
    del(k) { return this.run('readwrite', st => st.delete(k)); }
  };
  const hasFS = !!(window.showDirectoryPicker && window.showOpenFilePicker);
  let freshProject = false;   // set while a model picked from the start screen loads: it is a NEW project, so nothing saved under its name may survive
  let keepProjectName = '';   // set while the point cloud is swapped: the project keeps its name, so every setting stays attached
  let pendingProject = null, currentName = '', resumeRec = null, lastObjFiles = null, fromPkg = false;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  // The name every saved setting of a model hangs on. Matterport names every E57 "cloud_0.e57", so for such a generic name the
  // file size is added ("cloud_0_123456789"): two different scans never share points, tags, settings or the remembered place.
  const GENERIC_E57 = /^cloud_\d+$/i;
  function e57ModelName(file) { const b = file.name.replace(/\.e57$/i, ''); return GENERIC_E57.test(b) ? b + '_' + file.size : b; }
  const legacyOf = (oldName, name) => GENERIC_E57.test(oldName || '') && new RegExp('^' + oldName + '_\\d+$', 'i').test(name || '');   // a project saved before the size was added
  const shownName = name => { let tl = ''; try { tl = localStorage.getItem('tourViewerTitle:' + name) || ''; } catch (err) {} return tl || String(name || '').replace(/^(cloud_\d+)_\d+$/i, '$1'); };   // what a person recognises: the project title
  const canLoadNow = async () => !(started && (measures.length || areas.length) && !(await g360Ask(t('confirmNew'))));

  async function walkDir(dir, out, depth = 0) {
    for await (const [, h] of dir.entries()) {
      if (h.kind === 'file') out.push(await h.getFile());
      else if (depth < 3) await walkDir(h, out, depth + 1);
    }
    return out;
  }

  async function onModelLoaded(rec) {
    const back = (fromPkg || window.G360_CLIENT) ? null : readPose(); resumeAt = false;   // every way of opening a model (resume, a project file, a new import) returns to where you were
    poseHold = !!back; if (back) restorePose(back);   // right away: the model is in place, and the saving below can take a moment
    if (!fromPkg && !window.G360_CLIENT) { let lg = ''; try { lg = localStorage.getItem('tourViewerLogo:' + currentName) || ''; } catch (err) {} applyLogo(lg); }
    syncMpUI(); showHint(); loadViews(); restorePromo(); if (!fromPkg && !window.G360_CLIENT && window.G360_loadExtras) window.G360_loadExtras();
    $('resumeBox').hidden = true;
    try {
      if (rec.handle) await idb.set('last', { kind:rec.kind, name:rec.name, handle:rec.handle, quality:rec.quality || null, time:Date.now() });
      else await idb.del('last');   // loaded without a pointer (older browser): nothing to resume next time
    } catch (err) { console.warn('could not remember the file', err); }
    if (rec.handle && !window.G360_CLIENT) { try { await idb.set('model:' + rec.name, { kind:rec.kind, name:rec.name, handle:rec.handle, quality:rec.quality || null }); } catch (err) {} }
    if (pendingProject) { const d = pendingProject; pendingProject = null; if (d.model === currentName || legacyOf(d.model, currentName)) applyProject(d); else msg(t('projMismatch', currentName, d.model), true); }
    if (typeof cpLink === 'function') setTimeout(cpLink, 1200);   // the project's copy in the cloud: the newer one wins
  }

  // "Continue where you left off": where you stood and looked, and which view was open (inside, plan or 3D), is kept per model
  // every few seconds. Opening that model again in any way (the resume button, a project file, importing it again) brings you back there.
  // The key is outside the project's own keys on purpose: a fresh import wipes the project's settings, but not this.
  let resumeAt = false, restoring = false, poseHold = false;   // poseHold: a remembered place was restored, so the panoramas must not jump to the first scan
  const poseKey = () => 'g360Pose:' + currentName;
  function savePose() {
    if (!started || !camera || !currentName || fromPkg || window.G360_CLIENT || tween || resumeAt || restoring) return;
    const s = overview ? saved : { p:camera.position, yaw, pitch }, mode = dollhouse ? '3d' : (overview ? 'plan' : '');
    const rec = s && s.p ? { p:[s.p.x, s.p.y, s.p.z], yaw:s.yaw, pitch:s.pitch, mode } : { mode };   // on the plan / 3D view without having walked in yet: only the view is kept, never an older place
    try { localStorage.setItem(poseKey(), JSON.stringify(rec)); } catch (err) {}
  }
  setInterval(savePose, 2000);
  addEventListener('pagehide', savePose); document.addEventListener('visibilitychange', () => { if (document.hidden) savePose(); });
  function readPose() { try { return JSON.parse(localStorage.getItem(poseKey()) || localStorage.getItem('tourViewerPose:' + currentName) || 'null'); } catch (err) { return null; } }   // (the second key: the first version of this)
  function restorePose(ps) {
    if (!ps) return;
    const hasP = Array.isArray(ps.p) && ps.p.length === 3 && ps.p.every(isFinite);
    restoring = true;
    if (!hasP) { setTimeout(() => { restoring = false; try { if (ps.mode === '3d') go3D(); } catch (err) {} }, 500); return; }
    setTimeout(() => { restoring = false; try {   // after the model has settled into its first (plan) view
      const inside = { p:new THREE.Vector3(ps.p[0], ps.p[1], ps.p[2]), yaw:+ps.yaw || 0, pitch:+ps.pitch || 0 };
      if (ps.mode === '3d') { go3D(); saved = inside; }
      else if (ps.mode === 'plan') saved = inside;   // stays on the plan; "back" walks in where you were
      else goView({ p:ps.p, yaw:inside.yaw, pitch:inside.pitch });
    } catch (err) { console.error('could not return to the last place', err); } }, 500);
  }

  // Every load (picked, resumed or from a package) shows the logo and spinner on top of the start screen until the model is ready.
  async function withBoot(fn) {
    hideImport(); $('boot').hidden = false;
    await sleep(40);   // let the spinner paint before the heavy work starts
    let ok = false;
    try { ok = await fn(); return ok; } finally { hideBoot(); if (!ok) backToImport(); }
  }
  // Loading from the Options menu: the centred window steps aside so the loading screen shows; it comes back (with the message) only if the load fails.
  function hideImport() { if (started) { $('start').hidden = true; $('cancelImport').hidden = true; } }
  function backToImport() { if (started) { $('start').hidden = false; $('cancelImport').hidden = false; } }
  function loadObj(files, handle, name) { return withBoot(() => loadObjRaw(files, handle, name)); }
  /*@STUDIO*/
  function loadE57(file, handle, quality) { return withBoot(() => loadE57Raw(file, handle, quality)); }
  // A model picked from the start screen is a NEW project: everything saved under the same name (points, names, settings, logo, video) is deleted.
  // Replacing the model of an existing project is what the "replace model" buttons are for.
  const projKeyOf = (k, name) => { const i = k.indexOf(':'); if (i < 0 || !/^(tourViewer[A-Za-z]*|tags|tagsClient)$/.test(k.slice(0, i))) return false; const rest = k.slice(i + 1); return rest === name || rest.startsWith(name + ':'); };
  function projectKeys(name) { const out = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && projKeyOf(k, name)) out.push(k); } } catch (err) {} return out; }
  function wipeProject(name) {
    projectKeys(name).forEach(k => { try { localStorage.removeItem(k); } catch (err) {} });
    try { idb.del('promo:' + name).catch(() => {}); } catch (err) {}
  }
  async function freshLoad(name, fn) {
    freshProject = true;
    try { return await fn(); } finally { freshProject = false; }
  }
  /*@/STUDIO*/

  async function loadObjRaw(files, handle, name) {
    const objFile = files.find(f => /\.obj$/i.test(f.name));
    if (!objFile) { msg(t('noObj'), true); return false; }
    const mtlFile = files.find(f => /\.mtl$/i.test(f.name));
    msg(t('loading'));
    await sleep(20);
    const blobs = {};
    files.forEach(f => blobs[f.name.toLowerCase()] = URL.createObjectURL(f));
    const manager = new THREE.LoadingManager();
    manager.setURLModifier(url => blobs[decodeURIComponent(url.split(/[\\/]/).pop()).toLowerCase()] || url);
    try {
      const objLoader = new THREE.OBJLoader(manager);
      if (mtlFile) {
        const mats = new THREE.MTLLoader(manager).parse(await mtlFile.text(), '');
        mats.preload();
        objLoader.setMaterials(mats);
      }
      model = objLoader.parse(await objFile.text());
      pointMode = false; pcGrid = null; pcMat = null; stationsPC = [];
      lastE57 = null; if (panoSrc) setPanoSource(null);
    } catch (err) {
      console.error(err); msg(t('loadFail') + err.message, true); return false;
    }
    currentName = keepProjectName || name || objFile.name.replace(/\.obj$/i, '');
    if (freshProject && !keepProjectName && typeof wipeProject === 'function') wipeProject(currentName);
    lastObjFiles = files;
    start();
    onModelLoaded({ kind:'obj', name:currentName, handle });
    return true;
  }

  /*@STUDIO*/
  async function loadE57Raw(file, handle, quality) {
    $('picker').disabled = true; $('pickerE57').disabled = true; $('quality').disabled = true;
    msg(t('e57Reading', 1, 1, 0));
    try {
      const d = await readE57(file, quality, (i, n, p) => msg(t('e57Reading', i, n, p)), t);
      msg(t('e57Grid'));
      await sleep(30);
      currentName = keepProjectName || e57ModelName(file);
      if (freshProject && !keepProjectName) wipeProject(currentName);
      lastObjFiles = null; lastE57 = { d };
      if (panoSrc) setPanoSource(null);
      startPC(d);
      if (d.pano && d.stations.length) {
        setPanoSource({ size:2048, conv:-1, stations:d.pano.stations.map(ps => ({ p:new THREE.Vector3(d.stations[ps.st][0], d.stations[ps.st][1], d.stations[ps.st][2]),
          faces:ps.faces.map(f => ({ R:f.R, blob:() => d.pano.readBlob(f.off, f.len) })) })) });
        refreshPanoOpts();
      }
      onModelLoaded({ kind:'e57', name:currentName, handle, quality });
      return true;
    } catch (err) {
      console.error(err); msg(t('loadFail') + err.message, true);
      $('picker').disabled = false; $('pickerE57').disabled = false; $('quality').disabled = false;
      $('pickerE57').value = '';
      return false;
    }
  }
  /*@/STUDIO*/

  // The classic file inputs always work. In Chrome / Edge their click is routed to the system pickers that return a reusable pointer.
  $('loadE57Btn').onclick = () => $('pickerE57').click(); $('loadObjBtn').onclick = () => $('picker').click();
  [['picker', 'loadObjBtn'], ['pickerE57', 'loadE57Btn']].forEach(([inp, btn]) => { const sync = () => { $(btn).disabled = $(inp).disabled; }; new MutationObserver(sync).observe($(inp), { attributes:true, attributeFilter:['disabled'] }); sync(); });   // the big buttons follow their file inputs
  $('picker').addEventListener('change', async e => {
    const files = [...e.target.files];
    if (!files.length) return;
    if (!(await canLoadNow())) { e.target.value = ''; return; }
    const nm = (files[0].webkitRelativePath || '').split('/')[0];
    if (!(await freshLoad(nm, () => loadObj(files, null, nm)))) e.target.value = '';   // cancelled: the same folder can be picked again
  });
  $('pickerE57').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    if (!(await canLoadNow())) { e.target.value = ''; return; }
    if (!(await freshLoad(file.name.replace(/\.e57$/i, ''), () => loadE57(file, null, +$('quality').value)))) e.target.value = '';
  });
  if (hasFS) {
    $('picker').addEventListener('click', async e => {
      if ($('picker').dataset.native === '1') return;
      e.preventDefault();
      try {
        const dir = await g360Pick.dir({ id:'g360scan', mode:'read' });
        if (!(await canLoadNow())) return;
        const fl = await walkDir(dir, []);
        await freshLoad(dir.name, () => loadObj(fl, dir, dir.name));
      } catch (err) {
        if (err && err.name === 'AbortError') return;
        console.warn('directory picker unavailable, using the classic input', err);
        $('picker').dataset.native = '1'; $('picker').click();
      }
    });
    $('pickerE57').addEventListener('click', async e => {
      if ($('pickerE57').dataset.native === '1') return;
      e.preventDefault();
      try {
        const [h] = await g360Pick.open({ id:'g360scan', multiple:false, types:[{ description:'E57', accept:{ 'application/octet-stream':['.e57'] } }] });
        if (!(await canLoadNow())) return;
        const fe = await h.getFile();
        await freshLoad(fe.name.replace(/\.e57$/i, ''), () => loadE57(fe, h, +$('quality').value));
      } catch (err) {
        if (err && err.name === 'AbortError') return;
        console.warn('file picker unavailable, using the classic input', err);
        $('pickerE57').dataset.native = '1'; $('pickerE57').click();
      }
    });
  }

  // Resume: load the last file again (automatically when the browser still allows reading it, otherwise after one click).
  const setResumeLabel = () => { if (resumeRec) $('resumeBtn').textContent = t('resume', shownName(resumeRec.name)); };
  async function doResume(rec) {
    try {
      const h = rec.handle;
      hideImport();
      let perm = await h.queryPermission({ mode:'read' });
      if (perm !== 'granted') {
        try { perm = await h.requestPermission({ mode:'read' }); }
        catch (err) {   // the browser wants a fresh click before it asks (e.g. right after another file window): offer the model as a button
          if (err && err.name === 'SecurityError') { hideBoot(); resumeRec = rec; setResumeLabel(); $('resumeBox').hidden = false; $('resumeBtn').onclick = () => doResume(rec); backToImport(); if (!started) $('start').hidden = false; msg(''); return false; }
          throw err;
        }
      }
      if (perm !== 'granted') { backToImport(); msg(t('resumeDenied'), true); return false; }
      $('boot').hidden = false; await sleep(40);   // folder scan can take a while: show the loading screen first
      resumeAt = true;
      if (rec.kind === 'obj') return await loadObj(await walkDir(h, []), h, rec.name);
      if (rec.quality) $('quality').value = String(rec.quality);
      return await loadE57(await h.getFile(), h, rec.quality || +$('quality').value);
    } catch (err) { console.error(err); backToImport(); msg(t('resumeFail'), true); return false; }
    finally { hideBoot(); resumeAt = false; }
  }
  async function tryResume() {
    if (!hasFS) return;
    let rec = null;
    try { rec = await idb.get('last'); } catch (err) { return; }
    if (!rec || !rec.handle || started) return;
    resumeRec = rec; setResumeLabel();
    $('resumeBox').hidden = false;
    $('resumeBtn').onclick = () => doResume(rec);
    // The Studio always opens on the start screen; the last file is only offered as a button, never loaded by itself.
  }

