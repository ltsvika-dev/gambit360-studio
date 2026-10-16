  // ---- Accent colour (cyan by default), help dialog, Esc ----
  const DEFAULT_ACCENT = '#5ec4b6', ACCENT_KEY = 'tourViewerAccent';
  const SWATCHES = [['#5ec4b6', 'swCyan'], ['#4da3ff', 'swBlue'], ['#6fcf6f', 'swGreen'], ['#ffa94d', 'swOrange'], ['#ff7eb6', 'swPink'], ['#b392f0', 'swPurple'], ['#ffd166', 'swYellow'], ['#ff6b6b', 'swRed']];
  let accent = DEFAULT_ACCENT;
  try { accent = localStorage.getItem(ACCENT_KEY) || DEFAULT_ACCENT; } catch (e) {}

  function applyAccent(hex, save) {
    hex = hex.toLowerCase(); accent = hex;
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    const root = document.documentElement.style;
    root.setProperty('--accent', hex);
    root.setProperty('--on-accent', (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#0b1412' : '#ffffff');
    const c = new THREE.Color(hex).convertSRGBToLinear();  // so the 3D colour matches the CSS one
    accentLin = c;
    if (measMat) measMat.color.copy(c);
    if (fillMat) fillMat.color.copy(c);
    if (marker) marker.children.forEach(ch => ch.material.color.copy(c));
    if (window.G360_CLIENT) markSw(hex);
    if (save) { try { localStorage.setItem(ACCENT_KEY, hex); if (window.G360_CLIENT) localStorage.setItem('g360ClientAcc', '1'); } catch (e) {} }
  }
  // In the Studio the colour panel of the Options menu picks the client package's colour (cyan unless changed);
  // the Studio's own colour is picked in the top bar (js/34-side-columns.js). The client's copy picks its own colour.
  const PKG_ACC_KEY = 'g360PkgAccent';
  let pkgAccent = DEFAULT_ACCENT, baseAccent = DEFAULT_ACCENT;   // baseAccent: the colour the client's package came with
  try { pkgAccent = (localStorage.getItem(PKG_ACC_KEY) || DEFAULT_ACCENT).toLowerCase(); } catch (e) {}
  function markSw(hex) { [...$('swatches').children].forEach(sw => sw.classList.toggle('on', sw.dataset.c === hex)); $('colorPick').value = hex; }
  function pickColor(hex) {
    if (window.G360_CLIENT) { applyAccent(hex, true); return; }
    pkgAccent = hex.toLowerCase(); markSw(pkgAccent);
    try { if (pkgAccent === DEFAULT_ACCENT) localStorage.removeItem(PKG_ACC_KEY); else localStorage.setItem(PKG_ACC_KEY, pkgAccent); } catch (e) {}
    if (!$('colorPanel').hidden) applyAccent(pkgAccent);   // shown on the model at once, as the client will see it
  }
  let uiAccent = accent;   // the Studio's own colour; while the client colour window is open the view shows the client's colour instead
  window.G360_setUiAccent = hex => { uiAccent = hex.toLowerCase(); applyAccent(uiAccent, true); };
  window.G360_uiAccent = () => uiAccent;
  if (!window.G360_CLIENT) new MutationObserver(() => applyAccent($('colorPanel').hidden ? uiAccent : pkgAccent)).observe($('colorPanel'), { attributes:true, attributeFilter:['hidden'] });
  const pkgAccField = () => pkgAccent !== DEFAULT_ACCENT ? pkgAccent : undefined;   // the manifest's 'acc'
  function pkgBaseAccent(hex) {   // the client's copy: the package's colour, unless the client chose one
    if (!/^#[0-9a-f]{6}$/i.test(hex || '')) return;
    baseAccent = hex.toLowerCase(); let own = false; try { own = localStorage.getItem('g360ClientAcc') === '1'; } catch (e) {}
    if (!own) applyAccent(baseAccent);
  }
  SWATCHES.forEach(([hex, name]) => {
    const sw = document.createElement('button');
    sw.className = 'sw'; sw.dataset.c = hex; sw.dataset.n = name; sw.title = t(name); sw.style.background = hex;
    sw.onclick = () => pickColor(hex);
    $('swatches').appendChild(sw);
  });
  $('colorPick').oninput = e => pickColor(e.target.value);
  $('colorReset').onclick = () => { if (!window.G360_CLIENT) { pickColor(DEFAULT_ACCENT); return; } applyAccent(baseAccent); try { localStorage.removeItem(ACCENT_KEY); localStorage.removeItem('g360ClientAcc'); } catch (e) {} };
  function applyTheme(light, save) {
    document.documentElement.dataset.theme = light ? 'light' : 'dark';
    if (save) { try { localStorage.setItem('tourViewerTheme', light ? 'light' : 'dark'); } catch (err) {} }
  }
  { let th = ''; try { th = localStorage.getItem('tourViewerTheme') || ''; } catch (err) {} applyTheme(th === 'light', false); }
  $('themeBtn').onclick = () => applyTheme(document.documentElement.dataset.theme !== 'light', true);
  // One-time tip for a new user
  function showHint() {
    let seen = false; try { seen = localStorage.getItem('tourViewerHint') === '1'; } catch (err) {}
    if (seen) return;
    const h = $('hint'); h.hidden = false;
    const close = () => { h.hidden = true; try { localStorage.setItem('tourViewerHint', '1'); } catch (err) {} };
    h.onclick = close; setTimeout(close, 14000);
  }
  $('colorBtn').onclick = () => {
    $('mpPanel').hidden = true; $('pkgPanel').hidden = true; $('planPanel').hidden = true; const cp = $('colorPanel'); cp.hidden = !cp.hidden;
    // In the Studio the Options menu stays open, so the colour panel opens beside it instead of behind it
    // (or on its other side; on a phone there is room for neither, so the panel takes the menu's place)
    if (!cp.hidden && !window.G360_CLIENT && !$('optMenu').hidden) {
      const r = $('optMenu').getBoundingClientRect(), w = 220; let left = r.right + 8;
      if (left + w > innerWidth - 8) left = r.left - 8 - w;
      if (left < 8) { $('optMenu').hidden = true; left = Math.max(8, Math.min(r.right, innerWidth - 8) - w); }
      cp.style.cssText = 'position:fixed;z-index:9;top:' + Math.round(r.top) + 'px;left:' + Math.round(left) + 'px;width:' + w + 'px;max-width:calc(100vw - 16px);box-sizing:border-box;';
    }
    else cp.style.cssText = '';
  };
  applyAccent(accent); if (!window.G360_CLIENT) markSw(pkgAccent);

  $('homeBtn').onclick = () => openImport();
  $('cancelImport').onclick = () => closeImport();

  const helpBox = document.querySelector('.help-box');
  const openHelp = () => {
    if (document.pointerLockElement) document.exitPointerLock();
    $('colorPanel').hidden = true; $('help').hidden = false;
    if (!helpBox.dataset.placed) {   // first time: dock on the right so the model stays visible
      helpBox.style.left = Math.max(8, innerWidth - helpBox.offsetWidth - 12) + 'px';
      helpBox.style.top = '60px'; helpBox.dataset.placed = '1';
    }
  };
  const closeHelp = () => { $('help').hidden = true; };
  $('helpBtn').onclick = () => $('help').hidden ? openHelp() : closeHelp();
  $('helpClose').onclick = closeHelp;
  {  // move the help window by dragging its title bar
    const bar = document.querySelector('.help-top'); let d = null;
    bar.addEventListener('pointerdown', e => {
      if (e.target.closest('button')) return;
      const r = helpBox.getBoundingClientRect(); d = { dx:e.clientX - r.left, dy:e.clientY - r.top };
      bar.setPointerCapture(e.pointerId); e.preventDefault();
    });
    bar.addEventListener('pointermove', e => {
      if (!d) return;
      helpBox.style.left = Math.max(0, Math.min(innerWidth - 80, e.clientX - d.dx)) + 'px';
      helpBox.style.top = Math.max(0, Math.min(innerHeight - 40, e.clientY - d.dy)) + 'px';
    });
    bar.addEventListener('pointerup', () => { d = null; });
    bar.addEventListener('pointercancel', () => { d = null; });
  }
  addEventListener('keydown', e => {
    if (e.code === 'KeyH') { $('help').hidden ? openHelp() : closeHelp(); }
    if (e.code === 'Escape') {  // closes what is open first, then leaves measure / area mode
      if (tourOpen) closeTour();
      else if (!$('optMenu').hidden) { $('optMenu').hidden = true; if (!window.G360_CLIENT) { $('planPanel').hidden = true; $('colorPanel').hidden = true; } }
      else if (!$('help').hidden) closeHelp();
      else if (!$('colorPanel').hidden) $('colorPanel').hidden = true;
      else if (!$('mpPanel').hidden) $('mpPanel').hidden = true;
      else if (!$('pkgPanel').hidden) $('pkgPanel').hidden = true;
      else if (!$('planPanel').hidden) $('planPanel').hidden = true;
      else if (!$('viewsPanel').hidden) $('viewsPanel').hidden = true;
      else if (started && !$('start').hidden) closeImport();
      else if (areaMode) toggleArea();
      else if (measuring) toggleMeasure();
    }
  });

