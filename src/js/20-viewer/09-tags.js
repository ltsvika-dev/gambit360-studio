  // ---- Tags (like Matterport's Mattertags), a start point, and which controls the client sees ----
  let tags = [], placingTag = null, editingTag = null, startView = null, hideSet = [], tagImg = '', tagIcon = 0;
  const ICON_PATHS = [   // 16 line icons on a 24px grid, white on the tag's colour; the first eight keep the meaning of the earlier text icons
    '<circle cx="12" cy="12" r="4.2" fill="#fff" stroke="none"/>',
    '<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.7 1-5.9-4.3-4.1 5.9-.8z"/>',
    '<path d="M12 10.5v6.5"/><circle cx="12" cy="7" r=".9" fill="#fff"/>',
    '<path d="M6 21V4M6 4h11l-2.5 4 2.5 4H6"/>',
    '<path d="M12 20s-7-4.4-7-9.6A4 4 0 0 1 12 8a4 4 0 0 1 7 2.4C19 15.6 12 20 12 20z"/>',
    '<path d="M12 4 3 19h18z"/><path d="M12 10v4.5"/><circle cx="12" cy="17" r=".9" fill="#fff"/>',
    '<path d="M8 5.5v13l11-6.5z" fill="#fff"/>',
    '<path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19z"/><path d="M14.5 6.5l3 3"/>',
    '<path d="M13 2.5 5 13.5h6l-1 8 8-11h-6z"/>',
    '<path d="M12 3.5c3 4 6 7 6 10.5a6 6 0 0 1-12 0c0-3.500 3-6.500 6-10.500z"/>',
    '<path d="M4 8.500h3l1.500-2.500h7L17 8.500h3V19H4z"/><circle cx="12" cy="13.300" r="3.200"/>',
    '<circle cx="8" cy="14" r="3.500"/><path d="M10.500 11.500 19 3m-3 3 3 3m-5.500-.5 2 2"/>',
    '<path d="M3.500 11.500 12 4l8.500 7.500M6 10v10h12V10M10 20v-5h4v5"/>',
    '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/>',
    '<circle cx="12" cy="12" r="8.500"/><path d="m8.300 12.300 2.700 2.700 4.800-5.300"/>',
    '<circle cx="12" cy="12" r="8.500"/><path d="M9.700 9.600a2.400 2.400 0 1 1 3.400 2.200c-.7.400-1.100.9-1.100 1.600"/><circle cx="12" cy="16.500" r=".9" fill="#fff"/>'
  ];
  const TAG_ICONS = ICON_PATHS.map((_, i) => i);
  const iconSvg = i => '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON_PATHS[i] || ICON_PATHS[0]) + '</svg>';
  const TAG_CURSOR = 'url("data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="12" fill="rgba(0,0,0,.28)" stroke="rgba(0,0,0,.55)" stroke-width="4"/><circle cx="15" cy="15" r="12" fill="none" stroke="#fff" stroke-width="2"/><path d="M15 9v12M9 15h12" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>') + '") 15 15, crosshair';
  let clientTagsOn = false;
  const tagKey = () => (window.G360_CLIENT ? 'tagsClient:' : 'tags:') + currentName, startKey = () => 'tourViewerStart:' + currentName, hideKey = () => 'tourViewerHide:' + currentName;
  const HIDE_MAP = { measure:'#mbtn', area:'#abtn', shot:'#shotBtn', floors:'#floors', modes:'#bOver,#b3d', points:'#viewsBtn', mini:'#mini,#miniCtl,#miniToggle' };
  const HIDE_LBL = { measure:'hMeasure', area:'hArea', shot:'hShot', floors:'hFloors', modes:'hModes', points:'hPoints', mini:'hMini' };
  const safeUrl = u => { u = String(u || '').trim(); if (/^(https?:\/\/|mailto:|tel:)/i.test(u)) return u; return /^[\w-]+(\.[\w-]+)+(\/|$)/.test(u) ? 'https://' + u : ''; };
  const cleanTag = x => Object.assign({ n:x.n, d:x.d || '', url:x.url || '', img:x.img || '', icon:x.icon | 0, col:x.col || '#5ec4b6', p:x.p }, x.ty ? { ty:String(x.ty).slice(0, 24) } : {});   // ty: the tag's type (tag types, 09a), optional
  async function saveTags() { try { await idb.set(tagKey(), tags.filter(x => !x.locked && !x.pkg).map(cleanTag)); if (window.G360_CLIENT && clientTagsOn) await idb.set(tagKey() + ':pkg', tags.filter(x => x.pkg).map(cleanTag)); } catch (err) { console.error(err); } }
  function saveStart() { try { if (startView) localStorage.setItem(startKey(), JSON.stringify(startView)); else localStorage.removeItem(startKey()); } catch (err) {} }
  function saveHide() { try { localStorage.setItem(hideKey(), JSON.stringify(hideSet)); } catch (err) {} }
  function applyHide() {   // only the client's screen is affected; the Studio always shows everything
    let st = document.getElementById('hideUI'); if (!st) { st = document.createElement('style'); st.id = 'hideUI'; document.head.appendChild(st); }
    st.textContent = window.G360_CLIENT && hideSet.length ? hideSet.filter(g => HIDE_MAP[g] && !(g === 'points' && clientTagsOn)).map(g => HIDE_MAP[g]).join(',') + '{display:none !important}' : '';
  }
  function refreshStartUI() {
    $('startSt').textContent = startView ? t('startOk') : t('startNone');
    const box = $('hideList'); if (!box.children.length) {
      Object.keys(HIDE_MAP).forEach(g => { const l = document.createElement('label'); l.className = 'chk tgl'; const c = document.createElement('input'); c.type = 'checkbox'; c.dataset.g = g; const sp = document.createElement('span'); sp.dataset.k = HIDE_LBL[g]; l.appendChild(c); l.appendChild(document.createTextNode(' ')); l.appendChild(sp); box.appendChild(l);
        c.onchange = () => { hideSet = [...box.querySelectorAll('input')].filter(i => !i.checked).map(i => i.dataset.g); saveHide(); }; });
    }
    box.querySelectorAll('input').forEach(i => { i.checked = hideSet.indexOf(i.dataset.g) < 0; }); box.querySelectorAll('span[data-k]').forEach(sp => { sp.textContent = t(sp.dataset.k); });
    // No names made in the Studio: the "points and names" switch is off and locked, so the client is not shown an empty list. It turns on by itself when the first name is made.
    const pts = box.querySelector('input[data-g="points"]');
    if (pts && !window.G360_CLIENT) {
      const hasNames = views.some(v => v.room), akey = hideKey() + ':auto'; let auto = false; try { auto = localStorage.getItem(akey) === '1'; } catch (err) {}
      if (!hasNames) { pts.checked = false; pts.disabled = true; pts.parentElement.style.opacity = '.5'; if (hideSet.indexOf('points') < 0) hideSet.push('points'); try { localStorage.setItem(akey, '1'); } catch (err) {} saveHide(); }
      else { pts.disabled = false; pts.parentElement.style.opacity = ''; if (auto) { hideSet = hideSet.filter(g => g !== 'points'); pts.checked = true; try { localStorage.removeItem(akey); } catch (err) {} saveHide(); } }
    }
  }
  $('startSet').onclick = () => {
    if (overview || !camera) { note(t('startNeed3D')); return; }
    startView = { p:[camera.position.x, camera.position.y, camera.position.z], yaw, pitch }; saveStart(); refreshStartUI(); note(t('startOk'));
  };
  $('startClear').onclick = () => { startView = null; saveStart(); refreshStartUI(); };
  async function loadExtras() {   // Studio: this project's tags, start point and hidden controls
    tags = []; startView = null; hideSet = []; try { floorNames = JSON.parse(localStorage.getItem(floorKey()) || '[]') || []; } catch (err) { floorNames = []; } if (floors.length) buildFloorBar();
    try { const a = await idb.get(tagKey()); if (Array.isArray(a)) tags = a; } catch (err) {}
    try { startView = JSON.parse(localStorage.getItem(startKey()) || 'null'); } catch (err) {}
    try { hideSet = JSON.parse(localStorage.getItem(hideKey()) || '[]') || []; } catch (err) {}
    loadTagTypes();
    renderTagEls(); refreshStartUI(); renderViews();
  }
  window.G360_loadExtras = loadExtras;
  window.G360_pkgExtras = pk => {   // client: what the package carries
    floorNames = Array.isArray(pk.floors) ? pk.floors.map(x => String(x || '').slice(0, 40)) : []; if (floors.length) buildFloorBar();
    clientTagsOn = !!pk.clientTags; $('tabTags').hidden = !clientTagsOn;
    document.body.classList.toggle('noCloud', !!pk.noCloud);   // the owner can keep the point cloud away from the client: only the panoramas are shown
    if (pk.noCloud) { panoPref = true; try { updatePanoSw(); refreshClip(); } catch (err) {} }
    // Everything the owner made always shows. Only with the owner's permission can the client edit it (his edits are kept apart in his browser).
    tags = (Array.isArray(pk.tags) ? pk.tags : []).map(x => Object.assign(cleanTag(x), clientTagsOn ? { pkg:1 } : { locked:true }));
    views.forEach(v => { if (v.locked && v.room && clientTagsOn) { v.locked = false; v.pkg = 1; } });
    if (clientTagsOn) { try { const ov = JSON.parse(localStorage.getItem(viewsKey() + ':pkg') || 'null'); if (Array.isArray(ov)) views = views.filter(v => !v.pkg).concat(ov.map(v => Object.assign({}, v, { pkg:1 }))); } catch (err) {} }
    setTagTypes(pk.tagTypes, false);
    hideSet = Array.isArray(pk.hide) ? pk.hide : [];   // set before applyHide: the owner's choice of what the client sees
    applyHide(); renderTagEls(); renderViews(); if (window.G360_syncClientBtns) window.G360_syncClientBtns();
    if (clientTagsOn) idb.get(tagKey() + ':pkg').then(ov => { if (Array.isArray(ov)) tags = ov.map(x => Object.assign(cleanTag(x), { pkg:1 })); return idb.get(tagKey()); }).then(a => { if (Array.isArray(a) && a.length) tags = tags.concat(a.map(cleanTag)); renderTagEls(); renderViews(); }).catch(() => {});
    startView = pk.start && pk.start.p ? pk.start : null;
    if (startView) setTimeout(() => { try { goView(startView); } catch (err) { console.error(err); } }, 400);
  };
  // The client's own changes (tags, names) as a small file, and the way back: the client restores them, or you add them to the project.
  window.G360_say = m => say(m);
  window.G360_curName = () => currentName;
  window.G360_mineData = () => ({ g360mine:1, name:currentName, saved:new Date().toISOString(), tags:tags.filter(x => !x.locked && !x.pkg).map(cleanTag),
    views:views.filter(v => !v.locked && !v.pkg).map(v => ({ n:v.n, p:v.p, yaw:v.yaw, pitch:v.pitch, room:v.room ? 1 : undefined })) });
  window.G360_loadMine = async (d, add) => {   // add: the Studio appends them; at the client they replace his own
    const nt = Array.isArray(d.tags) ? d.tags.map(cleanTag) : [], nv = Array.isArray(d.views) ? d.views.filter(v => v && v.p) : [];
    if (add) { tags = tags.concat(nt); } else { tags = tags.filter(x => x.locked || x.pkg).concat(nt); }
    const keep = add ? views : views.filter(v => v.locked || v.pkg);
    views = keep.concat(nv.map(v => ({ n:String(v.n || '').slice(0, 80), p:v.p, yaw:+v.yaw || 0, pitch:+v.pitch || 0, room:v.room ? 1 : undefined })));
    await saveTags(); saveViews(); renderTagEls(); renderViews();
    return nt.length + nv.length;
  };
  window.G360_extrasData = () => ({ tags:tags.filter(x => !x.locked && !x.pkg).map(cleanTag), start:startView || undefined, hide:hideSet.length ? hideSet : undefined, floors:floorNames.some(Boolean) ? floorNames : undefined, tagTypes:tagTypes.length ? tagTypes : undefined });
  window.G360_setExtras = async d => {   // opening a project file
    tags = Array.isArray(d.tags) ? d.tags.map(cleanTag) : []; startView = d.start && d.start.p ? d.start : null; hideSet = Array.isArray(d.hide) ? d.hide : [];
    floorNames = Array.isArray(d.floors) ? d.floors.map(x => String(x || '').slice(0, 40)) : []; saveFloorNames(); if (floors.length) buildFloorBar();
    setTagTypes(d.tagTypes, true);
    await saveTags(); saveStart(); saveHide(); renderTagEls(); refreshStartUI(); renderViews();
  };
  // -- the round markers on the model, and the card a click opens --
  let tagElsList = [];
  function renderTagEls() {
    tagElsList.forEach(e => e.remove()); tagElsList = [];
    tags.forEach(tg => {
      const el = document.createElement('div'); el.className = 'mtag'; el.innerHTML = iconSvg(tg.icon | 0); el.style.background = tg.col; el.title = tg.n;
      let moved = false;
      if (selItem && selItem.ref === tg) el.classList.add('sel');
      el.addEventListener('pointerdown', e => {
        e.stopPropagation(); moved = false; selectItem('tag', tg);
        if (tg.locked || e.button !== 0 || !camera) return;   // drag a tag to move it (the Studio, or a client who was given permission)
        const x0 = e.clientX, y0 = e.clientY; let dragging = false;
        const mv = ev => {
          if (!dragging && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 6) return;
          if (!dragging) { dragging = true; moved = true; el.setPointerCapture(e.pointerId); el.style.cursor = 'grabbing'; $('tagCard').hidden = true; }
          ray.setFromCamera(new THREE.Vector2(ev.clientX / innerWidth * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1), camera); ray.far = Infinity;
          const h = cast()[0]; if (h) tg.p = [h.point.x, h.point.y, h.point.z];
        };
        const up = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); el.style.cursor = ''; if (dragging) { saveTags(); renderViews(); } };
        el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
      });
      el.addEventListener('click', e => { e.stopPropagation(); if (moved) { moved = false; return; } showTagCard(tg); });
      el.addEventListener('dblclick', e => { e.stopPropagation(); if (tg.locked) return; $('tagCard').hidden = true; if (document.pointerLockElement) document.exitPointerLock(); openTagEd(tg); });   // double-click: edit the tag
      $('labels').appendChild(el); tg.el = el; tagElsList.push(el);
    });
  }
  addEventListener('keydown', e => {   // Delete removes the selected tag or name
    if (e.code !== 'Delete' || !selItem || e.ctrlKey || e.metaKey || e.altKey) return;
    const a = document.activeElement; if (a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable)) return;
    if (!$('tagEd').hidden) return;
    const { kind, ref } = selItem; if (ref.locked) return;
    if (kind === 'tag') { const i = tags.indexOf(ref); if (i < 0) { clearSel(); return; } tags.splice(i, 1); clearSel(); $('tagCard').hidden = true; renderTagEls(); saveTags(); renderViews(); }
    else { const i = views.indexOf(ref); if (i < 0) { clearSel(); return; } if (!(ref.room || (!window.G360_CLIENT && !pointMode))) return; views.splice(i, 1); clearSel(); saveViews(); renderViews(); mini.dirty = true; }
    e.preventDefault();
  });
  document.addEventListener('pointerdown', e => { if (e.target && e.target.tagName === 'CANVAS') clearSel(); });
  function showTagCard(tg) {
    if (document.pointerLockElement) document.exitPointerLock();
    $('tagCardIc').innerHTML = iconSvg(tg.icon | 0); $('tagCardIc').style.background = tg.col; $('tagCardT').textContent = tg.n;
    $('tagCardD').textContent = tg.d; $('tagCardD').hidden = !tg.d;
    const okImg = typeof tg.img === 'string' && /^data:image\//.test(tg.img); $('tagCardImg').hidden = !okImg; if (okImg) $('tagCardImg').src = tg.img;
    const u = safeUrl(tg.url); $('tagCardA').hidden = !u; if (u) { $('tagCardA').href = u; $('tagCardA').textContent = t('tagOpenLink'); }
    $('tagCard').hidden = false;
  }
  $('tagCardX').onclick = () => { $('tagCard').hidden = true; };
  let occT = 0;
  function updateTagOcc() {   // a tag behind a wall is hidden; checked a few times a second, not every frame
    if (!tags.length || !camera || !model || (overview && !dollhouse)) return;
    const v = new THREE.Vector3(), o = camera.position.clone(), keepClip = clipY;
    tags.forEach(tg => {
      if (!tg.el) return; v.set(tg.p[0], tg.p[1], tg.p[2]);
      const dist = o.distanceTo(v); tg._d = dist;
      if (dollhouse || dist < 0.4 * scale) { tg._occ = false; return; }
      const pr = v.clone().project(camera); if (pr.z >= 1 || Math.abs(pr.x) > 1.1 || Math.abs(pr.y) > 1.1) return;
      ray.set(o, v.clone().sub(o).normalize()); ray.far = dist - 0.3 * scale;
      try { tg._occ = cast().length > 0; } catch (err) { tg._occ = false; }
    });
    clipY = keepClip;
  }
  setInterval(() => { try { updateTagOcc(); } catch (err) {} }, 450);
  window.G360_updateTags = () => {   // called every frame from updateLabels
    if (!tags.length) return;
    const v = new THREE.Vector3(), hideAll = (overview && !dollhouse) || !$('tagEd').hidden;
    tags.forEach(tg => {
      if (!tg.el) return;
      if (hideAll || tg._occ || !tagShown(tg)) { tg.el.style.display = 'none'; return; }
      v.set(tg.p[0], tg.p[1], tg.p[2]).project(camera);
      const vis = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05;
      tg.el.style.display = vis ? 'flex' : 'none';
      if (vis) tg.el.style.transform = `translate(${(v.x * 0.5 + 0.5) * VW()}px, ${(-v.y * 0.5 + 0.5) * innerHeight}px) translate(-50%,-50%)`;
    });
  };
  // -- the editor, and placing a tag on the model --
  function buildTagIcons() {
    const box = $('tagEdIcons'); box.innerHTML = '';
    TAG_ICONS.forEach((g, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'ic1' + (i === tagIcon ? ' on' : ''); b.innerHTML = iconSvg(i); b.style.background = $('tagEdC').value; b.onclick = () => { tagIcon = i; buildTagIcons(); }; box.appendChild(b); });
  }
  $('tagEdC').oninput = buildTagIcons;
  function setEdImg(u) { tagImg = u || ''; $('tagEdImg').hidden = !tagImg; if (tagImg) $('tagEdImg').src = tagImg; $('tagEdImgX').hidden = !tagImg; }
  $('tagEdImgB').onclick = () => $('tagEdImgF').click();
  $('tagEdImgX').onclick = () => setEdImg('');
  $('tagEdImgF').onchange = () => {
    const f = $('tagEdImgF').files[0]; $('tagEdImgF').value = ''; if (!f) return;
    const im = new Image(), url = URL.createObjectURL(f);
    im.onload = () => { const k = Math.min(1, (window.G360_CLIENT ? 360 : 640) / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.width * k)); c.height = Math.max(1, Math.round(im.height * k)); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url); setEdImg(c.toDataURL('image/jpeg', window.G360_CLIENT ? 0.7 : 0.82)); };
    im.onerror = () => URL.revokeObjectURL(url); im.src = url;
  };
  function openTagEd(tg) {
    editingTag = tg || null; if (document.pointerLockElement) document.exitPointerLock();
    $('tagEdH').textContent = tg ? t('tagEdit') : t('tagNew'); $('tagEdOk').textContent = t('tagSave');
    $('tagEdT').value = tg ? tg.n : ''; $('tagEdD').value = tg ? tg.d : ''; $('tagEdU').value = tg ? tg.url : ''; $('tagEdC').value = tg ? tg.col : '#5ec4b6'; tagIcon = tg ? tg.icon | 0 : 0;
    setEdImg(tg ? tg.img : ''); fillTypeSel(tg ? tg.ty || '' : quickTy()); if (!tg && quickTy()) applyType(quickTy()); buildTagIcons(); $('tagEd').hidden = false; $('tagEdT').focus();
  }
  $('tagAdd').onclick = () => {   // first pick the spot on the model, then the title / icon window opens there
    if (!started) return; $('tagEd').hidden = true; pendingPt = null;
    placingTag = { pending:true }; document.body.classList.add('placing'); if (renderer) renderer.domElement.style.cursor = TAG_CURSOR; say(t('tagPlace'));
  };
  let pendingPt = null;
  $('tagEdNo').onclick = () => { $('tagEd').hidden = true; pendingPt = null; };
  ['tagEdT', 'tagEdD', 'tagEdU'].forEach(id => $(id).addEventListener('keydown', e => e.stopPropagation()));
  $('tagEdOk').onclick = () => {
    const f = { n:$('tagEdT').value.trim().slice(0, 80) || t('tagNew'), d:$('tagEdD').value.trim(), url:$('tagEdU').value.trim(), img:tagImg, icon:tagIcon, col:$('tagEdC').value, ty:$('tagEdTy').value || undefined };
    $('tagEd').hidden = true;
    if (editingTag) { Object.assign(editingTag, f); if (!f.ty) delete editingTag.ty; renderTagEls(); saveTags(); renderViews(); return; }
    if (pendingPt) { tags.push(Object.assign({}, f, { p:pendingPt })); pendingPt = null; renderTagEls(); saveTags(); viewsTab = 'tags'; renderViews(); }
  };
  const endPlaceTag = () => { placingTag = null; document.body.classList.remove('placing'); if (renderer) renderer.domElement.style.cursor = ''; say(''); };
  window.G360_placeTag = point => {   // the canvas click calls this while a tag waits for its spot
    if (!placingTag) return false;
    if (placingTag.quick) { quickPlace([point.x, point.y, point.z]); return true; }   // quick mode: one click, one tag of the chosen type, and it goes on
    pendingPt = [point.x, point.y, point.z]; endPlaceTag(); openTagEd(null); return true;
  };
  addEventListener('keydown', e => { if (e.key === 'Escape' && placingTag) { endPlaceTag(); e.stopPropagation(); if (window.G360_tagTypesUI) G360_tagTypesUI(); } }, true);
  function tagPose(tg) {   // where to stand to see a tag, and the direction to look (also used by the tag report)
    const q = new THREE.Vector3(tg.p[0], tg.p[1], tg.p[2]);
    // stand on the nearest viewpoint of the tour (floor level, same floor); when that is far from the tag, stop about 2 m before it on the way
    let best = null, bd = Infinity;
    views.forEach(v => { if (!v.p || v.room) return; const dx = v.p[0] - q.x, dz = v.p[2] - q.z, dy = Math.abs(v.p[1] - (q.y - 0.5 * scale)); const d = Math.hypot(dx, dz) + 2 * dy; if (d < bd) { bd = d; best = v; } });
    let pos;
    if (best) {
      const s0 = new THREE.Vector3(best.p[0], best.p[1], best.p[2]), h = Math.hypot(s0.x - q.x, s0.z - q.z);
      if (h <= 3 * scale) pos = s0;
      else { const k = (2 * scale) / h; pos = new THREE.Vector3(q.x + (s0.x - q.x) * k, s0.y, q.z + (s0.z - q.z) * k); }
    } else { pos = new THREE.Vector3(q.x, q.y, q.z).add(new THREE.Vector3(0, 0, 2 * scale)); }
    const d = q.clone().sub(pos), yw = Math.atan2(-d.x, -d.z), pt = Math.max(-1.2, Math.min(1.2, Math.atan2(d.y, Math.hypot(d.x, d.z))));
    return { p:[pos.x, pos.y, pos.z], yaw:yw, pitch:pt };
  }
  function flyToTag(tg) {
    if (!tg || !tg.p || !camera) return;
    goView(tagPose(tg));
    setTimeout(() => { if (tg.el) { tg.el.classList.remove('pulse'); void tg.el.offsetWidth; tg.el.classList.add('pulse'); setTimeout(() => tg.el && tg.el.classList.remove('pulse'), 3200); } }, 950);
  }
  function renderTagRows() {
    const box = $('viewsList');
    tags.forEach((tg, i) => {
      if (!tagShown(tg)) return;   // its layer is switched off
      const row = document.createElement('div'); row.className = 'vrow';
      const go = document.createElement('button'); go.className = 'vgo'; const num = document.createElement('span'); num.className = 'vnum'; num.innerHTML = iconSvg(tg.icon | 0); num.style.background = tg.col; num.style.display = 'flex'; num.style.alignItems = 'center'; num.style.justifyContent = 'center'; go.appendChild(num); go.title = t('tagGo');
      go.onclick = () => { $('tagCard').hidden = true; selectItem('tag', tg); flyToTag(tg); };   // walk to the tag (from any room or from above), look at it and flash it; the card opens only when the tag itself is clicked
      row.appendChild(go);
      if (!tg.locked) {
        const nm = document.createElement('span'); nm.className = 'vlabel'; nm.textContent = tg.n; nm.style.flex = '1'; nm.style.overflow = 'hidden'; nm.style.textOverflow = 'ellipsis'; nm.style.whiteSpace = 'nowrap'; nm.ondblclick = () => openTagEd(tg); row.appendChild(nm);
        const ed = document.createElement('button'); ed.className = 'vdel'; ed.textContent = '✎'; ed.title = t('tagEdt'); ed.onclick = () => openTagEd(tg);
        const del = document.createElement('button'); del.className = 'vdel'; del.textContent = '✕'; del.title = t('viewsDel'); del.onclick = () => { tags.splice(i, 1); renderTagEls(); saveTags(); renderViews(); };
        row.appendChild(ed); row.appendChild(del);
      } else { const lbl = document.createElement('span'); lbl.className = 'vlabel'; lbl.textContent = tg.n; go.appendChild(lbl); }
      box.appendChild(row);
    });
  }
  { const prev = window.G360_relang; window.G360_relang = () => { if (prev) prev(); refreshStartUI(); renderViews(); }; }
  if (window.G360_CLIENT) $('tabTags').hidden = true;   // shown again when the package allows the client's own tags
  // The two panels under the top-right buttons take exactly the width (and position) of those buttons.
  function alignTopPanels() {
    const r = $('topRight').getBoundingClientRect(); if (!r.width) return;
    ['mpPanel', 'pkgPanel', 'planPanel', 'viewsPanel'].forEach(id => { const p = $(id); p.style.width = Math.min(Math.max(r.width, 310), innerWidth - 24) + 'px';   // at least 310px: at the client the button row alone is narrower than the panel needs
      p.style.right = (innerWidth - r.right) + 'px'; p.style.top = (r.bottom + 6) + 'px'; if (id !== 'viewsPanel') p.style.maxHeight = Math.max(160, innerHeight - r.bottom - 18) + 'px'; });
  }
  addEventListener('resize', alignTopPanels);
  {   // phones: the Options button joins the other buttons on the right, and the title takes the space beside the logo
    const tt = $('top-tools'), home = tt.parentNode, after = tt.nextSibling, mq = matchMedia('(max-width:640px)');
    const lay = () => {
      if (mq.matches && tt.parentNode !== $('topRight')) $('topRight').appendChild(tt);
      else if (!mq.matches && tt.parentNode === $('topRight')) home.insertBefore(tt, after);
      document.documentElement.style.setProperty('--trw', ($('topRight').offsetWidth + 18) + 'px');
      alignTopPanels();
    };
    if (mq.addEventListener) mq.addEventListener('change', lay);
    if (window.ResizeObserver) new ResizeObserver(lay).observe($('topRight'));
    addEventListener('resize', lay); lay();
  }
  $('viewsBtn').onclick = () => { $('planPanel').hidden = true; $('mpPanel').hidden = true; $('pkgPanel').hidden = true; $('viewsPanel').hidden = !$('viewsPanel').hidden; alignTopPanels(); };
  // Export: the client's own points as a small file to send back. Import (Studio only): add such a file to the list.
  const note = m => { say(m); setTimeout(() => { if ($('status').textContent === m) say(''); }, 3500); };
  $('viewsExport').onclick = () => {
    const mine = views.filter(v => !v.locked && !v.pkg).map(v => ({ n:v.n, p:v.p, yaw:v.yaw, pitch:v.pitch, room:v.room ? 1 : undefined }));
    const myTags = tags.filter(x => !x.locked && !x.pkg).map(cleanTag);
    if (!mine.length && !myTags.length) { note(t('viewsNoneToExport')); return; }
    const data = { app:'Gambit360', type:'viewpoints', project:window.PROJ_TITLE || currentName, model:currentName, views:mine, tags:myTags.length ? myTags : undefined };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type:'application/json' }));
    a.download = 'Gambit360-points-' + (window.PROJ_TITLE || currentName || 'tour').replace(/[\\/:*?"<>|]+/g, '_') + '.json';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };
  $('viewsImport').onclick = () => $('viewsFile').click();
  $('viewsFile').addEventListener('change', async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (!d || d.type !== 'viewpoints' || !Array.isArray(d.views)) throw new Error('bad');
      let added = 0;
      d.views.forEach(v => {
        if (!v || !Array.isArray(v.p) || v.p.length !== 3 || v.p.some(x => typeof x !== 'number' || !isFinite(x))) return;
        if (views.some(w => w.p.every((x, k) => Math.abs(x - v.p[k]) < 1e-3) && Math.abs((w.yaw || 0) - (v.yaw || 0)) < 1e-3)) return;
        views.push({ n:String(v.n || t('viewsDefault', views.length + 1)).slice(0, 80), p:v.p, yaw:+v.yaw || 0, pitch:+v.pitch || 0, room:v.room ? 1 : undefined }); added++;
      });
      if (Array.isArray(d.tags)) d.tags.forEach(x => {
        if (!x || !Array.isArray(x.p) || x.p.length !== 3 || x.p.some(q => typeof q !== 'number' || !isFinite(q))) return;
        if (tags.some(w => w.p.every((q, k) => Math.abs(q - x.p[k]) < 1e-3) && w.n === String(x.n || '').slice(0, 80))) return;
        const c = cleanTag(x); c.n = String(c.n || '').slice(0, 80) || t('tagNew'); c.url = String(c.url || '').slice(0, 500); c.d = String(c.d || '').slice(0, 1200); if (typeof c.img !== 'string' || !/^data:image\/jpeg;base64,/.test(c.img)) c.img = '';
        tags.push(c); added++;
      });
      if (Array.isArray(d.tags) && d.tags.length) { renderTagEls(); saveTags(); }
      saveViews(); renderViews();
      note(t('viewsImported', added) + (d.model && d.model !== currentName ? ' ' + t('viewsOtherModel') : ''));
    } catch (err) { note(t('viewsBadFile')); }
  });
  $('viewsClose').onclick = () => { $('viewsPanel').hidden = true; };

