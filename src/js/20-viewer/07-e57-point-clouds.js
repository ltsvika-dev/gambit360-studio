  // ---- E57 point clouds ----
  function startPC(d) {
    pointMode = true;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(d.pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(d.col, 3, true));
    geo.computeBoundingBox(); geo.computeBoundingSphere();
    pcMat = new THREE.ShaderMaterial({
      uniforms: { uSize:{ value:0.02 }, uPx:{ value:500 }, uClipY:{ value:1e9 }, uMin:{ value:2 }, uMax:{ value:8 }, uBoost:{ value:1 } },
      vertexShader: `
        uniform float uSize, uPx, uClipY, uMin, uMax, uBoost;
        attribute vec3 color; varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          if ((modelMatrix * vec4(position, 1.0)).y > uClipY) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; }
          gl_Position = projectionMatrix * mv;
          gl_PointSize = clamp(uSize * uBoost * uPx / max(-mv.z, 0.01), uMin * uBoost, uMax * uBoost);
        }`,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          if (dot(c, c) > 0.25) discard;
          gl_FragColor = vec4(vColor, 1.0);
        }`
    });
    const pts = new THREE.Points(geo, pcMat);
    pts.frustumCulled = false;
    model = new THREE.Group(); model.add(pts);
    ptsMain = pts; ptsLow = null;
    if (d.n > 1500000) {   // a quarter-or-so of the points, drawn a little bigger, for use while the model is being turned
      const stride = Math.ceil(d.n / 1000000), m = Math.floor(d.n / stride), lp = new Float32Array(m * 3), lc = new Uint8Array(m * 3);
      for (let i = 0, j = 0; i < m; i++, j += stride) { lp[i * 3] = d.pos[j * 3]; lp[i * 3 + 1] = d.pos[j * 3 + 1]; lp[i * 3 + 2] = d.pos[j * 3 + 2]; lc[i * 3] = d.col[j * 3]; lc[i * 3 + 1] = d.col[j * 3 + 1]; lc[i * 3 + 2] = d.col[j * 3 + 2]; }
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(lp, 3)); lg.setAttribute('color', new THREE.BufferAttribute(lc, 3, true));
      lg.boundingBox = geo.boundingBox; lg.boundingSphere = geo.boundingSphere;
      ptsLow = new THREE.Points(lg, new THREE.ShaderMaterial({ uniforms:Object.assign({}, pcMat.uniforms, { uBoost:{ value:Math.sqrt(stride) } }), vertexShader:pcMat.vertexShader, fragmentShader:pcMat.fragmentShader }));
      ptsLow.frustumCulled = false; ptsLow.visible = false; model.add(ptsLow);
    }
    stationsPC = d.stations.map(p => new THREE.Vector3(p[0], p[1], p[2]));
    pcGrid = buildPickGrid(d.pos, d.n);
    // Typical spacing between kept points on a surface; draw points a bit bigger than that so surfaces read as solid.
    const spacing = pcGrid.vs / Math.sqrt(Math.max(1, d.n / pcGrid.nv));
    baseSize = Math.max(0.012, Math.min(0.08, spacing * 1.7));
    pcMat.uniforms.uSize.value = baseSize;
    start();
  }

  const pcCast = () => {
    const o = ray.ray.origin, dir = ray.ray.direction;
    const h = gridCast(pcGrid, o.x, o.y, o.z, dir.x, dir.y, dir.z, ray.far, clipY);
    return h ? [{ point:new THREE.Vector3(h.x, h.y, h.z), distance:h.t, pc:true, ix:h.ix, iy:h.iy, iz:h.iz }] : [];
  };

  const bbox = () => { model.updateMatrixWorld(true); return new THREE.Box3().setFromObject(model); };
  const setSides = side => model.traverse(m => {
    if (!m.isMesh) return;
    (Array.isArray(m.material) ? m.material : [m.material]).forEach(o => o.side = side);
  });
  const cast = () => pointMode ? pcCast() : ray.intersectObject(model, true).filter(h => h.point.y <= clipY);
  const floorLike = h => {
    if (h.pc) return gridFlat(pcGrid, h.ix, h.iy, h.iz);
    const n = h.face.normal.clone().transformDirection(h.object.matrixWorld);
    return Math.abs(n.y) > 0.6;
  };

  // Scan textures are often flat and washed out: a light contrast and saturation lift, applied in the shader. Toggle with the button.
  const enh = { uCon:{ value:1.08 }, uSat:{ value:1.12 } };
  function enhanceShader(sh) {
    sh.uniforms.uCon = enh.uCon; sh.uniforms.uSat = enh.uSat;
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uCon;\nuniform float uSat;')
      .replace('#include <dithering_fragment>', `
        vec3 ec = gl_FragColor.rgb;
        ec = (ec - 0.5) * uCon + 0.5;
        float el = dot(ec, vec3(0.299, 0.587, 0.114));
        gl_FragColor.rgb = clamp(mix(vec3(el), ec, uSat), 0.0, 1.0);
        #include <dithering_fragment>`);
  }
  function setEnhance(on, save) {
    enh.uCon.value = on ? 1.08 : 1; enh.uSat.value = on ? 1.12 : 1;
    $('ebtn').classList.toggle('on', on);
    if (save) { try { localStorage.setItem('tourViewerEnhance', on ? '1' : '0'); } catch (e) {} }
  }

  function start() {
    if (started) { replaceModel(); return; }
    started = true;
    renderer = new THREE.WebGLRenderer({ antialias:true });
    basePR = Math.min(Math.max(devicePixelRatio, 1.5), 2); renderer.setPixelRatio(basePR);   // at least 1.5x supersampling for smoother edges
    renderer.setSize(innerWidth, innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1e9);
    renderer.clippingPlanes = [clipPlane];
    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x14181b);
    camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.05, 500);
    camera.rotation.order = 'YXZ';

    maxAniso = renderer.capabilities.getMaxAnisotropy();
    measMat = new THREE.MeshBasicMaterial({ color:0x5ec4b6, depthTest:false, depthWrite:false, transparent:true });
    hoverMat = new THREE.MeshBasicMaterial({ color:0xffd166, depthTest:false, depthWrite:false, transparent:true });
    fillMat = new THREE.MeshBasicMaterial({ color:0x5ec4b6, opacity:0.3, transparent:true, side:THREE.DoubleSide, depthTest:false, depthWrite:false });
    $('mbtn').hidden = false; $('mbtn').onclick = toggleMeasure;
    $('shotBtn').hidden = false; $('shotBtn').onclick = screenshot;
    if (window.G360_CLIENT) { setClientPromo(); } else { $('promoBtn').hidden = false; $('promoBtn').onclick = promoAsk; refreshPromoSt(); }
    $('ebtn').onclick = () => setEnhance(enh.uCon.value === 1, true);
    $('abtn').hidden = false; $('abtn').onclick = toggleArea;
    $('mUndo').onclick = undoMeasure; $('mClear').onclick = clearMeasures; $('mDone').onclick = finishArea;
    $('modes').hidden = false; $('bOver').onclick = () => { if (!overview || dollhouse) enterOverview(true); }; $('b3d').onclick = go3D;
    $('panoSw').onclick = () => { panoPref = !panoPref; try { localStorage.setItem(PANO_KEY, panoPref ? '1' : '0'); } catch (err) {} updatePanoSw(); refreshClip(); note(t(panoPref ? 'panoOnMsg' : 'panoOffMsg')); };
    marker = new THREE.Group();
    const mm = (o, map) => new THREE.MeshBasicMaterial({ color:0x5ec4b6, transparent:true, opacity:o, side:THREE.DoubleSide, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2, map:map || null });
    // Soft translucent disc (denser in the middle, fading toward the edge) like the Matterport walk marker.
    const gc = document.createElement('canvas'); gc.width = gc.height = 128;
    const gx = gc.getContext('2d'), gg = gx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gg.addColorStop(0, 'rgba(255,255,255,0.9)'); gg.addColorStop(0.65, 'rgba(255,255,255,0.6)'); gg.addColorStop(1, 'rgba(255,255,255,0.25)');
    gx.fillStyle = gg; gx.fillRect(0, 0, 128, 128);
    const discTex = new THREE.CanvasTexture(gc);
    marker.add(new THREE.Mesh(new THREE.CircleGeometry(0.135, 56), mm(0.75, discTex)));
    marker.add(new THREE.Mesh(new THREE.RingGeometry(0.15, 0.185, 56), mm(0.95)));
    marker.add(new THREE.Mesh(new THREE.RingGeometry(0.245, 0.26, 56), mm(0.4)));
    marker.rotation.x = -Math.PI / 2; marker.visible = false; marker.renderOrder = 5;
    scene.add(marker);
    applyAccent(accent);
    pickDot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 10), new THREE.MeshBasicMaterial({ color:0xffffff, depthTest:false, transparent:true }));
    pickDot.renderOrder = 1000; pickDot.visible = false; scene.add(pickDot);
