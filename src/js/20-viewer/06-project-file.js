  // ---- Project file: everything made in the Studio for one model (not the model itself) ----
  let projHandle = null;
  const pkgPubOf = name => { try { return localStorage.getItem('tourViewerPkgPub:' + name) || ''; } catch (err) { return ''; } };   // the client package's address on the site (06a-cloud-projects.js)
  function projectData() {
    const pts = a => a.pts.map(p => [+p.x.toFixed(4), +p.y.toFixed(4), +p.z.toFixed(4)]);
    return { g360project:1, saved:new Date().toISOString(), model:currentName, kind:lastE57 ? 'e57' : 'obj', quality:lastE57 ? +$('quality').value : null,
      title:$('pkgName').value.trim(), manager:$('pkgMgr').value.trim(), exp:{ start:$('pkgStart').value, dur:$('pkgDur').value, unit:$('pkgUnit').value },
      link:getLink(), logo:customLogo || '', pkgOpt:{ mp:$('pkgMpShow').checked, mini:$('pkgMini').checked, ctags:$('pkgClientTags').checked, cloud:$('pkgCloud').checked, promo:$('pkgPromoMode').value }, extras:window.G360_extrasData ? window.G360_extrasData() : undefined,
      views:views.filter(v => !v.locked && !v.pkg).map(v => ({ n:v.n, p:v.p, yaw:v.yaw, pitch:v.pitch, room:v.room ? 1 : undefined })),
      measures:measures.map(a => ({ type:'line', pts:pts(a) })), areas:areas.map(a => ({ type:'area', pts:pts(a) })), pub:pkgPubOf(currentName) || undefined };
  }
  async function saveProject() {
    if (!currentName || window.G360_CLIENT || fromPkg) return;
    const d = projectData(), text = JSON.stringify(d), safe = (d.title || currentName).replace(/[\\/:*?"<>|]+/g, '_').trim() || 'Gambit360-project';
    if (CP_HOSTED) { await cpSaveNow(d, ''); return; }   // the Studio online keeps the project in the cloud only (there is no Studio folder on this computer)
    try {
      if (window.showSaveFilePicker) {
        if (!projHandle || projHandle.__for !== currentName) {
          projHandle = await g360Pick.save({ id:'g360proj', suggestedName:safe + '.g360', types:[{ description:'Gambit360 project', accept:{ 'application/json':['.g360'] } }] });
          projHandle.__for = currentName;
        }
        const w = await projHandle.createWritable(); await w.write(text); await w.close();
        pkgMsg(t('projSaved', projHandle.name)); say(t('projSaved', projHandle.name)); cpSaveNow(d, projHandle.name);
      } else {
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type:'application/json' })); a.download = safe + '.g360'; document.body.appendChild(a); a.click(); a.remove();
        pkgMsg(t('projSaved', safe + '.g360')); say(t('projSaved', safe + '.g360')); cpSaveNow(d, safe + '.g360');
      }
    } catch (err) { if (err && err.name === 'AbortError') return; projHandle = null; console.error(err); pkgMsg(t('projSaveFail') + err.message); say(t('projSaveFail') + err.message); }
  }
  function applyProject(d) {
    const nm = currentName;
    try {
      localStorage.setItem('tourViewerTitle:' + nm, d.title || ''); localStorage.setItem('tourViewerMgr:' + nm, d.manager || '');
      localStorage.setItem('tourViewerExp:' + nm, JSON.stringify(d.exp || {}));
      if (d.link) localStorage.setItem(mpKey(), d.link);
      localStorage.setItem(viewsKey(), JSON.stringify(d.views || []));
      if (d.pkgOpt) localStorage.setItem(pkgOptKey(), JSON.stringify(d.pkgOpt));
      if (d.pub) localStorage.setItem('tourViewerPkgPub:' + nm, d.pub);   // the client's link on the site stays the same from every computer
    } catch (err) {}
    applyLogo(d.logo || ''); saveLogoLocal();
    $('pkgName').dataset.for = '';
    syncMpUI(); loadViews(); if (d.extras && window.G360_setExtras) window.G360_setExtras(d.extras);
    clearMeasures();
    const mk = (type, list, arr) => (list || []).forEach(o => {
      const sh = { type, pts:o.pts.map(a => new THREE.Vector3(a[0], a[1], a[2])), objs:[], el:document.createElement('div') };
      sh.el.className = 'mlabel'; $('labels').appendChild(sh.el); buildShape(sh); arr.push(sh);
    });
    mk('line', d.measures, measures); mk('area', d.areas, areas);
    say(t('projOpened', d.title || d.model));
  }
  async function openProject() {
    let file = null;
    try {
      if (window.showOpenFilePicker) { const [h] = await g360Pick.open({ id:'g360proj', multiple:false, types:[{ description:'Gambit360 project', accept:{ 'application/json':['.g360', '.json'] } }] }); file = await h.getFile(); projHandle = h; }
      else file = await new Promise(res => { const i = document.createElement('input'); i.type = 'file'; i.accept = '.g360,.json'; i.onchange = () => res(i.files[0] || null); i.click(); });
    } catch (err) { return; }
    if (!file) return;
    hideImport(); $('boot').hidden = false;   // show the logo and spinner at once (over the Options window) while the project and its model load
    let ok = false;
    try { await sleep(40); ok = await openProjectFile(file); } finally { hideBoot(); if (!ok) backToImport(); }
  }
  async function openProjectFile(file) {
    let d = null; try { d = JSON.parse(await file.text()); } catch (err) {}
    return openProjectData(d);
  }
  async function openProjectData(d) {   // a project file, or a project from the cloud (06a-cloud-projects.js)
    if (!d || d.g360project !== 1 || !d.model) { msg(t('projBad'), true); return false; }
    if (projHandle) projHandle.__for = d.model;
    if (started && d.model === currentName) { applyProject(d); closeImport(); return true; }
    if (started && !(await canLoadNow())) return false;
    pendingProject = d;
    let rec = null; if (!GENERIC_E57.test(d.model)) { try { rec = await idb.get('model:' + d.model); } catch (err) {} }   // an old "cloud_0" project cannot tell which file it was: the file is picked once
    if (rec && rec.handle) { if (rec.kind === 'e57' && d.quality) $('quality').value = String(d.quality); await doResume(rec); if (started && currentName === d.model) return true; if (!$('resumeBox').hidden) return false; }
    // the scan file has to be picked once: a clear button for it takes the place of the resume button
    const nm = d.title || d.model;
    $('resumeBtn').textContent = t('projPickBtn', nm); $('resumeBtn').onclick = () => $(d.kind === 'obj' ? 'loadObjBtn' : 'loadE57Btn').click(); $('resumeBox').hidden = false;
    msg(t('projPick', nm)); return false;   // the model has to be picked once: the start window stays open with the hint
  }
  async function swapCloud(file, h) {
    if (!currentName || !(await canLoadNow())) return;
    keepProjectName = currentName; let ok = false;
    try { ok = await loadE57(file, h || null, +$('quality').value); } finally { keepProjectName = ''; }
    if (ok) { const m = t('pkgSwapDone', file.name); pkgMsg(m); say(m); }
  }
  async function swapObj(dir) {
    if (!currentName || !(await canLoadNow())) return;
    keepProjectName = currentName; let ok = false;
    try { ok = await loadObj(await walkDir(dir, []), dir, currentName); } finally { keepProjectName = ''; }
    if (ok) { const m = t('pkgSwapDone', dir.name); pkgMsg(m); say(m); }
  }
  $('pkgSwapObjBtn').onclick = async () => {   // a MatterPak (OBJ) folder
    if (!currentName) { pkgMsg(t('pkgSwapNo')); return; }
    if (!window.showDirectoryPicker) { pkgMsg(t('pkgNoFS')); return; }
    let dir; try { dir = await g360Pick.dir({ id:'g360scan', mode:'read' }); } catch (err) { return; }
    await swapObj(dir);
  };
  $('pkgSwapBtn').onclick = async () => {   // an E57 point cloud
    if (!currentName) { pkgMsg(t('pkgSwapNo')); return; }
    if (!window.showOpenFilePicker) { $('swapFile').click(); return; }
    let h; try { [h] = await g360Pick.open({ id:'g360scan', multiple:false, types:[{ description:'E57', accept:{ 'application/octet-stream':['.e57'] } }] }); } catch (err) { return; }
    await swapCloud(await h.getFile(), h);
  };
  $('swapFile').onchange = async () => { const f = $('swapFile').files[0]; $('swapFile').value = ''; if (f) await swapCloud(f, null); };
  $('projSave').onclick = saveProject; $('projOpen').onclick = () => openImport();   // "Open project" brings up the start screen
   $('projOpenStart').onclick = openProject;
  /*@/STUDIO*/
  if (window.G360_CLIENT) $('projOpenStart').hidden = true;
  /*@STUDIO*/
  const normP = p => String(p || '').replace(/\\+$/, '').toLowerCase();
  let srcReal = ''; try { srcReal = localStorage.getItem('g360SrcPath') || ''; } catch (err) {}
  async function refreshSrc(real) {
    let h = null; try { h = await idb.get('srcDir'); } catch (err) {}
    $('srcBtn').textContent = t(h ? 'srcBtnChange' : 'srcBtn');
    $('srcBtn').classList.toggle('on', !h);
    if (real !== undefined) { srcReal = real || ''; try { if (srcReal) localStorage.setItem('g360SrcPath', srcReal); else localStorage.removeItem('g360SrcPath'); } catch (err) {} }
    const box = $('srcPath'), here = pageDir();
    if (!h) { box.textContent = here; box.style.color = ''; return; }   // nothing chosen yet: show where this file lives, as a hint
    const shown = srcReal || h.name;
    const diff = srcReal && here && normP(srcReal) !== normP(here);
    box.textContent = shown + (diff ? '\n⚠ ' + t('srcDiff', here) : '');
    box.style.color = diff ? '#ffb454' : ''; box.style.whiteSpace = 'pre-wrap';
  }
  refreshSrc();
  $('srcBtn').onclick = async () => {
    let dir;
    try { dir = await g360Pick.dir({ id:'g360studio', mode:'readwrite' }); }
    catch (err) { if (!(err && err.name === 'AbortError')) pkgMsg(t('pkgFail') + err.message); return; }
    const f0 = await findViewer(dir);
    if (!f0.html || !f0.lib.length) { pkgMsg(t('pkgBadSrc', f0.name, !!f0.html, f0.lib.length)); return; }
    try { await idb.set('srcDir', dir); } catch (err) {}
    const real = await helperReq(dir, '?.');   // the helper tells the real path of the chosen folder (when started from the launcher)
    refreshSrc(real || ''); pkgMsg(t('pkgSrcSaved'));
  };
  /*@/STUDIO*/

  // ===== Panorama cube: which way the six pictures face (found from the pictures themselves, so no convention has to be guessed) =====
  //<<PANOCAL
  const PANO_AX = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const PANO_CONV = (() => { const L = []; PANO_AX.forEach(a => PANO_AX.forEach(b => { if (a[0] * b[0] + a[1] * b[1] + a[2] * b[2] === 0) L.push({ a, b }); })); return L; })();   // view axis + image-up axis, in the camera's own frame: 24 candidates
  const PANO_DEF = PANO_CONV.findIndex(c => c.a[2] === -1 && c.b[1] === 1);
  const pcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const pdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const pnorm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  function panoAxes(R, c) {   // the picture's right / up / toward-viewer axes in the file's world frame
    const z = [-c.a[0], -c.a[1], -c.a[2]], y = c.b, x = pcross(y, z);
    const m = v => [R[0] * v[0] + R[1] * v[1] + R[2] * v[2], R[3] * v[0] + R[4] * v[1] + R[5] * v[2], R[6] * v[0] + R[7] * v[1] + R[8] * v[2]];
    return { x: m(x), y: m(y), z: m(z) };
  }
  function panoSample(img, ax, d) {
    const lz = pdot(ax.z, d); if (lz >= -1e-6) return null;
    const u = pdot(ax.x, d) / -lz, v = pdot(ax.y, d) / -lz;
    if (Math.abs(u) > 1.0001 || Math.abs(v) > 1.0001) return null;
    const n = img.n, x = Math.max(0, Math.min(n - 1, Math.round((u + 1) / 2 * (n - 1)))), y = Math.max(0, Math.min(n - 1, Math.round((1 - v) / 2 * (n - 1))));
    const o = (y * n + x) * 4; return [img.px[o], img.px[o + 1], img.px[o + 2]];
  }
  function panoCalibrate(faces) {   // faces: six of { R: 9 numbers (row-major), n: size, px: RGBA }
    const scores = PANO_CONV.map(c => {
      const axs = faces.map(f => panoAxes(f.R, c)), V = axs.map(a => [-a.z[0], -a.z[1], -a.z[2]]);
      let sum = 0, cnt = 0, pairs = 0;
      for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) {
        if (Math.abs(pdot(V[i], V[j])) > 0.2) continue;
        pairs++;
        const w = pcross(V[i], V[j]), e = 0.012;   // points just either side of the shared edge: the picture must carry on across it
        for (let k = 0; k < 24; k++) {
          const t = -0.9 + 1.8 * k / 23;
          const d1 = pnorm([V[i][0] + V[j][0] * (1 - e) + w[0] * t, V[i][1] + V[j][1] * (1 - e) + w[1] * t, V[i][2] + V[j][2] * (1 - e) + w[2] * t]);
          const d2 = pnorm([V[i][0] * (1 - e) + V[j][0] + w[0] * t, V[i][1] * (1 - e) + V[j][1] + w[1] * t, V[i][2] * (1 - e) + V[j][2] + w[2] * t]);
          const a = panoSample(faces[i], axs[i], d1), b = panoSample(faces[j], axs[j], d2);
          sum += (a && b) ? (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])) / 765 : 0.6; cnt++;
        }
      }
      return pairs >= 10 ? sum / cnt : 1;
    });
    let best = 0; scores.forEach((s, i) => { if (s < scores[best]) best = i; });
    let second = 1; scores.forEach((s, i) => { if (i !== best && s < second) second = s; });
    return { idx: best, score: scores[best], second, ok: scores[best] < 0.25 && second > scores[best] * 1.25 };
  }
  //>>PANOCAL

  // ===== Panorama view: while walking inside, the six pictures of the nearest scan station are shown on a cube around the camera =====
  // panoSrc = { stations:[{ p:Vector3, faces:[{ R:[9], blob:async()=>Blob }] }], conv:index into PANO_CONV, size:pixels per face }
  // The same walk view as the point cloud (same ring, same click-to-move, same bird's-eye and dollhouse views): only the picture changes. The option "panorama / point cloud" is in the Options menu.
  // Moving: the camera glides to the next station while the next cube (a small room of pictures standing at that station) fades in over the one you leave, so there is motion and no jump.
  const PANO_D = 6;   // half the size of the picture cube in metres: close enough that gliding between two cubes feels like moving
  function panoQ(R, conv) {   // plane orientation in viewer space (E57 is Z-up, the viewer is Y-up: x,y,z -> x,z,-y)
    const ax = panoAxes(R, PANO_CONV[conv]), cv = v => new THREE.Vector3(v[0], v[2], -v[1]);
    const X = cv(ax.x), Y = cv(ax.y), Z = cv(ax.z);
    return { q: new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z)), Z };
  }
  async function panoCanvas(blob, size, wantPixels) {
    const url = URL.createObjectURL(new Blob([blob], { type: 'image/jpeg' }));
    try {
      const img = new Image(); img.src = url;
      await (img.decode ? img.decode() : new Promise((res, rej) => { img.onload = res; img.onerror = rej; }));
      const c = document.createElement('canvas'); c.width = c.height = size;
      const g = c.getContext('2d', wantPixels ? { willReadFrequently:true } : undefined); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      g.drawImage(img, 0, 0, size, size);
      return wantPixels ? { n:size, px:g.getImageData(0, 0, size, size).data } : c;
    } finally { URL.revokeObjectURL(url); }
  }
  // Matterport pictures can have an empty (black) ceiling or floor face: it is filled with the colour of the walls next to it, so no black void shows.
  const panoWarned = new Set();
  function panoFillDark(cv, st, k) {
    try {
      const conv = panoSrc.conv >= 0 ? panoSrc.conv : PANO_DEF;
      const sm = document.createElement('canvas'); sm.width = sm.height = 12;
      const sg = sm.getContext('2d', { willReadFrequently:true });
      const avg = (c, sx, sy, sw, sh) => {
        sg.clearRect(0, 0, 12, 12); sg.drawImage(c, sx, sy, sw, sh, 0, 0, 12, 12);
        const d = sg.getImageData(0, 0, 12, 12).data; let r = 0, g = 0, b = 0; const n = d.length / 4;
        for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
        return [r / n, g / n, b / n];
      };
      const lum = a => 0.3 * a[0] + 0.59 * a[1] + 0.11 * a[2];
      const dir = st.faces.map(f => panoQ(f.R, conv).Z.clone().negate());
      const full = cv.map(c => avg(c, 0, 0, c.width, c.height));
      cv.forEach((c, i) => {
        if (lum(full[i]) >= 12 || Math.abs(dir[i].y) < 0.8) return;   // only the ceiling and the floor face
        const up = dir[i].y > 0, size = c.width, strip = Math.max(2, Math.round(size * 0.1));
        const cols = [];
        cv.forEach((c2, j) => { if (j === i || Math.abs(dir[j].y) > 0.5 || lum(full[j]) < 12) return; cols.push(avg(c2, 0, up ? 0 : size - strip, size, strip)); });
        if (!cols.length) return;
        const m = [0, 1, 2].map(q => Math.round(cols.reduce((a, v) => a + v[q], 0) / cols.length));
        const g = c.getContext('2d'); g.fillStyle = 'rgb(' + m.join(',') + ')'; g.fillRect(0, 0, size, size);
        if (!panoWarned.has(i)) { panoWarned.add(i); console.warn('panorama: the ' + (up ? 'ceiling' : 'floor') + ' picture is empty, filled with the wall colour', m); }
      });
    } catch (err) { console.warn('panorama fill', err); }
  }
  function updatePanoSw() {
    const b = $('panoSw'); if (!b) return;
    b.hidden = !panoSrc; b.disabled = !panoSrc || panoSrc.conv < 0;
    const sp = b.querySelector('span'); if (sp) sp.textContent = t(panoPref ? 'panoToCloud' : 'panoToPano');
  }
  function setPanoSource(src) {
    if (panoOn || panoMove) exitPano();
    panoSrc = src; panoCache.forEach(a => a.forEach(tx => tx.dispose())); panoCache.clear(); panoCur = -1;
    updatePanoSw();
    if (!src) return;
    if (src.conv >= 0) { setTimeout(() => { if (panoSrc === src) panoEnterFirst(); }, 80); return; }
    (async () => {   // find out how the pictures are oriented from the first station's own pictures
      try {
        const st = src.stations[0], faces = [];
        for (const f of st.faces) { const px = await panoCanvas(await f.blob(), 256, true); faces.push({ R:f.R, n:px.n, px:px.px }); }
        const r = panoCalibrate(faces);
        src.conv = r.ok ? r.idx : PANO_DEF; src.convOk = r.ok; src.convScore = r.score;
        console.log('panorama orientation', src.conv, r);
      } catch (err) { console.error(err); src.conv = PANO_DEF; src.convOk = false; }
      if (panoSrc === src) { updatePanoSw(); panoEnterFirst(); }
    })();
  }
  // A freshly loaded file with panoramas opens inside, at the first scan, instead of in the bird's-eye view.
  function panoEnterFirst() {
    if (!panoSrc || !panoPref || !renderer || !started || panoSrc.conv < 0 || !overview || dollhouse || panoOn || panoMove || poseHold) return;   // not when the last place of this model was restored
    const st = panoSrc.stations[0];
    exitOverview(); saved = null; tween = null;
    camera.position.copy(st.p); yaw = 0; pitch = 0; camera.fov = 75; camera.updateProjectionMatrix();
    if (floors.length > 1) { let idx = 0; floors.forEach((f, i) => { if (f <= st.p.y + 0.5 * scale) idx = i; }); setFloor(idx); }
  }
  function panoNearest(p) {
    let best = 0, bd = Infinity;
    panoSrc.stations.forEach((s, i) => { const d = s.p.distanceToSquared(p); if (d < bd) { bd = d; best = i; } });
    return best;
  }
  const nextFrame = () => new Promise(r => requestAnimationFrame(() => r()));
  const panoBig = () => (panoSrc && (panoSrc.size || 2048) >= 4096);
  async function panoTextures(k) {
    if (panoCache.has(k)) { const a = panoCache.get(k); panoCache.delete(k); panoCache.set(k, a); return a; }
    const maxT = renderer.capabilities.maxTextureSize || 2048, size = Math.min(panoSrc.size || 2048, maxT);
    const st = panoSrc.stations[k], src = panoSrc;
    const cv = await Promise.all(st.faces.map(async f => panoCanvas(await f.blob(), size, false)));
    panoFillDark(cv, st, k);
    const texs = cv.map(c => { const tx = new THREE.CanvasTexture(c); tx.encoding = THREE.sRGBEncoding; tx.generateMipmaps = false; tx.minFilter = THREE.LinearFilter; tx.magFilter = THREE.LinearFilter; return tx; });
    if (src !== panoSrc) { texs.forEach(tx => tx.dispose()); throw new Error('replaced'); }
    panoCache.set(k, texs);
    const keep = panoBig() ? 1 : 5;
    while (panoCache.size > keep) { const old = panoCache.keys().next().value; panoCache.get(old).forEach(tx => tx.dispose()); panoCache.delete(old); }
    for (const tx of texs) { await nextFrame(); try { renderer.initTexture(tx); } catch (err) {} }   // upload one picture per frame, so the move never stalls on a big upload
    return texs;
  }
  function panoMk(order, transparent) {
    const g = new THREE.Group(); g.visible = false;
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(PANO_D * 2.008, PANO_D * 2.008), new THREE.MeshBasicMaterial({ side:THREE.DoubleSide, depthTest:false, depthWrite:false, transparent, fog:false }));
      m.renderOrder = order; m.frustumCulled = false; g.add(m);
    }
    scene.add(g); return g;
  }
  function panoApply(g, k, texs) {
    const conv = panoSrc.conv >= 0 ? panoSrc.conv : PANO_DEF, st = panoSrc.stations[k];
    g.position.copy(st.p);
    g.children.forEach((m, i) => {
      const o = panoQ(st.faces[i].R, conv);
      m.quaternion.copy(o.q); m.position.copy(o.Z).multiplyScalar(-PANO_D);
      m.material.map = texs[i]; m.material.needsUpdate = true;
    });
  }
  function panoClip(off) {
    if (off) { if (!panoSavedClip) { panoSavedClip = renderer.clippingPlanes; renderer.clippingPlanes = []; } }
    else if (panoSavedClip) { renderer.clippingPlanes = panoSavedClip; panoSavedClip = null; }
  }
  function exitPano() {
    const was = panoOn || panoMove;
    panoMove = null; panoOn = false;
    if (panoA) panoA.visible = false; if (panoB) panoB.visible = false;
    if (model) model.visible = true;
    panoClip(false);
    if (typeof refreshClip === 'function' && clipPlane) refreshClip();
    if (was && camera && camera.fov !== panoF0 && panoF0) { camera.fov = panoF0; camera.updateProjectionMatrix(); }
  }
  // Go to a scan station: the camera glides there, the picture fades in on the way. Used for a click, W A S D, and for settling on the nearest station.
  function panoGoStation(i, dur0, opt) {
    if (panoMove || !panoSrc) return;
    const st = panoSrc.stations[i], dist = camera.position.distanceTo(st.p);
    if (!panoA) { panoA = panoMk(-10, false); panoB = panoMk(-9, true); }
    if (i === panoCur && panoOn && dist < 0.05) return;
    const m = { k:i, from:camera.position.clone(), t:0, dur:dur0 || Math.max(0.5, Math.min(1.2, 0.45 + 0.22 * dist)), texs:null, fade:-1 };
    if (dur0) { m.fs = 0.1; m.fd = Math.max(0.5, dur0 * 0.7); }
    if (opt) Object.assign(m, opt);   // a slow glide (promo video): the picture blends in over most of it
    panoMove = m; panoF0 = panoF0 || camera.fov;
    panoTextures(i).then(texs => { if (panoMove === m) m.texs = texs; })
      .catch(err => { if (panoMove !== m) return; console.error(err); panoMove = null; panoB.visible = false; panoRetry = performance.now() + 4000; if (!panoOn) panoClip(false); say(t('panoFail')); setTimeout(() => say(''), 4000); });
    if (!panoOn) panoClip(true);
    const f = $('fx'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
  }
  function panoTeleport(h) {
    const p = h.point, cost = s => Math.hypot(s.p.x - p.x, s.p.z - p.z) + 2 * Math.abs((s.p.y - 1.45) - p.y);
    let best = -1, bd = Infinity;
    panoSrc.stations.forEach((s, i) => { const d = cost(s); if (d < bd) { bd = d; best = i; } });
    if (best < 0 || best === panoCur) return;
    panoGoStation(best);
  }
  const sstep = x => x * x * (3 - 2 * x);
  function panoSync(dt) {
    const want = !!panoSrc && panoPref && panoSrc.conv >= 0 && !overview;   // measuring and area also work inside the panorama: the points come from the hidden cloud
    if (!want) { if (panoOn || panoMove) exitPano(); return; }
    if (!panoMove && !tween && performance.now() > panoRetry) {
      const k = panoNearest(camera.position);
      if (!panoOn || k !== panoCur) panoGoStation(k);
    }
    const m = panoMove;
    if (m) {
      m.t = window.G360_REDUCE ? 1 : Math.min(1, m.t + dt / m.dur);
      const e = m.ez ? m.ez(m.t) : sstep(m.t), st = panoSrc.stations[m.k];
      camera.position.lerpVectors(m.from, st.p, e);
      camera.fov = panoF0 + (m.punch || 4) * Math.sin(Math.PI * (m.ez ? m.t : e)); camera.updateProjectionMatrix();
      if (m.texs && m.fade < 0) { panoApply(panoB, m.k, m.texs); panoB.children.forEach(x => x.material.opacity = 0); panoB.visible = true; m.fade = 0; }
      if (m.fade >= 0 && (m.t >= (m.fs || 0.15) || window.G360_REDUCE)) {
        m.fade = Math.min(1, m.fade + (window.G360_REDUCE ? 1 : dt / (m.fd || 0.5)));
        const o = sstep(m.fade); panoB.children.forEach(x => x.material.opacity = o);
        if (m.fade >= 1 && m.t >= 1) {   // arrived: the new cube becomes the shown one
          panoApply(panoA, m.k, m.texs); panoA.visible = true; panoB.visible = false;
          panoCur = m.k; camera.position.copy(st.p); camera.fov = panoF0; camera.updateProjectionMatrix();
          if (!panoOn) { panoOn = true; model.visible = false; }
          panoMove = null; panoPreload();
        }
      }
    }
    if (panoOn && !panoMove && !tween && (keys.KeyW || keys.KeyS || keys.KeyA || keys.KeyD)) {
      const fw = new THREE.Vector3(); camera.getWorldDirection(fw); fw.y = 0; fw.normalize();
      const sd = new THREE.Vector3().crossVectors(fw, camera.up).normalize(), mv = new THREE.Vector3();
      if (keys.KeyW) mv.add(fw); if (keys.KeyS) mv.sub(fw); if (keys.KeyD) mv.add(sd); if (keys.KeyA) mv.sub(sd);
      if (mv.lengthSq() > 0) {
        mv.normalize(); let best = -1, bl = Infinity;
        panoSrc.stations.forEach((s, i) => {
          if (i === panoCur) return;
          const d = new THREE.Vector3().subVectors(s.p, camera.position); d.y = 0; const L = d.length();
          if (L < 0.5 || L > 10 || d.normalize().dot(mv) < 0.6) return;
          if (L < bl) { bl = L; best = i; }
        });
        if (best >= 0) panoGoStation(best);
      }
    }
  }
  // While you look around, the two nearest stations are loaded quietly, so the next move starts at once.
  let panoPreT = 0;
  function panoPreload() {
    clearTimeout(panoPreT);
    if (!panoSrc || panoBig()) return;
    const here = panoSrc.stations[panoCur]; if (!here) return;
    const near = panoSrc.stations.map((s, i) => ({ i, d: s.p.distanceTo(here.p) })).filter(o => o.i !== panoCur).sort((a, b) => a.d - b.d).slice(0, 2).map(o => o.i);
    panoPreT = setTimeout(async () => {
      for (const i of near) { if (panoMove || !panoOn) return; try { await panoTextures(i); } catch (err) { return; } await sleep(250); }
      if (panoOn && panoCache.has(panoCur)) panoCache.get(panoCur);
    }, 900);
  }

