// The point-cloud module laid out like Live Tours (Studio, wide screens):
//  - a top bar with the two modules as tabs ("Point clouds" / "Live tours"), the same tabs at the top of the Live Tours screen;
//  - two columns on the right while a model is open: the points of interest (with the Matterport tour and New project buttons),
//    and the project's cards (client package, floor plans). The 3D view takes the rest of the window (VW() in 00-core.js).
// The panels are the same elements that used to float under the top-right buttons; they move into the columns and back.
// The Options menu under the logo keeps only what the client's copy has; the Studio's own buttons (open / save project,
// the Options screen, the Studio folder) and the Studio's own colour sit in the top bar, where Live Tours has its buttons.
(function () {
  if (window.G360_CLIENT) return;
  const $ = id => document.getElementById(id);
  const TX = {
    he: { pc:'ענני נקודות', live:'סיורים חיים', colList:'הצגה או הסתרה של נקודות העניין', colEdit:'הצגה או הסתרה של כרטיסי הפרויקט', pkg:'חבילה ללקוח', close:'סגירה', closeTip:'סגירת המודל וחזרה למסך הפתיחה', lang:'English', plan:'ייצוא תכניות קומה', acc:'צבע הממשק', src:'תיקיית ה-Studio', openTip:'לפרויקט חדש, לחץ קודם על סגירה', cx:'חוויית הלקוח', video:'ייצוא סרטון וידאו', videoNote:'סרטון של כ-30 שניות: סיבוב סביב המבנה, הליכה בתוכו ויציאה. הוא נשמר בתיקיית ההורדות, ואפשר לצרף אותו לחבילה ללקוח.' },
    en: { pc:'Point clouds', live:'Live tours', colList:'Show or hide the points of interest', colEdit:'Show or hide the project cards', pkg:'Client package', close:'Close', closeTip:'Close the model and go back to the start screen', lang:'עברית', plan:'Export floor plans', acc:'Interface colour', src:'Studio folder', openTip:'For a new project, press Close first', cx:'Client experience', video:'Export a video', videoNote:'A video of about 30 seconds: a turn around the building, a walk inside and back out. It is saved to your Downloads folder, and you can attach it to the client package.' }
  };
  const T = k => TX[document.documentElement.lang === 'en' ? 'en' : 'he'][k];
  const LIST_W = 280, EDIT_W = 360, WIDE = matchMedia('(min-width:901px)');
  const noEdit = () => ui.noEdit !== undefined ? ui.noEdit : innerWidth < 1250;   // on a smaller screen the project cards start closed, so the 3D view keeps room
  let ui = {}; try { ui = JSON.parse(localStorage.getItem('g360pcUi') || '{}') || {}; } catch (e) {}
  ui.shut = ui.shut || {};
  const saveUi = () => { try { localStorage.setItem('g360pcUi', JSON.stringify(ui)); } catch (e) {} };
  const svg = d => '<svg viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>';
  const CHEV = '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

  // ---- top bar ----
  const tabs = on => '<div class="modTabs" role="tablist"><button type="button" data-m="pc"' + (on === 'pc' ? ' class="on"' : '') + '></button><button type="button" data-m="live"' + (on === 'live' ? ' class="on"' : '') + '></button></div>';
  const top = document.createElement('div'); top.id = 'pcTop'; top.hidden = true;
  // the same order as the Live Tours bar: tabs, then (on the far side) column switches, colour, Options screen, and the two main buttons
  top.innerHTML = tabs('pc') + '<span class="sp"></span><button type="button" id="pcColList" class="pcIb">' + svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16M17.5 8.5h1M17.5 12h1M17.5 15.5h1"/>') + '</button>'
    + '<button type="button" id="pcColEdit" class="pcIb">' + svg('<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>') + '</button>'
    + '<button type="button" id="pcLang" class="pcIb pcTx"></button>'
    + '<label id="pcAcc" class="pcIb"><input type="color"></label>'
    + '<button type="button" id="pcSrc" class="pcIb">' + svg('<path d="M3 7.5V18a1.5 1.5 0 0 0 1.5 1.5h15A1.5 1.5 0 0 0 21 18V9a1.5 1.5 0 0 0-1.5-1.5h-7.2L10.5 5H4.5A1.5 1.5 0 0 0 3 6.5z"/>') + '</button>'
    + '<span id="pcSlotSet"></span><span id="pcSlotSave"></span><span id="pcSlotOpen"></span>'
    + '<button type="button" id="pcClose" class="ib">' + svg('<path d="M6 6l12 12M18 6L6 18"/>') + '<span></span></button>';
  document.body.appendChild(top);
  // the Studio's own colour (the colour in the Options menu is the client package's, js/20-viewer/01-accent-help-esc.js)
  const accIn = $('pcAcc').querySelector('input');
  const uiAcc = () => window.G360_uiAccent ? window.G360_uiAccent() : '#5ec4b6';
  const accShow = () => { const a = uiAcc(); accIn.value = a; $('pcAcc').style.setProperty('--sw', a); const lv = $('lvAcc'); if (lv) { lv.style.setProperty('--sw', a); if (lv.firstChild) lv.firstChild.value = a; } if (!ucol.hidden) ucMark(); };
  accIn.oninput = e => { if (window.G360_setUiAccent) window.G360_setUiAccent(e.target.value); accShow(); };
  const setUi = window.G360_setUiAccent;   // the Live Tours bar changes the same colour, so this swatch follows it
  if (setUi) window.G360_setUiAccent = hex => { setUi(hex); accShow(); };
  // The colour button of either bar opens the same colour window as the Options menu: swatches, a custom colour, dark / light, reset.
  // Here it sets the Studio's colour (both modules); the window in the Options menu sets the client package's.
  const ucol = document.createElement('div'); ucol.id = 'uiColor'; ucol.hidden = true;
  ucol.innerHTML = '<div class="ucSw"></div><label><span></span> <input type="color"></label><button type="button" class="txt" data-b="theme"></button><button type="button" class="txt" data-b="reset"></button>';
  document.body.appendChild(ucol);
  const ucPick = ucol.querySelector('input');
  [...$('swatches').children].forEach(o => { const b = document.createElement('button'); b.type = 'button'; b.className = 'sw'; b.dataset.c = o.dataset.c; b.style.background = o.dataset.c; ucol.firstChild.appendChild(b); });
  const ucSet = hex => { if (window.G360_setUiAccent) window.G360_setUiAccent(hex.toLowerCase()); };
  function ucMark() { const a = uiAcc(); ucol.querySelectorAll('.sw').forEach(b => b.classList.toggle('on', b.dataset.c === a)); ucPick.value = a; }
  function ucTexts() {
    const tx = sel => { const e = document.querySelector(sel); return e ? e.textContent : ''; };
    ucol.querySelector('label span').textContent = tx('#colorPanel label span'); ucol.querySelector('[data-b="theme"]').textContent = tx('#themeBtn'); ucol.querySelector('[data-b="reset"]').textContent = tx('#colorReset');
    const own = [...$('swatches').children]; ucol.querySelectorAll('.sw').forEach((b, i) => { if (own[i]) b.title = own[i].title; });
  }
  ucol.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return;
    if (b.classList.contains('sw')) ucSet(b.dataset.c); else if (b.dataset.b === 'theme') $('themeBtn').click(); else if (b.dataset.b === 'reset') ucSet('#5ec4b6'); });
  ucPick.oninput = e => ucSet(e.target.value);
  function ucOpen(btn) {
    if (!ucol.hidden && ucol.dataset.by === btn.id) { ucol.hidden = true; return; }
    ucTexts(); ucMark(); ucol.dataset.by = btn.id; ucol.hidden = false;
    const r = btn.getBoundingClientRect(), w = ucol.offsetWidth;
    ucol.style.top = Math.round(r.bottom + 8) + 'px'; ucol.style.left = Math.round(Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2))) + 'px';
  }
  ['pcAcc', 'lvAcc'].forEach(id => { const b = $(id); if (b) b.addEventListener('click', e => { e.preventDefault(); ucOpen(b); }, true); });
  document.addEventListener('pointerdown', e => { if (!ucol.hidden && !e.target.closest('#uiColor, #pcAcc, #lvAcc')) ucol.hidden = true; }, true);
  addEventListener('keydown', e => { if (e.key === 'Escape' && !ucol.hidden) { ucol.hidden = true; e.stopImmediatePropagation(); } }, true);
  $('pcSrc').onclick = () => { const b = $('srcBtn'); if (b) b.click(); };
  $('pcLang').onclick = () => { const b = $('langBtn'); if (b) b.click(); };   // the Studio's language (the same button as in the Options menu)
  $('pcClose').onclick = () => location.reload();   // closes the model: the Studio starts again on its start screen, as when it is opened (the last file is offered as a button)
  $('pcSrc').onmouseenter = () => { const p = $('srcPath'); $('pcSrc').title = T('src') + (p && p.textContent ? ': ' + p.textContent : ''); };
  // the Studio-only buttons of the Options menu move into the bar on wide screens (and back on a phone)
  const BAR = [['liveSetMenuBtn', 'pcSlotSet'], ['projSave', 'pcSlotSave'], ['projOpen', 'pcSlotOpen']], barMarks = {};
  function barIn(on) {
    BAR.forEach(([id, slot]) => { const el = $(id); if (!el) return;
      if (on && !barMarks[id]) { barMarks[id] = document.createComment(id); el.replaceWith(barMarks[id]); $(slot).replaceWith(el); el.dataset.slot = slot; }
      else if (!on && barMarks[id]) { const ph = document.createElement('span'); ph.id = slot; el.replaceWith(ph); barMarks[id].replaceWith(el); delete barMarks[id]; } });
  }
  const lvTitle = $('lvTitle'); if (lvTitle) lvTitle.insertAdjacentHTML('afterend', tabs('live'));
  document.addEventListener('click', e => {
    const b = e.target.closest('.modTabs button'); if (!b) return;
    const liveOpen = $('live') && !$('live').hidden;
    if (b.dataset.m === 'live' && !liveOpen && window.G360_openLive) window.G360_openLive();
    else if (b.dataset.m === 'pc' && liveOpen) $('lvClose').click();   // the point cloud stayed loaded underneath
  });

  // ---- the two columns ----
  const side = document.createElement('div'); side.id = 'pcSide'; side.hidden = true;
  const sec = k => '<div class="pcSec" data-s="' + k + '"><button type="button" class="pcSecH">' + CHEV + '<span></span></button><div class="pcSecB"></div></div>';
  side.innerHTML = '<div class="pcCol" id="pcListCol"></div><div class="pcCol" id="pcEditCol">' + sec('pkg') + sec('cx') + sec('plan') + sec('video') + '</div>';
  side.querySelector('.pcSec[data-s="video"] .pcSecB').innerHTML = '<p class="pcNote"></p>';
  document.body.appendChild(side);
  const secEl = k => side.querySelector('.pcSec[data-s="' + k + '"]');
  side.querySelectorAll('.pcSec').forEach(s => {
    s.classList.toggle('shut', !!ui.shut[s.dataset.s]);
    s.querySelector('.pcSecH').onclick = () => { ui.shut[s.dataset.s] = s.classList.toggle('shut'); saveUi(); };
  });
  // where each panel goes; a comment keeps its place for when it goes back (phone width, start screen)
  const PLACES = [['topRight', () => $('pcListCol')], ['viewsPanel', () => $('pcListCol')], ['pkgPanel', () => secEl('pkg').querySelector('.pcSecB')], ['planPanel', () => secEl('plan').querySelector('.pcSecB')], ['pkgClientBox', () => secEl('cx').querySelector('.pcSecB')], ['promoBtn', () => secEl('video').querySelector('.pcSecB')]];
  const PANELS = ['viewsPanel', 'pkgPanel', 'planPanel'];
  const marks = {};
  let isOn = false;
  function enter() {
    PLACES.forEach(([id, to]) => { const el = $(id); if (!el) return; if (!marks[id]) { marks[id] = document.createComment(id); el.replaceWith(marks[id]); } to().appendChild(el); });
    PANELS.forEach(id => { const el = $(id); if (el) el.hidden = false; });
    ['optMenu', 'colorPanel'].forEach(id => { const el = $(id); if (el) el.hidden = true; });
  }
  function leave() {
    PANELS.forEach(id => { const el = $(id); if (el) el.hidden = true; });
    PLACES.forEach(([id]) => { const el = $(id); if (el && marks[id]) { marks[id].replaceWith(el); delete marks[id]; } });
  }
  // while the columns are open their panels stay open (the old buttons closed one panel when another opened)
  const keepOpen = new MutationObserver(recs => { if (isOn) recs.forEach(r => { if (r.target.hidden) r.target.hidden = false; }); });
  PANELS.forEach(id => { const el = $(id); if (el) keepOpen.observe(el, { attributes:true, attributeFilter:['hidden'] }); });

  const loaded = () => !!($('start') && $('start').hidden && document.querySelector('body > canvas:not(#mini)'));
  let barOn = false;
  function apply() {
    const wide = WIDE.matches, on = wide && loaded();
    const startOn = !!$('start') && !$('start').hidden;   // the start screen has no bar (it has its own buttons) and no project title
    top.hidden = !wide || startOn; document.body.classList.toggle('pcTopOn', wide && !startOn); document.body.classList.toggle('pcWide', wide);
    document.body.classList.toggle('pcStart', startOn);
    if (wide !== barOn) { barOn = wide; barIn(wide); }
    if (on !== isOn) { isOn = on; document.body.classList.toggle('pcSide', on); if (on) enter(); else leave(); }
    const pkgOk = !!$('pkgTopBtn') && !$('pkgTopBtn').hidden, planOk = !!$('pdfBtn') && !$('pdfBtn').hidden;
    const vidOk = !!$('promoBtn') && !$('promoBtn').hidden;
    secEl('pkg').hidden = secEl('cx').hidden = !pkgOk; secEl('plan').hidden = !planOk; secEl('video').hidden = !vidOk;
    // the width is kept from the start screen on, so a model that opens is framed for the narrower view at once
    const lw = wide && !ui.noList ? LIST_W : 0, ew = wide && !noEdit() && (!on || pkgOk || planOk || vidOk) ? EDIT_W : 0, w = lw + ew;
    side.classList.toggle('noList', !lw); side.classList.toggle('noEdit', !ew); side.hidden = !on || !w;
    $('pcColList').classList.toggle('off', !!ui.noList); $('pcColEdit').classList.toggle('off', noEdit());
    $('pcColList').hidden = $('pcColEdit').hidden = $('pcClose').hidden = !on;
    document.documentElement.style.setProperty('--pcSideW', w + 'px');
    if ((window.G360_sideW || 0) !== w) { window.G360_sideW = w; dispatchEvent(new Event('resize')); }   // the 3D view takes the new width
  }
  $('pcColList').onclick = () => { ui.noList = !ui.noList; saveUi(); apply(); };
  $('pcColEdit').onclick = () => { ui.noEdit = !noEdit(); saveUi(); apply(); };
  // a model opens or closes (start screen), or the package / plan buttons come and go
  const watch = new MutationObserver(apply);
  ['start', 'pkgTopBtn', 'pdfBtn', 'promoBtn'].forEach(id => { const el = $(id); if (el) watch.observe(el, { attributes:true, attributeFilter:['hidden'] }); });
  watch.observe(document.body, { childList:true });   // the 3D view's canvas is added when the first model opens
  if (WIDE.addEventListener) WIDE.addEventListener('change', apply);
  addEventListener('resize', apply);

  function texts() {
    document.querySelectorAll('.modTabs button').forEach(b => { b.textContent = T(b.dataset.m); });
    $('pcAcc').title = T('acc'); $('pcLang').textContent = document.documentElement.lang === 'en' ? '\u05e2\u05d1' : 'EN'; $('pcLang').title = T('lang');
    $('pcClose').lastChild.textContent = T('close'); $('pcClose').title = T('closeTip'); $('projOpen').title = T('openTip');
    BAR.forEach(([id]) => { const el = $(id); if (el && el.id === 'liveSetMenuBtn') { const sp = el.querySelector('span'); if (sp) el.title = sp.textContent; } });
    $('pcColList').title = T('colList'); $('pcColEdit').title = T('colEdit');
    side.querySelectorAll('.pcSec').forEach(s => { s.querySelector('.pcSecH span').textContent = T(s.dataset.s); }); side.querySelector('.pcNote').textContent = T('videoNote');
  }
  const prevRelang = window.G360_relang;
  window.G360_relang = function () { if (prevRelang) prevRelang.apply(this, arguments); texts(); };
  texts(); apply(); accShow();
  window.G360_sideApply = apply;
})();