renderer.domElement.addEventListener('mousedown', e => {
      dragMoved = 0; mouseDown = true;
      if (!locked && e.button === 0) { const v = findVertex(e.clientX, e.clientY); if (v) { drag = v; dragMoved = 99; } }
    });
    renderer.domElement.addEventListener('mousemove', e => {
      mouseNDC.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); mouseIn = true;
      if (drag) { setHover(drag); if (e.buttons & 1) moveVertex(e); else drag = null; return; }
      if (!locked && !(e.buttons & 1)) { const v = findVertex(e.clientX, e.clientY); setHover(v); renderer.domElement.style.cursor = (placingTag || placingRoom) ? TAG_CURSOR : (v ? 'grab' : (picking() ? 'crosshair' : '')); }
      if ((e.buttons & 1) && dollhouse && !tween) {   // dollhouse: drag orbits around the building
        orbGoal.az -= e.movementX * 0.006; orbGoal.el = Math.max(0.12, Math.min(1.5, orbGoal.el + e.movementY * 0.006)); lowRes();
        dragMoved += Math.abs(e.movementX) + Math.abs(e.movementY);
      } else
      if ((e.buttons & 1) && !overview) {  // drag = grab the view, like Matterport: the scene follows the cursor
        const k = (camera.fov * Math.PI / 180) / innerHeight;
        if (panoOn && !tween) {   // in a panorama the view eases toward where the mouse took it, so mouse-event timing never shows as stutter
          if (!look.on) { look.y = yaw; look.p = pitch; look.on = true; }
          look.y += e.movementX * k; look.p = Math.max(-1.5, Math.min(1.5, look.p + e.movementY * k));
        } else {
          yaw += e.movementX * k;
          pitch = Math.max(-1.5, Math.min(1.5, pitch + e.movementY * k));
        }
        dragMoved += Math.abs(e.movementX) + Math.abs(e.movementY);
      }
    });
    renderer.domElement.addEventListener('mouseleave', () => mouseIn = false);
    addEventListener('mouseup', () => { drag = null; mouseDown = false; });
    renderer.domElement.addEventListener('wheel', e => {
      e.preventDefault();
      const f = Math.exp(e.deltaY * 0.0015);  // below 1 = zoom in, above 1 = zoom out
      if (dollhouse) { orbGoal.dist = Math.max(orb.r * 0.25, Math.min(orb.r * 5, orbGoal.dist * f)); lowRes(); return; }
      if (overview) {
        // bird's-eye view: move toward (or away from) the point under the cursor
        mouseNDC.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
        ray.setFromCamera(mouseNDC, camera); ray.far = Infinity;
        const now = performance.now();
        if (now - lastWheel > 50) { const h = cast()[0]; wheelDist = h ? h.distance : camera.position.y - modelBox.min.y; lastWheel = now; }
        camera.position.addScaledVector(ray.ray.direction, wheelDist * (1 - f)); lowRes();
        camera.position.y = Math.max(modelBox.min.y + EYE, Math.min(modelBox.max.y + span * 3, camera.position.y));
      } else {
        camera.fov = Math.max(20, Math.min(90, camera.fov * f));  // inside the tour: change the field of view
        camera.updateProjectionMatrix();
      }
    }, { passive:false });
    // ---- Touch: one finger drags (look around / orbit / pan the plan) or taps (walk, measure), two fingers pinch to zoom. It feeds the same handlers the mouse uses. ----
    {
      const cv = renderer.domElement; cv.style.touchAction = 'none';
      const ptr = new Map(); let lastTouch = -1e9, moved = 0, pend = null, pinch = null, multi = false;
      const fire = (type, x, y, dx, dy, buttons, target) => {
        const ev = new MouseEvent(type, { bubbles:true, cancelable:true, clientX:x, clientY:y, button:0, buttons });
        Object.defineProperty(ev, 'movementX', { value:dx }); Object.defineProperty(ev, 'movementY', { value:dy });
        (target || cv).dispatchEvent(ev);
      };
      const two = () => { const [a, b] = [...ptr.values()]; return { d:Math.hypot(a.x - b.x, a.y - b.y) || 1, x:(a.x + b.x) / 2, y:(a.y + b.y) / 2 }; };
      addEventListener('click', e => { if (e.isTrusted && e.target === cv && performance.now() - lastTouch < 700) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);   // the browser's own tap-click: the tap is handled below
      const pan = (dx, dy) => {   // plan view: the map follows the finger
        const k = 2 * Math.tan(camera.fov * Math.PI / 360) * Math.max(0.5, camera.position.y - modelBox.min.y) / innerHeight;
        camera.position.x += (-Math.cos(yaw) * dx - Math.sin(yaw) * dy) * k;
        camera.position.z += (Math.sin(yaw) * dx - Math.cos(yaw) * dy) * k; lowRes();
      };
      cv.addEventListener('pointerdown', e => {
        if (e.pointerType !== 'touch') return;
        e.preventDefault(); lastTouch = performance.now();
        try { cv.setPointerCapture(e.pointerId); } catch (err) {}
        ptr.set(e.pointerId, { x:e.clientX, y:e.clientY });
        if (ptr.size === 1) { moved = 0; pend = { x:0, y:0 }; multi = false; pinch = null; fire('mousedown', e.clientX, e.clientY, 0, 0, 1); }
        else { multi = true; if (drag) { fire('mouseup', e.clientX, e.clientY, 0, 0, 0, window); } pinch = ptr.size === 2 ? two() : null; }
      });
      cv.addEventListener('pointermove', e => {
        if (e.pointerType !== 'touch' || !ptr.has(e.pointerId)) return;
        lastTouch = performance.now();
        const o = ptr.get(e.pointerId), dx = e.clientX - o.x, dy = e.clientY - o.y; o.x = e.clientX; o.y = e.clientY;
        if (ptr.size >= 2) {
          if (!pinch || ptr.size !== 2) { pinch = ptr.size === 2 ? two() : null; return; }
          const n = two(), f = pinch.d / n.d;
          if (Math.abs(f - 1) > 0.002) cv.dispatchEvent(new WheelEvent('wheel', { bubbles:true, cancelable:true, clientX:n.x, clientY:n.y, deltaY:Math.log(f) / 0.0015 }));
          pinch = n; return;
        }
        moved += Math.abs(dx) + Math.abs(dy); pend.x += dx; pend.y += dy;
        if (moved < 8) return;   // a tap with a little finger wobble is still a tap
        const mx = pend.x, my = pend.y; pend.x = 0; pend.y = 0;
        fire('mousemove', e.clientX, e.clientY, mx, my, 1);
        if (overview && !dollhouse && !drag && !tween) pan(mx, my);
      });
      const up = e => {
        if (e.pointerType !== 'touch' || !ptr.has(e.pointerId)) return;
        const wasOne = ptr.size === 1; ptr.delete(e.pointerId); lastTouch = performance.now();
        if (ptr.size < 2) pinch = null;
        if (!wasOne) return;
        fire('mouseup', e.clientX, e.clientY, 0, 0, 0, window);
        if (e.type === 'pointerup' && !multi && moved < 8) cv.dispatchEvent(new MouseEvent('click', { bubbles:true, cancelable:true, clientX:e.clientX, clientY:e.clientY, button:0 }));
        cv.dispatchEvent(new MouseEvent('mouseleave'));
      };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    }
    prepareModel();

    $('start').hidden = true; $('homeBtn').hidden = false; finishImport();
    addEventListener('resize', () => {
      camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    });
    document.addEventListener('pointerlockchange', () => {
      locked = document.pointerLockElement === renderer.domElement;
      syncOverlay();
      $('dot').hidden = !locked;
    });
    document.addEventListener('mousemove', e => {
      if (!locked) return;
      yaw -= e.movementX * 0.0022;
      pitch = Math.max(-1.5, Math.min(1.5, pitch - e.movementY * 0.0022));
    });
    renderer.domElement.addEventListener('click', e => {
      if (dragMoved > 4) { dragMoved = 0; return; }
      if (placingTag) {
        ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera); ray.far = Infinity;
        const h = cast()[0]; if (h) window.G360_placeTag(h.point); return;
      }
      if (placingRoom && overview) {
        ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera); ray.far = Infinity;
        const hit = cast().find(floorLike); if (hit) window.G360_placeRoom(hit.point); return;
      }
      if (picking()) {
        ray.setFromCamera((overview || !locked) ? new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1) : new THREE.Vector2(0, 0), camera);
        ray.far = Infinity;
        const h = cast()[0];
        if (h) { if (measuring) addPoint(h.point.clone()); else addAreaPoint(h.point.clone(), e.clientX, e.clientY); }
        return;
      }
      if (overview) {
        ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera);
        ray.far = Infinity;
        const hit = cast().find(floorLike);
        if (hit) {   // glide down to the spot (or the nearest scan) instead of jumping; the plan/dollhouse state is left when the glide ends
          let to;
          if (panoSrc && panoPref && panoSrc.conv >= 0) {
            const q = hit.point, cost = st => Math.hypot(st.p.x - q.x, st.p.z - q.z) + 2 * Math.abs((st.p.y - 1.45) - q.y);
            let best = 0, bd = Infinity; panoSrc.stations.forEach((st, k) => { const d = cost(st); if (d < bd) { bd = d; best = k; } });
            to = panoSrc.stations[best].p.clone();
          } else if (pointMode) {   // stand on the floor level under the clicked spot (a click on a ceiling must not put you above it)
            let fy = hit.point.y;
            if (floors.length) { const f = floors.filter(v => v <= hit.point.y + 0.2); fy = f.length ? f[f.length - 1] : floors[0]; }
            to = new THREE.Vector3(hit.point.x, fy + EYE, hit.point.z);
          } else { to = hit.point.clone(); to.y += EYE; }
          const wasDoll = dollhouse;
          tween = { from:camera.position.clone(), to, t:0, dur:1.1, rot:{ y0:yaw, y1:yaw, p0:pitch, p1:0 }, onEnd:() => { exitOverview(); pitch = 0; if (wasDoll) camera.fov = 75; camera.updateProjectionMatrix(); } };
        }
      } else teleport(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1));
    });
    addEventListener('keydown', e => {
      keys[e.code] = true;
      if (e.code === 'KeyG') { walkable = !walkable; floorY = null; updateModeLabel(); }
      if (e.code === 'KeyB') { twoSided = !twoSided; if (!overview) setSides(twoSided ? THREE.DoubleSide : THREE.FrontSide); }
      if (e.code === 'KeyR' && !pointMode) { model.rotation.x = model.rotation.x ? 0 : -Math.PI / 2; orient(); }
      if (pointMode && pcMat && (e.code === 'BracketLeft' || e.code === 'BracketRight')) {
        sizeMul = Math.max(0.4, Math.min(4, sizeMul * (e.code === 'BracketRight' ? 1.25 : 0.8)));
        const u = pcMat.uniforms; u.uSize.value = baseSize * sizeMul; u.uMin.value = Math.max(1, 2 * sizeMul); u.uMax.value = 8 * sizeMul;
      }
      if (e.code === 'KeyM') toggleMeasure();
      if (e.code === 'KeyP') toggleArea();
      if (e.code === 'Enter' && areaMode) finishArea();
      if (e.code === 'KeyX') clearMeasures();
      if (e.code === 'Backspace') { e.preventDefault(); undoMeasure(); }
      if (e.code === 'KeyO') overview ? backFromOverview() : enterOverview(true);
      const d = /^Digit(\d)$/.exec(e.code);
      if (d) { const n = +d[1]; if (n === 0) setFloor(-1); else if (n <= floors.length) setFloor(n - 1); }
    });
    addEventListener('keyup', e => keys[e.code] = false);
    loop();
  }

  // Everything that depends on the loaded model (so a new file can replace the current one without reloading the page).
  function prepareModel() {
    // Baked textures look right unlit, so swap in basic materials that keep the maps.
    model.traverse(m => {
      if (!m.isMesh) return;
      const list = Array.isArray(m.material) ? m.material : [m.material];
      const out = list.map(o => {
        if (o.map) {   // full-quality texture sampling: mipmaps plus anisotropic filtering keep floors and walls sharp at a low angle
          o.map.encoding = THREE.sRGBEncoding;
          o.map.anisotropy = maxAniso;
          o.map.minFilter = THREE.LinearMipmapLinearFilter; o.map.magFilter = THREE.LinearFilter;
          o.map.generateMipmaps = true; o.map.needsUpdate = true;
        }
        const mat = new THREE.MeshBasicMaterial({ map:o.map || null, color:o.map ? 0xffffff : (o.color || 0xbbbbbb), side:THREE.DoubleSide });
        mat.onBeforeCompile = enhanceShader;
        return mat;
      });
      m.material = Array.isArray(m.material) ? out : out[0];
    });
    current = model;
    scene.add(model);
    syncModelUI();
    orient();
  }
  function syncModelUI() {
    $('ebtn').hidden = true;   // the enhance-image button was retired
    if (!pointMode) setEnhance(false);
  }
  function disposeObj(o) {
    o.traverse(m => {
      if (m.geometry) m.geometry.dispose();
      (Array.isArray(m.material) ? m.material : [m.material]).forEach(x => { if (x) { if (x.map) x.map.dispose(); x.dispose(); } });
    });
  }
  function replaceModel() {
    if (current) { scene.remove(current); disposeObj(current); current = null; }
    if (measuring) toggleMeasure();
    if (areaMode) toggleArea();
    if (!keepProjectName) { clearMeasures(); if (typeof projHandle !== 'undefined') projHandle = null; }   // a new project starts clean: no old measurements, areas or save-file link
    hoverV = null; tween = null; floorY = null; curFloor = -1;
    prepareModel();
    $('start').hidden = true;
    finishImport();
  }
  function finishImport() {
    $('start').hidden = true; $('cancelImport').hidden = true;
    $('picker').disabled = false; $('pickerE57').disabled = false; $('quality').disabled = false;
    $('picker').value = ''; $('pickerE57').value = '';
    msg('');
  }
  // "File Import": show the file chooser over the current tour. Nothing is replaced until a file is actually loaded.
  function openImport() {
    $('colorPanel').hidden = true; $('help').hidden = true;
    $('start').hidden = false; $('cancelImport').hidden = false; msg('');
  }
  function closeImport() { if (started) { $('start').hidden = true; $('cancelImport').hidden = true; msg(''); } }

  // Guess the up axis and the model's units, then start from a bird's-eye view.
  function orient() {
    let size = bbox().getSize(new THREE.Vector3());
    if (!pointMode && !model.rotation.x && size.z < size.y && size.z < size.x) model.rotation.x = -Math.PI / 2;
    size = bbox().getSize(new THREE.Vector3());
    span = Math.max(size.x, size.z);
    modelBox = bbox();
    scale = pointMode ? 1 : Math.pow(10, Math.round(Math.log10(span / 20)));
    EYE = 1.6 * scale;
    camera.near = 0.05 * scale; camera.far = span * 20; camera.updateProjectionMatrix();
    if (!keepProjectName) clearMeasures();
    pointMode ? detectFloorsPC() : detectFloors(); buildFloorBar(); setFloor(-1);
    enterOverview(); saved = null;
  }

  // Find floor levels: big upward-facing horizontal surfaces, grouped by height.
  function detectFloors() {
    const box = bbox(), y0 = box.min.y, bin = 0.15 * scale;
    const nb = Math.ceil((box.max.y - y0) / bin) + 2;
    const up = new Float64Array(nb), down = new Float64Array(nb);
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), e2 = new THREE.Vector3(), e1 = new THREE.Vector3();
    model.traverse(m => {
      if (!m.isMesh) return;
      const pos = m.geometry.attributes.position, idx = m.geometry.index, mw = m.matrixWorld;
      const n = idx ? idx.count : pos.count;
      for (let i = 0; i + 2 < n; i += 3) {
        a.fromBufferAttribute(pos, idx ? idx.getX(i) : i).applyMatrix4(mw);
        b.fromBufferAttribute(pos, idx ? idx.getX(i + 1) : i + 1).applyMatrix4(mw);
        c.fromBufferAttribute(pos, idx ? idx.getX(i + 2) : i + 2).applyMatrix4(mw);
        e1.subVectors(b, a); e2.subVectors(c, a); e1.cross(e2);
        const len = e1.length();
        if (len < 1e-12 || Math.abs(e1.y / len) < 0.9) continue;
        const k = Math.floor(((a.y + b.y + c.y) / 3 - y0) / bin);
        if (k >= 0 && k < nb) (e1.y > 0 ? up : down)[k] += len / 2;
      }
    });
    const peaks = h => {
      const s = h.map((_, i) => (h[i - 1] || 0) + h[i] + (h[i + 1] || 0));
      const top = Math.max(...s), out = [];
      for (let i = 0; i < nb; i++) {
        if (s[i] >= 0.08 * top && s[i] > 0 && s[i] >= (s[i - 1] || 0) && s[i] > (s[i + 1] || 0)) out.push({ y:y0 + (i + 0.5) * bin, w:s[i] });
      }
      const merged = [];
      out.forEach(p => {
        const last = merged[merged.length - 1];
        if (last && p.y - last.y < 1.5 * scale) { if (p.w > last.w) merged[merged.length - 1] = p; }
        else merged.push(p);
      });
      return merged.map(p => p.y);
    };
    const pu = peaks(up), pd = peaks(down);
    // Normally floors face up. If the mesh winding is flipped, the lowest "down" surface is the floor instead.
    floors = (!pd.length || (pu.length && pu[0] <= pd[0])) ? pu : pd;
  }

  // Point clouds: floors come from the scanner stations. Drop rays down around each one, take the median floor height, group by height.
  function detectFloorsPC() {
    floors = []; floorCeil = [];
    if (!stationsPC.length) return;
    const keep = clipY; clipY = Infinity;
    const hs = [], dn = new THREE.Vector3(0, -1, 0), o = new THREE.Vector3();
    stationsPC.forEach(s => {
      const got = [];
      for (let k = -1; k < 8; k++) {
        const r = k < 0 ? 0 : 1.0, a = k * Math.PI / 4;
        o.set(s.x + r * Math.cos(a), s.y, s.z + r * Math.sin(a));
        ray.set(o, dn); ray.far = 3.2;
        const h = pcCast()[0]; if (h) got.push(h.point.y);
      }
      if (got.length >= 3) { got.sort((p, q) => p - q); hs.push(got[got.length >> 1]); }
    });
    clipY = keep;
    hs.sort((p, q) => p - q);
    const groups = [];
    hs.forEach(y => { const g = groups[groups.length - 1]; if (g && y - g[g.length - 1] < 1.2) g.push(y); else groups.push([y]); });
    floors = groups.map(g => g[g.length >> 1]);
    // Ceiling height above each floor: rays go up from the scan stations, median per floor (used to cut the model just below the ceiling).
    const ups = floors.map(() => []), up = new THREE.Vector3(0, 1, 0);
    const keep2 = clipY; clipY = Infinity;
    stationsPC.forEach(s => {
      let f = -1; floors.forEach((fy, i) => { if (fy <= s.y - 0.3 * scale) f = i; });
      if (f < 0) return;
      for (let k = -1; k < 8; k++) {
        const r = k < 0 ? 0 : 0.8, a = k * Math.PI / 4;
        o.set(s.x + r * Math.cos(a), s.y, s.z + r * Math.sin(a));
        ray.set(o, up); ray.far = 6 * scale;
        const h = pcCast()[0]; if (h) ups[f].push(h.point.y - floors[f]);
      }
    });
    clipY = keep2;
    floorCeil = ups.map(u => { if (u.length < 3) return 0; u.sort((p, q) => p - q); return u[u.length >> 1]; });
  }

  // What is hidden: everything above the next floor. Point clouds in bird's-eye view and dollhouse are also cut just below the ceiling (of the chosen floor, or of the top floor when no floor is chosen).
  function ceilCut(i) { return floors[i] + ((floorCeil[i] > 1.5 * scale ? floorCeil[i] : 2.5 * scale) - 0.12 * scale); }
  function refreshClip() {
    let c = (curFloor < 0 || curFloor >= floors.length - 1) ? Infinity : floors[curFloor + 1] - 0.1 * scale;
    // Point clouds are cut just below the ceiling from above, and also while a panorama is about to fade in, so the ceiling does not flash.
    const pend = !overview && panoSrc && panoPref && panoSrc.conv >= 0 && !panoOn;
    if (pointMode && (overview || pend) && floors.length) {
      let fi = curFloor >= 0 ? curFloor : floors.length - 1;
      if (pend) { fi = 0; floors.forEach((f, i) => { if (f <= camera.position.y + 0.3 * scale) fi = i; }); }
      c = Math.min(c, ceilCut(fi));
    }
    clipY = c;
    const v = isFinite(c) ? c : 1e9;
    clipPlane.constant = v;
    if (pcMat) pcMat.uniforms.uClipY.value = v;
  }

  // Floor picker: one button that shows the current floor and opens a list (top floor first); the owner can rename floors, the names go to the package.
  let floorNames = [];
  const floorKey = () => 'tourViewerFloors:' + currentName;
  const floorLabel = i => (floorNames[i] && String(floorNames[i]).trim()) || t('floorN', i + 1);
  const floorsEditable = () => !window.G360_CLIENT && !fromPkg;
  const saveFloorNames = () => { try { localStorage.setItem(floorKey(), JSON.stringify(floorNames)); } catch (err) {} };
  const FL_ICON = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 3 8l9 5 9-5z"/><path d="M3 12l9 5 9-5M3 16l9 5 9-5"/></svg>';
  document.addEventListener('click', e => { const m = document.getElementById('floorMenu'); if (m && !m.hidden && !e.target.closest('#floors')) m.hidden = true; });
  function updateFloorUI() {
    const bar = $('floors'), sp = bar.querySelector('#floorBtn .fl'); if (!sp) return;
    sp.textContent = curFloor < 0 ? t('floorAll') : floorLabel(curFloor);
    bar.querySelectorAll('.fRow').forEach(r => r.classList.toggle('on', +r.dataset.i === curFloor));
  }
  function buildFloorBar(keepOpen) {
    const bar = $('floors'); bar.innerHTML = '';
    bar.hidden = floors.length < 2; if (floors.length < 2) return;
    const btn = document.createElement('button'); btn.id = 'floorBtn'; btn.type = 'button';
    btn.innerHTML = FL_ICON + '<span class="fl"></span><svg class="ic chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>';
    const menu = document.createElement('div'); menu.id = 'floorMenu'; menu.hidden = !keepOpen;
    ['pointerdown', 'mousedown', 'click', 'dblclick', 'wheel', 'keydown', 'keyup'].forEach(ev => menu.addEventListener(ev, e => e.stopPropagation()));
    const edit = (row, i) => {
      row.innerHTML = ''; row.classList.add('editing');
      const inp = document.createElement('input'); inp.type = 'text'; inp.maxLength = 40; inp.value = floorLabel(i); row.appendChild(inp);
      let done = false;
      const fin = ok => { if (done) return; done = true; if (ok) { const v = inp.value.trim(); floorNames[i] = (v && v !== t('floorN', i + 1)) ? v : ''; saveFloorNames(); } buildFloorBar(true); };
      inp.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') fin(true); else if (e.key === 'Escape') fin(false); };
      inp.onblur = () => fin(true); setTimeout(() => { inp.focus(); inp.select(); }, 0);
    };
    const add = i => {
      const row = document.createElement('div'); row.className = 'fRow'; row.dataset.i = i;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'fItem'; b.innerHTML = i < 0 ? FL_ICON + '<span></span>' : '<span></span>';
      b.lastChild.textContent = i < 0 ? t('floorAll') : floorLabel(i);
      b.onclick = () => { menu.hidden = true; setFloor(i); };
      row.appendChild(b);
      if (i >= 0 && floorsEditable()) {
        const e = document.createElement('button'); e.type = 'button'; e.className = 'fEdit'; e.title = t('floorRename');
        e.innerHTML = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>';
        e.onclick = ev => { ev.stopPropagation(); edit(row, i); };
        row.appendChild(e);
      }
      menu.appendChild(row);
    };
    for (let i = floors.length - 1; i >= 0; i--) add(i);
    add(-1);
    btn.onclick = e => { e.stopPropagation(); menu.hidden = !menu.hidden; };
    bar.appendChild(btn); bar.appendChild(menu);
    updateFloorUI();
  }

  // Hide everything above the chosen floor, and move there if you are walking.
  function setFloor(i) {
    curFloor = i; floorY = null; 
    refreshClip();
    updateFloorUI();
    if (i >= 0 && !overview) {
      const to = camera.position.clone(); to.y = floors[i] + EYE;
      tween = { from:camera.position.clone(), to, t:0 };
    }
  }

