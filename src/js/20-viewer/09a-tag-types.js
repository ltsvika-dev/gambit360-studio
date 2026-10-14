  // ---- Tag types (electrical, plumbing…): optional, per project. Layers to show or hide each type, a quick mode (one click = one tag of a type),
  // and a PDF report of the tags with a picture of each one in the scan. A project without types works exactly as before. ----
  Object.assign(I18N.he, { tyLbl: 'סוג', tyNone: 'ללא סוג', tyEdit: 'סוגי תגיות…', tyEdH: 'סוגי תגיות בפרויקט', tyAdd: '+ סוג', tyInfra: 'הוספת סוגי תשתיות', tyNamePh: 'שם הסוג',
    tyHint: 'סוג קובע צבע ואייקון לתגית, ואפשר להציג או להסתיר כל סוג. בלי סוגים התגיות עובדות כרגיל.', tyDone: 'סגירה', tyDel: 'מחיקת הסוג (התגיות נשארות, בלי סוג)',
    quickOn: 'מצב מהיר', quickOff: 'סיום מצב מהיר', quickSay: n => 'מצב מהיר: כל לחיצה על הסריקה מוסיפה תגית "' + n + '". Esc לסיום.', layers: 'שכבות',
    repBtn: 'דוח PDF', repBusy: (i, n) => 'מכין את הדוח… ' + i + ' / ' + n, repNone: 'אין תגיות בשכבות המוצגות.', repTitle: 'דוח תגיות', repCount: n => n + ' תגיות',
    repFloor: 'קומה', repDate: 'תאריך', repPage: (i, n) => 'עמוד ' + i + ' מתוך ' + n, repDone: 'הדוח נשמר.', repNeed3D: 'הדוח נוצר מהסריקה בתלת-ממד: טענו מודל קודם.',
    infra: ['חשמל', 'אינסטלציה', 'ניקוז', 'מיזוג אוויר', 'גז', 'תקשורת', 'קונסטרוקציה'] });
  Object.assign(I18N.en, { tyLbl: 'Type', tyNone: 'No type', tyEdit: 'Tag types…', tyEdH: 'Tag types in this project', tyAdd: '+ Type', tyInfra: 'Add infrastructure types', tyNamePh: 'Type name',
    tyHint: 'A type gives a tag its colour and icon, and each type can be shown or hidden. Without types, tags work as before.', tyDone: 'Close', tyDel: 'Delete the type (its tags stay, with no type)',
    quickOn: 'Quick mode', quickOff: 'End quick mode', quickSay: n => 'Quick mode: every click on the scan adds a "' + n + '" tag. Esc to finish.', layers: 'Layers',
    repBtn: 'PDF report', repBusy: (i, n) => 'Making the report… ' + i + ' / ' + n, repNone: 'No tags in the layers shown.', repTitle: 'Tag report', repCount: n => n + ' tags',
    repFloor: 'Floor', repDate: 'Date', repPage: (i, n) => 'Page ' + i + ' of ' + n, repDone: 'The report was saved.', repNeed3D: 'The report is made from the 3D scan: load a model first.',
    infra: ['Electrical', 'Plumbing', 'Drainage', 'Air conditioning', 'Gas', 'Communication', 'Structure'] });
  const INFRA = [['#f2b705', 8], ['#2f80ed', 9], ['#8d6e63', 9], ['#00acc1', 0], ['#e65100', 5], ['#8e24aa', 2], ['#607d8b', 12]];   // colour and icon of each infrastructure type, in the order of t('infra')
  let tagTypes = [], hidTypes = new Set(), quickSel = '';
  const typesKey = () => 'tourViewerTagTypes:' + currentName;
  const typeOf = id => tagTypes.find(x => x.id === id) || null;
  const tagShown = tg => !hidTypes.has(typeOf(tg.ty) ? tg.ty : '');   // a tag of a type that no longer exists counts as one with no type
  const quickTy = () => (typeOf(quickSel) ? quickSel : '');
  const cleanType = x => ({ id:String(x.id || '').slice(0, 24), n:String(x.n || '').slice(0, 40), col:/^#[0-9a-f]{6}$/i.test(x.col || '') ? x.col : '#5ec4b6', icon:Math.max(0, Math.min(ICON_PATHS.length - 1, x.icon | 0)) });
  function setTagTypes(a, save) { tagTypes = Array.isArray(a) ? a.filter(x => x && x.id).map(cleanType) : []; hidTypes = new Set(); if (save) saveTagTypes(); tagTypesUI(); }
  function loadTagTypes() { let a = null; try { a = JSON.parse(localStorage.getItem(typesKey()) || 'null'); } catch (err) {} setTagTypes(a, false); }
  function saveTagTypes() { try { if (tagTypes.length) localStorage.setItem(typesKey(), JSON.stringify(tagTypes)); else localStorage.removeItem(typesKey()); } catch (err) {} }
  const canAddTags = () => !window.G360_CLIENT || clientTagsOn;

  // -- the tag editor: a type sets the colour and the icon (they can still be changed for one tag) --
  function fillTypeSel(cur) {
    const s = $('tagEdTy'); s.innerHTML = ''; $('tagEdTyRow').hidden = !tagTypes.length; $('tagEdTyL').textContent = t('tyLbl');
    [{ id:'', n:t('tyNone') }].concat(tagTypes).forEach(x => { const o = document.createElement('option'); o.value = x.id; o.textContent = x.n || '…'; s.appendChild(o); });
    s.value = typeOf(cur) ? cur : '';
  }
  function applyType(id) { const ty = typeOf(id); if (!ty) return; $('tagEdC').value = ty.col; tagIcon = ty.icon; }
  $('tagEdTy').onchange = () => { applyType($('tagEdTy').value); buildTagIcons(); };

  // -- quick mode: pick a type, then every click on the scan is a tag of that type, numbered, with no window in between --
  function quickPlace(p) {
    const ty = typeOf(quickTy()), base = ty ? ty.n : t('tagNew'), n = tags.filter(x => (x.ty || '') === (ty ? ty.id : '')).length + 1;
    tags.push(Object.assign({ n:(base + ' ' + n).slice(0, 80), d:'', url:'', img:'', icon:ty ? ty.icon : 0, col:ty ? ty.col : '#5ec4b6', p }, ty ? { ty:ty.id } : {}));
    renderTagEls(); saveTags(); viewsTab = 'tags'; renderViews(); say(t('quickSay', base));
  }
  function quickToggle() {
    if (placingTag && placingTag.quick) { endPlaceTag(); tagTypesUI(); return; }
    if (!started || !canAddTags()) return;
    $('tagEd').hidden = true; placingTag = { quick:true }; document.body.classList.add('placing'); if (renderer) renderer.domElement.style.cursor = TAG_CURSOR;
    const ty = typeOf(quickTy()); say(t('quickSay', ty ? ty.n : t('tagNew'))); tagTypesUI();
  }

  // -- the row in the Tags tab: layers (one switch per type), quick mode, the types window and the report --
  function tagTypesUI() {
    const box = $('tagTyRow'); if (!box) return;
    box.innerHTML = ''; box.hidden = viewsTab !== 'tags';
    if (tagTypes.length) {
      const lay = document.createElement('div'); lay.className = 'tyLayers'; lay.title = t('layers');
      tagTypes.concat(tags.some(x => !typeOf(x.ty)) ? [{ id:'', n:t('tyNone'), col:'#8e9aa1' }] : []).forEach(ty => {
        const l = document.createElement('label'), c = document.createElement('input'), dot = document.createElement('span'), nm = document.createElement('span');
        l.className = 'tyChip'; c.type = 'checkbox'; c.checked = !hidTypes.has(ty.id); dot.className = 'tyDot'; dot.style.background = ty.col;
        nm.textContent = ty.n + ' (' + tags.filter(x => (typeOf(x.ty) ? x.ty : '') === ty.id).length + ')';
        c.onchange = () => { if (c.checked) hidTypes.delete(ty.id); else hidTypes.add(ty.id); renderViews(); };
        l.append(c, dot, nm); lay.appendChild(l);
      });
      box.appendChild(lay);
    }
    const bar = document.createElement('div'); bar.className = 'tyBar';
    if (canAddTags()) {
      if (tagTypes.length) {
        const s = document.createElement('select'); s.id = 'tagQuickTy';
        [{ id:'', n:t('tyNone') }].concat(tagTypes).forEach(x => { const o = document.createElement('option'); o.value = x.id; o.textContent = x.n || '…'; s.appendChild(o); });
        s.value = quickTy(); s.onchange = () => { quickSel = s.value; if (placingTag && placingTag.quick) { const ty = typeOf(quickTy()); say(t('quickSay', ty ? ty.n : t('tagNew'))); } };
        bar.appendChild(s);
      }
      const q = document.createElement('button'); q.type = 'button'; q.id = 'tagQuick'; const on = !!(placingTag && placingTag.quick);
      q.textContent = on ? t('quickOff') : t('quickOn'); q.classList.toggle('on', on); q.onclick = quickToggle; bar.appendChild(q);
    }
    if (!window.G360_CLIENT) { const e = document.createElement('button'); e.type = 'button'; e.id = 'tagTyEdBtn'; e.textContent = t('tyEdit'); e.onclick = openTypesEd; bar.appendChild(e); }
    if (tags.length) { const r = document.createElement('button'); r.type = 'button'; r.id = 'tagRepBtn'; r.textContent = t('repBtn'); r.onclick = () => tagReport().catch(err => { console.error(err); say(String(err && err.message || err)); }); bar.appendChild(r); }
    if (bar.children.length) box.appendChild(bar);
  }
  window.G360_tagTypesUI = tagTypesUI;
  { const prev = renderViews; renderViews = function () { prev.apply(this, arguments); tagTypesUI(); }; }   // the row follows the tab and the list

  // -- the types window (Studio only) --
  function openTypesEd() {
    let w = document.getElementById('tagTyEd');   // ($ answers a detached element for a missing id)
    if (!w) { w = document.createElement('div'); w.id = 'tagTyEd'; document.body.appendChild(w); w.addEventListener('keydown', e => e.stopPropagation()); }
    const draw = () => {
      w.innerHTML = ''; w.hidden = false;
      const h = document.createElement('b'); h.textContent = t('tyEdH'); w.appendChild(h);
      const p = document.createElement('p'); p.className = 'tyHint'; p.textContent = t('tyHint'); w.appendChild(p);
      tagTypes.forEach((ty, i) => {
        const r = document.createElement('div'); r.className = 'trow tyRow';
        const ic = document.createElement('button'); ic.type = 'button'; ic.className = 'ic1'; ic.style.background = ty.col; ic.innerHTML = iconSvg(ty.icon); ic.title = t('tyLbl');
        ic.onclick = () => { ty.icon = (ty.icon + 1) % ICON_PATHS.length; changed(ty); draw(); };   // a click moves to the next icon
        const c = document.createElement('input'); c.type = 'color'; c.value = ty.col; c.oninput = () => { ty.col = c.value; ic.style.background = c.value; }; c.onchange = () => { changed(ty); };
        const n = document.createElement('input'); n.type = 'text'; n.value = ty.n; n.placeholder = t('tyNamePh'); n.maxLength = 40; n.oninput = () => { ty.n = n.value; }; n.onchange = () => { ty.n = n.value.trim() || ty.n; changed(null); };
        const x = document.createElement('button'); x.type = 'button'; x.className = 'tyX'; x.textContent = '✕'; x.title = t('tyDel');
        x.onclick = () => { tagTypes.splice(i, 1); tags.forEach(tg => { if (tg.ty === ty.id) delete tg.ty; }); hidTypes.delete(ty.id); saveTags(); changed(null); draw(); };
        r.append(ic, c, n, x); w.appendChild(r);
      });
      const b = document.createElement('div'); b.className = 'trow';
      const add = document.createElement('button'); add.type = 'button'; add.textContent = t('tyAdd');
      add.onclick = () => { tagTypes.push({ id:'y' + Date.now().toString(36), n:'', col:'#5ec4b6', icon:0 }); changed(null); draw(); const ins = w.querySelectorAll('input[type=text]'); if (ins.length) ins[ins.length - 1].focus(); };
      b.appendChild(add);
      if (!tagTypes.length) {
        const inf = document.createElement('button'); inf.type = 'button'; inf.textContent = t('tyInfra');
        inf.onclick = () => { t('infra').forEach((n, i) => tagTypes.push({ id:'i' + i, n, col:INFRA[i][0], icon:INFRA[i][1] })); changed(null); draw(); };
        b.appendChild(inf);
      }
      const ok = document.createElement('button'); ok.type = 'button'; ok.className = 'tyOk'; ok.textContent = t('tyDone'); ok.onclick = () => { w.hidden = true; tagTypes = tagTypes.filter(x => x.n.trim()); changed(null); };
      b.appendChild(ok); w.appendChild(b);
    };
    draw();
  }
  function changed(ty) {   // a type's colour or icon changed: its tags follow
    if (ty) tags.forEach(tg => { if (tg.ty === ty.id) { tg.col = ty.col; tg.icon = ty.icon; } });
    saveTagTypes(); if (ty) { saveTags(); renderTagEls(); } renderViews();
  }

  // -- the PDF report: a cover with the totals by type, then the tags, two to a page, each with a picture taken in the scan from where it is seen --
  const PW = 1240, PH = 1754, M = 80;   // an A4 page at 150 dpi
  const isHe = s => /[֐-׿]/.test(s || '');
  function txt(g, s, x, y, size, opt) {   // one line, right-to-left when the text is Hebrew (or the screen is), cut with … when too wide
    opt = opt || {}; s = String(s == null ? '' : s);
    g.font = (opt.bold ? '700 ' : '400 ') + size + 'px "Segoe UI", Arial, sans-serif'; g.fillStyle = opt.col || '#1b2428'; g.textBaseline = 'alphabetic';
    const rtl = opt.rtl != null ? opt.rtl : (isHe(s) || (LANG === 'he' && !/[A-Za-z]/.test(s))); g.direction = rtl ? 'rtl' : 'ltr';
    const w = opt.w || PW - 2 * M; if (g.measureText(s).width > w) { while (s.length > 1 && g.measureText(s + '…').width > w) s = s.slice(0, -1); s += '…'; }
    g.textAlign = opt.align || (rtl ? 'right' : 'left'); g.fillText(s, opt.align === 'center' ? x : rtl ? x + w : x, y);
  }
  function wrap(g, s, size, w, max) {   // the description in lines that fit
    g.font = '400 ' + size + 'px "Segoe UI", Arial, sans-serif'; const out = [];
    String(s || '').split('\n').forEach(par => { let line = ''; par.split(/\s+/).forEach(word => { const tr = line ? line + ' ' + word : word; if (g.measureText(tr).width > w && line) { out.push(line); line = word; } else line = tr; }); out.push(line); });
    if (out.length > max) { out.length = max; out[max - 1] += ' …'; }
    return out;
  }
  const loadImg = src => new Promise(res => { if (!src) return res(null); const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  const floorIdxOf = y => { let idx = 0; floors.forEach((f, i) => { if (f <= y + 0.5 * scale) idx = i; }); return idx; };
  function tagShot(tg, w, h) {   // the scan as seen from the tag's viewpoint, with the tag marked
    const v = tagPose(tg);
    if (floors.length > 1) setFloor(floorIdxOf(v.p[1]));
    camera.position.set(v.p[0], v.p[1], v.p[2]); yaw = v.yaw; pitch = v.pitch; camera.rotation.set(pitch, yaw, 0); camera.updateMatrixWorld(true);
    renderer.render(scene, camera);
    const src = renderer.domElement, c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    const k = Math.max(w / src.width, h / src.height), sw = w / k, sh = h / k;   // fill the frame from the middle of the screen
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.drawImage(src, (src.width - sw) / 2, (src.height - sh) / 2, sw, sh, 0, 0, w, h);
    const q = new THREE.Vector3(tg.p[0], tg.p[1], tg.p[2]).project(camera);
    if (q.z < 1) {
      const x = ((q.x * 0.5 + 0.5) * src.width - (src.width - sw) / 2) * k, y = ((-q.y * 0.5 + 0.5) * src.height - (src.height - sh) / 2) * k, r = 22;
      g.beginPath(); g.arc(x, y, r + 5, 0, 2 * Math.PI); g.fillStyle = '#fff'; g.fill();
      g.beginPath(); g.arc(x, y, r, 0, 2 * Math.PI); g.fillStyle = tg.col || '#5ec4b6'; g.fill();
    }
    return c;
  }
  function jpegBytes(c, q) { const d = atob(c.toDataURL('image/jpeg', q).split(',')[1]), u = new Uint8Array(d.length); for (let i = 0; i < d.length; i++) u[i] = d.charCodeAt(i); return u; }
  function imagePdf(pages) {   // a PDF of whole-page JPEG pictures (the text is drawn into them, so Hebrew prints right)
    const parts = [], offs = []; let len = 0;
    const push = x => { const b = typeof x === 'string' ? Uint8Array.from(x, ch => ch.charCodeAt(0) & 255) : x; parts.push(b); len += b.length; };
    const obj = (n, body) => { offs[n] = len; push(n + ' 0 obj\n'); body.forEach(push); push('\nendobj\n'); };
    const n = pages.length, A4W = 595.28, A4H = 841.89;
    push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    obj(1, ['<< /Type /Catalog /Pages 2 0 R >>']);
    obj(2, ['<< /Type /Pages /Count ' + n + ' /Kids [' + pages.map((_, i) => (3 + 3 * i) + ' 0 R').join(' ') + '] >>']);
    pages.forEach((pg, i) => {
      const p = 3 + 3 * i, cs = 'q ' + A4W + ' 0 0 ' + A4H + ' 0 0 cm /Im0 Do Q';
      obj(p, ['<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + A4W + ' ' + A4H + '] /Resources << /XObject << /Im0 ' + (p + 2) + ' 0 R >> >> /Contents ' + (p + 1) + ' 0 R >>']);
      obj(p + 1, ['<< /Length ' + cs.length + ' >>\nstream\n' + cs + '\nendstream']);
      obj(p + 2, ['<< /Type /XObject /Subtype /Image /Width ' + pg.w + ' /Height ' + pg.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + pg.bytes.length + ' >>\nstream\n', pg.bytes, '\nendstream']);
    });
    const xref = len, total = 3 + 3 * n;
    push('xref\n0 ' + total + '\n0000000000 65535 f \n'); for (let i = 1; i < total; i++) push(String(offs[i]).padStart(10, '0') + ' 00000 n \n');
    push('trailer\n<< /Size ' + total + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
    return new Blob(parts, { type:'application/pdf' });
  }
  async function tagReport() {
    if (!started || !camera || !model) { say(t('repNeed3D')); return; }
    const list = tags.filter(tagShown);
    if (!list.length) { say(t('repNone')); return; }
    if (placingTag) endPlaceTag();
    if (overview) { exitOverview(); saved = null; await sleep(60); }
    tween = null;
    const keep = { p:camera.position.clone(), yaw, pitch, floor:curFloor };
    const title = window.PROJ_TITLE || currentName || '', date = new Date().toLocaleDateString(LANG === 'he' ? 'he-IL' : 'en-GB'), he = LANG === 'he';
    const logo = await loadImg((document.querySelector('#logo img') || {}).src || '');
    const pages = [], newPage = () => { const c = document.createElement('canvas'); c.width = PW; c.height = PH; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, PW, PH); return { c, g }; };
    const groups = tagTypes.filter(ty => !hidTypes.has(ty.id)).map(ty => ({ ty, list:list.filter(x => x.ty === ty.id) })).filter(x => x.list.length);
    const none = list.filter(x => !typeOf(x.ty)); if (none.length) groups.push({ ty:{ id:'', n:t('tyNone'), col:'#8e9aa1' }, list:none });
    // the cover
    { const { c, g } = newPage();
      if (logo) { const lw = Math.min(420 * logoK(), PW - 2 * M, 300 * logo.naturalWidth / logo.naturalHeight), lh = lw * logo.naturalHeight / logo.naturalWidth; g.drawImage(logo, he ? PW - M - lw : M, M, lw, lh); }
      txt(g, t('repTitle'), M, 420, 40, { col:'#5d6a72', rtl:he }); txt(g, title, M, 500, 64, { bold:true, rtl:he });
      txt(g, t('repDate') + ': ' + date + '   ·   ' + t('repCount', list.length), M, 570, 30, { col:'#5d6a72', rtl:he });
      g.fillStyle = '#e1e6e9'; g.fillRect(M, 620, PW - 2 * M, 2);
      groups.forEach((gr, i) => { const y = 700 + i * 74; g.beginPath(); g.arc(he ? PW - M - 18 : M + 18, y - 12, 16, 0, 2 * Math.PI); g.fillStyle = gr.ty.col; g.fill();
        txt(g, gr.ty.n + '  ·  ' + gr.list.length, he ? M : M + 52, y, 34, { w:PW - 2 * M - 52, rtl:he }); });
      pages.push(c); }
    // two tags to a page, in the order of the types
    const flat = []; groups.forEach(gr => gr.list.forEach(tg => flat.push({ tg, ty:gr.ty })));
    const SH = 600, SW = PW - 2 * M, BLOCK = (PH - 2 * M - 40) / 2;
    let page = null;
    for (let i = 0; i < flat.length; i++) {
      say(t('repBusy', i + 1, flat.length)); await sleep(0);
      if (i % 2 === 0) { page = newPage(); pages.push(page.c); }
      const { tg, ty } = flat[i], g = page.g, y0 = M + (i % 2) * BLOCK;
      g.drawImage(tagShot(tg, SW, SH), M, y0);
      let y = y0 + SH + 52;
      // the number and the type at the start of the line, the title after them
      const chip = (i + 1) + '  ' + ty.n; g.font = '700 26px "Segoe UI", Arial, sans-serif'; const cw = g.measureText(chip).width + 28;
      g.fillStyle = ty.col; g.beginPath(); if (g.roundRect) g.roundRect(he ? PW - M - cw : M, y - 34, cw, 44, 22); else g.rect(he ? PW - M - cw : M, y - 34, cw, 44); g.fill();
      txt(g, chip, he ? PW - M - cw + 14 : M + 14, y - 3, 26, { bold:true, col:'#fff', w:cw - 28, rtl:he });
      txt(g, tg.n, he ? M : M + cw + 20, y, 34, { bold:true, w:SW - cw - 20, rtl:he });
      if (floors.length > 1) { y += 44; txt(g, t('repFloor') + ': ' + floorLabel(floorIdxOf(tg.p[1])), M, y, 24, { col:'#5d6a72', rtl:he }); }
      const im = typeof tg.img === 'string' && /^data:image\//.test(tg.img) ? await loadImg(tg.img) : null, iw = im ? 300 : 0;
      if (im) { const ih = Math.min(220, iw * im.naturalHeight / im.naturalWidth); g.drawImage(im, he ? M : PW - M - iw, y + 18, iw, ih); }
      wrap(g, tg.d, 24, SW - (iw ? iw + 24 : 0), 6).forEach((ln, k) => txt(g, ln, he ? M + (iw ? iw + 24 : 0) : M, y + 50 + k * 34, 24, { w:SW - (iw ? iw + 24 : 0) }));
      const u = safeUrl(tg.url); if (u) txt(g, u, M, y0 + BLOCK - 20, 20, { col:'#2f80ed', rtl:false });
    }
    pages.forEach((c, i) => { const g = c.getContext('2d'); txt(g, (title ? title + '   ·   ' : '') + t('repPage', i + 1, pages.length), PW / 2, PH - 40, 20, { col:'#8e9aa1', align:'center', w:PW - 2 * M, rtl:he }); });
    // back where we were
    camera.position.copy(keep.p); yaw = keep.yaw; pitch = keep.pitch; camera.rotation.set(pitch, yaw, 0); if (floors.length > 1 && keep.floor >= 0) setFloor(keep.floor);
    const blob = imagePdf(pages.map(c => ({ bytes:jpegBytes(c, 0.85), w:c.width, h:c.height })));
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'Gambit360-' + t('repTitle').replace(/\s+/g, '-') + '-' + (title || 'tour').replace(/[\\/:*?"<>|]+/g, '_') + '.pdf';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 8000);
    say(t('repDone')); window.G360_lastReport = blob;   // kept for the browser test
  }
  { const prev = window.G360_relang; window.G360_relang = () => { if (prev) prev(); tagTypesUI(); }; }
