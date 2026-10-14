  // ---- Promo video: a 30-second automatic walk through the building, recorded straight from the view (Studio only) ----
  // Plan: ~4s slow turn around the building from outside, descent to the first scan, a walk through the scan stations, rise back out, closing card with the logo.
  let promo = null;
  const pAng = (a, b, k) => { let d = (b - a) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return a + d * k; };
  const pEase = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
  // The video is remembered per project (in the browser's storage), so it is still there after the Studio is closed and reopened.
  function setPromo(blob, ext) {
    lastPromo = blob ? { blob, ext } : null; refreshPromoSt();
    if (!window.G360_CLIENT && currentName) { try { (blob ? idb.set('promo:' + currentName, { blob, ext }) : idb.del('promo:' + currentName)).catch(() => {}); } catch (err) {} }
  }
  async function restorePromo() {
    if (window.G360_CLIENT || !currentName) return;
    let v = null; try { v = await idb.get('promo:' + currentName); } catch (err) {}
    lastPromo = v && v.blob ? { blob:v.blob, ext:v.ext || 'mp4' } : null; refreshPromoSt();
  }
  function refreshPromoSt() {
    const el = $('pkgPromoSt'); if (!el) return;
    el.textContent = lastPromo ? t('pkgPromoReady', Math.max(1, Math.round(lastPromo.blob.size / 1e6))) : t('pkgPromoNone');
  }
  $('pkgPromoPick').onclick = () => $('pkgPromoFile').click();
  $('pkgPromoFile').onchange = e => {
    const f = e.target.files && e.target.files[0]; e.target.value = '';
    if (!f) return;
    const m = /\.(mp4|webm|mov|m4v)$/i.exec(f.name); setPromo(f, m ? m[1].toLowerCase() : 'mp4');
  };
  // Client: play the video that came in the package.
  // The client's promo button follows the owner's choice: the video that came in the package (default), a live walk through the building, or a video the client makes and downloads.
  function setClientPromo() {
    const pk = window.G360PKG || {}, mode = pk.promoMode, b = $('promoBtn'), sp = b.querySelector('span');
    const can = mode === 'live' || (mode === 'gen' && !!window.MediaRecorder && !!HTMLCanvasElement.prototype.captureStream);
    if (can) {
      b.hidden = false; b.onclick = mode === 'live' ? promoLive : promoAsk;
      sp.dataset.i18n = mode === 'live' ? 'promoLiveBtn' : 'promoGenBtn'; b.dataset.i18nTitle = mode === 'live' ? 'promoLiveTip' : 'promoGenTip';
      sp.textContent = t(sp.dataset.i18n); b.title = t(b.dataset.i18nTitle);
    } else { b.hidden = !pk.promo; b.onclick = promoPlay; }
  }
  function promoPlay() {
    const pk = window.G360PKG; if (!pk || !pk.promo) return;
    const v = $('promoVid'), url = 'model/' + pk.promo;
    if (v.getAttribute('src') !== url) v.src = url;
    $('promoDl').href = url; $('promoDl').download = pk.promo;
    $('promoBox').hidden = false;
    const r = v.play(); if (r && r.catch) r.catch(() => {});
  }
  function promoClose() { const v = $('promoVid'); v.pause(); $('promoBox').hidden = true; }
  $('promoX').onclick = promoClose;
  $('promoBox').addEventListener('mousedown', e => { if (e.target === $('promoBox')) promoClose(); });
  addEventListener('keydown', e => { if (!$('promoBox').hidden && e.code === 'Escape') promoClose(); });
  // Speed profile of one step of the walk: only the first step starts slowly and only the last one stops; the steps in between keep their speed, so the walk flows.
  const pProfile = (first, last) => t => {
    const r = 0.38, a = first ? r : 0, b = last ? r : 0;
    const norm = 1 - a / 2 - b / 2;
    t = Math.max(0, Math.min(1, t));
    let d;   // distance covered, before normalising
    if (t < a) d = t * t / (2 * a);
    else d = (a ? a / 2 : 0) + (t - a);
    if (b && t > 1 - b) { const u = t - (1 - b); d = (a ? a / 2 : 0) + (1 - b - a) + (u - u * u / (2 * b)); }
    return Math.min(1, d / norm);
  };
  // A change of floor in the video: fade to black, switch to the next floor (the floors above it are hidden, as in the viewer), fade back in.
  // Returns true while it is still running.
  function promoFloorJump(p, h) {
    const q = p.jump || (p.jump = { t:0, ph:0 }), wait = panoSrc && panoPref && panoSrc.conv >= 0 && h.b.st !== undefined;
    q.t += p.dt; p.blur = 1;
    if (q.ph === 0) {
      p.fadeBlack = Math.min(1, q.t / 0.4);
      if (q.t >= 0.4) {
        q.ph = 1; q.t = 0;
        setFloor(h.b.fl); tween = null;
        camera.position.copy(h.b.p); yaw = h.dir; pitch = -0.02; camera.rotation.set(pitch, yaw, 0);
        if (wait) panoGoStation(h.b.st, 0.5, { ez:x => x, fs:0.1, fd:0.4, punch:0 });
      }
    } else if (q.ph === 1) {
      p.fadeBlack = 1; camera.position.copy(h.b.p); camera.rotation.set(pitch, yaw, 0);
      if (q.t >= 0.15 && (!wait || (!panoMove && panoOn) || q.t > 5)) { q.ph = 2; q.t = 0; p.lab = { fl:h.b.fl, t0:performance.now() }; }
    } else {
      p.fadeBlack = Math.max(0, 1 - q.t / 0.45); camera.rotation.set(pitch, yaw, 0);
      if (q.t >= 0.45) { p.jump = null; p.fadeBlack = 0; return false; }
    }
    return true;
  }
  // Arriving in a big space: the walk stops and the camera turns slowly to one side to show the space and comes back, always as one gentle, eased movement (no shaking).
  const PLOOK = 5.5;
  function promoLook(p) {
    const q = p.lk || (p.lk = { t:0, y0:yaw, side:(p.lookN = (p.lookN || 0) + 1) % 2 ? 1 : -1 });   // turns to the left, then to the right on the next one
    q.t += p.dt; p.blur = 0.75;
    const u = Math.min(1, q.t / PLOOK), w = Math.sin(Math.PI * pEase(u));
    yaw = q.y0 + q.side * 0.95 * w; pitch = -0.02 + 0.03 * w;
    camera.rotation.set(pitch, yaw, 0);
    if (q.t >= PLOOK) { p.lk = null; yaw = q.y0; return false; }
    return true;
  }
  // A point on the planned walk at a given walking distance (used to look a little ahead, so the view turns smoothly into the bends).
  function promoPathAt(p, sd) {
    const c = p.cum; let i = 0; while (i < p.hops.length - 1 && c[i + 1] < sd) i++;
    const h = p.hops[i], f = h.d > 0 ? Math.max(0, Math.min(1, (sd - c[i]) / h.d)) : 0;
    return new THREE.Vector3().lerpVectors(h.a.p, h.b.p, f);
  }
  let promoAuto = false;
  function promoRoute() {
    promoAuto = false;
    const nF = floors.length, multi = nF > 1;
    const fOf = y => { let k = 0; floors.forEach((f, i) => { if (f <= y - 0.3 * scale) k = i; }); return k; };   // which floor a scan position belongs to
    let pts = [];
    if (panoSrc && panoPref && panoSrc.conv >= 0) pts = panoSrc.stations.map((s, i) => ({ p:s.p.clone(), st:i }));
    else if (pointMode && stationsPC.length) pts = stationsPC.map(p => ({ p:p.clone() }));
    else pts = views.filter(v => !v.room).map(v => ({ p:new THREE.Vector3(v.p[0], v.p[1], v.p[2]) }));
    if (multi) pts.forEach(q => { q.fl = fOf(q.p.y); });
    const flUsed = new Set(pts.map(q => q.fl)).size;   // points that sit on one floor only (the automatic points of a mesh) do not make a walk through all floors
    if ((pts.length < 2 || (multi && flUsed < 2)) && !pointMode) {   // a mesh without stations or saved points (MatterPak): plan a walk through the open floor
      try {
        if (multi) {   // several floors: a separate walk on each floor, in order from the lowest up
          const tr = meshTris(), all = [], per = 45;
          for (let i = 0; i < nF; i++) { const r = autoRoute(tr, scale, per, floors[i]); if (r.length >= 3) r.forEach(a => all.push({ p:new THREE.Vector3(a[0], a[1], a[2]), fl:i, open:a[3] })); }
          if (new Set(all.map(q => q.fl)).size > 1) { promoAuto = true; return all; }
        }
        const r = autoRoute(meshTris(), scale, 45); if (r.length >= 3) { promoAuto = true; return r.map(a => ({ p:new THREE.Vector3(a[0], a[1], a[2]), open:a[3] })); }
      } catch (err) { console.error('route', err); }
    }
    const minD = 2.8 * scale;
    const dedupe = arr => { const keep = []; arr.forEach(q => { const l = keep[keep.length - 1]; if (!l || l.p.distanceTo(q.p) >= minD) keep.push(q); }); return keep; };
    const pick = (arr, n) => { if (arr.length <= n) return arr; const out = []; for (let i = 0; i < n; i++) out.push(arr[Math.round(i * (arr.length - 1) / (n - 1))]); return out; };
    if (multi) {   // each floor gets its own walk (floors with a single position are left out), the floors follow one another from the bottom up
      const groups = []; for (let i = 0; i < nF; i++) { const g = dedupe(pts.filter(q => q.fl === i)); if (g.length >= 2) groups.push(g); }
      if (groups.length > 1) { const per = 10; return [].concat(...groups.map(g => pick(g, per))); }
    }
    return pick(dedupe(pts), 12);
  }
  // How open the space around a scan position is (median distance to the walls, in metres): a big hall or a small room.
  function promoOpen(pos) {
    if (!pointMode || !pcGrid) return 0;
    const oc = clipY; clipY = Infinity;   // nothing is cut off while measuring
    try {
      const ds = [];
      for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8; ray.set(new THREE.Vector3(pos.x, pos.y, pos.z), new THREE.Vector3(Math.cos(a), 0, Math.sin(a))); ray.far = 20 * scale; const h = pcCast(); ds.push(h.length ? h[0].distance : 20 * scale); }
      ds.sort((a, b) => a - b); return ds[8] / scale;
    } catch (err) { return 0; } finally { clipY = oc; }
  }
  // Before recording the Studio asks what goes into the video: the opening title and the logo / closing card can be left out for a clean video.
  let promoOpts = { title:true, logo:true };
  function promoLive() { promoOpts = { title:true, logo:true }; promoStart({ live:true }); }
  function promoAsk() {
    if (promo || !started || !modelBox) return;
    $('promoOptTitleSw').checked = true; $('promoOptLogoSw').checked = true; $('promoOpt').hidden = false;
  }
  $('promoOptGo').onclick = () => { promoOpts = { title:$('promoOptTitleSw').checked, logo:$('promoOptLogoSw').checked }; $('promoOpt').hidden = true; promoStart(); };
  $('promoOptX').onclick = () => { $('promoOpt').hidden = true; };
  addEventListener('keydown', e => { if (e.code === 'Escape' && !$('promoOpt').hidden) { $('promoOpt').hidden = true; e.stopImmediatePropagation(); } }, true);
  function promoStart(opt) {
    const live = !!(opt && opt.live);   // live: the same walk, shown on the screen instead of being recorded
    if (promo || !started || !modelBox) return;
    if (!live && (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream)) { note(t('promoNoRec')); return; }
    if (measuring) toggleMeasure(); if (areaMode) toggleArea();
    const route = promoRoute(), auto = promoAuto;
    const W = live ? 1600 : 1920, H = live ? 900 : 1080, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    const types = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
    const mime = types.find(m => MediaRecorder.isTypeSupported(m)) || '';
    let rec;
    if (live) rec = { start() {}, stop() { const f = this.onstop; if (f) setTimeout(f, 0); } };
    else try { rec = new MediaRecorder(cv.captureStream(30), mime ? { mimeType:mime, videoBitsPerSecond:9000000 } : { videoBitsPerSecond:9000000 }); }
    catch (err) { console.error(err); note(t('promoNoRec')); return; }
    if (live) { const box = document.createElement('div'); box.id = 'promoLive'; box.appendChild(cv); const x = document.createElement('button'); x.id = 'promoLiveX'; x.type = 'button'; x.textContent = '✕'; x.title = 'Esc'; x.onclick = () => { promoEnd(false); say(''); }; box.appendChild(x); document.body.appendChild(box); }
    const chunks = []; rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    // several floors: the walk of each floor is followed by a change of floor (a fade through black); it takes no walking distance
    const hops = route.slice(0, -1).map((r, i) => { const b = route[i + 1], jump = r.fl !== undefined && b.fl !== undefined && r.fl !== b.fl; return { a:r, b, jump, d:jump ? 0 : r.p.distanceTo(b.p) }; });
    const floored = floors.length > 1 && hops.some(h => h.jump), nJ = hops.filter(h => h.jump).length;
    const TD = 30 * Math.max(1, new Set(route.map(r => r.fl)).size);   // 30 seconds of walking for every floor
    // big spaces get a look around: points whose surroundings are open, at most two on a floor and at least 8 m apart
    const cd = [0]; hops.forEach(h => cd.push(cd[cd.length - 1] + h.d));
    route.forEach((r, k) => { if (r.open === undefined && k < route.length - 1) r.open = promoOpen(r.p); });
    const thr = auto ? 2.3 : 3.4, chosen = [];
    route.map((r, k) => ({ r, k })).filter(x => x.k < route.length - 1 && (x.r.open || 0) >= thr).sort((a, b) => b.r.open - a.r.open).forEach(x => {
      if (chosen.filter(c => c.r.fl === x.r.fl).length >= 2) return;
      if (chosen.some(c => c.r.fl === x.r.fl && Math.abs(cd[c.k] - cd[x.k]) < 8 * scale)) return;
      chosen.push(x); x.r.look = true;
    });
    const nL = chosen.length;
    let L = 0; hops.forEach(h => { L += h.d; });
    hops.forEach((h, i) => {
      h.dur = Math.max(auto ? 0.15 : 1.6, Math.min(8, TD * h.d / Math.max(L, 1e-6)));
      let j = Math.min(route.length - 1, i + 4); while (j > i + 1 && route[j].fl !== route[i].fl) j--;   // the look-ahead stays on the same floor
      const tg = auto && !h.jump ? route[j].p : h.b.p;   // a walk planned over a grid looks a little ahead, so the view turns smoothly
      h.dir = Math.atan2(-(tg.x - h.a.p.x), -(tg.z - h.a.p.z));
    });
    hops.forEach((h, i) => { if (h.jump) { const n = hops.slice(i + 1).find(x => !x.jump), pv = i > 0 ? hops[i - 1] : null; h.dir = n ? n.dir : (pv ? pv.dir : 0); } });   // after a change of floor the view already faces the way the walk goes on
    const orbitOnly = route.length < 2;   // no scan stations or saved viewpoints: the whole video is a slow turn around the building
    promo = { live, floored, TD, est:TD + 14 + 1.1 * nJ + PLOOK * nL, floor0:curFloor, lab:null, jump:null, dt:0, auto, panoWalk:!!(panoSrc && panoPref && panoSrc.conv >= 0 && route[0] && route[0].st !== undefined), orbitOnly, rec, mime, chunks, cv, g, route, hops, hi:0, ph:0, t:0, last:performance.now(), start:performance.now(), hopT:0, hopOn:false, hopFrom:null, cancel:false, W, H, fadeBlack:1, card:0, wait:0, lastSay:0 };
    promo.opts = Object.assign({}, promoOpts);
    // the first frames: show the building from outside
    if (floored) { setFloor(-1); tween = null; }   // the whole building is shown while turning around it
    enterDollhouse(); tween = null; say('');
    promo.az0 = orb.az; promo.el0 = orb.el; promo.d0 = orb.dist;
    rec.start(250);
    document.body.classList.add('promoRec');
  }
  function promoEnd(ok) {
    const p = promo; if (!p) return; promo = null;
    document.body.classList.remove('promoRec');
    const lv = $('promoLive'); if (lv) lv.remove();
    p.rec.onstop = () => {
      if (p.live) return;   // the live walk leaves nothing behind
      if (!ok || !p.chunks.length) { note(t('promoCancel')); return; }
      const blob = new Blob(p.chunks, { type:p.mime || 'video/webm' }), ext = /mp4/.test(p.mime) ? 'mp4' : 'webm';
      const a = document.createElement('a'), d = new Date(), p2 = n => String(n).padStart(2, '0');
      a.href = URL.createObjectURL(blob);
      a.download = 'Gambit360-promo-' + (currentName || 'tour').replace(/[\\/:*?"<>|]+/g, '_') + '-' + d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + '-' + p2(d.getHours()) + p2(d.getMinutes()) + '.' + ext;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 8000);
      setPromo(blob, ext);
      note(t('promoDone', ext.toUpperCase()));
    };
    try { p.rec.stop(); } catch (err) {}
    if (!overview) { enterDollhouse(); } else if (!dollhouse) enterDollhouse();
    if (p.floored) { try { setFloor(p.floor0); } catch (err) {} tween = null; }   // the floor that was selected before the video
  }
  // Called every frame while recording, after the normal view logic and before the picture is drawn.
  function promoStep() {
    try { promoStep2(); } catch (err) { console.error('promo', err); say(''); if (promo) promoEnd(false); }
  }
  function promoStep2() {   // real time (not frame count), so the video is about 30 seconds long even on a slow computer; it is just less smooth
    const p = promo, now = performance.now(), dt = Math.min(2, (now - p.last) / 1000); p.last = now; p.t += dt; p.dt = dt;
    tween = null; look.on = false; p.blur = 1;
    const setPose = (pos, y, pi) => { camera.position.copy(pos); yaw = y; pitch = pi; camera.rotation.set(pi, y, 0); };
    const orbPose = (az, el, dist) => { orb.az = az; orb.el = el; orb.dist = dist; orbGoal.az = az; orbGoal.el = el; orbGoal.dist = dist; return orbPos(); };
    const T0 = p.orbitOnly ? 26 : 4, T1 = 2.5, T3 = 4, T4 = 3;
    if (p.ph === 0) {   // turn around the building
      const u = Math.min(1, p.t / T0);
      if (p.orbitOnly) {
        setPose(orbPose(p.az0 + 5.2 * pEase(u), p.el0 - 0.16 * Math.sin(Math.PI * u) + 0.05 * u, p.d0 * (1 - 0.22 * Math.sin(Math.PI * Math.min(1, u * 1.1)))), orb.az, -orb.el);
        p.card = Math.max(0, (p.t - (T0 - 0.9)) / 0.9);
      } else setPose(orbPose(p.az0 + 1.1 * pEase(u), p.el0 - 0.12 * pEase(u), p.d0 * (1 - 0.14 * pEase(u))), orb.az, -orb.el);
      p.fadeBlack = Math.max(0, 1 - p.t / 0.8);
      if (p.orbitOnly && p.t >= T0) { p.ph = 4; p.t = 0; }
      else if (p.t >= T0) { p.ph = 1; p.t = 0; p.from = { pos:camera.position.clone(), y:yaw, pi:pitch }; }
    } else if (p.ph === 1) {   // descend to the first station
      const u = pEase(p.t / T1), h = p.hops[0], to = p.route[0].p;
      const y1 = h ? h.dir : yaw;
      setPose(new THREE.Vector3().lerpVectors(p.from.pos, to, u), pAng(p.from.y, y1, u), p.from.pi * (1 - u) - 0.02 * u);
      if (p.t >= T1) {
        exitOverview(); p.ph = 15; p.t = 0;
        if (p.floored) { setFloor(p.route[0].fl); tween = null; p.lab = { fl:p.route[0].fl, t0:performance.now() }; }
        camera.position.copy(to);
        if (p.route[0].st !== undefined && panoSrc && panoPref) panoPre(p.route[0].st);
      }
    } else if (p.ph === 15) {   // wait for the first panorama (if there is one), at most 7 seconds
      camera.position.copy(p.route[0].p); camera.rotation.set(-0.02, yaw, 0);
      const waitPano = panoSrc && panoPref && panoSrc.conv >= 0 && p.route[0].st !== undefined;
      if (!waitPano || (panoOn && !panoMove) || p.t > 7) { p.ph = 2; p.t = 0; p.hi = 0; p.hopOn = false; if (p.floored && !p.lab) p.lab = { fl:p.route[0].fl, t0:performance.now() }; }
    } else if (p.ph === 2 && !p.panoWalk) {   // walk through the point cloud / mesh: position follows the clock along the whole route, so a slow computer drops frames instead of falling behind
      if (!p.cum) { p.cum = [0]; p.hops.forEach(h => p.cum.push(p.cum[p.cum.length - 1] + h.d)); p.walkT = 0; p.prof = pProfile(true, true); p.ev = []; p.hops.forEach((h, i) => { if (h.jump) p.ev.push({ k:'j', i, s:p.cum[i], o:2 * i + 1 }); }); p.route.forEach((r, i) => { if (r.look && i < p.hops.length) p.ev.push({ k:'l', i, s:p.cum[i], o:2 * i }); }); p.ev.sort((a, b) => a.s - b.s || a.o - b.o); p.en = 0; }
      const ev = p.ev[p.en];
      if (ev && (p.jump || p.lk || p.prof(Math.min(1, (p.walkT + dt) / p.TD)) * p.cum[p.cum.length - 1] >= ev.s)) {   // the walk reached the end of a floor or a big space
        if (ev.k === 'j') { if (!promoFloorJump(p, p.hops[ev.i])) p.en++; p.hi = ev.i; }
        else if (!promoLook(p)) p.en++;
      } else {
      p.walkT += dt;
      const u = Math.min(1, p.walkT / p.TD), s = p.prof(u) * p.cum[p.cum.length - 1];
      let i = 0; while (i < p.hops.length - 1 && p.cum[i + 1] < s) i++;
      const h = p.hops[i];
      if (!h) { p.ph = 3; p.t = 0; }
      else {
        const f = h.d > 0 ? Math.max(0, Math.min(1, (s - p.cum[i]) / h.d)) : 0, y0 = yaw;
        let sT = Math.min(p.cum[p.cum.length - 1], s + 2.8 * scale);   // the view looks a few metres ahead along the walk (not across a change of floor)
        const nj = p.hops.findIndex((x, k) => x.jump && p.cum[k] >= s - 1e-6); if (nj >= 0) sT = Math.min(sT, p.cum[nj]);
        const tg = promoPathAt(p, sT), dx = tg.x - camera.position.x, dz = tg.z - camera.position.z;
        yaw = pAng(yaw, Math.hypot(dx, dz) > 0.25 * scale ? Math.atan2(-dx, -dz) : yaw, 1 - Math.exp(-dt * 1.3)); pitch += (-0.02 - pitch) * (1 - Math.exp(-dt * 2));
        const rate = dt > 0 ? pAng(0, yaw - y0, 1) / dt : 0;
        p.roll = (p.roll || 0) + (Math.max(-0.02, Math.min(0.02, -rate * 0.08)) - (p.roll || 0)) * (1 - Math.exp(-dt * 4));
        camera.position.lerpVectors(h.a.p, h.b.p, f); camera.position.y += 0.004 * scale * Math.sin(p.walkT * 5.2);   // only a very gentle step
        camera.rotation.set(pitch, yaw, p.roll); p.blur = 0.7; p.hi = i;
        if (u >= 1) { p.ph = 3; p.t = 0; }
      }
      }
    } else if (p.ph === 2) {   // walk (panorama steps)
      const h = p.hops[p.hi];
      if (!h) { p.ph = 3; p.t = 0; }
      else if (h.jump) { if (!promoFloorJump(p, h)) { p.hi++; p.hopOn = false; } }
      else if (!p.hopOn && h.a.look && !h.a.lookDone) { if (!promoLook(p)) h.a.lookDone = true; }   // a big space: look around first
      else {
        const usePano = panoSrc && panoPref && panoSrc.conv >= 0 && h.b.st !== undefined && panoOn;
        if (!p.hopOn) {
          const prof = pProfile(p.hi === 0, p.hi === p.hops.length - 1);
          h.prof = prof;
          if (usePano) { if (!panoMove) { panoGoStation(h.b.st, h.dur, { ez:prof, fs:0.18, fd:h.dur * 0.62, punch:7 }); p.hopOn = true; p.t = 0; p.prevYaw = yaw; } }
          else { p.hopOn = true; p.t = 0; p.hopFrom = camera.position.clone(); p.prevYaw = yaw; }
          const nx = p.hops[p.hi + 1]; if (usePano && nx && nx.b.st !== undefined) panoPre(nx.b.st);
        }
        if (p.hopOn) {
          const y0 = yaw;
          yaw = pAng(yaw, h.dir, 1 - Math.exp(-dt * 1.1)); pitch += (-0.02 - pitch) * (1 - Math.exp(-dt * 2));
          const rate = dt > 0 ? pAng(0, yaw - y0, 1) / dt : 0;   // how fast the view is turning
          p.roll = (p.roll || 0) + (Math.max(-0.02, Math.min(0.02, -rate * 0.08)) - (p.roll || 0)) * (1 - Math.exp(-dt * 4));
          const u = Math.max(0, Math.min(1, p.t / h.dur)), spd = p.auto ? 1 : Math.sin(Math.PI * Math.min(1, u * 0.9 + 0.05));
          const bob = 0, sway = 0;
          p.blur = 0.7;
          if (usePano) { camera.rotation.set(pitch + bob, yaw + sway, p.roll); if (!panoMove && p.t > 0.3) { p.hi++; p.hopOn = false; } }
          else {
            camera.position.lerpVectors(p.hopFrom, h.b.p, h.prof(p.t / h.dur)); camera.rotation.set(pitch + bob, yaw + sway, p.roll);
            camera.position.y += 0.004 * scale * Math.sin(p.t * 5.2) * spd;
            if (!p.auto) { camera.fov = 75 + 5 * Math.sin(Math.PI * Math.min(1, p.t / h.dur)); camera.updateProjectionMatrix(); }
            if (p.t >= h.dur) { camera.position.copy(h.b.p); p.hi++; p.hopOn = false; if (!p.auto) { camera.fov = 75; camera.updateProjectionMatrix(); } }
          }
        } else { camera.rotation.set(pitch, yaw, 0); p.blur = 1; }
      }
    } else if (p.ph === 3) {   // back out
      if (!p.up) {
        if (p.floored) { setFloor(-1); tween = null; }   // the whole building again for the way out
        enterDollhouse(); tween = null;
        p.up = { from:{ pos:camera.position.clone(), y:yaw, pi:pitch }, pos:orbPos(), y:orb.az, pi:-orb.el };
      }
      const u = pEase(p.t / T3);
      setPose(new THREE.Vector3().lerpVectors(p.up.from.pos, p.up.pos, u), pAng(p.up.from.y, p.up.y, u), p.up.from.pi + (p.up.pi - p.up.from.pi) * u);
      p.card = Math.max(0, (p.t - (T3 - 0.9)) / 0.9);
      if (p.t >= T3) { p.ph = 4; p.t = 0; }
    } else {   // closing card
      p.card = 1;
      if (p.t >= (p.opts && !p.opts.logo ? 0.3 : T4)) { promoEnd(true); return; }   // no closing card to show: the video ends at once
    }
  }
  function promoFrame() {
    const p = promo; if (!p) return;
    const { g, W, H } = p, src = renderer.domElement;
    // the 3D view, cropped to 16:9
    const sw = src.width, sh = src.height, ar = W / H;
    let cw = sw, ch = sw / ar; if (ch > sh) { ch = sh; cw = sh * ar; }
    if (p.blur < 1 && p.started) { g.globalAlpha = p.blur; } else { g.fillStyle = '#14181b'; g.fillRect(0, 0, W, H); }   // while moving, each picture is laid over the previous one: a soft motion trail
    g.drawImage(src, (sw - cw) / 2, (sh - ch) / 2, cw, ch, 0, 0, W, H);
    g.globalAlpha = 1; p.started = true;
    const o = p.opts || { title:true, logo:true }, title = (window.PROJ_TITLE || currentName || '').toString();
    if (o.title && p.ph <= 1 && p.t < 3.6 && p.ph === 0 && title) {   // opening title
      const a = Math.min(1, p.t / 0.8, (3.6 - p.t) / 0.6);
      g.save(); g.globalAlpha = Math.max(0, a); g.textAlign = 'center'; g.fillStyle = '#fff'; g.shadowColor = 'rgba(0,0,0,.75)'; g.shadowBlur = 24;
      g.font = '600 64px sans-serif'; g.fillText(title, W / 2, H - 110); g.restore();
    }
    if (p.floored && p.lab && p.ph >= 2 && p.ph <= 3) {   // name of the floor, bottom right, fades in and out at every change of floor
      const a = (performance.now() - p.lab.t0) / 1000, al = Math.min(1, a / 0.5, (3 - a) / 0.6);
      if (a > 3) p.lab = null;
      else if (al > 0) {
        const txt = floorLabel(p.lab.fl); g.save(); g.globalAlpha = al; g.font = '600 40px sans-serif'; g.textAlign = 'right';
        const tw = g.measureText(txt).width + 56, m = 36, hh = 66;
        g.fillStyle = 'rgba(15,19,22,.62)'; g.beginPath();
        if (g.roundRect) g.roundRect(W - m - tw, H - m - hh, tw, hh, 33); else g.rect(W - m - tw, H - m - hh, tw, hh);
        g.fill(); g.fillStyle = '#fff'; g.fillText(txt, W - m - 28, H - m - 20); g.restore();
      }
    }
    if (p.fadeBlack > 0) { g.fillStyle = 'rgba(0,0,0,' + p.fadeBlack + ')'; g.fillRect(0, 0, W, H); }
    const img = document.querySelector('#logo img');
    if (o.logo && p.card > 0) {
      g.fillStyle = 'rgba(15,19,22,' + Math.min(1, p.card) + ')'; g.fillRect(0, 0, W, H);
      g.save(); g.globalAlpha = Math.min(1, p.card); g.textAlign = 'center';
      if (img && img.naturalWidth) {
        const lw = Math.min(560 * logoK(), W * 0.8, H * 0.34 * img.naturalWidth / img.naturalHeight), lh = lw * img.naturalHeight / img.naturalWidth, pad = 26;
        g.fillStyle = '#fff'; g.beginPath();
        if (g.roundRect) g.roundRect(W / 2 - lw / 2 - pad, H / 2 - lh - pad - 40, lw + 2 * pad, lh + 2 * pad, 18); else g.rect(W / 2 - lw / 2 - pad, H / 2 - lh - pad - 40, lw + 2 * pad, lh + 2 * pad);
        g.fill(); g.drawImage(img, W / 2 - lw / 2, H / 2 - lh - 40, lw, lh);
      }
      g.fillStyle = '#fff'; g.font = '600 54px sans-serif'; if (title) g.fillText(title, W / 2, H / 2 + 80);
      if (!customLogo) { g.fillStyle = '#5ec4b6'; g.font = '500 40px sans-serif'; g.fillText('gambit360.co.il', W / 2, H / 2 + 150); }
      g.restore();
    } else if (o.logo && img && img.naturalWidth && p.ph >= 1) {   // small logo in the corner while walking
      const lw = Math.min(230 * logoK(), W * 0.5, H * 0.16 * img.naturalWidth / img.naturalHeight), lh = lw * img.naturalHeight / img.naturalWidth, pad = 10, m = 36;
      g.save(); g.globalAlpha = .92; g.fillStyle = '#fff'; g.beginPath();
      if (g.roundRect) g.roundRect(m, H - m - lh - 2 * pad, lw + 2 * pad, lh + 2 * pad, 10); else g.rect(m, H - m - lh - 2 * pad, lw + 2 * pad, lh + 2 * pad);
      g.fill(); g.drawImage(img, m + pad, H - m - lh - pad, lw, lh); g.restore();
    }
    const el = (performance.now() - p.start) / 1000;
    if (!p.live && el - p.lastSay > 0.5) { p.lastSay = el; say(t('promoRec', Math.min(99, Math.round(el / (p.est || 30) * 100)))); }
  }
  // Warm up a station's pictures so the next step of the walk starts at once.
  function panoPre(k) { try { panoTextures(k).catch(() => {}); } catch (err) {} }
  addEventListener('keydown', e => { if (promo && e.code === 'Escape') { promoEnd(false); say(''); } });

