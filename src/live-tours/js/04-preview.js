  // ---- preview: the real tour with the layer drawn on top (nadir and the live map position need the SDK, so they show on the site) ----
  let lastSrc = '', wantCard = false;
  function openInfoCard() { wantCard = true; preview(); }   // the details card opens in the preview while it is being filled in
  function mpSrc(t) {
    const p = new URLSearchParams(); p.set('m', pvModel || t.model); Object.keys(t.mp).forEach(k => p.set(k, String(t.mp[k])));
    if (t.extra) new URLSearchParams(t.extra.replace(/^[?&]/, '')).forEach((v, k) => p.set(k, v));
    return 'https://my.matterport.com/show/?' + p.toString();
  }
  // the full link to the published page on our server (index.html reads ?t=<address>, which also works on nginx where .htaccess is ignored)
  function siteLink(t) { return settings.base.replace(/\/?$/, '/') + '?t=' + slugOf(t); }
  // a jump point in the preview: the tour opens at that scan point and view direction
  function previewSpot(t, x) {
    const fr = $('lvFrame'); pvModel = x.m && x.m !== t.model ? x.m : null;
    lastSrc = mpSrc(t); fr.hidden = false; $('lvPh').hidden = true;
    const u = new URL(lastSrc); u.searchParams.set('ss', x.ss); if (x.sr) u.searchParams.set('sr', x.sr); else u.searchParams.delete('sr'); u.searchParams.set('play', '1'); u.searchParams.set('qs', '1'); fr.src = u.toString();
    preview();
  }
  function stopPrev() { if (prevAudio) { prevAudio.pause(); prevAudio = null; } const b = $('lvPMusic'); if (b) b.textContent = '🔇'; }
  async function preview(reload) {
    const t = cur, fr = $('lvFrame'), ph = $('lvPh');
    if (!t || !t.model) { fr.hidden = true; fr.src = 'about:blank'; lastSrc = ''; ph.hidden = false; ph.textContent = t ? L('noModel') : L('pickTour'); ['lvPLogo', 'lvPMini'].forEach(id => { $(id).style.display = 'none'; }); $('lvPMusic').style.display = 'none'; ['lvPTitle', 'lvPInfo', 'lvPVid', 'lvPTour', 'lvPContact', 'lvPSpot', 'lvPCt'].forEach(id => { $(id).style.display = 'none'; }); $('lvPBadges').innerHTML = ''; return; }
    ph.hidden = true; fr.hidden = false;
    const src = mpSrc(t); if (src !== lastSrc && (reload || !lastSrc)) { lastSrc = src; fr.src = src; } else if (src !== lastSrc) { lastSrc = src; fr.src = src; }
    const lg = $('lvPLogo'), lu = t.logo.on ? await fileUrl(t.id + ':logo') : '';
    if (cur !== t) return;
    lg.style.display = lu ? 'block' : 'none';
    if (lu) { lg.querySelector('img').src = lu; lg.className = t.logo.pos + (t.logo.card ? ' card' : ''); lg.style.width = t.logo.w + 'px'; lg.style.opacity = 1 - (t.logo.tr || 0) / 100; lg.style.top = t.logo.top + 'px'; lg.style.left = t.logo.pos === 'tl' ? t.logo.side + 'px' : ''; lg.style.right = t.logo.pos === 'tr' ? t.logo.side + 'px' : ''; }
    const mb = $('lvPMusic'), mu = t.music.on ? await fileUrl(t.id + ':music') : '';
    if (cur !== t) return;
    mb.style.display = t.music.on ? 'flex' : 'none';
    if (!mu) stopPrev(); else if (!prevAudio) mb.textContent = '🔇';
    mb.onclick = () => { if (!mu) return; if (prevAudio) { stopPrev(); return; } prevAudio = new Audio(mu); prevAudio.loop = true; prevAudio.volume = t.music.vol / 100; prevAudio.play().catch(() => {}); mb.textContent = '🔊'; };
    // the top-right buttons, as the visitor sees them on the published page
    const cOk = t.info.on && t.contact.on && contactHref(t.contact), hasInfo = !!t.info.on;
    const tl = [{ name: t.mainName || t.name || L('mainTourName'), id: null }].concat(t.tours.filter(x => x.model).map(x => ({ name: x.name || x.model, id: x.model })));
    const bi = $('lvPInfo'), bv = $('lvPVid'), bt = $('lvPTour'), tm = $('lvPTm'), ov = $('lvPOv'), oc = ov.querySelector('.c');
    bi.style.display = hasInfo ? 'flex' : 'none'; bv.style.display = t.vidSec.on ? 'flex' : 'none'; { const en = tourLang(t) === 'en'; $('lvStage').dir = en ? 'ltr' : 'rtl'; bv.querySelector('span').textContent = t.videos.length > 1 ? (en ? 'Videos' : 'סרטונים') : (t.videos[0] && t.videos[0].name) || (en ? 'Video' : 'סרטון'); bi.querySelector('span').textContent = en ? 'Details' : 'פרטים'; } $('lvStage').classList.toggle('lblOff', t.btnLbl === 'icon'); bt.style.display = t.tourSec.on ? 'flex' : 'none';
    [['lvPInfo', 'info'], ['lvPVid', 'video'], ['lvPTour', 'tours']].forEach(([id, k]) => { $(id).querySelector('svg').innerHTML = ICONS[t.icons[k]] || ICONS[ICON_SETS[k][0]]; });
    bt.querySelector('span').textContent = (tl.find(x => x.id === pvModel) || tl[0]).name;
    { const ts = (t.btnSty || {}).title || {}, tb = $('lvPTitle'); tb.style.display = ts.on ? 'flex' : 'none'; tb.querySelector('span').textContent = t.title || t.name || L('untitled'); tb.title = ts.link || ''; }
    [['lvPTm', 'tours'], ['lvPVm', 'video'], ['lvPOv', 'video']].forEach(([id, k]) => { const st = (t.btnSty || {})[k] || {}, e = $(id); if (!e) return; if (/^#[0-9a-f]{6}$/i.test(st.bg || '')) { const lk = btnLook({ bg: st.bg, tr: 0 }); e.style.setProperty('--hl', st.bg); e.style.setProperty('--hlFg', lk.fg); } else { e.style.removeProperty('--hl'); e.style.removeProperty('--hlFg'); } });
    { const w = $('lvPWel'), wc = t.welcome || {}, on = !!wc.on && !!(String(wc.title || '').trim() || String(wc.text || '').trim());   // the opening caption
      if (w) { w.style.display = on ? 'flex' : 'none'; w.classList.toggle('r', wc.pos === 'r'); w.style.bottom = Math.round((wc.bottom == null ? 64 : +wc.bottom) * .7) + 'px'; w.querySelector('b').textContent = wc.title || ''; w.querySelector('.wb div').textContent = wc.text || ''; w.querySelector('.t').textContent = wc.pos === 'r' ? '\u25B6' : '\u25C0'; } }
    [['lvPTm', 'tours'], ['lvPVm', 'video']].forEach(([id, k]) => { const st = (t.btnSty || {})[k] || {}, e = $(id); if (!e) return; if (/^#[0-9a-f]{6}$/i.test(st.bg || '')) { const m = (i, d) => Math.round(parseInt(st.bg.slice(i, i + 2), 16) * .25 + d * .75); e.style.setProperty('--hov', 'rgb(' + m(1, 20) + ',' + m(3, 24) + ',' + m(5, 27) + ')'); } else e.style.removeProperty('--hov'); });   // the hover mark in the lists: 25% of the button's colour in the dark grey
    { const sp = $('lvPSpot'), en = tourLang(t) === 'en'; sp.style.display = t.spots.on ? 'flex' : 'none'; sp.querySelector('svg').innerHTML = ICONS[t.icons.spots] || ICONS.pin; sp.querySelector('span').textContent = en ? 'Places' : 'מקומות';   // jump points
      const cb = $('lvPCt'), ch = (t.btnSty.contact || {}).on ? contactHref(t.contact) : ''; cb.style.display = ch ? 'flex' : 'none';   // the contact button in the row
      if (ch) { cb.href = ch; cb.querySelector('svg').innerHTML = t.contact.type === 'wa' ? WA_ICON : ICONS[CONTACT_IC[t.contact.type] || 'star']; cb.querySelector('span').textContent = t.contact.label || L('cD_' + t.contact.type); } }
    [['lvPTitle', 'title'], ['lvPInfo', 'info'], ['lvPVid', 'video'], ['lvPTour', 'tours'], ['lvPMusic', 'music'], ['lvPSpot', 'spots'], ['lvPCt', 'contact']].forEach(([id, k]) => {   // each button's own name, colour and transparency
      const e = $(id), st = (t.btnSty || {})[k] || {}, lk = btnLook(st);
      if (st.lbl && k !== 'music') e.querySelector('span').textContent = st.lbl;
      e.style.setProperty('background', lk.bg, 'important'); e.style.setProperty('color', lk.fg, 'important');
      if (k !== 'music' && +st.w > 0 && t.btnLbl !== 'icon') e.style.minWidth = st.w + 'px'; else e.style.minWidth = '';
      if (k !== 'music' && st.r != null && +st.r < 20) e.style.setProperty('border-radius', (+st.r) + 'px', 'important'); else e.style.removeProperty('border-radius');
      if (k === 'contact' && !/^#[0-9a-f]{6}$/i.test(st.bg || '')) { const h = CONTACT_COL[t.contact.type] || CONTACT_COL.link; e.style.setProperty('background', st.tr == null || +st.tr === 28 ? h : btnLook({ bg: h, tr: st.tr }).bg, 'important'); e.style.setProperty('color', '#fff', 'important'); }   // in the colour of its kind unless one was chosen
    });
    { const bpp = t.btnPos || {}; const pid = { title: 'lvPTitle', info: 'lvPInfo', video: 'lvPVid', tours: 'lvPTour', music: 'lvPMusic', spots: 'lvPSpot', contact: 'lvPCt' }; (t.btnOrder || ['title', 'info', 'tours', 'music', 'video', 'spots', 'contact']).forEach(k => { $(bpp[k] === 'r' ? 'lvPCtl' : 'lvPLctl').appendChild($(pid[k])); }); const bo2 = t.btnOff || { top: -1, side: 14 }; let tp = 12 + (+t.mp.brand !== 0 ? 34 : 0) + (+t.mp.title !== 0 ? 30 : 0); if (bo2.top >= 0) tp = bo2.top; $('lvPLctl').style.top = tp + 'px'; $('lvPLctl').style.left = bo2.side + 'px'; $('lvPCtl').style.top = (bo2.top >= 0 ? bo2.top : 14) + 'px'; $('lvPCtl').style.right = bo2.side + 'px'; }
    const openOv = html => { oc.innerHTML = html; ov.style.display = 'flex'; ov.dataset.k = ''; };
    ov.querySelector('.x').onclick = () => { ov.style.display = 'none'; oc.innerHTML = ''; ov.dataset.k = ''; };
    // the details card, built by the same code as on the published page (card.js): the same links as buttons, the contact button and the Photos tab
    const infoCard = async () => {
      const i = t.info, en = tourLang(t) === 'en', ch = cOk ? contactHref(t.contact) : '', iu = await fileUrl(t.id + ':infoimg');
      if (cur !== t) return;
      const o = { info: i, title: t.title || t.name || '', img: iu, photos: !!t.photos.on, photosHtml: '<div class="photoMsg" dir="auto">' + esc(L('photosPrevNote')) + '</div>', lang: en ? 'en' : 'he', icon: k => ICONS[k] };
      o.cta = G360Card.cta(t.contact, ch, o.lang, o.icon);
      const hasDet = G360Card.hasDetails(o), pho = o.photos;
      openOv(G360Card.html(o));
      ov.dataset.k = 'info';
      const show = k => { G360Card.show(oc, k); ov.dataset.pane = k; };
      oc.querySelectorAll('.cardTabs button').forEach(b => { b.onclick = () => show(b.dataset.p); });
      show(hasDet ? (ov.dataset.pane === 'p' && pho ? 'p' : 'd') : 'p');
    };
    bi.onclick = () => { ov.dataset.pane = ''; infoCard(); };
    if (wantCard || (ov.style.display === 'flex' && ov.dataset.k === 'info')) { wantCard = false; if (hasInfo) infoCard(); else if (ov.dataset.k === 'info') { ov.style.display = 'none'; oc.innerHTML = ''; ov.dataset.k = ''; } }   // an open card follows the edits
    bv.onclick = async () => {
      if (!t.videos.length) return;
      if (prevAudio) stopPrev();
      const urls = []; for (const v of t.videos) urls.push(await fileUrl(t.id + ':video:' + v.id));
      const menu = t.vidMode === 'menu' && t.videos.length > 1;
      const show = k => {
        const vtabs = t.videos.length > 1 && !menu ? '<div class="tabs"></div>' : '';
        openOv('<h3 dir="auto" style="margin:0 34px 8px 0">' + esc(t.videos[k].name) + '</h3><video controls autoplay playsinline></video>' + vtabs);
        oc.querySelector('video').src = urls[k];
        const tb = oc.querySelector('.tabs'); if (tb) t.videos.forEach((v, j) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = v.name || ('#' + (j + 1)); b.dir = 'auto'; if (j === k) b.className = 'on'; b.onclick = () => show(j); tb.appendChild(b); });
      };
      if (!menu) { show(0); return; }
      const vm = $('lvPVm'); if (vm.style.display === 'block') { vm.style.display = 'none'; return; }
      vm.innerHTML = ''; t.videos.forEach((v, j) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = v.name || ('#' + (j + 1)); b.dir = 'auto'; b.onclick = () => { vm.style.display = 'none'; show(j); }; vm.appendChild(b); });
      const r = bv.getBoundingClientRect(), st = $('lvStage').getBoundingClientRect(); vm.style.display = 'block';
      if ((t.btnPos || {}).video === 'r') { vm.style.left = 'auto'; vm.style.right = (t.btnOff ? t.btnOff.side : 14) + 'px'; vm.style.top = (r.bottom - st.top + 8) + 'px'; } else { vm.style.right = 'auto'; vm.style.left = (r.right - st.left + 8) + 'px'; vm.style.top = (r.top - st.top) + 'px'; }
    };
    $('lvPVm').style.display = 'none';
    { const sm = $('lvPSm'), sb = $('lvPSpot'); sm.innerHTML = ''; sm.style.display = 'none';   // the jump points list: a click shows that place in the preview
      t.spots.list.filter(x => x.ss).forEach(x => { const b = document.createElement('button'); b.type = 'button'; b.dir = 'auto'; b.textContent = x.name || ('#' + x.ss); b.onclick = () => { sm.style.display = 'none'; previewSpot(t, x); }; sm.appendChild(b); });
      sb.onclick = () => { if (!sm.children.length) return; if (sm.style.display === 'block') { sm.style.display = 'none'; return; } const r = sb.getBoundingClientRect(), st = $('lvStage').getBoundingClientRect(); sm.style.display = 'block';
        if ((t.btnPos || {}).spots === 'r') { sm.style.left = 'auto'; sm.style.right = (t.btnOff ? t.btnOff.side : 14) + 'px'; sm.style.top = (r.bottom - st.top + 8) + 'px'; } else { sm.style.right = 'auto'; sm.style.left = (r.right - st.left + 8) + 'px'; sm.style.top = (r.top - st.top) + 'px'; } }; }
    tm.innerHTML = ''; tm.style.display = 'none';
    tl.forEach(x => { const b = document.createElement('button'); b.type = 'button'; b.textContent = x.name; b.onclick = () => { tm.style.display = 'none'; pvModel = x.id; preview(true); }; tm.appendChild(b); });
    bt.onclick = () => { tm.style.display = tm.style.display === 'none' ? 'block' : 'none'; const r = bt.getBoundingClientRect(), st = $('lvStage').getBoundingClientRect(); if ((t.btnPos || {}).tours === 'r') { tm.style.left = 'auto'; tm.style.right = (t.btnOff ? t.btnOff.side : 14) + 'px'; tm.style.top = (r.bottom - st.top + 8) + 'px'; } else { tm.style.right = 'auto'; tm.style.left = (r.right - st.left + 8) + 'px'; tm.style.top = (r.top - st.top) + 'px'; } };
    if (lu) { const w = $('lvPCtl').offsetWidth; if (t.logo.pos === 'tr') lg.style.right = (w ? w + t.logo.side + 8 : t.logo.side) + 'px'; }
    $('lvPContact').style.display = 'none';





    const mp = $('lvPMini');
    let fu = '';
    if (t.mini.on) for (let i = 0; i < t.mini.floors.length && !fu; i++) fu = await fileUrl(t.id + ':floor:' + i);
    if (cur !== t) return;
    mp.style.display = fu ? 'block' : 'none';
    if (fu) { mp.querySelector('img').src = fu; mp.querySelector('span').textContent = L('previewNote'); mp.style.width = t.mini.w + 'px'; mp.style.top = mp.style.bottom = mp.style.left = mp.style.right = ''; mp.style[t.mini.pos[0] === 't' ? 'top' : 'bottom'] = t.mini.pos[0] === 't' ? '14px' : '70px'; mp.style[t.mini.pos[1] === 'l' ? 'left' : 'right'] = '14px'; }
    const bd = []; if (t.nadir.on) bd.push(L('bNadir')); if (fu && t.mini.floors.some(f => f.calib)) bd.push(L('bMiniCal'));
    $('lvPBadges').innerHTML = bd.map(x => '<span>' + esc(x) + '</span>').join('');
  }

