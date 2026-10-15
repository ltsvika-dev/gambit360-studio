  // ---- Viewpoints: a list of places (saved by you, or the scan positions of an E57) that you can jump to ----
  let views = [], roomEls = [], placingRoom = null, viewsTab = 'points';
  // The tag or name last clicked is selected (outlined); the Delete key removes it, if it is one the user may delete.
  let selItem = null;
  { const mk = $('marksShow'); let on = true; try { on = localStorage.getItem('g360MarksShow') !== '0'; } catch (err) {}
    mk.checked = on; document.body.classList.toggle('hideMarks', !on);
    mk.onchange = () => { document.body.classList.toggle('hideMarks', !mk.checked); try { localStorage.setItem('g360MarksShow', mk.checked ? '1' : '0'); } catch (err) {} }; }   // a view setting: hide the tags and names without deleting them
  function clearSel() { if (selItem && selItem.ref.el) selItem.ref.el.classList.remove('sel'); selItem = null; }
  function selectItem(kind, ref) { clearSel(); selItem = { kind, ref }; if (ref.el) ref.el.classList.add('sel'); }
  // In a client package the points that came with it are locked; the client can add, rename and delete his own (kept in his browser).
  const viewsKey = () => (fromPkg ? 'tourViewerViewsClient:' : 'tourViewerViews:') + currentName;
  const saveViews = () => { try { localStorage.setItem(viewsKey(), JSON.stringify(views.filter(v => !v.locked && !v.pkg).map(v => ({ n:v.n, p:v.p, yaw:v.yaw, pitch:v.pitch, room:v.room ? 1 : undefined }))));
    if (window.G360_CLIENT && clientTagsOn) localStorage.setItem(viewsKey() + ':pkg', JSON.stringify(views.filter(v => v.pkg).map(v => ({ n:v.n, p:v.p, yaw:v.yaw, pitch:v.pitch, room:v.room ? 1 : undefined })))); } catch (err) {} };   // the client's edits of the names that came with the package are kept apart
  function setPackageViews(list) {
    let own = []; try { own = JSON.parse(localStorage.getItem(viewsKey()) || '[]') || []; } catch (err) {}
    views = list.map(v => Object.assign({}, v, { locked:true })).concat(own);
    renderViews();
  }
  function loadViews() {
    if (fromPkg) { renderViews(); return; }
    views = [];
    try { views = JSON.parse(localStorage.getItem(viewsKey()) || '[]') || []; } catch (err) {}
    if (!views.length && pointMode && stationsPC.length) views = stationsPC.map((p, i) => ({ n:t('viewsDefault', i + 1), p:[p.x, p.y, p.z], yaw:0, pitch:0 }));
    // A mesh (MatterPak) carries no scan positions: spread points over the open floor so the list is never empty
    if (!views.length && !pointMode && !panoSrc && modelBox) {
      try {
        const r = autoRoute(meshTris(), scale, 40), keep = [], minD = 3.0 * scale;
        r.forEach(a => { const q = new THREE.Vector3(a[0], a[1], a[2]), l = keep[keep.length - 1]; if (!l || l.distanceTo(q) >= minD) keep.push(q); });
        views = keep.map((q, i) => ({ n:t('viewsDefault', i + 1), p:[q.x, q.y, q.z], yaw:0, pitch:0 }));
      } catch (err) { console.error('auto points', err); }
    }
    renderViews();
  }
  function renderViews() {
    const box = $('viewsList'); box.innerHTML = '';
    let shown = 0;
    [...$('viewsTabs').children].forEach(b => b.classList.toggle('on', b.dataset.tab === viewsTab));
    const owner = !fromPkg && !window.G360_CLIENT;
    $('viewsAddRow').hidden = viewsTab !== 'points' || pointMode || !owner;   // adding points: only the owner, and only on a mesh (an E57 has its own scan positions)
    $('roomAddRow').hidden = viewsTab !== 'rooms' || (!!window.G360_CLIENT && !clientTagsOn); $('tagAddRow').hidden = viewsTab !== 'tags' || (!!window.G360_CLIENT && !clientTagsOn);
    if (!window.G360_CLIENT && typeof refreshStartUI === 'function') refreshStartUI();
    $('viewsBtn').hidden = !started || (!!window.G360_CLIENT && !clientTagsOn && !views.some(v => v.locked || v.pkg));   // a client with no names from the owner and no permission to add his own sees no names button at all
    $('viewsIO').hidden = true;   // export / import of the lists is no longer offered: the project file carries them
    roomEls.forEach(e => e.remove()); roomEls = []; mini.dirty = true;
    views.forEach((v, i) => {
      if (v.room) { const el = document.createElement('div'); el.className = 'rlabel'; el.textContent = v.n; $('labels').appendChild(el); v.el = el; roomEls.push(el); if (selItem && selItem.ref === v) el.classList.add('sel');
        el.addEventListener('pointerdown', e => {   // from above, drag a tag to a new spot on the floor
          if (overview) selectItem('view', v);
          if (!overview || dollhouse || v.locked || placingRoom) return;
          e.preventDefault(); e.stopPropagation(); el.setPointerCapture(e.pointerId);
          const move = ev => {
            ray.setFromCamera(new THREE.Vector2(ev.clientX / VW() * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1), camera); ray.far = Infinity;
            const h = cast().find(floorLike); if (h) { v.p = [h.point.x, h.point.y + EYE, h.point.z]; mini.dirty = true; }
          };
          const up = () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); saveViews(); };
          el.addEventListener('pointermove', move); el.addEventListener('pointerup', up);
        });
        el.addEventListener('dblclick', e => {   // double-click the name on the map to rename it
          if (!overview || v.locked || el.querySelector('input')) return;
          e.preventDefault(); e.stopPropagation();
          const inp = document.createElement('input'); inp.type = 'text'; inp.className = 'rledit'; inp.value = v.n; inp.spellcheck = false;
          inp.style.cssText = 'font:inherit;color:inherit;background:var(--bg,#fff);border:1px solid var(--accent,#c9a35c);border-radius:4px;padding:1px 4px;width:' + Math.max(90, el.offsetWidth + 20) + 'px;text-align:center;pointer-events:auto';
          el.textContent = ''; el.appendChild(inp); inp.focus(); inp.select();
          let done = false;
          const fin = ok => { if (done) return; done = true; if (ok) v.n = inp.value.trim() || v.n; el.textContent = v.n; mini.dirty = true; saveViews(); renderViews(); };
          ['pointerdown', 'dblclick', 'click'].forEach(ev => inp.addEventListener(ev, x => x.stopPropagation()));
          inp.addEventListener('keydown', k => { k.stopPropagation(); if (k.key === 'Enter') fin(true); else if (k.key === 'Escape') fin(false); });
          inp.addEventListener('blur', () => fin(true));
        }); }
      if (viewsTab === 'tags' || !!v.room !== (viewsTab === 'rooms')) return;
      shown++;
      const edit = !v.locked && (!!v.room || owner);   // names: the owner can name every point; the client only his own names
      const canDel = !v.locked && (v.room ? true : (owner && !pointMode));   // points can be deleted only by the owner on a mesh, never at the client or on an E57
      const row = document.createElement('div'); row.className = 'vrow';
      const go = document.createElement('button'); go.className = 'vgo';
      const num = document.createElement('span'); num.className = 'vnum' + (v.room ? ' room' : ''); num.textContent = shown;
      go.appendChild(num); go.title = t('viewsTip');
      go.onclick = () => { selectItem('view', v); goView(v); };
      row.appendChild(go);
      if (edit) {
        const inp = document.createElement('input'); inp.type = 'text'; inp.className = 'vname'; inp.value = v.n; inp.spellcheck = false;
        inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') inp.blur(); });
        inp.addEventListener('change', () => { v.n = inp.value.trim() || (v.room ? t('roomDefault', i + 1) : t('viewsDefault', i + 1)); if (v.el) v.el.textContent = v.n; mini.dirty = true; saveViews(); });
        const del = document.createElement('button'); del.className = 'vdel'; del.textContent = '✕'; del.title = t('viewsDel');
        del.onclick = () => { views.splice(i, 1); saveViews(); renderViews(); };
        row.appendChild(inp); if (canDel) row.appendChild(del);
      } else {
        const lbl = document.createElement('span'); lbl.className = 'vlabel'; lbl.textContent = v.n;
        go.appendChild(lbl);
      }
      box.appendChild(row);
    });
    if (viewsTab === 'tags') renderTagRows();
    $('viewsEmpty').hidden = viewsTab !== 'points' || shown > 0; $('roomEmpty').hidden = viewsTab !== 'rooms' || shown > 0; $('tagEmpty').hidden = viewsTab !== 'tags' || tags.length > 0;
  }
  [...$('viewsTabs').children].forEach(b => b.onclick = () => { viewsTab = b.dataset.tab; renderViews(); });
  function goView(v) {
    if (!v || !v.p || !camera) return;
    const to = new THREE.Vector3(v.p[0], v.p[1], v.p[2]), twoPi = 2 * Math.PI;
    if (overview) { exitOverview(); saved = null; }
    if (floors.length > 1) { let idx = 0; floors.forEach((f, i) => { if (f <= to.y + 0.5 * scale) idx = i; }); setFloor(idx); }
    tween = { from:camera.position.clone(), to, t:0, dur:0.9, punch:{ f0:camera.fov },
      rot:{ y0:yaw, y1:v.yaw + twoPi * Math.round((yaw - v.yaw) / twoPi), p0:pitch, p1:v.pitch, yEnd:v.yaw } };
    const f = $('fx'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
  }
  $('viewsAdd').onclick = () => {
    if (overview) { const m = t('viewsNeed3D'); say(m); setTimeout(() => { if ($('status').textContent === m) say(''); }, 3000); return; }
    const name = $('viewsName').value.trim() || t('viewsDefault', views.length + 1);
    views.push({ n:name, p:[camera.position.x, camera.position.y, camera.position.z], yaw, pitch });
    $('viewsName').value = ''; saveViews(); renderViews();
    $('viewsList').scrollTop = $('viewsList').scrollHeight;
  };
  $('viewsName').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') $('viewsAdd').click(); });
  const setPlacing = on => { document.body.classList.toggle('placing', on); const c = renderer && renderer.domElement; if (c) c.style.cursor = on ? TAG_CURSOR : ''; if (!on) placingRoom = null; };
  $('roomAdd').onclick = () => {
    if (!started || (window.G360_CLIENT && !clientTagsOn)) return;
    const n = views.filter(v => v.room).length + 1;
    placingRoom = { name: $('roomName').value.trim() || t('roomDefault', n) };
    viewsTab = 'rooms'; renderViews();
    if (!overview || dollhouse) enterOverview(true);   // pick the spot from above, like in Matterport
    setPlacing(true); placingRoom = placingRoom || null;
    const m = t('roomPlace'); say(m); setTimeout(() => { if ($('status').textContent === m) say(''); }, 6000);
  };
  window.G360_placeRoom = (point) => {   // called by the canvas click while a room tag is being placed
    if (!placingRoom) return false;
    views.push({ n:placingRoom.name, p:[point.x, point.y + EYE, point.z], yaw:0, pitch:0, room:1 });
    $('roomName').value = ''; setPlacing(false); saveViews(); renderViews(); say('');
    $('viewsList').scrollTop = $('viewsList').scrollHeight; return true;
  };
  addEventListener('keydown', e => { if (e.key === 'Escape' && placingRoom) { setPlacing(false); say(''); e.stopPropagation(); } }, true);
  $('roomName').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') $('roomAdd').click(); });

