  // ---- Client logo: replaces the Gambit360 logo in the viewer, snapshots, the promo video and the client package ----
  const DEF_LOGO = (document.querySelector('#logo img') || {}).src || '';
  let customLogo = '';
  function refreshLogoSt() { const e = $('pkgLogoSt'); if (e) e.textContent = t(customLogo ? 'logoCustom' : 'logoDefault'); if ($('pkgLogoReset')) $('pkgLogoReset').hidden = !customLogo; }
  function applyLogo(url) {
    customLogo = url || '';
    const a = $('logo'), img = a.querySelector('img');
    img.src = customLogo || DEF_LOGO;
    $('bootLogo').src = img.src; $('bootLogo').hidden = false;
    a.classList.toggle('custom', !!customLogo);
    if (customLogo) { a.removeAttribute('href'); a.removeAttribute('title'); a.onclick = e => e.preventDefault(); }
    else { a.href = 'https://gambit360.co.il/'; a.title = 'gambit360.co.il'; a.onclick = null; }
    refreshLogoSt();
  }
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
