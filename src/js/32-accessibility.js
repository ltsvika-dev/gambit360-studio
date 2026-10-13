(function () {
  const $ = id => document.getElementById(id) || (($.m = $.m || {})[id] = $.m[id] || document.createElement('div')), KEY = 'tourViewerA11y';
  let st = { size: 0, hc: false, rm: false };
  try { Object.assign(st, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  function apply(save) {
    const h = document.documentElement;
    h.classList.toggle('t1', st.size === 1); h.classList.toggle('t2', st.size === 2);
    h.classList.toggle('hc', !!st.hc); document.body.classList.toggle('rm', !!st.rm); window.G360_REDUCE = !!st.rm;
    [...$('a11ySize').children].forEach(b => b.classList.toggle('on', +b.dataset.v === st.size));
    $('a11yHc').classList.toggle('on', !!st.hc); $('a11yHc').textContent = t(st.hc ? 'a11yOn' : 'a11yOff');
    $('a11yRm').classList.toggle('on', !!st.rm); $('a11yRm').textContent = t(st.rm ? 'a11yOn' : 'a11yOff');
    if (save) { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  }
  const box = $('a11y');
  $('a11yBtn').onclick = e => { e.stopPropagation(); $('optMenu').hidden = true; if (document.pointerLockElement) document.exitPointerLock(); apply(false); box.hidden = false; };
  $('a11yClose').onclick = () => { box.hidden = true; };
  box.addEventListener('mousedown', e => { if (e.target === box) box.hidden = true; });
  [...$('a11ySize').children].forEach(b => b.onclick = () => { st.size = +b.dataset.v; apply(true); });
  $('a11yHc').onclick = () => { st.hc = !st.hc; apply(true); };
  $('a11yRm').onclick = () => { st.rm = !st.rm; apply(true); };
  $('a11yReset').onclick = () => { st = { size: 0, hc: false, rm: false }; apply(true); };
  addEventListener('keydown', e => { if (e.key === 'Escape' && !box.hidden) { box.hidden = true; e.stopPropagation(); } }, true);
  apply(false);
  const prev = window.onLang; // keep the On/Off labels in the right language after a language switch
  document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#langBtn')) setTimeout(() => apply(false), 0); });
})();
