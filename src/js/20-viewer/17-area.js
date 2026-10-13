  // ---- Area: click the corners of a polygon, finish with Enter (or click the first point). ----
  const thin = new Set();
  const mkDot = pt => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.045 * scale, 14, 10), measMat);
    m.position.copy(pt); m.renderOrder = 999; scene.add(m); thin.add(m); return m;
  };
  const mkBar = (a, b) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.011 * scale, 0.011 * scale, a.distanceTo(b), 8), measMat);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    if (a.distanceTo(b) > 1e-6) m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    m.userData.bar = true; m.renderOrder = 999; scene.add(m); thin.add(m); return m;
  };
  const fmtArea = a => (a / (scale * scale)).toFixed(2) + t('m2');

  function toggleArea() {
    areaMode = !areaMode;
    if (areaMode && measuring) toggleMeasure();
    if (areaMode) {
      say(t('areaHint'));
      if (document.pointerLockElement) document.exitPointerLock();
    } else { cancelDraft(); say(''); }
    $('abtn').classList.toggle('on', areaMode);
    renderer.domElement.style.cursor = (placingTag || placingRoom) ? TAG_CURSOR : (picking() ? 'crosshair' : '');
    syncOverlay();
  }

  function cancelDraft() { if (draft) { removeObjs(draft.parts.flat()); draft = null; } }

  function addAreaPoint(p, cx, cy) {
    if (!draft) draft = { pts:[], parts:[] };
    if (draft.pts.length >= 3) {
      const q = draft.pts[0].clone().project(camera);
      if (Math.hypot((q.x * 0.5 + 0.5) * innerWidth - cx, (-q.y * 0.5 + 0.5) * innerHeight - cy) < 22) { finishArea(); return; }
    }
    const last = draft.pts[draft.pts.length - 1];
    draft.parts.push(last ? [mkBar(last, p), mkDot(p)] : [mkDot(p)]);
    draft.pts.push(p);
    say(draft.pts.length < 3 ? t('areaMore') : t('areaFinish'));
  }

  function finishArea() {
    if (!draft || draft.pts.length < 3) return;
    const sh = { type:'area', pts:draft.pts, objs:[], el:document.createElement('div') };
    sh.el.className = 'mlabel'; $('labels').appendChild(sh.el);
    cancelDraft();
    buildShape(sh);
    areas.push(sh);
    say(t('areaDone', sh.el.textContent));
  }

  // Draws a finished line or polygon from its points: dots, bars, fill and label.
  function buildShape(sh) {
    removeObjs(sh.objs); sh.objs = [];
    const pts = sh.pts, n = pts.length, isArea = sh.type === 'area';
    pts.forEach(p => { const d = mkDot(p); d.visible = isArea; sh.objs.push(d); });   // a plain measurement has no dots, they only show when the cursor is over an end so it can be dragged
    applyHover(sh);
    for (let i = 0; i < (isArea ? n : n - 1); i++) sh.objs.push(mkBar(pts[i], pts[(i + 1) % n]));
    sh.mid = new THREE.Vector3(); pts.forEach(p => sh.mid.add(p)); sh.mid.divideScalar(n);
    if (!isArea) { sh.el.textContent = fmt(pts[0].distanceTo(pts[1])); return; }
    // Newell's method: the vector area of the polygon, so floors, walls and slopes all work.
    const nv = new THREE.Vector3();
    pts.forEach((a, i) => {
      const b = pts[(i + 1) % n];
      nv.x += (a.y - b.y) * (a.z + b.z); nv.y += (a.z - b.z) * (a.x + b.x); nv.z += (a.x - b.x) * (a.y + b.y);
    });
    const nrm = nv.clone().normalize();
    let u = new THREE.Vector3(0, 1, 0).cross(nrm);
    if (u.lengthSq() < 1e-6) u = new THREE.Vector3(1, 0, 0).cross(nrm);
    u.normalize();
    const w = nrm.clone().cross(u);
    const tris = THREE.ShapeUtils.triangulateShape(pts.map(p => new THREE.Vector2(p.dot(u), p.dot(w))), []);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flatMap(p => [p.x, p.y, p.z]), 3));
    g.setIndex(tris.flat());
    const fill = new THREE.Mesh(g, fillMat);
    fill.renderOrder = 998; scene.add(fill); sh.objs.push(fill);
    sh.el.textContent = fmtArea(nv.length() / 2);
  }

  // The point under the cursor turns yellow and grows, so it is clear it can be grabbed.
  function applyHover(sh) {
    if (!hoverV || hoverV.sh !== sh) return;
    const o = sh.objs[hoverV.i];
    if (o) { o.material = hoverMat; o.userData.hot = true; o.visible = true; }
  }
  function setHover(v) {
    if (hoverV && v && hoverV.sh === v.sh && hoverV.i === v.i) return;
    if (hoverV) { const o = hoverV.sh.objs[hoverV.i]; if (o) { o.material = measMat; o.userData.hot = false; o.visible = hoverV.sh.type === 'area'; } }
    hoverV = v ? { sh:v.sh, i:v.i } : null;
    if (hoverV) applyHover(hoverV.sh);
  }

  // Which finished point is under the cursor (within 16px)?
  function findVertex(cx, cy) {
    let best = null, bd = 22;
    [...measures, ...areas].forEach(sh => sh.pts.forEach((p, i) => {
      const q = p.clone().project(camera);
      if (q.z > 1) return;
      const d = Math.hypot((q.x * 0.5 + 0.5) * innerWidth - cx, (-q.y * 0.5 + 0.5) * innerHeight - cy);
      if (d < bd) { bd = d; best = { sh, i }; }
    }));
    return best;
  }

  function moveVertex(e) {
    const now = performance.now();
    if (now - lastMove < 30) return;
    lastMove = now;
    ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera);
    ray.far = Infinity;
    const h = cast()[0];
    if (h) { drag.sh.pts[drag.i].copy(h.point); buildShape(drag.sh); }
  }

  // While measuring: a white dot shows exactly where the click will land, plus a rubber-band line from the last point.
  function hidePick() {
    pickDot.visible = false; markKey = '';
    if (rubber) { removeObjs([rubber]); rubber = null; }
  }

  function pickHover(dt) {
    markAcc += dt;
    const key = ['p', yaw, pitch, camera.fov, camera.position.x, camera.position.y, camera.position.z, mouseNDC.x, mouseNDC.y].join();
    if (markAcc < 0.06 || key === markKey) return;
    markAcc = 0; markKey = key;
    ray.setFromCamera(locked ? new THREE.Vector2(0, 0) : mouseNDC, camera); ray.far = Infinity;
    const h = cast()[0];
    if (rubber) { removeObjs([rubber]); rubber = null; }
    if (!h || (!locked && !mouseIn)) { pickDot.visible = false; return; }
    let p = h.point, closing = false;
    if (areaMode && draft && draft.pts.length >= 3) {  // near the first corner: snap to it, click will close the shape
      const q = draft.pts[0].clone().project(camera);
      const mx = (mouseNDC.x * 0.5 + 0.5) * innerWidth, my = (-mouseNDC.y * 0.5 + 0.5) * innerHeight;
      if (!locked && Math.hypot((q.x * 0.5 + 0.5) * innerWidth - mx, (-q.y * 0.5 + 0.5) * innerHeight - my) < 22) { p = draft.pts[0]; closing = true; }
    }
    pickDot.position.copy(p);
    pickDot.scale.setScalar(scale * Math.max(1, camera.position.distanceTo(p) / (3 * scale)));
    pickDot.material.color.set(closing ? 0xffd166 : 0xffffff);
    pickDot.visible = true;
    const from = draft && draft.pts.length ? draft.pts[draft.pts.length - 1] : (pending ? pending.a : null);
    if (from) rubber = mkBar(from, p);
  }

  // Keep dots and lines readable from far away (bird's-eye view).
  function updateThickness() {
    thin.forEach(o => {
      const k = Math.max(1, camera.position.distanceTo(o.position) / (3 * scale));
      if (o.userData.bar) o.scale.set(k, 1, k); else o.scale.setScalar(k * (o.userData.hot ? 1.5 : 1));
    });
  }

  function updateLabels() {
    const v = new THREE.Vector3();
    views.forEach(w => {   // room names float over the model in the 3D dollhouse view
      if (!w.el) return;
      if (!overview || dollhouse) { w.el.style.display = 'none'; return; }
      const canDrag = overview && !dollhouse && !w.locked && !placingRoom; w.el.style.pointerEvents = canDrag ? 'auto' : 'none'; w.el.style.cursor = canDrag ? 'grab' : '';
      if (overview && !dollhouse && floors.length > 1) {   // from above show only the rooms of the floor that is selected (none while all floors are shown)
        const lo = curFloor >= 0 ? floors[curFloor] - 0.3 * scale : 0, hi = curFloor >= 0 && curFloor < floors.length - 1 ? floors[curFloor + 1] - 0.1 * scale : Infinity;
        if (curFloor < 0 || w.p[1] < lo || w.p[1] > hi) { w.el.style.display = 'none'; return; }
      }
      v.set(w.p[0], w.p[1] + -0.8 * scale, w.p[2]).project(camera);   // from above, pin the tag nearer the floor so it sits inside its room
      const vis = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
      w.el.style.display = vis ? 'inline-flex' : 'none';
      if (vis) w.el.style.transform = `translate(${(v.x * 0.5 + 0.5) * innerWidth}px, ${(-v.y * 0.5 + 0.5) * innerHeight}px) translate(-50%,-50%)`;
    });
    if (window.G360_updateTags) window.G360_updateTags();
    [...measures, ...areas].forEach(m => {
      v.copy(m.mid).project(camera);
      const vis = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
      m.el.style.display = vis ? '' : 'none';
      if (vis) m.el.style.transform = `translate(${(v.x * 0.5 + 0.5) * innerWidth}px, ${(-v.y * 0.5 + 0.5) * innerHeight}px) translate(-50%,-50%)`;
    });
  }

  function enterOverview(anim) {
    if (panoOn) exitPano();
    if (!overview) saved = { p:camera.position.clone(), yaw, pitch };
    overview = true; dollhouse = false; tween = null; refreshClip();
    if (document.pointerLockElement) document.exitPointerLock();
    const box = bbox(), c = box.getCenter(new THREE.Vector3());
    const top = new THREE.Vector3(c.x, box.max.y + span * 0.8, c.z), pEnd = -Math.PI / 2 + 0.001;
    camera.fov = 75; camera.updateProjectionMatrix();
    if (anim) {
      const y1 = Math.round(yaw / (2 * Math.PI)) * 2 * Math.PI;   // the nearest way round to "north"
      tween = { from:camera.position.clone(), to:top, t:0, dur:0.8, rot:{ y0:yaw, y1, p0:pitch, p1:pEnd, yEnd:0 } };
    } else { camera.position.copy(top); yaw = 0; pitch = pEnd; }
    setSides(THREE.FrontSide);
    $('dot').hidden = true; syncOverlay(); syncMode();
  }
  function exitOverview() {
    overview = false; dollhouse = false; refreshClip();
    setSides(twoSided ? THREE.DoubleSide : THREE.FrontSide);
    syncOverlay(); syncMode();
  }
  function backFromOverview() {
    exitOverview();
    if (saved) {
      const y1 = saved.yaw, twoPi = 2 * Math.PI;
      tween = { from:camera.position.clone(), to:saved.p.clone(), t:0, dur:0.8, rot:{ y0:yaw, y1:y1 + twoPi * Math.round((yaw - y1) / twoPi), p0:pitch, p1:saved.pitch, yEnd:y1 } };
    }
  }

  // Click while walking: glide to the floor spot (or the wall) under the crosshair.
  function teleport(ndc) {
    ray.setFromCamera(ndc, camera); ray.far = Infinity;
    const h = cast()[0];
    if (!h) return;
    if (panoOn && panoSrc) { panoTeleport(h); return; }
    let to;
    if (floorLike(h) && h.point.y < camera.position.y - 0.3 * scale) {
      to = h.point.clone(); to.y += EYE;
    } else {
      const d = ray.ray.direction.clone();
      to = h.point.clone().addScaledVector(d, -0.6 * scale); to.y = camera.position.y;
    }
    tween = { from:camera.position.clone(), to, t:0, dur:0.5, punch:{ f0:camera.fov } };
    const f = $('fx'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
  }

  function blocked(dir) {
    ray.set(camera.position.clone().setY(camera.position.y - 0.3 * scale), dir);
    ray.far = 0.45 * scale;
    return cast().length > 0;
  }

  function loop() {
    requestAnimationFrame(loop);
    if (tourOpen) { clock.getDelta(); return; }   // the 3D view rests while the Matterport tour is open
    syncMeasBtns();
    const dt = Math.min(clock.getDelta(), 0.1);
    if (look.on) {
      if (!panoOn || tween) look.on = false;
      else { const kk = 1 - Math.exp(-dt * 18); yaw += (look.y - yaw) * kk; pitch += (look.p - pitch) * kk; if (Math.abs(look.y - yaw) < 5e-4 && Math.abs(look.p - pitch) < 5e-4) look.on = false; }
    }
    camera.rotation.set(pitch, yaw, 0);

    if (tween) lowRes();   // a lighter picture while the camera glides, so the move never stutters
    if (tween) {
      tween.t = window.G360_REDUCE ? 1 : Math.min(1, tween.t + dt / (tween.dur || 0.4));
      const ez = tween.t * tween.t * (3 - 2 * tween.t);
      camera.position.lerpVectors(tween.from, tween.to, ez);
      if (tween.rot) { yaw = tween.rot.y0 + (tween.rot.y1 - tween.rot.y0) * ez; pitch = tween.rot.p0 + (tween.rot.p1 - tween.rot.p0) * ez; }
      if (tween.punch) { camera.fov = tween.punch.f0 + 7 * Math.sin(Math.PI * ez); camera.updateProjectionMatrix(); }
      if (tween.t >= 1) {
        if (tween.punch) { camera.fov = tween.punch.f0; camera.updateProjectionMatrix(); }
        if (tween.rot && tween.rot.yEnd !== undefined) yaw = tween.rot.yEnd;
        const fin = tween.onEnd; tween = null; if (fin) fin();
      }
    }

    let speed = (keys.ShiftLeft || keys.ShiftRight ? 4.5 : 1.8) * scale * dt;
    if (overview) speed *= Math.max(3, span / 10);
    const fwd = new THREE.Vector3(), side = new THREE.Vector3();
    camera.getWorldDirection(fwd);
    if (walkable && !overview) fwd.y = 0;
    fwd.normalize();
    side.crossVectors(fwd, camera.up).normalize();

    const move = new THREE.Vector3();
    if (keys.KeyW) move.add(fwd);
    if (keys.KeyS) move.sub(fwd);
    if (keys.KeyD) move.add(side);
    if (keys.KeyA) move.sub(side);
    if (!walkable || overview) {
      if (keys.KeyE) move.y += 1;
      if (keys.KeyQ) move.y -= 1;
    }
    const hasMove = !panoOn && move.lengthSq() > 0;
    if (hasMove) move.normalize();

    const wk = walkable && !overview && !panoOn;
    if (wk) {
      // Collision rays are expensive on big meshes, so check a few times per second only.
      acc += dt;
      if (acc > 0.08) {
        acc = 0;
        blockCache = hasMove ? blocked(move.clone()) : false;
        ray.set(camera.position.clone().setY(camera.position.y + 0.5 * scale), new THREE.Vector3(0, -1, 0));
        ray.far = 4 * scale;
        const hit = cast()[0];
        floorY = hit && (hit.point.y + EYE - camera.position.y) < 0.6 * scale ? hit.point.y + EYE : null;
      }
    }
    if (dollhouse) {
      if (hasMove && !tween) { orb.target.x += move.x * speed; orb.target.z += move.z * speed; }
      if (!tween) {
        const k = window.G360_REDUCE ? 1 : 1 - Math.exp(-dt * 16);   // ease toward where the mouse asked to go, independent of frame rate
        orb.az += (orbGoal.az - orb.az) * k; orb.el += (orbGoal.el - orb.el) * k; orb.dist += (orbGoal.dist - orb.dist) * k;
        camera.position.copy(orbPos()); yaw = orb.az; pitch = -orb.el;
      } else { orbGoal.az = orb.az; orbGoal.el = orb.el; orbGoal.dist = orb.dist; }
    } else
    if (hasMove && !tween && !(wk && blockCache)) camera.position.addScaledVector(move, speed);
    if (wk && floorY !== null) camera.position.y += (floorY - camera.position.y) * Math.min(1, dt * 10);

    if (panoSrc) panoSync(dt);
    if (pcMat) pcMat.uniforms.uPx.value = renderer.domElement.height * 0.5;
    updateThickness();
    if (promo && typeof promoStep === 'function') promoStep();
    updateMarker(dt);
    updateLabels();
    updateMini(dt);
    renderer.render(scene, camera);
    if (promo && typeof promoFrame === 'function') promoFrame();
  }

  function updateModeLabel() { const el = $('mode'); if (el) el.textContent = t(walkable ? 'modeWalk' : 'modeFly'); }

  // Called whenever the language changes: refresh everything built from text.
  onLang = () => {
    if (window.PROJ_TITLE) setProjectTitle(window.PROJ_TITLE, window.PROJ_MANAGER);
    setExpiry(window.G360_EXPIRES);
    [...$('swatches').children].forEach(sw => { sw.title = t(sw.dataset.n); });
    updateModeLabel();
    buildFloorBar();
    if (renderer) [...measures, ...areas].forEach(buildShape);
    if (measuring) say(t('measureHint')); else if (areaMode) say(t('areaHint'));
    setResumeLabel(); if (typeof refreshSrc === 'function') refreshSrc(); alignTopPanels(); fillTourMsg(); refreshPanoOpts(); updatePanoSw(); refreshPromoSt();
  };
  if (window.G360_CLIENT) { const pb = $('promoBtn'); pb.setAttribute('data-i18n-title', 'promoPlayTip'); pb.querySelector('span').setAttribute('data-i18n', 'promoPlay'); }
  applyLang(LANG);
  (async () => {
    try { if (await tryPackage()) return; await tryResume(); }
    finally { hideBoot(); }
  })();
}
