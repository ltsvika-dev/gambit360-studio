  // ---- Mini-map: plan of the floor you are on, with your position and viewing direction ----
  let DISP = 176;   // size of the map on the screen; the picture itself is drawn at twice that size, so it stays sharp when zoomed in
  const RS = 2;
  let MINI = DISP * RS;
  const MINI_SIZES = [176, 240, 320, 420, 520], MINI_KEY = 'tourViewerMiniSize';
  let miniIdx = 0;
  try { const v = +localStorage.getItem(MINI_KEY); if (MINI_SIZES.includes(v)) miniIdx = MINI_SIZES.indexOf(v); } catch (err) {}
  const mini = { ctx:$('mini').getContext('2d'), cache:new Map(), cur:null, job:null, key:null, k:1, ox:0, oy:0, t:0, hover:null, dirty:false, z:1, tx:0, ty:0 };
  const MINI_ZOOMS = [1, 1.5, 2, 3];
  let miniZi = 0; try { const v = +localStorage.getItem('tourViewerMiniZoom'); if (MINI_ZOOMS.includes(v)) miniZi = MINI_ZOOMS.indexOf(v); } catch (err) {}
  function placeMiniCtl() {
    const sz = DISP, w = $('miniCtl').offsetWidth || 90;
    $('miniCtl').style.left = (16 + sz - w - 6) + 'px'; $('miniCtl').style.top = (innerHeight - 84 - sz + 6) + 'px';
  }
  function applyMiniSize(save) {
    let idx = miniIdx; while (idx > 0 && (MINI_SIZES[idx] > innerWidth * 0.6 || MINI_SIZES[idx] > innerHeight - 200)) idx--;
    const cv = $('mini'); DISP = MINI_SIZES[idx]; MINI = DISP * RS;
    cv.width = cv.height = MINI; cv.style.width = cv.style.height = DISP + 'px';
    mini.cache.clear(); mini.cur = null; mini.job = null; mini.key = null; mini.dirty = true;
    $('miniReset').hidden = idx === 0; $('miniSmall').disabled = idx === 0; $('miniBig').disabled = idx === MINI_SIZES.length - 1;
    placeMiniCtl();
    if (save) { try { localStorage.setItem(MINI_KEY, String(MINI_SIZES[miniIdx])); } catch (err) {} }
  }
  $('miniBig').onclick = () => { if (miniIdx < MINI_SIZES.length - 1) { miniIdx++; applyMiniSize(true); } };
  $('miniSmall').onclick = () => { if (miniIdx > 0) { miniIdx--; applyMiniSize(true); } };
  $('miniReset').onclick = () => { miniIdx = 0; applyMiniSize(true); };
  const setMiniZoom = i => { miniZi = Math.max(0, Math.min(MINI_ZOOMS.length - 1, i)); $('miniZin').disabled = miniZi === MINI_ZOOMS.length - 1; $('miniZout').disabled = miniZi === 0; mini.dirty = true; try { localStorage.setItem('tourViewerMiniZoom', String(MINI_ZOOMS[miniZi])); } catch (err) {} };
  $('startGo').onclick = () => { if (startView && startView.p) goView(startView); };
  $('miniZin').onclick = () => setMiniZoom(miniZi + 1);
  $('miniZout').onclick = () => setMiniZoom(miniZi - 1);
  setMiniZoom(miniZi);
  let miniOff = false; try { const mv = localStorage.getItem('tourViewerMiniOff'); miniOff = mv === '1' || (mv === null && !!window.G360_CLIENT && !!(window.G360PKG && window.G360PKG.miniClosed)); } catch (err) {}   // a client package can start with the mini-map closed; the client's own choice wins once made
  window.G360_miniDefault = () => { try { if (localStorage.getItem('tourViewerMiniOff') === null) { miniOff = true; $('miniToggle').classList.remove('on'); } } catch (err) {} };   // the package asks for a closed mini-map on the first visit
  const setMiniOff = v => { miniOff = v; try { localStorage.setItem('tourViewerMiniOff', v ? '1' : '0'); } catch (err) {} $('miniToggle').classList.toggle('on', !miniOff); };
  $('miniToggle').onclick = () => setMiniOff(!miniOff);
  $('miniToggle').classList.toggle('on', !miniOff);
  ['mousedown', 'pointerdown', 'mouseup', 'pointerup', 'click', 'dblclick', 'contextmenu', 'wheel'].forEach(ev => $('miniCtl').addEventListener(ev, e => e.stopPropagation()));
  addEventListener('resize', () => applyMiniSize(false));
  applyMiniSize(false);
  function miniBase() {
    let idx = curFloor;
    if (idx < 0 && floors.length) { idx = 0; floors.forEach((f, i) => { if (f <= camera.position.y + 0.5 * scale) idx = i; }); }
    if (floors.length) return floors[idx];
    const q = 0.5 * scale;
    return Math.round((camera.position.y - EYE) / q) * q;
  }
  // Walls show up as lines: every triangle that crosses the height band of the floor is drawn from above. Floors and ceilings fall outside it.
  // Built in small slices (a few ms per frame) so the viewer never freezes, and cached per floor.
  // Colour map: the real model seen from above (cut at 1.5 m like an architect's plan), rendered once per floor. Falls back to the line map if anything fails.
  function miniPhoto(base, cv) {
    const box = modelBox; if (!box || !model || !renderer) return false;
    const sx = box.max.x - box.min.x, sz = box.max.z - box.min.z, pad = 8;
    const k = (MINI - 2 * pad) / Math.max(sx, sz, 1e-6);
    const ox = pad + ((MINI - 2 * pad) - sx * k) / 2, oy = pad + ((MINI - 2 * pad) - sz * k) / 2;
    mini.k = k; mini.ox = ox; mini.oy = oy;
    const w = MINI / k, cx = box.min.x + (MINI / 2 - ox) / k, cz = box.min.z + (MINI / 2 - oy) / k;
    const cam = new THREE.OrthographicCamera(-w / 2, w / 2, w / 2, -w / 2, 0.1 * scale, (box.max.y - box.min.y) + span * 3);
    cam.up.set(0, 0, -1); cam.position.set(cx, box.max.y + span, cz); cam.lookAt(cx, 0, cz);
    cam.updateMatrixWorld(true);
    const rt = new THREE.WebGLRenderTarget(MINI, MINI); rt.texture.encoding = THREE.sRGBEncoding;
    const vis = scene.children.map(c => c.visible), oldClip = clipPlane.constant, oldCol = new THREE.Color(), oldA = renderer.getClearAlpha();
    renderer.getClearColor(oldCol);
    const oldPx = pcMat ? pcMat.uniforms.uPx.value : 0, oldUY = pcMat ? pcMat.uniforms.uClipY.value : 0, oldPlanes = renderer.clippingPlanes;   // in a panorama the planes are switched off: they must stay off afterwards
    try {
      renderer.clippingPlanes = [clipPlane];
      scene.children.forEach(c => { c.visible = (c === model); });
      clipPlane.constant = base + 1.5 * scale;
      if (pcMat) { pcMat.uniforms.uClipY.value = base + 1.5 * scale; pcMat.uniforms.uPx.value = MINI * 0.5; }
      renderer.setClearColor(0x000000, 0);
      renderer.setRenderTarget(rt); renderer.clear(); renderer.render(scene, cam); renderer.setRenderTarget(null);
      const buf = new Uint8Array(MINI * MINI * 4); renderer.readRenderTargetPixels(rt, 0, 0, MINI, MINI, buf);
      const g = cv.getContext('2d'), im = g.createImageData(MINI, MINI), row = MINI * 4;
      for (let y = 0; y < MINI; y++) { const r = MINI - 1 - y; im.data.set(buf.subarray(r * row, (r + 1) * row), y * row); }
      g.clearRect(0, 0, MINI, MINI); g.putImageData(im, 0, 0);
      return true;
    } finally {
      scene.children.forEach((c, i) => { c.visible = vis[i]; });
      renderer.clippingPlanes = oldPlanes; clipPlane.constant = oldClip; renderer.setClearColor(oldCol, oldA);
      if (pcMat) { pcMat.uniforms.uPx.value = oldPx; pcMat.uniforms.uClipY.value = oldUY; }
      renderer.setRenderTarget(null); rt.dispose();
    }
  }
  function* miniGen(base, cv) {
    try { if (miniPhoto(base, cv)) return; } catch (err) { console.warn('colour map failed, using lines', err); }
    yield* miniGenLines(base, cv);
  }
  function* miniGenLines(base, cv) {
    const g = cv.getContext('2d'); g.clearRect(0, 0, MINI, MINI);
    const box = modelBox; if (!box || !model) return;
    const sx = box.max.x - box.min.x, sz = box.max.z - box.min.z, pad = 8;
    const k = (MINI - 2 * pad) / Math.max(sx, sz, 1e-6);
    const ox = pad + ((MINI - 2 * pad) - sx * k) / 2, oy = pad + ((MINI - 2 * pad) - sz * k) / 2;
    mini.k = k; mini.ox = ox; mini.oy = oy;
    const lo = base + 0.25 * scale, hi = base + 2.0 * scale;
    const X = x => ox + (x - box.min.x) * k, Z = z => oy + (z - box.min.z) * k;
    model.updateMatrixWorld(true);
    const objs = []; model.traverse(o => { if (o.geometry && o.geometry.attributes && o.geometry.attributes.position) objs.push(o); });
    if (pointMode) {
      const grid = new Uint8Array(MINI * MINI);
      for (const o of objs) {
        const pa = o.geometry.attributes.position, e = o.matrixWorld.elements, a = pa.array, n = pa.count, step = Math.max(1, Math.floor(n / 2e6));
        for (let i = 0; i < n; i += step) {
          if ((i & 0x3ffff) === 0) yield;
          const x = a[3 * i], y = a[3 * i + 1], z = a[3 * i + 2];
          const wy = e[1] * x + e[5] * y + e[9] * z + e[13]; if (wy < lo || wy > hi) continue;
          const px = Math.round(X(e[0] * x + e[4] * y + e[8] * z + e[12])), pz = Math.round(Z(e[2] * x + e[6] * y + e[10] * z + e[14]));
          if (px >= 0 && px < MINI && pz >= 0 && pz < MINI) { const j = pz * MINI + px; if (grid[j] < 255) grid[j]++; }
        }
      }
      const im = g.createImageData(MINI, MINI);
      for (let j = 0; j < grid.length; j++) if (grid[j] >= 2) { const q = 4 * j; im.data[q] = im.data[q + 1] = im.data[q + 2] = 235; im.data[q + 3] = Math.min(255, 90 + grid[j] * 20); }
      g.putImageData(im, 0, 0);
      return;
    }
    g.strokeStyle = 'rgba(235,240,242,.9)'; g.lineWidth = RS; g.beginPath();
    const P = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    let total = 0, segs = 0;
    for (const o of objs) if (o.isMesh) { const ga = o.geometry; total += ga.index ? ga.index.count / 3 : ga.attributes.position.count / 3; }
    const stride = Math.max(1, Math.round(total / 700000));   // at most ~700k triangles are looked at
    for (const o of objs) {
      if (!o.isMesh) continue;
      const ga = o.geometry, e = o.matrixWorld.elements, a = ga.attributes.position.array, idx = ga.index ? ga.index.array : null;
      const tri = idx ? idx.length / 3 : ga.attributes.position.count / 3, step = stride;
      for (let ti = 0; ti < tri; ti += step) {
        if ((ti & 0x3fff) === 0) yield;
        if (segs >= 6000) { g.stroke(); g.beginPath(); segs = 0; yield; }   // one huge stroke at the end would freeze the page
        let ymin = 1e30, ymax = -1e30;
        for (let v = 0; v < 3; v++) {
          const vi = idx ? idx[3 * ti + v] : 3 * ti + v, x = a[3 * vi], y = a[3 * vi + 1], z = a[3 * vi + 2];
          const wy = e[1] * x + e[5] * y + e[9] * z + e[13];
          P[3 * v] = e[0] * x + e[4] * y + e[8] * z + e[12]; P[3 * v + 1] = wy; P[3 * v + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
          if (wy < ymin) ymin = wy; if (wy > ymax) ymax = wy;
        }
        if (ymax < lo || ymin > hi) continue;
        g.moveTo(X(P[0]), Z(P[2])); g.lineTo(X(P[3]), Z(P[5])); g.lineTo(X(P[6]), Z(P[8])); g.closePath(); segs++;
      }
    }
    g.stroke();
  }
  function updateMini(dt) {
    const avail = started && !overview && !!modelBox && !!model, show = avail && !miniOff;
    $('miniToggle').hidden = !(started && !!modelBox);
    $('startGo').hidden = !(started && !!modelBox && startView && startView.p);   // the owner's starting point: one tap takes the client back there
    if ($('mini').hidden === show) { $('mini').hidden = !show; $('miniCtl').hidden = !show; if (show) placeMiniCtl(); }
    if (!show) return;
    const base = miniBase(), key = Math.round(base * 100) + ':' + model.uuid;
    if (key !== mini.key) {
      mini.key = key; mini.job = null;
      if (mini.cache.has(key)) mini.cur = mini.cache.get(key);
      else { const cv = document.createElement('canvas'); cv.width = cv.height = MINI; mini.job = { key, cv, gen:miniGen(base, cv) }; }
    }
    if (mini.job) {
      const t0 = performance.now(); let r;
      do { r = mini.job.gen.next(); } while (!r.done && performance.now() - t0 < 4);
      if (r.done) {
        if (mini.cache.size > 8) mini.cache.delete(mini.cache.keys().next().value);
        mini.cache.set(mini.job.key, mini.job.cv); mini.cur = mini.job.cv; mini.job = null;
      }
    }
    mini.t += dt; if (mini.t < 0.1 && !mini.dirty) return; mini.t = 0; mini.dirty = false;
    const c = mini.ctx; c.clearRect(0, 0, MINI, MINI);
    // zoom: the map follows your position (and never shows beyond its edge)
    const Z = MINI_ZOOMS[miniZi], px0 = mini.ox + (camera.position.x - modelBox.min.x) * mini.k, pz0 = mini.oy + (camera.position.z - modelBox.min.z) * mini.k;
    const tx = Z > 1 ? Math.max(MINI - Z * MINI, Math.min(0, MINI / 2 - Z * px0)) : 0, ty = Z > 1 ? Math.max(MINI - Z * MINI, Math.min(0, MINI / 2 - Z * pz0)) : 0;
    mini.z = Z; mini.tx = tx; mini.ty = ty;
    if (mini.cur) { c.setTransform(Z, 0, 0, Z, tx, ty); c.drawImage(mini.cur, 0, 0); c.setTransform(1, 0, 0, 1, 0, 0); }
    const px = tx + Z * px0, pz = ty + Z * pz0;
    const ang = Math.atan2(-Math.cos(yaw), -Math.sin(yaw));
    c.fillStyle = document.documentElement.style.getPropertyValue('--accent').trim() || '#5ec4b6'; c.globalAlpha = 0.35; c.beginPath(); c.moveTo(px, pz); c.arc(px, pz, 30 * RS, ang - 0.6, ang + 0.6); c.closePath(); c.fill(); c.globalAlpha = 1;
    c.beginPath(); c.arc(px, pz, 5 * RS, 0, Math.PI * 2); c.fill(); c.lineWidth = 2 * RS; c.strokeStyle = '#fff'; c.stroke();
    { const baseY = miniBase(); c.font = (600) + ' ' + (13 * RS) + 'px Heebo, Segoe UI, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
      views.forEach(w => {
        if (!w.room || w.p[1] < baseY - 0.3 * scale || w.p[1] > baseY + 2.8 * scale) return;
        const rx = tx + Z * (mini.ox + (w.p[0] - modelBox.min.x) * mini.k), rz = ty + Z * (mini.oy + (w.p[2] - modelBox.min.z) * mini.k);
        if (rx < 0 || rz < 0 || rx > MINI || rz > MINI) return;
        c.lineWidth = 4 * RS; c.strokeStyle = 'rgba(0,0,0,.75)'; c.strokeText(w.n, rx, rz); c.fillStyle = '#fff'; c.fillText(w.n, rx, rz);
      }); c.textAlign = 'start'; c.textBaseline = 'alphabetic'; }
    if (mini.hover) {   // the spot you are pointing at on the map
      c.beginPath(); c.arc(mini.hover.x, mini.hover.y, 7 * RS, 0, Math.PI * 2); c.lineWidth = 2 * RS; c.strokeStyle = c.fillStyle; c.stroke();
      c.beginPath(); c.arc(mini.hover.x, mini.hover.y, 2.5 * RS, 0, Math.PI * 2); c.fillStyle = '#fff'; c.fill();
    }
  }
  // Click on the map: glide to that spot on the floor you are on.
  const miniPos = e => { const r = $('mini').getBoundingClientRect(); return { x:(e.clientX - r.left) * MINI / r.width, y:(e.clientY - r.top) * MINI / r.height }; };
  function miniGo(e) {
    if (!modelBox || !model || overview) return;
    const p = miniPos(e), wx = ((p.x - mini.tx) / mini.z - mini.ox) / mini.k + modelBox.min.x, wz = ((p.y - mini.ty) / mini.z - mini.oy) / mini.k + modelBox.min.z, base = miniBase();
    for (const up of [2.0, 1.4, 0.9]) {
      ray.set(new THREE.Vector3(wx, base + up * scale, wz), new THREE.Vector3(0, -1, 0)); ray.far = (up + 0.6) * scale;
      const h = cast().find(x => Math.abs(x.point.y - base) < 0.45 * scale && floorLike(x));
      if (h) {
        const to = h.point.clone(); to.y += EYE;
        tween = { from:camera.position.clone(), to, t:0, dur:0.6, punch:{ f0:camera.fov } };
        const f = $('fx'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
        return;
      }
    }
    const msgText = t('miniNone'); say(msgText); setTimeout(() => { if ($('status').textContent === msgText) say(''); }, 2500);
  }
  ['mousedown', 'pointerdown', 'mouseup', 'pointerup', 'contextmenu', 'dblclick'].forEach(ev => $('mini').addEventListener(ev, e => e.stopPropagation()));
  $('mini').addEventListener('wheel', e => { e.stopPropagation(); e.preventDefault(); setMiniZoom(miniZi + (e.deltaY < 0 ? 1 : -1)); }, { passive:false });   // the wheel over the map zooms it
  $('mini').addEventListener('click', e => { e.stopPropagation(); miniGo(e); });
  $('mini').addEventListener('mousemove', e => { const p = miniPos(e); mini.hover = p; mini.dirty = true; });
  $('mini').addEventListener('mouseleave', () => { mini.hover = null; mini.dirty = true; });

  /*@STUDIO*/
