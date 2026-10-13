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
  // the module keeps its own language and colour (settings.mLang / mAcc); closing it brings back the Studio's
  const accVars = hex => { const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16), st = document.documentElement.style; st.setProperty('--accent', hex); st.setProperty('--on-accent', (.299 * r + .587 * g + .114 * b) / 255 > .55 ? '#0b1412' : '#ffffff'); };
  const studioLang = () => { let l = 'he'; try { l = localStorage.getItem('tourViewerLang') || 'he'; } catch (e) {} return l === 'en' ? 'en' : 'he'; };
  const studioAcc = () => { let a = ''; try { a = localStorage.getItem('tourViewerAccent') || ''; } catch (e) {} return /^#[0-9a-f]{6}$/i.test(a) ? a.toLowerCase() : '#5ec4b6'; };
  function modLook(on) {
    const lg = on && /^(he|en)$/.test(settings.mLang || '') ? settings.mLang : studioLang(), ac = on && /^#[0-9a-f]{6}$/i.test(settings.mAcc || '') ? settings.mAcc : studioAcc();
    accVars(ac); $('lvAcc').firstChild.value = ac; $('lvAcc').style.setProperty('--sw', ac);
    if (typeof LANG !== 'undefined' && LANG !== lg) applyLang(lg, false);   // re-labels the module too (G360_relang below)
    $('lvLang').textContent = lg === 'he' ? 'EN' : '\u05e2\u05d1'; $('lvLang').title = L('mLang'); $('lvAcc').title = L('mAcc');
  }
  $('lvLang').onclick = () => { settings.mLang = (document.documentElement.lang || 'he') === 'en' ? 'he' : 'en'; saveSet(); modLook(true); };
  $('lvAcc').firstChild.oninput = e => { settings.mAcc = e.target.value.toLowerCase(); saveSet(); modLook(true); };
  $('lvAcc').oncontextmenu = e => { e.preventDefault(); settings.mAcc = ''; saveSet(); modLook(true); };
  function close() { if (settings.upKey) bkSrvAuto(); stopPrev(); modLook(false); $('live').hidden = true; $('lvSet').hidden = true; $('lvDlg').hidden = true; const fr = $('lvFrame'); fr.src = 'about:blank'; lastSrc = ''; }
  $('lvClose').onclick = close;
  $('lvSetBtn').onclick = openSet;
  $('lvStats').onclick = () => openStats(cur);
  const colTog = k => { settings.ui = settings.ui || {}; settings.ui[k] = !settings.ui[k]; saveSet(); colUI(); };
  $('lvColEdit').onclick = () => colTog('noEdit'); $('lvColList').onclick = () => colTog('noList');
  $('lvTopIco').onchange = () => { settings.topIco = $('lvTopIco').checked; saveSet(); topBtns(); };
  $('lvPubAll').onclick = () => publish(tours.slice());
  // while the screen is open the Studio's keyboard shortcuts stay off (typing still works); Esc closes the settings box, then the screen
  addEventListener('keydown', e => {
    if ($('live').hidden) return;
    if (e.key === 'Escape') { if (!$('lvDlg').hidden) $('lvDlg').hidden = true; else if (!$('lvSet').hidden) $('lvSet').hidden = true; else close(); }
    e.stopImmediatePropagation();
  }, true);

  // entry points: the start screen and the Options menu
  const startBox = $('projOpenStart');
  if (startBox) { const b = document.createElement('button'); b.type = 'button'; b.id = 'liveStartBtn'; b.className = 'resume'; b.onclick = open; startBox.insertAdjacentElement('afterend', b); }
  const menu = $('optMenu');
  if (menu) { const b = document.createElement('button'); b.type = 'button'; b.id = 'liveMenuBtn'; b.className = 'ib'; b.innerHTML = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg><span></span>'; b.onclick = open; const pk = $('pkgTopBtn'); if (pk && pk.parentNode === menu) pk.insertAdjacentElement('afterend', b); else menu.insertBefore(b, menu.firstChild); }
  texts();
  const prevRelang = window.G360_relang;
  window.G360_relang = function () { if (prevRelang) prevRelang.apply(this, arguments); texts(); if (!$('live').hidden) { renderList(); renderEdit(); preview(); } };
  window.G360_openLive = open;
})();
