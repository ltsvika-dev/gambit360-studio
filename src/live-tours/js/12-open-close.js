  // ---- open / close ----
  async function open() {
    // every Studio menu and panel closes first (the colour palette included), so nothing stays on top of the tours screen
    ['optMenu', 'colorPanel', 'planPanel', 'pkgPanel', 'mpPanel', 'viewsPanel', 'help', 'hint', 'floorMenu'].forEach(id => { const e = $(id); if (e) e.hidden = true; });
    try { const ae = document.activeElement; if (ae && ae !== document.body && ae.blur) ae.blur(); } catch (e) {}
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
    await load(); await cloudBoot(); texts();
    if (!tours.length) msg(L('rsHint'));
    if (cur) cur = tours.find(t => t.id === cur.id) || null;
    if (!cur && tours.length) cur = tours[0];
    modLook(true); $('live').hidden = false; renderList(); renderEdit(); preview(true); bkDismiss = false; checkBk();
    if (settings.upKey) bkSrvAuto();   // what changed on another computer comes in
  }
  // the module keeps its own language (settings.mLang); closing it brings back the Studio's. The colour is the Studio's own (the same as in the point-cloud bar)
  const accVars = hex => { const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16), st = document.documentElement.style; st.setProperty('--accent', hex); st.setProperty('--on-accent', (.299 * r + .587 * g + .114 * b) / 255 > .55 ? '#0b1412' : '#ffffff'); };
  const studioLang = () => { let l = 'he'; try { l = localStorage.getItem('tourViewerLang') || 'he'; } catch (e) {} return l === 'en' ? 'en' : 'he'; };
  const studioAcc = () => { let a = ''; try { a = localStorage.getItem('tourViewerAccent') || ''; } catch (e) {} return /^#[0-9a-f]{6}$/i.test(a) ? a.toLowerCase() : '#5ec4b6'; };
  function modLook(on) {
    const lg = on && /^(he|en)$/.test(settings.mLang || '') ? settings.mLang : studioLang(), ac = studioAcc();   // one colour for the whole Studio: the point-cloud bar and this one change the same colour
    accVars(ac); $('lvAcc').firstChild.value = ac; $('lvAcc').style.setProperty('--sw', ac);
    if (typeof LANG !== 'undefined' && LANG !== lg) applyLang(lg, false);   // re-labels the module too (G360_relang below)
    $('lvLang').textContent = lg === 'he' ? 'EN' : '\u05e2\u05d1'; $('lvLang').title = L('mLang'); $('lvAcc').title = L('mAcc');
  }
  $('lvLang').onclick = () => { settings.mLang = (document.documentElement.lang || 'he') === 'en' ? 'he' : 'en'; saveSet(); modLook(true); };
  const setAcc = hex => { if (settings.mAcc) { settings.mAcc = ''; saveSet(); } if (window.G360_setUiAccent) window.G360_setUiAccent(hex); else { try { localStorage.setItem('tourViewerAccent', hex); } catch (e) {} } modLook(true); };
  $('lvAcc').firstChild.oninput = e => setAcc(e.target.value.toLowerCase());
  function close() { if (settings.upKey) bkSrvAuto(); stopPrev(); modLook(false); $('live').hidden = true; $('lvSet').hidden = true; $('lvDlg').hidden = true; const fr = $('lvFrame'); fr.src = 'about:blank'; lastSrc = ''; }
  $('lvClose').onclick = close;
  $('lvSetBtn').onclick = openSet;
  $('lvStats').onclick = () => openStats(cur);
  const colTog = k => { settings.ui = settings.ui || {}; settings.ui[k] = !settings.ui[k]; saveSet(); colUI(); };
  $('lvColEdit').onclick = () => PHONE.matches ? phShow('edit') : colTog('noEdit'); $('lvColList').onclick = () => PHONE.matches ? phShow('list') : colTog('noList');
  $('lvTopIco').onchange = () => { settings.topIco = $('lvTopIco').checked; saveSet(); topBtns(); };
  $('lvPubAll').onclick = () => publish(tours.slice());
  // while the screen is open the Studio's keyboard shortcuts stay off (typing still works); Esc closes the settings box, then the screen
  addEventListener('keydown', e => {
    if ($('live').hidden) {   // the Options screen opened from the point-cloud module: Esc closes it, and typing in it does not reach the viewer
      if ($('lvSet').hidden) return;
      if (e.key === 'Escape' && $('g360Ask') && !$('g360Ask').hidden) return;
      if (e.key === 'Escape') $('lvSet').hidden = true;
      e.stopImmediatePropagation(); return;
    }
    if (e.key === 'Escape') { if (!$('lvDlg').hidden) $('lvDlg').hidden = true; else if (!$('lvSet').hidden) $('lvSet').hidden = true; else close(); }
    e.stopImmediatePropagation();
  }, true);

  // entry points: the start screen and the Options menu
  const startBox = $('projOpenStart');
  if (startBox) { const b = document.createElement('button'); b.type = 'button'; b.id = 'liveStartBtn'; b.className = 'resume'; b.onclick = open; startBox.insertAdjacentElement('afterend', b); }
  const menu = $('optMenu');
  if (menu) { const b = document.createElement('button'); b.type = 'button'; b.id = 'liveMenuBtn'; b.className = 'ib'; b.innerHTML = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg><span></span>'; b.onclick = open; const pk = $('pkgTopBtn'); if (pk && pk.parentNode === menu) pk.insertAdjacentElement('afterend', b); else menu.insertBefore(b, menu.firstChild);
    // the Options screen (my logo, cloud, server) opens from the point-cloud module too, without opening the tours screen
    const s = document.createElement('button'); s.type = 'button'; s.id = 'liveSetMenuBtn'; s.className = 'ib'; s.innerHTML = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"/><path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.5A7.5 7.5 0 0 0 7 6.5l-2.4-1-2 3.4 2 1.6a7.6 7.6 0 0 0 0 3l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 0 0 2.6 1.5l.4 2.5h4l.4-2.5a7.5 7.5 0 0 0 2.6-1.5l2.4 1 2-3.4z"/></svg><span></span>'; s.onclick = openSetHere; b.insertAdjacentElement('afterend', s); }
  async function openSetHere() {
    ['optMenu', 'colorPanel', 'planPanel'].forEach(id => { const e = $(id); if (e) e.hidden = true; });
    if ($('live').hidden) { try { const st = await db.kget('settings'); if (st) Object.assign(settings, st); } catch (e) {} }
    await openSet();
  }
  window.G360_openSet = openSetHere;
  // When the Studio opens on a computer connected to the cloud, the server is checked at once (not only when the tours screen opens):
  // an older upload.php replaces itself, and a newer Studio goes online by itself.
  if (!HOSTED && !window.G360_CLIENT) setTimeout(async () => { try { if ($('live').hidden) { const st = await db.kget('settings'); if (st) Object.assign(settings, st); } if (settings.upKey && settings.base) await srvCheck(false); } catch (e) {} }, 4000);
  texts();
  const prevRelang = window.G360_relang;
  window.G360_relang = function () { if (prevRelang) prevRelang.apply(this, arguments); texts(); if (!$('live').hidden) { renderList(); renderEdit(); preview(); } };
  window.G360_openLive = open;
})();
