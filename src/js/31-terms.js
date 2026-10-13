(function () {
  const $ = id => document.getElementById(id) || (($.m = $.m || {})[id] = $.m[id] || document.createElement('div')), KEY = 'tourViewerTerms';
  const custom = () => { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } };
  // Studio: the saved custom text (or '' for default). Client: the text that came in the package.
  window.G360_getTerms = () => custom();
  const text = () => (window.G360_CLIENT ? (window.PKG_TERMS || '') : custom()) || t('termsText');
  const box = $('terms'), body = $('termsBody'), edit = $('termsEdit'), bar = $('termsBar');
  const studio = () => !window.G360_CLIENT && !window.PKG_TERMS;
  function show() {
    if (document.pointerLockElement) document.exitPointerLock();
    body.textContent = text(); body.hidden = false; edit.hidden = true;
    bar.hidden = !studio();
    if (studio()) { edit.value = text(); edit.hidden = false; body.hidden = true; }
    box.hidden = false;
  }
  $('termsBtn').onclick = e => { e.stopPropagation(); $('optMenu').hidden = true; show(); };
  $('termsClose').onclick = () => { box.hidden = true; };
  box.addEventListener('mousedown', e => { if (e.target === box) box.hidden = true; });
  edit.addEventListener('keydown', e => e.stopPropagation());
  $('termsSave').onclick = () => {
    const v = edit.value.trim();
    try { if (!v || v === t('termsText')) localStorage.removeItem(KEY); else localStorage.setItem(KEY, v); } catch (e) {}
    box.hidden = true;
  };
  $('termsReset').onclick = () => { try { localStorage.removeItem(KEY); } catch (e) {} edit.value = t('termsText'); };
  addEventListener('keydown', e => { if (e.key === 'Escape' && !box.hidden) { box.hidden = true; e.stopPropagation(); } }, true);
})();
