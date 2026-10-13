// The load / package / help / colour / language buttons live in one "Options" menu (the buttons keep their own handlers).
(function () {
  const $ = id => document.getElementById(id) || (($.m = $.m || {})[id] = $.m[id] || document.createElement('div')), menu = $('optMenu'), btn = $('optBtn');
  ['projOpen', 'projSave', 'pkgTopBtn', 'pdfBtn', 'mineSaveBtn', 'mineLoadBtn', 'panoSw', 'colorBtn', 'langBtn', 'a11yBtn', 'helpBtn', 'termsBtn'].forEach(id => { const b = $(id); if (b) menu.appendChild(b); });
  if (!window.G360_CLIENT && $('projOpen')) $('projOpen').hidden = false;   // the Studio can open a saved project from the menu at any time
  function place() { const r = btn.getBoundingClientRect(), phone = r.width < 150, w = phone ? Math.min(210, innerWidth - 16) : r.width; menu.style.width = w + 'px'; menu.style.left = (phone ? Math.max(8, Math.min(r.right - w, innerWidth - w - 8)) : r.left) + 'px'; menu.style.top = (r.bottom + 6) + 'px'; }
  btn.addEventListener('click', e => { e.stopPropagation(); const cp = $('colorPanel'); if (cp) cp.hidden = true; menu.hidden = !menu.hidden; if (!menu.hidden) place(); else if (!window.G360_CLIENT) $('planPanel').hidden = true; });   // closing the Options menu also closes the plan export that opened beside it
  // In the Studio the options menu stays open until the Options button (or Esc) closes it; the client's copy closes after a choice or a click elsewhere.
  menu.addEventListener('click', e => { if (window.G360_CLIENT && e.target.closest('button')) menu.hidden = true; });
  document.addEventListener('click', e => { if (window.G360_CLIENT && !menu.hidden && !e.target.closest('#optMenu')) menu.hidden = true; });
  addEventListener('resize', () => { if (!menu.hidden) place(); });
})();
