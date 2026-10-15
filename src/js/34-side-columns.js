// The point-cloud module laid out like Live Tours (Studio, wide screens):
//  - a top bar with the two modules as tabs ("Point clouds" / "Live tours"), the same tabs at the top of the Live Tours screen;
//  - two columns on the right while a model is open: the points of interest (with the Matterport tour and New project buttons),
//    and the project's cards (client package, floor plans). The 3D view takes the rest of the window (VW() in 00-core.js).
// The panels are the same elements that used to float under the top-right buttons; they move into the columns and back.
(function () {
  if (window.G360_CLIENT) return;
  const $ = id => document.getElementById(id);
  const TX = {
    he: { pc:'ענני נקודות', live:'סיורים חיים', colList:'הצגה או הסתרה של נקודות העניין', colEdit:'הצגה או הסתרה של כרטיסי הפרויקט', pkg:'חבילה ללקוח', plan:'ייצוא תכניות קומה' },
    en: { pc:'Point clouds', live:'Live tours', colList:'Show or hide the points of interest', colEdit:'Show or hide the project cards', pkg:'Client package', plan:'Export floor plans' }
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
  top.innerHTML = tabs('pc') + '<button type="button" id="pcColList" class="pcIb">' + svg('<rect x="3.5" y="4" width="17" height="16" rx="2"/><path d="M14.5 4v16"/>') + '</button>'
    + '<button type="button" id="pcColEdit" class="pcIb">' + svg('<rect x="3.5" y="4" width="17" height="16" rx="2"/><path d="M9.5 4v16"/>') + '</button>';
  document.body.appendChild(top);
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
  side.innerHTML = '<div class="pcCol" id="pcListCol"></div><div class="pcCol" id="pcEditCol">' + sec('pkg') + sec('plan') + '</div>';
  document.body.appendChild(side);
  const secEl = k => side.querySelector('.pcSec[data-s="' + k + '"]');
  side.querySelectorAll('.pcSec').forEach(s => {
    s.classList.toggle('shut', !!ui.shut[s.dataset.s]);
    s.querySelector('.pcSecH').onclick = () => { ui.shut[s.dataset.s] = s.classList.toggle('shut'); saveUi(); };
  });
  // where each panel goes; a comment keeps its place for when it goes back (phone width, start screen)
  const PLACES = [['topRight', () => $('pcListCol')], ['viewsPanel', () => $('pcListCol')], ['pkgPanel', () => secEl('pkg').querySelector('.pcSecB')], ['planPanel', () => secEl('plan').querySelector('.pcSecB')]];
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
  function apply() {
    const wide = WIDE.matches, on = wide && loaded();
    top.hidden = !wide; document.body.classList.toggle('pcTopOn', wide);
    if (on !== isOn) { isOn = on; document.body.classList.toggle('pcSide', on); if (on) enter(); else leave(); }
    const pkgOk = !!$('pkgTopBtn') && !$('pkgTopBtn').hidden, planOk = !!$('pdfBtn') && !$('pdfBtn').hidden;
    secEl('pkg').hidden = !pkgOk; secEl('plan').hidden = !planOk;
    // the width is kept from the start screen on, so a model that opens is framed for the narrower view at once
    const lw = wide && !ui.noList ? LIST_W : 0, ew = wide && !noEdit() && (!on || pkgOk || planOk) ? EDIT_W : 0, w = lw + ew;
    side.classList.toggle('noList', !lw); side.classList.toggle('noEdit', !ew); side.hidden = !on || !w;
    $('pcColList').classList.toggle('off', !!ui.noList); $('pcColEdit').classList.toggle('off', noEdit());
    $('pcColList').hidden = $('pcColEdit').hidden = !on;
    document.documentElement.style.setProperty('--pcSideW', w + 'px');
    if ((window.G360_sideW || 0) !== w) { window.G360_sideW = w; dispatchEvent(new Event('resize')); }   // the 3D view takes the new width
  }
  $('pcColList').onclick = () => { ui.noList = !ui.noList; saveUi(); apply(); };
  $('pcColEdit').onclick = () => { ui.noEdit = !noEdit(); saveUi(); apply(); };
  // a model opens or closes (start screen), or the package / plan buttons come and go
  const watch = new MutationObserver(apply);
  ['start', 'pkgTopBtn', 'pdfBtn'].forEach(id => { const el = $(id); if (el) watch.observe(el, { attributes:true, attributeFilter:['hidden'] }); });
  watch.observe(document.body, { childList:true });   // the 3D view's canvas is added when the first model opens
  if (WIDE.addEventListener) WIDE.addEventListener('change', apply);
  addEventListener('resize', apply);

  function texts() {
    document.querySelectorAll('.modTabs button').forEach(b => { b.textContent = T(b.dataset.m); });
    $('pcColList').title = T('colList'); $('pcColEdit').title = T('colEdit');
    side.querySelectorAll('.pcSec').forEach(s => { s.querySelector('.pcSecH span').textContent = T(s.dataset.s); });
  }
  const prevRelang = window.G360_relang;
  window.G360_relang = function () { if (prevRelang) prevRelang.apply(this, arguments); texts(); };
  texts(); apply();
  window.G360_sideApply = apply;
})();
