  // ---- copy / paste the settings of one tour into another (not the name, address, model, extra tours, videos or map floors) ----
  const CPS = ['logo', 'welcome', 'music', 'nadir', 'mini', 'info', 'contact', 'icons', 'btnPos', 'btnOff', 'vidMode', 'btnLbl', 'btnSty', 'btnOrder', 'uiLang', 'mp'];   // (the on/off of the videos and extra-tours sections stays with each tour)
  let cpClip = null;
  const cpPick = (s, k) => k === 'mp' ? { mp: s.mp, extra: s.extra || '' } : k === 'mini' ? { mini: { on: s.mini.on, pos: s.mini.pos, w: s.mini.w, open: s.mini.open } } : { [k]: s[k] };
  async function cpCopy(t) {
    const clip = { from: t.name || t.client || t.slug || '', at: Date.now(), data: {}, files: {} };
    CPS.forEach(k => Object.assign(clip.data, JSON.parse(JSON.stringify(cpPick(t, k)))));
    for (const k of ['logo', 'music', 'nadir']) { const m = await fileMeta(t.id + ':' + k); if (m && m.blob) clip.files[k] = m; }
    cpClip = clip; try { await db.kset('settingsClip', clip); } catch (e) {}
    msg(L('cpCopied', clip.from));
  }
  async function cpPaste(t) {
    if (t.locked) return;
    if (!cpClip) { try { cpClip = await db.kget('settingsClip'); } catch (e) {} }
    if (!cpClip) { msg(L('cpNone'), true); return; }
    const d = cpClip.data, ov = document.createElement('div'), bx = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99999;display:flex;align-items:center;justify-content:center';
    bx.style.cssText = 'background:var(--panel,var(--card,#1d2128));color:var(--ink,#eee);border:1px solid var(--line,#444);border-radius:12px;padding:16px;max-width:380px;width:92%;display:flex;flex-direction:column;gap:8px;direction:' + (he() ? 'rtl' : 'ltr');
    bx.innerHTML = '<b></b>'; bx.firstChild.textContent = L('cpPasteT', cpClip.from); ov.appendChild(bx);
    const boxes = CPS.map(k => { if (d[k] === undefined) return null; const l = document.createElement('label'); l.className = 'tgl'; l.style.display = 'flex'; l.innerHTML = '<input type="checkbox" checked> <span></span>'; l.lastChild.textContent = L('cpS_' + k); bx.appendChild(l); return l.firstChild; });
    const nt = document.createElement('div'); nt.className = 'note'; nt.textContent = L('cpNote'); bx.appendChild(nt);
    const rw = document.createElement('div'); rw.className = 'row'; rw.style.cssText = 'display:flex;gap:12px;margin-top:8px'; rw.innerHTML = '<button type="button"></button><button type="button"></button>'; bx.appendChild(rw);
    rw.firstChild.textContent = L('cpGo'); rw.lastChild.textContent = L('cpCancel'); rw.lastChild.onclick = () => ov.remove(); ov.onclick = e => { if (e.target === ov) ov.remove(); };
    rw.firstChild.onclick = async () => {
      const sel = CPS.filter((k, i) => boxes[i] && boxes[i].checked);
      for (const k of sel) {
        if (k === 'mp') { t.mp = Object.assign({}, d.mp); t.extra = d.extra || ''; }
        else if (k === 'mini') t.mini = Object.assign({}, t.mini, d.mini);
        else t[k] = JSON.parse(JSON.stringify(d[k]));
        if (cpClip.files && cpClip.files[k]) { await db.fset(t.id + ':' + k, cpClip.files[k]); forgetUrl(t.id + ':' + k); }
      }
      ov.remove(); if (!sel.length) return;
      normTour(t); save(t); stopPrev(); await renderEdit(); preview(true); msg(L('cpPasted', sel.length));
    };
    document.body.appendChild(ov);
  }
  async function renderEdit() {
    const box = $('lvEdit'), t = cur;
    box.innerHTML = '';
    if (!t) { box.innerHTML = '<div class="note" style="padding:8px">' + esc(L('pickTour')) + '</div>'; return; }
    const tok = (box.dataset.tok = String(Math.random()));
    const alive = () => box.dataset.tok === tok && cur === t;

    // details
    let s = sec('lvSecD', L('sDetails')); box.appendChild(s);
    const nm = field(s, L('name'), '<input type="text">'); nm.value = t.name; nm.oninput = () => { t.name = nm.value; if (!t.slugTouched && !t.slug) {} save(t); };
    const cl = field(s, L('client'), '<input type="text">'); cl.value = t.client; cl.oninput = () => { t.client = cl.value; save(t); };
    const md = field(s, L('model'), '<input type="url" dir="ltr" spellcheck="false" placeholder="https://my.matterport.com/show/?m=…">'); md.value = t.model ? 'https://my.matterport.com/show/?m=' + t.model : '';
    const mdN = document.createElement('div'); mdN.className = 'note'; s.appendChild(mdN);
    md.onchange = () => { const id = modelId(md.value); mdN.textContent = md.value.trim() && !id ? L('modelBad') : ''; mdN.className = 'note warn'; if (id) { t.model = id; pvModel = null; md.value = 'https://my.matterport.com/show/?m=' + id; save(t); preview(true); sl.placeholder = id.toLowerCase(); showLink(); syncActs(); } };
    const sl = field(s, L('slug'), '<input type="text" dir="ltr" spellcheck="false">'); sl.value = t.slug; sl.placeholder = t.model ? t.model.toLowerCase() : 'dganya-2-raanana';
    const slN = document.createElement('div'); slN.className = 'note'; s.appendChild(slN);
    const showLink = () => {
      const v = sl.value.trim().toLowerCase(), eff = v || slugOf({ model: t.model });
      if (v && !slugOk(v)) { slN.className = 'note warn'; slN.textContent = L('slugBad'); return; }
      if (slugTaken(t, eff)) { slN.className = 'note warn'; slN.textContent = L('slugDup'); return; }
      slN.className = 'note ltr'; slN.textContent = eff ? settings.base.replace(/\/?$/, '/') + '?t=' + eff + (v ? '' : '   \u00b7   ' + L('slugAuto')) : '';
    };
    sl.oninput = () => { sl.value = sl.value.toLowerCase().replace(/\s+/g, '-'); const v = sl.value.trim(); if (!v || (slugOk(v) && !slugTaken(t, v))) { t.slug = v; save(t); } showLink(); syncActs(); };
    showLink();









    const pt = field(s, L('pageTitle'), '<input type="text">'); pt.value = t.title; pt.oninput = () => { t.title = pt.value; save(t); };
    // the link preview (WhatsApp, Facebook): the page title above, this description and picture
    const shareD = field(s, L('shareDescL'), '<input type="text">'); shareD.value = t.shareDesc || ''; shareD.placeholder = L('shareDescPh'); shareD.oninput = () => { t.shareDesc = shareD.value; save(t); };
    { const sl = document.createElement('label'); sl.className = 'f'; sl.textContent = L('shareImgL'); s.appendChild(sl); }
    await fileRow(s, t.id + ':share', 'image/jpeg,image/png,.jpg,.jpeg,.png', imgOk, () => save(t), true); if (!alive()) return;
    { const sn = document.createElement('div'); sn.className = 'note'; sn.textContent = L('shareNote'); s.appendChild(sn); }

    // logo
    s = sec('lvSecL', L('sLogo'), true); box.appendChild(s); bindToggle(s, t.logo, t);
    await fileRow(s, t.id + ':logo', 'image/png,.png', pngOk, () => { save(t); preview(); }, true); if (!alive()) return;
    const lgn = document.createElement('div'); lgn.className = 'note'; lgn.textContent = L('logoNote'); s.appendChild(lgn);
    posRow(s, t.logo, t, [['tl', 'posTL'], ['tc', 'posTC'], ['tr', 'posTR']]);
    range(s, L.bind(null, 'width'), 60, 360, 5, t.logo.w, v => { t.logo.w = v; save(t); preview(); });
    range(s, v => L('logoMw', v), 0, 300, 5, +t.logo.mw || 0, v => { t.logo.mw = v; save(t); });   // on a phone: at most this wide (0 = about a third of the screen)
    range(s, v => L('logoTop', v), 0, 200, 2, t.logo.top, v => { t.logo.top = v; save(t); preview(); });
    range(s, v => L('logoSide', v), 0, 120, 2, t.logo.side, v => { t.logo.side = v; save(t); preview(); });
    { const sn = document.createElement('div'); sn.className = 'note'; sn.textContent = L('logoSideNote'); s.appendChild(sn); }
    range(s, v => L('logoTr', v), 0, 90, 5, t.logo.tr || 0, v => { t.logo.tr = v; save(t); preview(); });
    const cd = document.createElement('label'); cd.className = 'tgl'; cd.style.marginTop = '8px'; cd.innerHTML = '<input type="checkbox"> ' + esc(L('card')); s.appendChild(cd);
    cd.querySelector('input').checked = !!t.logo.card; cd.querySelector('input').onchange = e => { t.logo.card = e.target.checked; save(t); preview(); };
    const ll = field(s, L('logoLink'), '<input type="url" dir="ltr" spellcheck="false" placeholder="https://">'); ll.value = t.logo.link || ''; ll.oninput = () => { t.logo.link = ll.value.trim(); save(t); };
    const sd = document.createElement('label'); sd.className = 'tgl'; sd.style.marginTop = '8px'; sd.innerHTML = '<input type="checkbox"> ' + esc(L('logoAsSplash')); s.appendChild(sd);
    sd.querySelector('input').checked = !!t.logo.asSplash; sd.querySelector('input').onchange = e => { t.logo.asSplash = e.target.checked; save(t); };

    // opening caption: a title and text in a bottom corner, closing a few seconds after Play
    s = sec('lvSecW', L('sWelcome'), true); box.appendChild(s); bindToggle(s, t.welcome, t);
    { const wt = field(s, L('welTitle'), '<input type="text" dir="auto">'); wt.placeholder = L('welTitlePh'); wt.value = t.welcome.title || ''; wt.oninput = () => { t.welcome.title = wt.value; save(t); preview(); };
      const wx = field(s, L('welText'), '<textarea dir="auto" rows="2"></textarea>'); wx.placeholder = L('welTextPh'); wx.value = t.welcome.text || ''; wx.oninput = () => { t.welcome.text = wx.value; save(t); preview(); };
      posRow(s, t.welcome, t, [['l', 'welL'], ['r', 'welR']]);
      range(s, v => L('welBottom', v), 0, 400, 2, t.welcome.bottom == null ? 64 : +t.welcome.bottom, v => { t.welcome.bottom = v; save(t); preview(); });
      range(s, v => L('welSecs', v), 1, 30, 1, +t.welcome.secs || 6, v => { t.welcome.secs = v; save(t); });
      const wn = document.createElement('div'); wn.className = 'note'; wn.textContent = L('welNote'); s.appendChild(wn); }

    // music
    s = sec('lvSecM', L('sMusic'), true); box.appendChild(s); bindToggle(s, t.music, t, stopPrev);
    await fileRow(s, t.id + ':music', 'audio/*', audioOk, () => { stopPrev(); save(t); preview(); }, false); if (!alive()) return;
    range(s, L.bind(null, 'vol'), 0, 100, 1, t.music.vol, v => { t.music.vol = v; if (prevAudio) prevAudio.volume = v / 100; save(t); });
    const mn = document.createElement('div'); mn.className = 'note'; mn.textContent = L('musicNote'); s.appendChild(mn);

    // nadir
    s = sec('lvSecN', L('sNadir'), true); box.appendChild(s); bindToggle(s, t.nadir, t);
    await fileRow(s, t.id + ':nadir', 'image/*', imgOk, () => { save(t); preview(); }, true); if (!alive()) return;
    range(s, L.bind(null, 'size'), .3, 2, .05, t.nadir.size, v => { t.nadir.size = v; save(t); });
    range(s, L.bind(null, 'opacity'), 20, 100, 5, t.nadir.opacity, v => { t.nadir.opacity = v; save(t); });
    const nn = document.createElement('div'); nn.className = 'note' + (settings.sdk ? '' : ' warn'); nn.textContent = L('nadirNote'); s.appendChild(nn);

    // mini map
    s = sec('lvSecP', L('sMini'), true); box.appendChild(s); bindToggle(s, t.mini, t);
    posRow(s, t.mini, t);
    range(s, L.bind(null, 'width'), 140, 420, 10, t.mini.w, v => { t.mini.w = v; save(t); preview(); });
    const mo = document.createElement('label'); mo.className = 'tgl'; mo.style.marginTop = '8px'; mo.innerHTML = '<input type="checkbox"> ' + esc(L('miniOpen')); s.appendChild(mo);
    mo.querySelector('input').checked = t.mini.open !== false; mo.querySelector('input').onchange = e => { t.mini.open = e.target.checked; save(t); };
    const fh = document.createElement('label'); fh.className = 'f'; fh.textContent = L('floors'); s.appendChild(fh);
    for (let i = 0; i < t.mini.floors.length; i++) {
      const f = t.mini.floors[i], fb = document.createElement('div'); fb.className = 'flr'; s.appendChild(fb);
      const top = document.createElement('div'); top.className = 'row'; fb.appendChild(top);
      top.innerHTML = '<input type="text" style="flex:1;min-width:120px"><span class="note ' + (f.calib && f.calib.length >= 3 ? 'ok' : '') + '">' + esc(f.calib && f.calib.length >= 3 ? L('calOk') : L('calNo')) + '</span><button type="button">' + esc(L('del')) + '</button>';
      const fi = top.querySelector('input'); fi.placeholder = L('floorN', i + 1); fi.value = f.label || ''; fi.oninput = () => { f.label = fi.value; save(t); };
      top.querySelector('button').onclick = async () => {
        for (let j = i; j < t.mini.floors.length; j++) { const k = t.id + ':floor:' + j, nk = t.id + ':floor:' + (j + 1), nx = await fileMeta(nk); forgetUrl(k); if (nx) await db.fset(k, nx); else await db.fdel(k); }
        t.mini.floors.splice(i, 1); save(t); renderEdit(); preview();
      };
      await fileRow(fb, t.id + ':floor:' + i, 'image/*', imgOk, () => { f.calib = null; save(t); preview(); }, true); if (!alive()) return;
    }
    const af = document.createElement('div'); af.className = 'row'; af.innerHTML = '<button type="button">' + esc(L('addFloor')) + '</button>'; s.appendChild(af);
    af.querySelector('button').onclick = () => { t.mini.floors.push({ label: '', calib: null }); save(t); renderEdit(); };
    const mnote = document.createElement('div'); mnote.className = 'note'; mnote.textContent = L('miniNote') + ' ' + L('miniNoCal'); s.appendChild(mnote);
    const ch = document.createElement('label'); ch.className = 'f'; ch.textContent = L('calHead'); s.appendChild(ch);
    const cs = document.createElement('div'); cs.className = 'note' + (settings.sdk ? '' : ' warn'); cs.textContent = L('calSteps') + (settings.sdk ? '' : ' ' + L('sdkNeed')); s.appendChild(cs);
    const co = document.createElement('div'); co.className = 'row'; co.innerHTML = '<button type="button">' + esc(L('calOpen')) + '</button>'; s.appendChild(co);
    co.querySelector('button').dataset.calopen = '1'; co.querySelector('button').onclick = () => window.open(siteLink(t) + '&calib=1', '_blank', 'noopener');
    const ta = document.createElement('textarea'); ta.placeholder = L('calPaste'); s.appendChild(ta); ta.style.marginTop = '6px';
    const ca = document.createElement('div'); ca.className = 'row'; ca.innerHTML = '<button type="button">' + esc(L('calApply')) + '</button>'; s.appendChild(ca);
    ca.querySelector('button').onclick = () => {
      const v = ta.value.trim().replace(/^G360CAL:/, ''); let o;
      try { o = JSON.parse(v); } catch (e) { msg(L('calBad'), true); return; }
      let n = 0;
      Object.keys(o || {}).forEach(k => { const i = +k, c = o[k]; if (t.mini.floors[i] && Array.isArray(c) && c.length >= 3 && c.every(p => Array.isArray(p) && p.length === 4 && p.every(Number.isFinite))) { t.mini.floors[i].calib = c.slice(0, 3); n++; } });
      if (!n) { msg(L('calBad'), true); return; }
      save(t); msg(L('calDone', n)); renderEdit();
    };

    // the contact details (kind, number, message): the same fields in the details card and in the contact button's card, kept in step
    const ctSync = () => box.querySelectorAll('[data-ct]').forEach(e => { const k = e.dataset.ct; if (e !== document.activeElement) e.value = t.contact[k] || (k === 'type' ? 'wa' : ''); if (k === 'value') e.placeholder = L('cV_' + t.contact.type); if (k === 'label') e.placeholder = L('cD_' + t.contact.type); const w = e.closest('[data-ctmsg]'); if (w) w.style.display = t.contact.type === 'wa' ? '' : 'none'; });
    const ctFields = (parent, withLabel) => {
      const cty = field(parent, L('cType'), '<select style="width:100%" data-ct="type"><option value="wa"></option><option value="tel"></option><option value="mail"></option><option value="link"></option></select>');
      ['wa', 'tel', 'mail', 'link'].forEach((k, i) => { cty.options[i].textContent = L('cT_' + k); });
      cty.onchange = () => { t.contact.type = cty.value; ctSync(); save(t); preview(); };
      const cvl = field(parent, L('cValue'), '<input type="text" dir="ltr" data-ct="value">'); cvl.oninput = () => { t.contact.value = cvl.value; ctSync(); save(t); preview(); };
      const cmw = document.createElement('div'); cmw.dataset.ctmsg = '1'; parent.appendChild(cmw);
      const cms = field(cmw, L('cMsg'), '<input type="text" data-ct="msg">'); cms.oninput = () => { t.contact.msg = cms.value; ctSync(); save(t); };
      if (withLabel) { const clb = field(parent, L('cLabel'), '<input type="text" data-ct="label">'); clb.oninput = () => { t.contact.label = clb.value; ctSync(); save(t); preview(); }; }
      ctSync();
    };
    // details card: hide Matterport's own card and/or build ours as a layer over the tour
    s = sec('lvSecI', L('sInfo')); box.appendChild(s);
    const mkChk = (parent, label, get, set, rerender) => { const c = document.createElement('label'); c.className = 'tgl'; c.style.display = 'flex'; c.style.marginTop = '6px'; c.innerHTML = '<input type="checkbox"> ' + esc(label); parent.appendChild(c); const i = c.querySelector('input'); i.checked = !!get(); i.onchange = () => { set(i.checked); save(t); if (rerender) { preview(true); renderEdit(); } else preview(); }; return c; };
    mkChk(s, L('infoHideMp'), () => !(+t.mp.title) && !(+t.mp.brand), v => { t.mp.title = v ? 0 : 1; t.mp.brand = 0; }, true);
    const iw = document.createElement('div'); iw.style.display = t.info.on ? '' : 'none';
    mkChk(s, L('infoCustom'), () => t.info.on, v => { t.info.on = v; iw.style.display = v ? '' : 'none'; if (v) wantCard = true; }, false);
    s.appendChild(iw);
    iw.addEventListener('focusin', () => { const o = $('lvPOv'); if (o.style.display !== 'flex' || o.dataset.k !== 'info') openInfoCard(); });   // while the card is being filled in, the preview shows it as the visitor will
    iconRow(iw, 'info', t);
    const fi = (key, lbl, html) => { const e = field(iw, lbl, html); e.value = t.info[key] || ''; e.oninput = () => { t.info[key] = e.value; save(t); preview(); }; return e; };
    fi('title', L('infoTitleL'), '<input type="text">');
    const itx = fi('text', L('infoTextL'), '<textarea></textarea>'); itx.style.cssText = 'direction:rtl;font-family:inherit;font-size:.88rem;height:90px';
    fi('phone', L('infoPhoneL'), '<input type="text" dir="ltr">');
    fi('mail', L('infoMailL'), '<input type="text" dir="ltr">');
    fi('link', L('infoLinkL'), '<input type="url" dir="ltr" placeholder="https://">');
    fi('linkTxt', L('infoLinkTxtL'), '<input type="text">');
    fi('address', L('infoAddrL'), '<input type="text">');
    { const il = document.createElement('label'); il.className = 'f'; il.textContent = L('infoImgL'); iw.appendChild(il); }
    await fileRow(iw, t.id + ':infoimg', 'image/*', imgOk, () => { save(t); preview(); }, true); if (!alive()) return;
    const pw = document.createElement('div'); pw.style.display = t.photos.on ? '' : 'none';
    mkChk(iw, L('infoPhotos'), () => t.photos.on, v => { t.photos.on = v; pw.style.display = v ? '' : 'none'; }, false);
    iw.appendChild(pw);
    mkChk(pw, L('infoOnly360'), () => t.photos.only360, v => { t.photos.only360 = v; }, false);
    { const pn = document.createElement('div'); pn.className = 'note' + (settings.sdk ? '' : ' warn'); pn.textContent = L('infoPhotosNote'); pw.appendChild(pn); }
    // contact button, inside the details card
    const cw = document.createElement('div'); cw.className = 'cbox'; iw.appendChild(cw);
    const ctg = document.createElement('label'); ctg.className = 'tgl'; ctg.innerHTML = '<input type="checkbox"> ' + esc(L('sContact')); cw.appendChild(ctg);
    const cin = document.createElement('div'); cw.appendChild(cin); cin.style.display = t.contact.on ? '' : 'none';
    ctg.querySelector('input').checked = !!t.contact.on;
    ctg.querySelector('input').onchange = e => { t.contact.on = e.target.checked; cin.style.display = t.contact.on ? '' : 'none'; save(t); preview(); };
    const cnote = document.createElement('div'); cnote.className = 'note'; cnote.textContent = L('contactNote'); cin.appendChild(cnote);
    ctFields(cin, true);















    // additional tours (a selector appears on the page)
    // where the round buttons sit: left (under Matterport's logo and title) or right
    s = sec('lvSecB', L('sBtnPos')); box.appendChild(s);
    // one card per button, in the order they appear on the page; drag a card by its handle (or use the arrows) to change the order
    const BLK = { title: 'bpTitle', info: 'bpInfo', video: 'bpVideo', tours: 'bpTours', music: 'bpMusic', spots: 'bpSpots', contact: 'bpContact' };
    { const on = document.createElement('div'); on.className = 'note'; on.textContent = L('boNote'); s.appendChild(on); }
    let dragK = null;
    const moveBtn = (k, to) => { if (t.locked) return; const o = t.btnOrder.filter(x => x !== k); o.splice(Math.max(0, Math.min(o.length, to)), 0, k); t.btnOrder = o; save(t); renderEdit(); preview(); };
    t.btnOrder.forEach((k, idx) => {
      const lk = BLK[k], g = document.createElement('div'); g.className = 'bgrp'; s.appendChild(g);
      const hd = document.createElement('div'); hd.className = 'bhd'; hd.innerHTML = '<span class="grip" title="">\u2807</span><b></b><span class="sp"></span><button type="button" data-u>\u25b2</button><button type="button" data-d>\u25bc</button>'; g.appendChild(hd);
      hd.querySelector('b').textContent = L(lk); hd.querySelector('.grip').title = L('boDrag'); hd.querySelector('[data-u]').title = L('boUp'); hd.querySelector('[data-d]').title = L('boDown');
      hd.querySelector('[data-u]').disabled = idx === 0; hd.querySelector('[data-d]').disabled = idx === t.btnOrder.length - 1;
      hd.querySelector('[data-u]').onclick = () => moveBtn(k, idx - 1); hd.querySelector('[data-d]').onclick = () => moveBtn(k, idx + 1);
      hd.draggable = !t.locked;   // the card's title row is the handle (the sliders and text fields below keep working)
      hd.ondragstart = e => { dragK = k; g.classList.add('drag'); try { e.dataTransfer.setData('text/plain', k); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setDragImage(g, 20, 14); } catch (x) {} };
      hd.ondragend = () => { dragK = null; g.classList.remove('drag'); };
      g.ondragover = e => { if (dragK && dragK !== k) { e.preventDefault(); g.classList.add('over'); } };
      g.ondragleave = () => g.classList.remove('over');
      g.ondrop = e => { e.preventDefault(); g.classList.remove('over'); if (dragK && dragK !== k) { moveBtn(dragK, idx); } };
      const sel = field(g, L('boSide'), '<select style="width:100%"><option value="l"></option><option value="r"></option></select>');
      sel.options[0].textContent = L('posLeft'); sel.options[1].textContent = L('posRight'); sel.value = t.btnPos[k] === 'r' ? 'r' : 'l';
      sel.onchange = () => { t.btnPos[k] = sel.value; save(t); preview(); };
      // name (not for music: an icon only), background colour and its transparency, per button
      const bs = t.btnSty[k], bx = document.createElement('div'); bx.className = 'bsty'; g.appendChild(bx);
      if (k === 'title') {   // a button that only shows the tour's name, optionally a link; switched off by default
        const on = document.createElement('label'); on.className = 'tgl'; on.style.marginTop = '6px'; on.innerHTML = '<input type="checkbox"> ' + esc(L('ttlOn')); bx.appendChild(on);
        on.querySelector('input').checked = !!bs.on; on.querySelector('input').onchange = e => { bs.on = e.target.checked; save(t); preview(); };
      }
      if (k === 'contact') {   // the contact button in the row (WhatsApp, a call, an email or a link); switched off by default
        const on = document.createElement('label'); on.className = 'tgl'; on.style.marginTop = '6px'; on.innerHTML = '<input type="checkbox"> ' + esc(L('ctBtnOn')); bx.appendChild(on);
        const cf = document.createElement('div'); cf.style.display = bs.on ? '' : 'none';
        on.querySelector('input').checked = !!bs.on; on.querySelector('input').onchange = e => { bs.on = e.target.checked; cf.style.display = bs.on ? '' : 'none'; save(t); preview(); };
        bx.appendChild(cf); ctFields(cf, false);
        const cn = document.createElement('div'); cn.className = 'note'; cn.textContent = L('ctBtnNote'); cf.appendChild(cn);
      }
      if (k === 'spots') { const sn = document.createElement('div'); sn.className = 'note'; sn.textContent = L('spBtnNote'); bx.appendChild(sn); }
      if (k !== 'music') { const ln = field(bx, L('bsLbl'), '<input type="text" dir="auto" spellcheck="false">'); ln.placeholder = k === 'contact' ? (t.contact.label || L('cD_' + t.contact.type)) : L(k === 'title' ? 'ttlPh' : 'bsLblPh'); ln.value = bs.lbl || ''; ln.oninput = () => { bs.lbl = ln.value.trim(); save(t); preview(); }; }
      if (k === 'title') { const li = field(bx, L('ttlLink'), '<input type="url" dir="ltr" spellcheck="false" placeholder="https://">'); li.value = bs.link || ''; li.oninput = () => { bs.link = li.value.trim(); save(t); }; }
      const cr = document.createElement('div'); cr.className = 'row'; cr.innerHTML = '<label class="f" style="margin:0"></label><input type="color"><button type="button"></button>'; bx.appendChild(cr);
      cr.children[0].textContent = L('bsCol'); cr.children[2].textContent = L('bsDef');
      const ci = cr.children[1]; ci.value = bs.bg || '#14181b'; ci.oninput = () => { bs.bg = ci.value; save(t); preview(); };
      cr.children[2].onclick = () => { bs.bg = ''; bs.tr = 28; save(t); renderEdit(); preview(); };
      range(bx, v => L('bsTr', v), 0, 90, 2, bs.tr, v => { bs.tr = v; save(t); preview(); });
      if (k !== 'music') range(bx, v => L('bsW', v), 0, 320, 5, +bs.w || 0, v => { bs.w = v; save(t); preview(); });   // 0 = as wide as its text
      if (k !== 'music') range(bx, v => L('bsR', v), 0, 20, 1, bs.r == null ? 20 : +bs.r, v => { bs.r = v; save(t); preview(); });   // 20 = fully round, 0 = square corners
    });
    { const bn = document.createElement('div'); bn.className = 'note'; bn.textContent = L('bsNote') + ' ' + L('bsWNote'); s.appendChild(bn); }
    const lgs = field(s, L('uiLangL'), '<select style="width:100%"><option value="auto"></option><option value="he"></option><option value="en"></option></select>');
    lgs.options[0].textContent = L('uiLangAuto'); lgs.options[1].textContent = 'עברית'; lgs.options[2].textContent = 'English'; lgs.value = t.uiLang || 'auto';
    lgs.onchange = () => { t.uiLang = lgs.value; save(t); preview(); };
    mkChk(s, L('btnLblOn'), () => t.btnLbl !== 'icon', v => { t.btnLbl = v ? 'both' : 'icon'; }, false);
    {
      const bo = t.btnOff, au = document.createElement('label'); au.className = 'tgl'; au.style.marginTop = '10px'; au.innerHTML = '<input type="checkbox"> ' + esc(L('bpAuto')); s.appendChild(au);
      range(s, v => L('bpTop', v), 0, 200, 2, bo.top < 0 ? 76 : bo.top, v => { bo.top = v; save(t); preview(); });
      const rt = s.lastElementChild; rt.disabled = bo.top < 0;
      au.querySelector('input').checked = bo.top < 0;
      au.querySelector('input').onchange = e => { bo.top = e.target.checked ? -1 : +rt.value; rt.disabled = e.target.checked; save(t); preview(); };
      range(s, v => L('bpSide', v), 0, 80, 2, bo.side, v => { bo.side = v; save(t); preview(); });
    }
    s = sec('lvSecT', L('sTours'), true); box.appendChild(s); bindToggle(s, t.tourSec, t);
    const tnote = document.createElement('div'); tnote.className = 'note'; tnote.textContent = L('toursNote'); s.appendChild(tnote);
    iconRow(s, 'tours', t);
    const mn2 = field(s, L('mainTourName'), '<input type="text">'); mn2.value = t.mainName || ''; mn2.placeholder = t.name || ''; mn2.oninput = () => { t.mainName = mn2.value; save(t); };
    t.tours.forEach((x, i) => {
      const fb = document.createElement('div'); fb.className = 'flr'; s.appendChild(fb);
      fb.innerHTML = '<div class="row"><input type="text" data-n style="flex:1;min-width:120px"><button type="button" data-p></button><button type="button" data-x>\u2715</button></div><input type="url" dir="ltr" spellcheck="false" data-m placeholder="https://my.matterport.com/show/?m=…" style="margin-top:6px">';
      const ni = fb.querySelector('[data-n]'), mi = fb.querySelector('[data-m]'), pb = fb.querySelector('[data-p]'), xb = fb.querySelector('[data-x]');
      ni.placeholder = L('tourNameL'); ni.value = x.name || ''; ni.oninput = () => { x.name = ni.value; save(t); };
      mi.value = x.model ? 'https://my.matterport.com/show/?m=' + x.model : '';
      mi.onchange = () => { const id = modelId(mi.value); if (id) { x.model = id; mi.value = 'https://my.matterport.com/show/?m=' + id; save(t); } else if (mi.value.trim()) msg(L('modelBad'), true); };
      pb.textContent = L('preview'); pb.onclick = () => { if (x.model) { pvModel = x.model; preview(true); } };
      xb.onclick = () => { t.tours.splice(i, 1); save(t); renderEdit(); };
    });
    const at = document.createElement('div'); at.className = 'row'; at.innerHTML = '<button type="button" data-a></button><button type="button" data-m></button>'; s.appendChild(at);
    at.querySelector('[data-a]').textContent = L('addTour'); at.querySelector('[data-a]').onclick = () => { t.tours.push({ name: '', model: '' }); t.tourSec.on = true; save(t); renderEdit(); };
    at.querySelector('[data-m]').textContent = L('prevMain'); at.querySelector('[data-m]').onclick = () => { pvModel = null; preview(true); };

    // jump points: places in the tour, each from a Matterport "link to this location" (Share → Link to this location)
    s = sec('lvSecS', L('sSpots'), true); box.appendChild(s); bindToggle(s, t.spots, t);
    { const sn = document.createElement('div'); sn.className = 'note'; sn.textContent = L('spotsNote'); s.appendChild(sn); }
    iconRow(s, 'spots', t);
    t.spots.list.forEach((x, i) => {
      const fb = document.createElement('div'); fb.className = 'flr'; s.appendChild(fb);
      fb.innerHTML = '<div class="row"><input type="text" dir="auto" data-n style="flex:1;min-width:120px"><button type="button" data-p></button><button type="button" data-u style="min-width:0;padding-inline:8px">\u25b2</button><button type="button" data-x style="min-width:0;padding-inline:8px">\u2715</button></div><input type="url" dir="ltr" spellcheck="false" data-l style="margin-top:6px"><div class="note" data-s></div>';
      const ni = fb.querySelector('[data-n]'), li = fb.querySelector('[data-l]'), st = fb.querySelector('[data-s]'), pb = fb.querySelector('[data-p]'), ub = fb.querySelector('[data-u]');
      ni.placeholder = L('spotNameL'); ni.value = x.name || ''; ni.oninput = () => { x.name = ni.value; save(t); preview(); };
      li.placeholder = L('spotLinkPh');
      const show = () => { li.value = x.ss ? 'https://my.matterport.com/show/?m=' + (x.m || t.model) + '&ss=' + x.ss + (x.sr ? '&sr=' + x.sr : '') : ''; const tn = x.m && x.m !== t.model ? (t.tours.find(o => o.model === x.m) || {}).name || x.m : ''; st.className = 'note' + (x.ss ? '' : ' warn'); st.textContent = x.ss ? L('spotOk', x.ss) + (tn ? ' \u00b7 ' + L('spotTour', tn) : '') : L('spotNone'); };
      li.onchange = () => { const v = spotParse(li.value); if (!v) { if (li.value.trim()) msg(L('spotBad'), true); show(); return; } x.ss = v.ss; x.sr = v.sr; x.m = v.m && v.m !== t.model ? v.m : ''; save(t); show(); preview(); };
      show();
      pb.textContent = L('preview'); pb.onclick = () => { if (x.ss) previewSpot(t, x); };
      ub.title = L('boUp'); ub.disabled = i === 0; ub.onclick = () => { t.spots.list.splice(i - 1, 0, t.spots.list.splice(i, 1)[0]); save(t); renderEdit(); preview(); };
      fb.querySelector('[data-x]').onclick = () => { t.spots.list.splice(i, 1); save(t); renderEdit(); preview(); };
    });
    { const ar = document.createElement('div'); ar.className = 'row'; ar.innerHTML = '<button type="button"></button>'; s.appendChild(ar); ar.firstChild.textContent = L('addSpot'); ar.firstChild.onclick = () => { t.spots.list.push({ name: '', ss: '', sr: '', m: '' }); t.spots.on = true; save(t); renderEdit(); preview(); }; }

    // videos (played by a stand-alone player on the page)
    s = sec('lvSecV', L('sVideos'), true); box.appendChild(s); bindToggle(s, t.vidSec, t);
    const vnote = document.createElement('div'); vnote.className = 'note'; vnote.textContent = L('videosNote'); s.appendChild(vnote);
    iconRow(s, 'video', t);
    const vms = field(s, L('vidModeL'), '<select style="width:100%"><option value="player"></option><option value="menu"></option></select>');
    vms.options[0].textContent = L('vidModePlayer'); vms.options[1].textContent = L('vidModeMenu'); vms.value = t.vidMode === 'menu' ? 'menu' : 'player';
    vms.onchange = () => { t.vidMode = vms.value; save(t); preview(); };
    t.videos.forEach((v, i) => {
      const fb = document.createElement('div'); fb.className = 'flr'; s.appendChild(fb);
      fb.innerHTML = '<div class="row"><input type="text" data-n style="flex:1;min-width:120px"><button type="button" data-x>\u2715</button></div><div class="note" data-f></div>';
      const ni = fb.querySelector('[data-n]'); ni.placeholder = L('videoNameL'); ni.value = v.name || ''; ni.oninput = () => { v.name = ni.value; save(t); };
      fileMeta(t.id + ':video:' + v.id).then(m => { const e = fb.querySelector('[data-f]'); if (e) e.textContent = m && m.blob ? m.name + ' \u00b7 ' + Math.max(1, Math.round(m.blob.size / 1048576)) + ' MB' : L('noFile'); });
      fb.querySelector('[data-x]').onclick = async () => { try { await db.fdel(t.id + ':video:' + v.id); } catch (e) {} forgetUrl(t.id + ':video:' + v.id); t.videos.splice(i, 1); save(t); renderEdit(); };
    });
    const av = document.createElement('div'); av.className = 'row'; av.innerHTML = '<button type="button"></button>'; s.appendChild(av);
    av.firstChild.textContent = L('addVideo');
    av.firstChild.onclick = () => {
      const inp = document.createElement('input'); inp.type = 'file'; inp.multiple = true; inp.accept = 'video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v';
      inp.onchange = async () => {
        for (const f of [...(inp.files || [])]) {
          if (!/\.(mp4|webm|mov|m4v)$/i.test(f.name)) { msg(L('videoBad'), true); continue; }
          const id = 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
          await db.fset(t.id + ':video:' + id, { blob: f, name: f.name, type: f.type, ts: Date.now() });
          t.videos.push({ id, name: f.name.replace(/\.[^.]+$/, '') });
        }
        t.vidSec.on = true; save(t); renderEdit();
      };
      inp.click();
    };

    // Matterport parameters
    s = sec('lvSecX', L('sMp')); box.appendChild(s);
    const chips = document.createElement('div'); chips.className = 'chips'; s.appendChild(chips);
    MP_KEYS.forEach(([k, lk]) => { const c = document.createElement('label'); c.className = 'tgl'; c.innerHTML = '<input type="checkbox"> ' + esc(L(lk)); chips.appendChild(c); const i = c.querySelector('input'); i.checked = !!+t.mp[k]; i.onchange = () => { t.mp[k] = i.checked ? 1 : 0; save(t); preview(true); }; });
    const ex = field(s, L('extra'), '<input type="text" dir="ltr" spellcheck="false" placeholder="lang=en&amp;ts=0">'); ex.value = t.extra || ''; ex.onchange = () => { t.extra = ex.value.trim(); save(t); preview(true); };

    // actions: publish and open on top, small icon buttons below
    const IC = { pub: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 20h14"/>', open: '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>', link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>', qr: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2h-2zM18 14h2M14 18h2M18 18h2v2h-2z"/>', dup: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/>', cpc: '<path d="M15 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/><rect x="8" y="8" width="13" height="13" rx="2.5"/><path d="M11 12.5h7M11 17h7"/><circle cx="14" cy="12.5" r="1.4" fill="currentColor"/><circle cx="16.5" cy="17" r="1.4" fill="currentColor"/>', cpp: '<path d="M9 3.5h6v3.5H9z"/><path d="M15 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"/><path d="M8.5 11h7M8.5 15.5h7"/><circle cx="12" cy="11" r="1.4" fill="currentColor"/><circle cx="10" cy="15.5" r="1.4" fill="currentColor"/><path d="M12 18v2.2M10.7 19l1.3 1.3 1.3-1.3"/>', del: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3"/>' };
    const mk = (cls, ic, label, text) => { const b = document.createElement('button'); b.type = 'button'; if (cls) b.className = cls; b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + IC[ic] + '</svg>' + (text ? '<span></span>' : ''); if (text) b.lastChild.textContent = text; b.title = label; b.setAttribute('aria-label', label); return b; };
    const act = document.createElement('div'); act.className = 'acts'; box.appendChild(act);
    const main = document.createElement('div'); main.className = 'main'; act.appendChild(main);
    const bPub = mk('pri', 'pub', L('pubOne'), L('pubOne')), bOpen = mk('', 'open', L('openSite'), L('openSite'));
    main.append(bPub, bOpen);
    const tl = document.createElement('div'); tl.className = 'tools'; act.appendChild(tl);
    IC.st = '<path d="M4 20h16"/><path d="M7 16v-5M12 16V6M17 16v-8"/>';
    const bStats = mk('', 'st', L('statsBtn')), bCopy = mk('', 'link', L('copyLink')), bShare = mk('', 'qr', L('shareBtn')), bDup = mk('', 'dup', L('dup')), bCpc = mk('', 'cpc', L('cpCopy')), bCpp = mk('', 'cpp', L('cpPaste')), bDel = mk('dng', 'del', L('remove'));
    const gp = () => { const g = document.createElement('i'); g.className = 'gap'; return g; }, spc = document.createElement('span'); spc.className = 'sp';
    tl.append(bCopy, bShare, bStats, gp(), bDup, bCpc, bCpp, spc, bDel);
    bCpc.querySelector('svg').style.color = '#5ec4b6'; bCpp.querySelector('svg').style.color = '#f2b04c';   // copy in teal, paste in amber
    syncActs = () => { const has = !!slugOf(t); bOpen.disabled = bCopy.disabled = bShare.disabled = !has; const cb = box.querySelector('[data-calopen]'); if (cb) cb.disabled = !has; };
    syncActs();
    bPub.onclick = () => publish([t]);
    bShare.onclick = () => openShare(t); bStats.onclick = () => openStats(t);
    bOpen.onclick = () => { if (!t.uploadedAt) msg(L('notUp')); window.open(siteLink(t), '_blank', 'noopener'); };
    bCopy.onclick = () => copyText(siteLink(t), L('linkCopied') + ' \u00b7 ' + siteLink(t));
    bDup.onclick = async () => {
      const c = JSON.parse(JSON.stringify(t)), o = newTour(); c.id = o.id; c.slug = uniqueSlug(slugOf(t) || 'tour'); c.name = (t.name || '') + ' (2)'; c.updated = Date.now(); c.publishedAt = c.uploadedAt = 0;
      for (const k of fileKeys(t)) { const m = await fileMeta(t.id + ':' + k); if (m) await db.fset(c.id + ':' + k, m); }
      tours.unshift(c); await db.put(c); select(c);
    };
    bCpc.onclick = () => cpCopy(t); bCpp.onclick = () => cpPaste(t);
    bDel.onclick = async () => {
      const others = tours.filter(o => o !== t), sl = t.upSlug, ml = String(t.model || '').toLowerCase();
      const onSrv = !!(sl && settings.upKey && settings.upOn !== false && !others.some(o => slugOf(o) === sl));   /* only a tour that was uploaded and whose address no other tour uses */
      const rm = onSrv && await g360Ask(L('delSrvAsk', settings.base.replace(/\/?$/, '/') + sl));
      clearTimeout(saveT); t.deleted = t.updated = Date.now(); await db.put(t); bkSoon();
      tours = others; trash.unshift(t); cur = null; stopPrev(); renderList(); renderEdit(); preview(true); msg(L('trashed'));
      if (!rm) return;
      const dirs = [sl]; if (ml && ml !== sl && slugOk(ml) && !others.some(o => slugOf(o) === ml || String(o.model || '').toLowerCase() === ml)) dirs.push(ml);   /* also the pointer for the old MPEmbed link */
      let err = '';
      for (const d of dirs) { try { const j = await upPost({ key: settings.upKey, action: 'rmtour', slug: d }); if (!j.ok && d === sl) err = j.error === 'action' ? L('srvOld') : j.error === 'key' ? L('pingKey') : String(j.error); } catch (e) { if (d === sl) err = e.message || String(e); } }
      if (err) { msg(L('delSrvFail', err), true); return; }
      t.upSlug = ''; t.uploadedAt = 0; db.put(t).catch(() => {}); msg(L('delSrvDone'));
    };
    // accordion: one section open at a time; the on/off switches in a header do not fold it
    { const sD = box.querySelector('#lvSecD'), sI = box.querySelector('#lvSecI'), sB = box.querySelector('#lvSecB'); if (sD && sI) sD.after(sI); if (sI && sB) sI.after(sB); }   // details card right under the tour details, then the button positions
    const secs = [...box.querySelectorAll('.sec')];
    const setOpen = id => { openSec = id; secs.forEach(x => { x.classList.toggle('closed', x.id !== id); const c = x.querySelector('.chev'); if (c) c.textContent = x.id === id ? '\u25be' : (he() ? '\u25c2' : '\u25b8'); }); };
    secs.forEach(x => {
      const h = x.querySelector('h4'); if (!h) return;
      const c = document.createElement('span'); c.className = 'chev'; h.insertBefore(c, h.firstChild);
      h.onclick = e => { if (e.target.closest('label, input')) return; setOpen(x.id === openSec ? '' : x.id); if (openSec === 'lvSecI') openInfoCard(); };
      const sw = h.querySelector('input[data-k=on]'); if (sw) sw.addEventListener('change', () => { if (sw.checked) setOpen(x.id); });
    });
    setOpen(secs.some(x => x.id === openSec) || openSec === '' ? openSec : 'lvSecD');
    // a locked tour (finished project) opens for viewing only: every setting is read-only until it is unlocked
    box.classList.toggle('ro', !!t.locked);
    if (t.locked) {
      secs.forEach(x => x.querySelectorAll('input, select, textarea, button').forEach(e => { e.disabled = true; }));
      bCpp.disabled = bDel.disabled = true;
      const rb = document.createElement('div'); rb.className = 'roBar'; rb.innerHTML = '<span></span><button type="button"></button>'; rb.firstChild.textContent = '\ud83d\udd12 ' + L('roNote'); rb.lastChild.textContent = L('roUnlock');
      rb.lastChild.onclick = async () => { if (!(await g360Ask(L('folderUnlockAsk', t.name || t.client || L('untitled'))))) return; t.locked = false; db.put(t).catch(() => {}); bkSoon(); renderList(); renderEdit(); };
      box.insertBefore(rb, box.firstChild);
    }
  }

