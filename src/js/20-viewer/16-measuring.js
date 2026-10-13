  // ---- Measuring: pick two points on the model, get the distance. ----
  const fmt = d => { const m = d / scale; return m < 1 ? Math.round(m * 100) + t('cm') : m.toFixed(2) + t('m'); };
  const say = t => { $('status').hidden = !t; $('status').textContent = t || ''; };

  function toggleMeasure() {
    measuring = !measuring;
    if (measuring && areaMode) toggleArea();
    if (!measuring) { cancelPending(); say(''); }
    else {
      say(t('measureHint'));
      if (document.pointerLockElement) document.exitPointerLock();  // free the cursor so you can point at things
    }
    $('mbtn').classList.toggle('on', measuring);
    renderer.domElement.style.cursor = (placingTag || placingRoom) ? TAG_CURSOR : (picking() ? 'crosshair' : '');
    syncOverlay();
  }

  const picking = () => measuring || areaMode;
  const syncOverlay = () => { $('click').hidden = true; };   // no capture overlay: the cursor is always free
  const syncMode = () => { $('bOver').classList.toggle('on', overview && !dollhouse); $('b3d').classList.toggle('on', !overview || dollhouse); };

  // The 3D button always shows the building from outside (dollhouse, no ceilings); a click on the floor steps inside, as in Matterport.
  function go3D() {
    if (picking() || dollhouse) return;
    enterDollhouse();
  }
  // Dollhouse: the whole building from a corner, ceilings hidden, drag to orbit. Click the floor to step inside.
  function enterDollhouse() {
    if (!modelBox) return;
    enterOverview(false);
    const box = bbox(), sz = box.getSize(new THREE.Vector3());
    orb.target = box.getCenter(new THREE.Vector3()); orb.r = Math.max(0.5 * Math.hypot(sz.x, sz.y, sz.z), 1e-3);
    orb.az = 0.8; orb.el = 0.85; orb.dist = orb.r * 1.7; orbGoal.az = orb.az; orbGoal.el = orb.el; orbGoal.dist = orb.dist;
    dollhouse = true; syncMode();
    const to = orbPos();
    tween = { from:camera.position.clone(), to, t:0, dur:0.9, rot:{ y0:yaw, y1:orb.az, p0:pitch, p1:-orb.el, yEnd:orb.az } };
    const m = t('dollHint'); say(m); setTimeout(() => { if ($('status').textContent === m) say(''); }, 5000);
  }
  function orbPos() {
    const c = Math.cos(orb.el);
    return new THREE.Vector3(orb.target.x + Math.sin(orb.az) * c * orb.dist, orb.target.y + Math.sin(orb.el) * orb.dist, orb.target.z + Math.cos(orb.az) * c * orb.dist);
  }

  function removeObjs(objs) { objs.forEach(o => { thin.delete(o); scene.remove(o); o.geometry.dispose(); }); }
  function cancelPending() { if (pending) { removeObjs(pending.objs); pending = null; } }
  function undoMeasure() {
    if (draft) {
      const part = draft.parts.pop(); if (part) removeObjs(part);
      draft.pts.pop(); if (!draft.pts.length) draft = null;
      return;
    }
    if (pending) { cancelPending(); say(t('measureHint')); return; }
    const m = (areaMode && areas.length) ? areas.pop() : (measures.pop() || areas.pop());
    if (m) { removeObjs(m.objs); m.el.remove(); }
  }
  function clearMeasures() {
    cancelPending(); cancelDraft();
    while (measures.length) undoMeasure();
    areas.splice(0).forEach(a => { removeObjs(a.objs); a.el.remove(); });
    if (measuring) say(t('measureHint'));
    else if (areaMode) say(t('areaHint'));
  }

  // Undo / Clear all / Finish buttons next to Measure and Area, so measurements can be removed without a keyboard (phones, tablets).
  let measBtnKey = '';
  function syncMeasBtns() {
    const any = !!(measures.length || areas.length || pending || draft), show = any || picking(), done = !!(areaMode && draft && draft.pts.length >= 3);
    const key = [any, show, done, picking()].join();
    if (key === measBtnKey) return;
    measBtnKey = key;
    document.body.classList.toggle('mPicking', show);   // while the measuring buttons are on screen (mode on, or measurements left), the phone toolbar makes room for them
    $('mUndo').hidden = !show; $('mClear').hidden = !show; $('mDone').hidden = !done;   // shown as soon as Measure or Area is on, greyed out until there is something to remove
    $('mUndo').disabled = !any; $('mClear').disabled = !any;
  }

  function addPoint(p) {
    if (!pending) { pending = { a:p, objs:[mkDot(p)] }; say(t('secondPoint')); return; }   // the first point shows a dot right away
    const sh = { type:'line', pts:[pending.a, p], objs:[], el:document.createElement('div') };
    sh.el.className = 'mlabel'; $('labels').appendChild(sh.el);
    cancelPending();
    buildShape(sh);
    measures.push(sh);
    say(t('measured', sh.el.textContent));
  }

  // Surface normal at a hit, flipped to face the viewer.
  function hitNormal(h) {
    const d = ray.ray.direction;
    if (h.pc) {   // point clouds have no normals: flat spots face up/down, everything else is treated as a vertical wall
      if (gridFlat(pcGrid, h.ix, h.iy, h.iz)) return new THREE.Vector3(0, d.y < 0 ? 1 : -1, 0);
      const w = new THREE.Vector3(-d.x, 0, -d.z);
      return w.lengthSq() > 1e-6 ? w.normalize() : new THREE.Vector3(0, 1, 0);
    }
    const n = h.face.normal.clone().transformDirection(h.object.matrixWorld);
    if (n.dot(d) > 0) n.negate();
    return n;
  }

  // The ring follows the cursor over the 3D view and the bird's-eye view, like in Matterport.
  function updateMarker(dt) {
    if (placingTag || placingRoom) { marker.visible = false; pickDot.visible = false; if (renderer && renderer.domElement.style.cursor !== TAG_CURSOR) renderer.domElement.style.cursor = TAG_CURSOR; return; }   // while a tag is placed the walking ring gives way to a small circle with a +
    if (promo) { marker.visible = false; pickDot.visible = false; return; }
    if (picking()) { marker.visible = false; if (tween) hidePick(); else pickHover(dt); return; }
    if (pickDot.visible) hidePick();
    if (!mouseIn || tween || (mouseDown && dragMoved > 4)) { marker.visible = false; markKey = ''; return; }
    markAcc += dt;
    const key = [yaw, pitch, camera.fov, camera.position.x, camera.position.y, camera.position.z, mouseNDC.x, mouseNDC.y].join();
    if (markAcc > 0.07 && key !== markKey) {
      markAcc = 0; markKey = key;
      ray.setFromCamera(mouseNDC, camera);
      ray.far = Infinity;
      const hs = cast();
      const h = overview ? (hs.find(floorLike) || hs[0]) : hs[0];
      if (h) {
        // Floor spot you can walk to: ring in the system colour. Anything else (wall, ceiling): the same ring, white and faint, lying on that surface.
        const n = hitNormal(h);
        marker.userData.ok = floorLike(h) && (overview || h.point.y < camera.position.y - 0.3 * scale);
        marker.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
        marker.position.copy(h.point).addScaledVector(n, 0.015 * scale);
        marker.scale.setScalar(scale * Math.max(1, camera.position.distanceTo(h.point) / (5 * scale)));
        marker.visible = true;
      } else marker.visible = false;
    }
    {
      const ok = !!marker.userData.ok, k = ok ? 1 : 0.5, col = ok ? accentLin : whiteCol;
      marker.children.forEach(ch => ch.material.color.copy(col));
      marker.children[0].material.opacity = 0.75 * k;
      marker.children[1].material.opacity = 0.95 * k;
      marker.children[2].material.opacity = (0.3 + 0.2 * Math.sin(clock.elapsedTime * 3)) * k;
    }
  }

