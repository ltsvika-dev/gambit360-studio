  // ---- Client logo: replaces the Gambit360 logo in the viewer, snapshots, the promo video and the client package ----
  const DEF_LOGO0 = (document.querySelector('#logo img') || {}).src || '';
  let customLogo = '', DEF_LOGO = DEF_LOGO0, brandW = 0;   // DEF_LOGO: my own logo (chosen in the Options screen) or the built-in Gambit360 one
  function refreshLogoSt() { const e = $('pkgLogoSt'); if (e) e.textContent = t(customLogo ? 'logoCustom' : 'logoDefault'); if ($('pkgLogoReset')) $('pkgLogoReset').hidden = !customLogo; }
  // A logo with a see-through background whose drawing is mostly white: shown on the usual white box, only its coloured parts would show
  function logoLight(src) {
    return new Promise(res => { const im = new Image(); im.onload = () => { try {
      const k = Math.min(1, 160 / im.naturalWidth, 80 / im.naturalHeight), w = Math.max(1, Math.round(im.naturalWidth * k)), h = Math.max(1, Math.round(im.naturalHeight * k));
      const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(im, 0, 0, w, h);
      const d = x.getImageData(0, 0, w, h).data; let clear = 0, solid = 0, white = 0;
      for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 50) { clear++; continue; } if (d[i + 3] < 160) continue; solid++; if (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2] > 215) white++; }
      res(clear > w * h * 0.05 && solid > 0 && white / solid > 0.3);
    } catch (err) { res(false); } }; im.onerror = () => res(false); im.src = src; });
  }
  function applyLogo(url) {
    customLogo = url || '';
    const a = $('logo'), img = a.querySelector('img');
    img.src = customLogo || DEF_LOGO;
    { const src = img.src; a.classList.remove('light'); if (src !== DEF_LOGO0) logoLight(src).then(l => { if (img.src === src) a.classList.toggle('light', l); }); }   // a white logo (made for dark screens) gets a dark box, or its white part vanishes
    $('bootLogo').src = img.src; $('bootLogo').hidden = false;
    a.classList.toggle('custom', !!customLogo); a.classList.toggle('brand', !customLogo && DEF_LOGO !== DEF_LOGO0);
    if (window.G360_CLIENT) { const st = document.documentElement.style, k = !customLogo && brandW ? brandW / 260 : 0; st.setProperty('--logoW', k ? Math.round(200 * k) + 'px' : 'auto'); st.setProperty('--logoMH', k ? Math.round(64 * k) + 'px' : '64px'); }   // a client package shows my logo at the chosen width
    if (customLogo) { a.removeAttribute('href'); a.removeAttribute('title'); a.onclick = e => e.preventDefault(); }
    else { a.href = 'https://gambit360.co.il/'; a.title = 'gambit360.co.il'; a.onclick = null; }
    refreshLogoSt();
  }
  // My logo comes from the Options screen (the live tours module hands it over). Its width there is for the published live tours only.
  function setBrand(url, w) {
    DEF_LOGO = url || DEF_LOGO0; brandW = 0;   // the width chosen in the Options screen is for the live tours only: the point-cloud module (Studio, packages, snapshots, videos, reports) keeps the usual size
    if (!window.G360_CLIENT) { try { if (url) localStorage.setItem('g360Brand', JSON.stringify({ url, w:brandW })); else localStorage.removeItem('g360Brand'); } catch (err) {} }
    applyLogo(customLogo);
  }
  const logoK = () => !customLogo && brandW > 0 ? brandW / 260 : 1;   // the size outputs draw my logo at (260 = the usual width)
  function brandFields() { return { brand:DEF_LOGO !== DEF_LOGO0 ? DEF_LOGO : undefined, brandW:DEF_LOGO !== DEF_LOGO0 && brandW && brandW !== 260 ? brandW : undefined }; }
  window.G360_setBrand = setBrand;
  if (!window.G360_CLIENT) { try { const b = JSON.parse(localStorage.getItem('g360Brand') || 'null'); if (b && b.url) setBrand(b.url, b.w); } catch (err) {} }   // at once, so the Studio opens with my logo
  function saveLogoLocal() { try { if (customLogo) localStorage.setItem('tourViewerLogo:' + currentName, customLogo); else localStorage.removeItem('tourViewerLogo:' + currentName); } catch (err) {} }
  function pickLogo(file) {
    const u = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const k = Math.min(1, 600 / im.naturalWidth, 240 / im.naturalHeight), w = Math.max(1, Math.round(im.naturalWidth * k)), h = Math.max(1, Math.round(im.naturalHeight * k));
      const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(im, 0, 0, w, h);
      URL.revokeObjectURL(u); applyLogo(c.toDataURL('image/png')); saveLogoLocal();
    };
    im.onerror = () => { URL.revokeObjectURL(u); pkgMsg(t('logoBad')); };
    im.src = u;
  }
  $('pkgLogoPick').onclick = () => $('pkgLogoFile').click();
  $('pkgLogoFile').onchange = e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) pickLogo(f); };
  $('pkgLogoReset').onclick = () => { applyLogo(''); saveLogoLocal(); };
  refreshLogoSt(); window.G360_relang = () => { refreshLogoSt(); if (typeof refreshPromoSt === 'function') refreshPromoSt(); };

  const pkgOptKey = () => 'tourViewerPkgOpt:' + currentName;
  function promoModeVal() { const v = $('pkgPromoMode').value; return v === 'live' || v === 'gen' ? v : undefined; }   // the client's promo button: undefined = the attached video
  function savePkgOpt() { try { localStorage.setItem(pkgOptKey(), JSON.stringify({ mp:$('pkgMpShow').checked, mini:$('pkgMini').checked, ctags:$('pkgClientTags').checked, cloud:$('pkgCloud').checked, promo:$('pkgPromoMode').value })); } catch (err) {} }
  function loadPkgOpt() { let o = {}; try { o = JSON.parse(localStorage.getItem(pkgOptKey()) || '{}') || {}; } catch (err) {} $('pkgMpShow').checked = o.mp !== false; $('pkgMini').checked = !!o.mini; $('pkgClientTags').checked = !!o.ctags; $('pkgCloud').checked = o.cloud !== false; $('pkgPromoMode').value = ['video', 'gen'].includes(o.promo) ? o.promo : 'live'; }   // default: a live walk through the building
  $('pkgMpShow').onchange = savePkgOpt; $('pkgMini').onchange = savePkgOpt; $('pkgClientTags').onchange = savePkgOpt; $('pkgCloud').onchange = savePkgOpt; $('pkgPromoMode').onchange = savePkgOpt;
  window.G360_loadPkgOpt = loadPkgOpt;
  /*@STUDIO*/
