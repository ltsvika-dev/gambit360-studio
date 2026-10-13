  // ---- UI ----
  const TOP_ICO = { lvStats: ['statsBtn', '<path d="M4 20h16"/><path d="M7 16v-5M12 16V6M17 16v-8"/>'], lvSetBtn: ['settings', '<path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"/><path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.5A7.5 7.5 0 0 0 7 6.5l-2.4-1-2 3.4 2 1.6a7.6 7.6 0 0 0 0 3l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 0 0 2.6 1.5l.4 2.5h4l.4-2.5a7.5 7.5 0 0 0 2.6-1.5l2.4 1 2-3.4z"/>'], lvPubAll: ['publishAll', '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v4h16v-4"/>'], lvClose: ['close', '<path d="M6 6l12 12M18 6L6 18"/>'] };
  const tourLang = t => ['he', 'en'].includes(t.uiLang) ? t.uiLang : (/[\u0590-\u05FF]/.test((t.mainName || '') + (t.name || '') + (t.title || '')) ? 'he' : 'en');
  async function purge(t) {
    normTour(t);
    for (const k of fileKeys(t)) { forgetUrl(t.id + ':' + k); try { await db.fdel(t.id + ':' + k); } catch (e) {} }
    try { await db.del(t.id); } catch (e) {} trash = trash.filter(o => o !== t);
    try { const p = (await db.kget('purged')) || {}; p[t.id] = Date.now(); await db.kset('purged', p); } catch (e) {}   // so the sync takes it off the other computers too
  }
  function restoreTour(t) {
    delete t.deleted; t.updated = Date.now();
    if (slugOf(t) && tours.some(o => slugOf(o) === slugOf(t))) { t.slug = ''; msg(L('slugCleared'), true); } else msg(L('restoredT'));
    trash = trash.filter(o => o !== t); tours.unshift(t); db.put(t).catch(() => {}); bkSoon(); select(t);
  }
  let trashOpen = false;
  function renderTrash(items) {
    if (!trash.length) return;
    const h = document.createElement('div'); h.className = 'fh trH';
    h.innerHTML = '<span class="fa">' + (trashOpen ? '\u25be' : '\u25b8') + '</span><span class="fi">\ud83d\uddd1</span><span class="fn"></span><span class="fc">' + trash.length + '</span><span class="sp"></span><button type="button" data-e></button>';
    h.querySelector('.fn').textContent = L('trash'); const eb = h.querySelector('[data-e]'); eb.textContent = L('emptyTrash'); eb.hidden = !trashOpen;
    h.onclick = e => { if (e.target.closest('button')) return; trashOpen = !trashOpen; renderList(); };
    eb.onclick = async () => { if (!confirm(L('emptyAsk', trash.length))) return; for (const t of trash.slice()) await purge(t); bkSoon(); renderList(); };
    items.appendChild(h);
    if (!trashOpen) return;
    const fb = document.createElement('div'); fb.className = 'fbody';
    const nt = document.createElement('div'); nt.className = 'empty'; nt.textContent = L('trashNote'); fb.appendChild(nt);
    trash.forEach(t => {
      const b = document.createElement('div'); b.className = 'it tr';
      b.innerHTML = '<div></div><small></small><div class="trb"><button type="button" data-r></button><button type="button" data-x></button></div>';
      b.firstChild.textContent = t.name || t.client || L('untitled'); b.querySelector('small').textContent = L('trashedAt', new Date(t.deleted).toLocaleDateString());
      b.querySelector('[data-r]').textContent = L('restoreT'); b.querySelector('[data-r]').onclick = () => restoreTour(t);
      b.querySelector('[data-x]').textContent = L('delForever'); b.querySelector('[data-x]').onclick = async () => { if (!confirm(L('confirmDel', t.name || slugOf(t) || L('untitled')))) return; await purge(t); bkSoon(); renderList(); };
      fb.appendChild(b);
    });
    items.appendChild(fb);
  }
  function topBtns() {
    Object.keys(TOP_ICO).forEach(id => { const b = $(id), d = TOP_ICO[id]; b.innerHTML = '<svg viewBox="0 0 24 24">' + d[1] + '</svg><span></span>'; b.lastChild.textContent = L(d[0]); b.title = L(d[0]); });
    document.querySelector('#live .lvTop').classList.toggle('icoOnly', !!settings.topIco);
    colUI();
  }
  function colUI() {
    const lv = $('live'), ui = settings.ui || {};
    lv.classList.toggle('noEdit', !!ui.noEdit); lv.classList.toggle('noList', !!ui.noList);
    const ib = (id, ic, tip, on) => { const b = $(id); b.innerHTML = '<svg viewBox="0 0 24 24">' + ic + '</svg>'; b.title = tip; b.setAttribute('aria-label', tip); b.classList.toggle('on', on); };
    ib('lvColEdit', '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>', L(ui.noEdit ? 'colEditShow' : 'colEditHide'), !!ui.noEdit);
    ib('lvColList', '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16M17.5 8.5h1M17.5 12h1M17.5 15.5h1"/>', L(ui.noList ? 'colListShow' : 'colListHide'), !!ui.noList);
  }
  function texts() {
    $('lvTitle').textContent = L('title'); topBtns();
    $('lvSetH').textContent = L('setH'); $('lvSdkL').textContent = L('sdkL'); $('lvSdkN').textContent = L('sdkN'); $('lvBaseL').textContent = L('baseL'); $('lvBaseN').textContent = L('baseN'); $('lvOutL').textContent = L('outL'); $('lvOutBtn').textContent = L('outBtn'); $('lvSetOk').textContent = L('ok');
    $('lvSetClose').textContent = L('close'); $('lvTopIcoL').textContent = L('topIcoL'); $('lvSetX').title = L('close'); $('lvBkL').textContent = L('bkL'); $('lvBkN').textContent = L('bkN'); $('lvBkNow').textContent = L('bkNow'); $('lvBkRestore').textContent = L('bkRestore'); $('lvSplL').textContent = L('splL'); $('lvSplN').textContent = L('splN'); $('lvSplPick').textContent = L('splPick'); $('lvSplRm').textContent = L('splRm');
    $('lvUpL').textContent = L('upL'); $('lvUpN').textContent = L('upN'); $('lvUpOnL').textContent = L('upOn'); $('lvKeyBtn').textContent = L(settings.upKey ? 'keyRe' : 'keyNew'); $('lvPingBtn').textContent = L('ping'); $('lvUpSt').textContent = L(settings.upKey ? 'upHasKey' : 'upNoKey');
    const sb = $('liveStartBtn'); if (sb) sb.textContent = L('startBtn');
    const mb = $('liveMenuBtn'); if (mb) mb.querySelector('span').textContent = L('menuBtn');
  }
  let activeFolder = '', syncActs = () => {}, openSec = 'lvSecD';
  const saveSet = () => { settings.setAt = Date.now(); db.kset('settings', settings).catch(() => {}); };
  let dragId = null;
  function moveTour(t, n) { t.folder = n || ''; settings.foldOpen[t.folder] = true; activeFolder = t.folder; saveSet(); save(t); }
  function closeMove() { const m = $('lvMv'); if (m) m.remove(); }
  function openMove(btn, t) {
    closeMove();
    const m = document.createElement('div'); m.id = 'lvMv';
    [''].concat(settings.folders).forEach(n => { const o = document.createElement('button'); o.type = 'button'; o.textContent = (n === (t.folder || '') ? '\u2713 ' : '') + (n || L('noFolder')); o.onclick = () => { closeMove(); moveTour(t, n); }; m.appendChild(o); });
    document.body.appendChild(m);
    const r = btn.getBoundingClientRect();
    m.style.top = Math.max(8, Math.min(r.bottom + 4, innerHeight - m.offsetHeight - 8)) + 'px';
    m.style.left = Math.max(8, Math.min(r.left, innerWidth - m.offsetWidth - 8)) + 'px';
  }
  addEventListener('pointerdown', e => { const m = $('lvMv'); if (m && !m.contains(e.target) && !(e.target.closest && e.target.closest('.mv'))) closeMove(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeMove(); });
  function tourItem(t) {
    const b = document.createElement('div'); b.className = 'it' + (cur === t ? ' on' : '') + (t.locked ? ' lkd' : '');
    b.innerHTML = '<div>' + esc(t.name || t.client || L('untitled')) + '</div><small>' + esc(slugOf(t) || t.model || '\u2014') + '</small>';
    b.onclick = () => select(t);   // a locked tour (finished project) opens read-only
    { const lb = document.createElement('button'); lb.type = 'button'; lb.className = 'lk2'; lb.textContent = t.locked ? '\ud83d\udd12' : '\ud83d\udd13'; lb.title = L(t.locked ? 'tourUnlock' : 'tourLock'); b.appendChild(lb);
      lb.onclick = e => { e.stopPropagation(); if (t.locked && !confirm(L('folderUnlockAsk', t.name || t.client || L('untitled')))) return; t.locked = !t.locked; db.put(t).catch(() => {}); bkSoon(); renderList(); if (cur === t) renderEdit(); }; }
    b.draggable = true;
    b.ondragstart = e => { dragId = t.id; b.classList.add('drag'); try { e.dataTransfer.setData('text/plain', t.id); e.dataTransfer.effectAllowed = 'move'; } catch (x) {} };
    b.ondragend = () => { dragId = null; b.classList.remove('drag'); };
    if (settings.folders.length) {   // a small folder button on every tour (the other way is dragging the tour onto a folder)
      const mv = document.createElement('button'); mv.type = 'button'; mv.className = 'mv'; mv.textContent = '\ud83d\udcc1'; mv.title = L('moveTo');
      mv.onclick = e => { e.stopPropagation(); openMove(mv, t); };
      b.appendChild(mv);
    }
    return b;
  }
  function dropTarget(el, folder) {
    el.ondragover = e => { if (dragId) { e.preventDefault(); el.classList.add('over'); } };
    el.ondragleave = () => el.classList.remove('over');
    el.ondrop = e => { e.preventDefault(); el.classList.remove('over'); const t = tours.find(x => x.id === dragId); dragId = null; if (t && (t.folder || '') !== folder) moveTour(t, folder); };
  }
  function renderList() {
    const box = $('lvList');
    if (!$('lvBar')) {
      box.innerHTML = '';
      const bar = document.createElement('div'); bar.className = 'lvBar'; bar.id = 'lvBar'; bar.innerHTML = '<button class="pri" type="button" data-n></button><button type="button" data-f></button>'; box.appendChild(bar);
      const sr = document.createElement('div'); sr.className = 'lvSort'; sr.innerHTML = '<input type="text" id="lvQ" spellcheck="false"><select id="lvSortSel"></select>'; box.appendChild(sr);
      const it = document.createElement('div'); it.id = 'lvItems'; it.style.cssText = 'display:flex;flex-direction:column;gap:6px'; box.appendChild(it);
      $('lvQ').oninput = () => renderList();
      $('lvSortSel').onchange = () => { settings.listSort = $('lvSortSel').value; saveSet(); renderList(); };
      bar.querySelector('[data-n]').onclick = () => { const t = newTour(); t.folder = settings.folders.indexOf(activeFolder) >= 0 && !settings.locked[activeFolder] ? activeFolder : ''; settings.foldOpen[t.folder] = true; saveSet(); tours.unshift(t); db.put(t).catch(() => {}); $('lvQ').value = ''; select(t); msg(t.folder ? L('newIn', t.folder) : L('newNoFolder')); };
      bar.querySelector('[data-f]').onclick = () => { const n = (prompt(L('folderName')) || '').trim(); if (!n) return; if (settings.folders.indexOf(n) >= 0) { msg(L('folderExists'), true); return; } settings.folders.push(n); settings.foldOpen[n] = true; activeFolder = n; saveSet(); renderList(); };
    }
    $('lvBar').querySelector('[data-n]').textContent = L('newTour'); $('lvBar').querySelector('[data-f]').textContent = L('newFolder'); $('lvQ').placeholder = L('searchPh');
    const sel = $('lvSortSel'); sel.innerHTML = ''; [['updated', 'sortUpd'], ['name', 'sortName'], ['client', 'sortClient']].forEach(([v, k]) => { const o = document.createElement('option'); o.value = v; o.textContent = L(k); sel.appendChild(o); }); sel.value = settings.listSort || 'updated';
    const items = $('lvItems'); items.innerHTML = '';
    const nm = t => String(t.name || t.client || '');
    const cmp = { updated: (x, y) => (y.updated || 0) - (x.updated || 0), name: (x, y) => nm(x).localeCompare(nm(y), 'he'), client: (x, y) => String(x.client || '').localeCompare(String(y.client || ''), 'he') }[settings.listSort] || ((x, y) => (y.updated || 0) - (x.updated || 0));
    const q = $('lvQ').value.trim().toLowerCase(), hit = t => !q || [t.name, t.client, t.title, t.slug, t.model, t.folder].join(' ').toLowerCase().indexOf(q) >= 0;
    if (!tours.length && !settings.folders.length) { const e = document.createElement('div'); e.className = 'empty'; e.textContent = L('listEmpty'); items.appendChild(e); renderTrash(items); return; }
    let shown = 0;
    settings.folders.forEach(name => {
      const list = tours.filter(t => t.folder === name && hit(t)).sort(cmp), lk = !!settings.locked[name], open = !lk && (q ? true : settings.foldOpen[name] !== false);   // a locked folder (finished project) stays closed
      if (q && !list.length && name.toLowerCase().indexOf(q) < 0) return;
      shown++;
      const h = document.createElement('div'); h.className = 'fh' + (activeFolder === name ? ' act' : '') + (lk ? ' lk' : '');
      h.innerHTML = '<span class="fa">' + (open ? '\u25be' : '\u25b8') + '</span><span class="fi">' + (open ? '\ud83d\udcc2' : '\ud83d\udcc1') + '</span><span class="fn" title="' + esc(name) + '">' + esc(name) + '</span><span class="fc">' + list.length + '</span><span class="sp"></span><button type="button" data-l></button><button type="button" data-r></button><button type="button" data-x>\u2715</button>';
      { const lb = h.querySelector('[data-l]'); lb.className = 'lkb'; lb.textContent = lk ? '\ud83d\udd12' : '\ud83d\udd13'; lb.title = L(lk ? 'folderUnlock' : 'folderLock');
        lb.onclick = () => { if (lk && !confirm(L('folderUnlockAsk', name))) return; if (lk) delete settings.locked[name]; else { settings.locked[name] = true; settings.foldOpen[name] = false; if (activeFolder === name) activeFolder = ''; } saveSet(); renderList(); }; }
      h.querySelector('[data-r]').textContent = '\u270e'; h.querySelector('[data-r]').title = L('folderRen'); h.querySelector('[data-x]').title = L('folderDel');
      h.onclick = e => { if (e.target.closest('button')) return; if (lk) { msg(L('folderLocked', name)); return; } settings.foldOpen[name] = settings.foldOpen[name] === false; activeFolder = name; saveSet(); renderList(); };
      h.querySelector('[data-r]').onclick = () => {
        const n = (prompt(L('folderName'), name) || '').trim(); if (!n || n === name) return;
        if (settings.folders.indexOf(n) >= 0) { msg(L('folderExists'), true); return; }
        settings.folders[settings.folders.indexOf(name)] = n; settings.foldOpen[n] = settings.foldOpen[name]; delete settings.foldOpen[name]; if (settings.locked[name]) { settings.locked[n] = true; delete settings.locked[name]; }
        tours.forEach(t => { if (t.folder === name) { t.folder = n; db.put(t).catch(() => {}); } });
        if (activeFolder === name) activeFolder = n; saveSet(); renderList(); if (cur) renderEdit();
      };
      h.querySelector('[data-x]').onclick = () => {
        if (!confirm(L('folderDelAsk'))) return;
        tours.forEach(t => { if (t.folder === name) { t.folder = ''; db.put(t).catch(() => {}); } });
        settings.folders.splice(settings.folders.indexOf(name), 1); delete settings.foldOpen[name]; delete settings.locked[name];
        if (activeFolder === name) activeFolder = ''; saveSet(); renderList(); if (cur) renderEdit();
      };
      dropTarget(h, name);
      items.appendChild(h);
      if (open && list.length) { const fb = document.createElement('div'); fb.className = 'fbody'; list.forEach(t => fb.appendChild(tourItem(t))); items.appendChild(fb); }
    });
    const rest = tours.filter(t => (!t.folder || settings.folders.indexOf(t.folder) < 0) && hit(t)).sort(cmp);
    if (settings.folders.length) {
      const rOpen = q ? true : settings.foldOpen[''] !== false;
      const l = document.createElement('div'); l.className = 'fh root'; l.innerHTML = '<span class="fa">' + (rOpen ? '\u25be' : '\u25b8') + '</span><span class="fn"></span><span class="fc">' + rest.length + '</span>'; l.querySelector('.fn').textContent = L('noFolder'); if (activeFolder === '') l.classList.add('act');
      l.onclick = () => { settings.foldOpen[''] = settings.foldOpen[''] === false; activeFolder = ''; saveSet(); renderList(); };
      dropTarget(l, ''); items.appendChild(l);
      if (rOpen) rest.forEach(t => items.appendChild(tourItem(t)));
    } else rest.forEach(t => items.appendChild(tourItem(t)));
    if (tours.length) { const tt = document.createElement('div'); tt.className = 'tot'; const nh = tours.filter(hit).length; tt.textContent = q ? L('totalQ', nh, tours.length) : L('total', tours.length); items.appendChild(tt); }
    if (!shown && !rest.length) { const e = document.createElement('div'); e.className = 'empty'; e.textContent = L('noRes'); items.appendChild(e); }
    renderTrash(items);
  }
  function select(t) { cur = t; pvModel = null; activeFolder = t.folder || ''; renderList(); renderEdit(); preview(true); }

  function sec(id, title, toggle) {
    const s = document.createElement('div'); s.className = 'sec'; s.id = id;
    s.innerHTML = '<h4><span>' + esc(title) + '</span><span class="sp"></span>' + (toggle ? '<label class="tgl"><input type="checkbox" data-k="on"></label>' : '') + '</h4>';
    return s;
  }
  function field(parent, label, html) { const l = document.createElement('label'); l.className = 'f'; l.textContent = label; parent.appendChild(l); const w = document.createElement('div'); w.innerHTML = html; while (w.firstChild) parent.appendChild(w.firstChild); return parent.lastElementChild; }
  function pickFile(accept) { return new Promise(res => { const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.onchange = () => res(i.files && i.files[0] || null); i.click(); }); }

  async function setFile(key, accept, check) {
    const f = await pickFile(accept); if (!f) return false;
    if (check && !check(f)) { msg(L(check.bad || 'imgBad'), true); return false; }
    await db.fset(key, { blob: f, name: f.name, type: f.type, ts: Date.now() }); forgetUrl(key); return true;
  }
  function imgOk(f) { return /^image\//.test(f.type) || /\.(png|jpe?g|webp|svg|gif)$/i.test(f.name); }
  function pngOk(f) { return f.type === 'image/png' || /\.png$/i.test(f.name); }
  pngOk.bad = 'pngBad';
  function audioOk(f) { return /^audio\//.test(f.type) || /\.(mp3|m4a|aac|ogg|wav)$/i.test(f.name); }

  async function fileRow(parent, key, accept, check, onChange, isImg) {
    const row = document.createElement('div'); row.className = 'row'; parent.appendChild(row);
    const meta = await fileMeta(key), u = meta ? await fileUrl(key) : '';
    row.innerHTML = (isImg && u ? '<img class="thumb" src="' + u + '">' : '') + '<button type="button">' + esc(isImg ? L('pickImg') : L('pickAudio')) + '</button><span class="note">' + esc(meta ? meta.name : L('noFile')) + '</span>' + (meta ? '<button type="button" data-x>✕</button>' : '');
    row.querySelector('button').onclick = async () => { if (await setFile(key, accept, check)) { onChange(); renderEdit(); } };
    const x = row.querySelector('[data-x]'); if (x) x.onclick = async () => { await db.fdel(key); forgetUrl(key); onChange(); renderEdit(); };
    return row;
  }
  const ICONS = {"list": "<path d=\"M4 7h16M4 12h16M4 17h16\"/>", "grid": "<rect x=\"4\" y=\"4\" width=\"7\" height=\"7\" rx=\"1\"/><rect x=\"13\" y=\"4\" width=\"7\" height=\"7\" rx=\"1\"/><rect x=\"4\" y=\"13\" width=\"7\" height=\"7\" rx=\"1\"/><rect x=\"13\" y=\"13\" width=\"7\" height=\"7\" rx=\"1\"/>", "layers": "<path d=\"M12 3l9 5-9 5-9-5z\"/><path d=\"M3 13l9 5 9-5\"/>", "home": "<path d=\"M4 11l8-7 8 7\"/><path d=\"M6 10v10h12V10\"/>", "map": "<path d=\"M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z\"/><path d=\"M9 4v14M15 6v14\"/>", "pin": "<path d=\"M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z\"/><circle cx=\"12\" cy=\"10\" r=\"2.5\"/>", "compass": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M15.5 8.5l-2 5-5 2 2-5z\"/>", "dots": "<circle cx=\"5\" cy=\"12\" r=\"1.4\" fill=\"currentColor\"/><circle cx=\"12\" cy=\"12\" r=\"1.4\" fill=\"currentColor\"/><circle cx=\"19\" cy=\"12\" r=\"1.4\" fill=\"currentColor\"/>", "video": "<rect x=\"3\" y=\"5\" width=\"18\" height=\"14\" rx=\"3\"/><path d=\"M10 9.5v5l4.5-2.5z\" fill=\"currentColor\"/>", "play": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M10 8.5v7l6-3.5z\" fill=\"currentColor\"/>", "film": "<rect x=\"4\" y=\"4\" width=\"16\" height=\"16\" rx=\"2\"/><path d=\"M8 4v16M16 4v16M4 9h4M4 15h4M16 9h4M16 15h4\"/>", "camera": "<path d=\"M4 8h3l2-3h6l2 3h3v11H4z\"/><circle cx=\"12\" cy=\"13\" r=\"3.5\"/>", "image": "<rect x=\"3\" y=\"5\" width=\"18\" height=\"14\" rx=\"2\"/><circle cx=\"9\" cy=\"10\" r=\"1.6\"/><path d=\"M4 18l5-5 4 4 3-3 4 4\"/>", "info": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 11v6\"/><circle cx=\"12\" cy=\"7.6\" r=\".6\" fill=\"currentColor\"/>", "card": "<rect x=\"3\" y=\"5\" width=\"18\" height=\"14\" rx=\"2\"/><path d=\"M7 10h5M7 14h10\"/>", "user": "<circle cx=\"12\" cy=\"8\" r=\"4\"/><path d=\"M4 20c1-4 4-6 8-6s7 2 8 6\"/>", "phone": "<path d=\"M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z\"/>", "chat": "<path d=\"M4 5h16v11H9l-5 4z\"/>", "mail": "<rect x=\"3\" y=\"5\" width=\"18\" height=\"14\" rx=\"2\"/><path d=\"M3 7l9 6 9-6\"/>", "star": "<path d=\"M12 4l2.4 5 5.6.7-4.1 3.9 1 5.6L12 16.5 7.1 19.2l1-5.6L4 9.7 9.6 9z\"/>", "building": "<path d=\"M5 21V4h9v17M14 9h5v12M3 21h18\"/><path d=\"M8 8h3M8 12h3M8 16h3\"/>", "key": "<circle cx=\"8\" cy=\"15\" r=\"4\"/><path d=\"M11 12l9-9M17 6l3 3M14.5 8.5l2 2\"/>", "help": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.4v.6\"/><circle cx=\"12\" cy=\"17\" r=\".6\" fill=\"currentColor\"/>", "globe": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18\"/>"};
  const ICON_SETS = { spots: ['pin','map','compass','home','building','layers','star','image','camera','dots','list','grid'], tours: ['list','grid','layers','home','map','pin','compass','dots','info','card','user','phone','chat','mail','star','image','building','key','help','globe'], video: ['video','play','film','camera','image'], info: ['list','grid','layers','home','map','pin','compass','dots','info','card','user','phone','chat','mail','star','image','building','key','help','globe'] };
  const WA_ICON = '<path d="M4 20l1.2-4A8.5 8.5 0 1 1 8 18.9z"/><path d="M9.2 8.6c.2 2.4 2.6 4.8 5 5l1.3-1.3-1.7-1.1-.9.7c-.8-.3-1.7-1.2-2-2l.7-.9-1.1-1.7z" fill="currentColor" stroke="none"/>';
  function contactHref(c) { const v = String(c && c.value || '').trim(), dg = v.replace(/[^0-9]/g, ''); if (!v) return ''; if (c.type === 'wa' && dg) return 'https://wa.me/' + (dg[0] === '0' ? '972' + dg.slice(1) : dg) + (c.msg ? '?text=' + encodeURIComponent(c.msg) : ''); if (c.type === 'tel' && dg) return 'tel:' + (v[0] === '+' ? '+' : '') + dg; if (c.type === 'mail' && v.indexOf('@') > 0) return 'mailto:' + v; if (c.type === 'link' && /^https?:\/\//i.test(v)) return v; return ''; }
  // a button's background (colour + transparency) and a readable text colour for it; the same rule is in the published page
  function btnLook(st) {
    const h = /^#[0-9a-f]{6}$/i.test(st && st.bg || '') ? st.bg : '#14181b', r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16);
    const a = Math.max(.1, Math.min(1, 1 - (st && Number.isFinite(+st.tr) ? +st.tr : 28) / 100)), lum = (.299 * r + .587 * g + .114 * b) / 255;
    return { bg: 'rgba(' + r + ',' + g + ',' + b + ',' + a.toFixed(2) + ')', fg: lum > .62 && a >= .45 ? '#14181b' : '#fff' };
  }
  const CONTACT_COL = { wa: '#25a85a', tel: '#1f8a70', mail: '#3b6fd8', link: '#4a5560' }, CONTACT_IC = { tel: 'phone', mail: 'mail', link: 'star' };
  function iconRow(parent, key, t) {
    const lb = document.createElement('label'); lb.textContent = L('iconL'); parent.appendChild(lb);
    const row = document.createElement('div'); row.className = 'row icoRow'; parent.appendChild(row);
    ICON_SETS[key].forEach(n => { const b = document.createElement('button'); b.type = 'button'; b.title = n; b.innerHTML = '<svg viewBox="0 0 24 24">' + ICONS[n] + '</svg>'; b.classList.toggle('on', t.icons[key] === n); b.onclick = () => { t.icons[key] = n; save(t); [...row.children].forEach(c => c.classList.toggle('on', c === b)); preview(); }; row.appendChild(b); });
  }
  function posRow(parent, obj, t, opts) {
    const row = document.createElement('div'); row.className = 'row'; parent.appendChild(row);
    const o4 = opts || [['tl', 'posTL'], ['tr', 'posTR'], ['bl', 'posBL'], ['br', 'posBR']]; row.style.cssText = 'display:grid;gap:6px;grid-template-columns:repeat(' + (o4.length === 4 ? 2 : o4.length) + ',1fr);direction:ltr';   // left-to-right so the left choice sits on the left and the right one on the right, also in Hebrew
    (opts || [['tl', 'posTL'], ['tr', 'posTR'], ['bl', 'posBL'], ['br', 'posBR']]).forEach(([v, k]) => { const b = document.createElement('button'); b.type = 'button'; b.style.cssText = 'min-width:0;padding:7px 4px;white-space:normal;line-height:1.25'; b.dir = 'auto'; b.textContent = L(k); b.classList.toggle('on', obj.pos === v); b.onclick = () => { obj.pos = v; save(t); [...row.children].forEach(c => c.classList.toggle('on', c === b)); preview(); }; row.appendChild(b); });
  }
  function range(parent, label, min, max, step, val, onIn) {
    const l = document.createElement('label'); l.className = 'f'; l.textContent = label(val); parent.appendChild(l);
    const r = document.createElement('input'); r.type = 'range'; r.min = min; r.max = max; r.step = step; r.value = val; parent.appendChild(r);
    r.oninput = () => { l.textContent = label(+r.value); onIn(+r.value); };
  }
  function bindToggle(s, obj, t, cb) { const c = s.querySelector('h4 input[data-k=on]'); c.checked = !!obj.on; s.classList.toggle('off', !obj.on); c.onchange = () => { obj.on = c.checked; s.classList.toggle('off', !obj.on); save(t); preview(); if (cb) cb(); }; }

