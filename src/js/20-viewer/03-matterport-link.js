  // ---- Link to the original Matterport tour (kept per file name) ----
  const mpKey = () => 'tourViewerLink:' + currentName;
  const getLink = () => { try { return localStorage.getItem(mpKey()) || ''; } catch (err) { return ''; } };
  const mpMsg = k => { $('mpMsg').textContent = k ? t(k) : ''; };
  function syncMpUI() {
    const link = getLink();
    $('pkgRow').hidden = !((lastObjFiles || lastE57) && !fromPkg && !window.G360_CLIENT);
    $('pkgPanoRow').hidden = !(lastE57 && lastE57.d.pano);
    $('pkgSwapBtn').hidden = $('pkgSwapObjBtn').hidden = $('pkgRow').hidden;
    $('projSave').hidden = $('pkgRow').hidden; $('projOpen').hidden = !!window.G360_CLIENT || fromPkg;
    $('pkgTopBtn').hidden = $('pkgRow').hidden; $('pdfBtn').hidden = $('pkgRow').hidden;  if ($('pkgRow').hidden) { $('pkgPanel').hidden = true; $('planPanel').hidden = true; }
    if (!$('pkgRow').hidden && typeof refreshSrc === 'function') refreshSrc();
    { let v = ''; try { v = localStorage.getItem('tourViewerTitle:' + currentName) || ''; } catch (err) {} let m = ''; try { m = localStorage.getItem('tourViewerMgr:' + currentName) || ''; } catch (err) {} if (!$('pkgName').value || $('pkgName').dataset.for !== currentName) { $('pkgName').value = v || currentName; $('pkgMgr').value = m; $('pkgName').dataset.for = currentName; if (window.G360_loadPkgOpt) window.G360_loadPkgOpt();
        try { const e = JSON.parse(localStorage.getItem('tourViewerExp:' + currentName) || 'null') || {}; $('pkgStart').value = e.start || ymd(new Date()); $('pkgDur').value = e.dur || ''; $('pkgUnit').value = e.unit || 'm'; } catch (err) {}
        refreshExpiry(); if (v && !fromPkg) setProjectTitle(v, m); } }
    $('mpBtn').hidden = !link; $('pkgMpRow').hidden = !link;
    if (document.activeElement !== $('pkgMpLink')) $('pkgMpLink').value = link;
    // client package: no editing, no model choice, just the link and who to call
    ['mpInput', 'mpHintP', 'mpRow'].forEach(id => { $(id).hidden = fromPkg; });
    $('contactBox').hidden = !fromPkg; $('mpMsg').hidden = fromPkg;
    if (fromPkg) $('homeBtn').hidden = true; $('mpBtn').classList.toggle('on', !!link);
    $('mpInput').value = link; $('mpOpen').disabled = !link; mpMsg('');
  }
  $('pkgTopBtn').onclick = () => { $('planPanel').hidden = true; $('colorPanel').hidden = true; $('viewsPanel').hidden = true; $('mpPanel').hidden = true; $('pkgPanel').hidden = !$('pkgPanel').hidden; alignTopPanels(); };
  $('mpBtn').onclick = () => { $('planPanel').hidden = true; $('colorPanel').hidden = true; $('viewsPanel').hidden = true; $('pkgPanel').hidden = true; $('mpPanel').hidden = true; alignTopPanels(); if (getLink()) openTour(); };   // the link is set in the package panel; this button only starts the tour
  const saveMpLink = () => {   // the Matterport link is typed in the package panel
    const v = $('pkgMpLink').value.trim(), bad = !!v && !/^https?:\/\//i.test(v);
    $('pkgMpLink').style.borderColor = bad ? '#d9534f' : '';
    if (bad) return;
    try { if (v) localStorage.setItem(mpKey(), v); else localStorage.removeItem(mpKey()); } catch (err) {}
    syncMpUI();
  };
  $('pkgMpLink').addEventListener('input', saveMpLink);
  $('pkgMpLink').addEventListener('keydown', e => e.stopPropagation());
  $('mpSave').onclick = () => {
    const v = $('mpInput').value.trim();
    if (v && !/^https?:\/\//i.test(v)) { mpMsg('mpBad'); return; }
    try { if (v) localStorage.setItem(mpKey(), v); else localStorage.removeItem(mpKey()); } catch (err) {}
    syncMpUI(); mpMsg(v ? 'mpSaved' : 'mpRemoved');
  };
  $('mpRemove').onclick = () => { $('mpInput').value = ''; $('mpSave').click(); };
  // The Matterport tour opens in a full-screen layer inside the app (embed), with the contact line always visible.
  let tourOpen = false;
  function embedUrl(u) {
    try {
      const x = new URL(u);
      const m = x.pathname.match(/\/(?:discover\/)?space\/([A-Za-z0-9]+)/);
      if (/matterport\.com$/i.test(x.hostname) && m && !x.searchParams.get('m')) return 'https://my.matterport.com/show/?m=' + m[1];
    } catch (err) {}
    return u;
  }
  // A client whose storage period has ended gets a notice instead of the Matterport tour (it can be closed; the local tour keeps working).
  function storageEnded() {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(window.G360_EXPIRES || '');
    return !!window.G360_CLIENT && !!m && (new Date(+m[1], +m[2] - 1, +m[3] + 1) - new Date()) <= 0;
  }
  function showExpired() {
    if (document.pointerLockElement) { try { document.exitPointerLock(); } catch (err) {} }
    const lg = document.querySelector('#logo img'); if (lg && lg.src) { $('expLogo').src = lg.src; $('expLogo').hidden = false; }
    $('mpPanel').hidden = true; $('expiredBox').hidden = false;
  }
  $('expClose').onclick = () => { $('expiredBox').hidden = true; };
  $('expiredBox').addEventListener('click', e => { if (e.target === $('expiredBox')) $('expiredBox').hidden = true; });
  function openTour() {
    if (storageEnded()) { showExpired(); return; }
    const v = getLink(); if (!v) return;
    $('mpPanel').hidden = true;
    $('tourFrame').src = embedUrl(v); $('tourNew').href = v;
    fillTourMsg(); clearTimeout(tourNoteT); $('tourFoot').classList.remove('fade'); $('tourFoot').hidden = false; $('tourOv').hidden = false; tourOpen = true;
    tourNoteT = setTimeout(() => { $('tourFoot').classList.add('fade'); tourNoteT = setTimeout(() => { $('tourFoot').hidden = true; $('tourFoot').classList.remove('fade'); }, 700); }, 8000);   // the renewal note goes away by itself after 8 seconds
  }
  let tourNoteT = 0;
  function closeTour() { $('tourOv').hidden = true; $('tourFrame').src = 'about:blank'; tourOpen = false; }
  $('tourClose').onclick = closeTour;
  // Share / copy the address of the Matterport tour (the original link, not the embed address)
  const copyText = async str => {
    try { await navigator.clipboard.writeText(str); return true; } catch (err) {}
    try { const ta = document.createElement('textarea'); ta.value = str; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok; } catch (err) { return false; }
  };
  const flashBtn = (b, key) => { b.classList.add(key === 'tourCopied' ? 'ok' : 'bad'); b.title = t(key); clearTimeout(b._t); b._t = setTimeout(() => { b.classList.remove('ok', 'bad'); b.title = t(b.dataset.i18nTitle); }, 1600); };
  $('tourCopy').onclick = async () => { const v = getLink(); if (v) flashBtn($('tourCopy'), (await copyText(v)) ? 'tourCopied' : 'tourCopyFail'); };
  $('tourShare').onclick = async () => {
    const v = getLink(); if (!v) return;
    if (navigator.share) { try { await navigator.share({ title:window.PROJ_TITLE || currentName || 'Gambit360', url:v }); return; } catch (err) { if (err && err.name === 'AbortError') return; } }
    flashBtn($('tourShare'), (await copyText(v)) ? 'tourCopied' : 'tourCopyFail');   // no share menu on this device: the address is copied instead
  };
  $('tourNoteX').onclick = () => { clearTimeout(tourNoteT); $('tourFoot').hidden = true; };
  const fillTourMsg = () => { let n = 0; const wide = !(window.matchMedia && matchMedia('(max-width:640px)').matches); $('tourMsg').innerHTML = t('contactMsg').replace(/<br>/g, () => (n++ && wide ? ' &nbsp;·&nbsp; ' : '<br>')); };   // on a phone the phone and the mail each get their own line
  $('mpOpen').onclick = openTour;
  ['pkgName', 'pkgMgr'].forEach(id => { $(id).addEventListener('keydown', e => e.stopPropagation()); $(id).addEventListener('input', () => setProjectTitle($('pkgName').value.trim(), $('pkgMgr').value.trim())); });
  $('mpInput').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') $('mpSave').click(); });   // typing here must not trigger the viewer shortcuts

