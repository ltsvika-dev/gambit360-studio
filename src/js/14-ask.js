// ===== Questions in the middle of the screen (instead of the browser's own confirm / prompt box, which sits at the top) =====
// g360Ask(text) -> Promise<true|false>.  g360Ask(text, { input:true, value }) -> Promise<string|null> (null = cancelled).
// Other options: ok / cancel (button texts). Enter answers OK, Escape or a click outside answers Cancel.
const g360Ask = (() => {
  let box = null, done = null;
  function build() {
    box = document.createElement('div'); box.id = 'g360Ask'; box.hidden = true;
    box.innerHTML = '<div class="box" role="dialog" aria-modal="true"><p dir="auto"></p><input type="text" dir="auto"><div class="row"><button type="button" class="ok"></button><button type="button" class="no"></button></div></div>';
    document.body.appendChild(box);
    box.querySelector('.ok').onclick = () => done(true);
    box.querySelector('.no').onclick = () => done(false);
    box.addEventListener('mousedown', e => { if (e.target === box) done(false); });
  }
  // while the question is up, keys belong to it alone (Escape must not also close the window behind it, letters must not run shortcuts)
  addEventListener('keydown', e => {
    if (!box || box.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); done(false); }
    else if (e.key === 'Enter') { e.preventDefault(); done(true); }
    else if (e.key === 'Tab') { const b = [...box.querySelectorAll('input:not([hidden]), button')]; const i = b.indexOf(document.activeElement); e.preventDefault(); b[(i + (e.shiftKey ? b.length - 1 : 1)) % b.length].focus(); }
    e.stopImmediatePropagation();
  }, true);
  return (text, o = {}) => new Promise(res => {
    if (!box) build();
    if (done) done(false);   // a question already up is answered Cancel
    const inp = box.querySelector('input'), back = document.activeElement;
    box.querySelector('p').textContent = text;
    box.querySelector('.ok').textContent = o.ok || t('dlgOk');
    box.querySelector('.no').textContent = o.cancel || t('cancel');
    inp.hidden = !o.input; inp.value = o.value || '';
    box.hidden = false;
    setTimeout(() => { if (o.input) { inp.focus(); inp.select(); } else box.querySelector('.ok').focus(); }, 0);
    done = yes => { done = null; box.hidden = true; try { if (back && back.focus) back.focus(); } catch (e) {} res(o.input ? (yes ? inp.value : null) : yes); };
  });
})();
