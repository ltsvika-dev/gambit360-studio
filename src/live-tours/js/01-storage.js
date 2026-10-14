  // ---- storage: tours and their files stay on this computer (IndexedDB) ----
  const db = {
    h: null,
    open() {
      if (this.h) return Promise.resolve(this.h);
      return new Promise((res, rej) => { const r = indexedDB.open('gambit360live', 1); r.onupgradeneeded = () => { const d = r.result; d.createObjectStore('tours', { keyPath: 'id' }); d.createObjectStore('files'); d.createObjectStore('kv'); }; r.onsuccess = () => { this.h = r.result; res(r.result); }; r.onerror = () => rej(r.error); });
    },
    async run(st, mode, fn) { const d = await this.open(); return new Promise((res, rej) => { const q = fn(d.transaction(st, mode).objectStore(st)); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); },
    all() { return this.run('tours', 'readonly', s => s.getAll()); },
    put(t) { return this.run('tours', 'readwrite', s => s.put(t)); },
    del(id) { return this.run('tours', 'readwrite', s => s.delete(id)); },
    fget(k) { return this.run('files', 'readonly', s => s.get(k)); },
    fset(k, v) { return this.run('files', 'readwrite', s => s.put(v, k)); },
    fdel(k) { return this.run('files', 'readwrite', s => s.delete(k)); },
    kget(k) { return this.run('kv', 'readonly', s => s.get(k)); },
    kset(k, v) { return this.run('kv', 'readwrite', s => s.put(v, k)); }
  };
  function studioDirHandle() {   // the Studio folder the package maker already remembers
    return new Promise(res => { try { const r = indexedDB.open('gambit360viewer', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => { try { const q = r.result.transaction('kv', 'readonly').objectStore('kv').get('srcDir'); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); } catch (e) { res(null); } }; r.onerror = () => res(null); } catch (e) { res(null); } });
  }

  const BTN_KEYS = ['title', 'info', 'video', 'tours', 'music', 'spots', 'contact'];   // the round buttons on the page
  const MP_KEYS = [['brand', 'mpBrand'], ['title', 'mpTitle'], ['help', 'mpHelp'], ['qs', 'mpQs'], ['play', 'mpPlay'], ['hl', 'mpHl'], ['dh', 'mpDh'], ['mt', 'mpMt'], ['vr', 'mpVr']];
  // every field of a tour with its default. A new tour starts from this; normTour fills in what a tour made by an older Studio lacks.
  // A new field goes here only (and, when older tours need more than its default, a line in normTour).
  const BTN_STY_DEF = () => ({ lbl: '', bg: '', tr: 28, w: 0, r: 20, noLbl: false });   // noLbl: this button shows its icon only
  const TOUR_DEF = () => ({ name: '', client: '', model: '', slug: '', title: '', mp: { brand: 0, title: 1, help: 0, qs: 1, play: 0, hl: 0, dh: 1, mt: 1, vr: 1 }, extra: '', logo: { on: true, pos: 'tl', w: 160, card: true, link: '', top: 14, side: 14 }, music: { on: false, vol: 35 }, nadir: { on: false, size: .9, opacity: 100 }, mini: { on: false, pos: 'br', w: 240, open: true, floors: [] }, videos: [], tours: [], vidSec: { on: false }, tourSec: { on: false }, contact: { on: false, type: 'wa', value: '', msg: '', label: '', pos: 'br', col: '' }, folder: '', mainName: '', icons: { tours: 'list', video: 'video', info: 'list', spots: 'pin' }, spots: { on: false, list: [] }, info: { on: false, title: '', text: '', phone: '', mail: '', link: '', linkTxt: '', layout: 'rows' }, photos: { on: false, only360: false }, welcome: { on: false, title: '', text: '', pos: 'l', secs: 6, bottom: 64 }, btnPos: { title: 'l', info: 'l', video: 'l', tours: 'l', music: 'l', spots: 'l', contact: 'l' }, btnOff: { top: -1, side: 14 }, btnOrder: ['title', 'info', 'tours', 'music', 'video', 'spots', 'contact'], btnSty: Object.assign(Object.fromEntries(BTN_KEYS.map(k => [k, BTN_STY_DEF()])), { title: Object.assign(BTN_STY_DEF(), { on: false, link: '' }), contact: Object.assign(BTN_STY_DEF(), { on: false }) }), vidMode: 'player', btnLbl: 'both', uiLang: 'auto' });
  const TOUR_MERGE = ['contact', 'icons', 'spots', 'info', 'photos', 'welcome', 'btnPos', 'btnOff'];   // objects an older tour may have only some fields of: filled in field by field
  const newTour = () => normTour(Object.assign(TOUR_DEF(), { id: 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), cardMig: 1, updated: Date.now() }));
  const modelId = s => { s = String(s || '').trim(); const m = s.match(/[?&]m=([A-Za-z0-9]{6,})/) || s.match(/^([A-Za-z0-9]{6,})$/); return m ? m[1] : ''; };
  // a jump point from a Matterport "link to this location" (…&ss=19&sr=-3.05,.57) or just its ss=…&sr=… part
  const spotParse = v => { v = String(v || '').trim(); const q = new URLSearchParams((v.indexOf('?') >= 0 ? v.slice(v.indexOf('?') + 1) : v).replace(/^[?&#]+/, '').replace(/#.*$/, '')), ss = q.get('ss'), sr = q.get('sr') || ''; if (!/^\d{1,4}$/.test(ss || '')) return null; return { ss, sr: /^-?[0-9.]+,-?[0-9.]+$/.test(sr) ? sr : '', m: modelId(v) }; };
  const slugOk = s => /^[a-z0-9][a-z0-9-]*$/.test(s || '') && s !== 'show' && s !== 'app';   // 'show' is the old MPEmbed address (/show/?m=...), 'app' the Studio online
  const slugify = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
  const slugOf = t => { const s = String(t.slug || '').trim().toLowerCase(); if (s) return s; const m = String(t.model || '').toLowerCase(); return slugOk(m) ? m : ''; };   // no address typed: the Matterport model ID
  const slugTaken = (t, v) => !!v && tours.some(o => o !== t && slugOf(o) === v);
  const uniqueSlug = b => { let s = b, n = 2; while (tours.some(o => slugOf(o) === s)) s = b + '-' + (n++); return s; };
  const ext = (f, d) => { const m = (f && f.name || '').match(/\.([a-z0-9]{2,5})$/i); return m ? m[1].toLowerCase() : d; };

  let trash = [], pvModel = null, tours = [], cur = null, settings = { sdk: '', base: 'https://studio.gambit360.co.il/', folders: [], foldOpen: {}, locked: {} }, urls = {}, saveT = 0, prevAudio = null;

  const fileKeys = t => ['logo', 'music', 'nadir', 'infoimg', 'share'].concat(t.mini.floors.map((_, i) => 'floor:' + i), (t.videos || []).map(v => 'video:' + v.id));
  function normTour(t) {
    const d = TOUR_DEF();
    Object.keys(d).forEach(k => { if (k === 'vidSec' || k === 'tourSec' || k === 'btnOrder' || k === 'btnSty') return; if (t[k] == null || t[k] === '') t[k] = d[k]; else if (TOUR_MERGE.includes(k)) t[k] = Object.assign(d[k], t[k]); });   // the four left out get their own lines below
    if (!Array.isArray(t.spots.list)) t.spots.list = [];   // jump points: places in the tour the visitor can jump to (a Matterport link to a location)
    // button order (the title button comes first), and each button's own name / colour / width
    t.btnOrder = (Array.isArray(t.btnOrder) ? t.btnOrder : []).filter((k, i, a) => BTN_KEYS.includes(k) && a.indexOf(k) === i); if (t.btnOrder.indexOf('title') < 0) t.btnOrder.unshift('title'); ['info', 'tours', 'music', 'video'].forEach(k => { if (t.btnOrder.indexOf(k) < 0) t.btnOrder.push(k); }); if (t.btnOrder.join() === 'title,info,video,tours,music') t.btnOrder = ['title', 'info', 'tours', 'music', 'video'];   /* the earlier default order moves to the new one */ ['spots', 'contact'].forEach(k => { if (t.btnOrder.indexOf(k) < 0) t.btnOrder.push(k); });   /* buttons added later go last */ t.btnSty = t.btnSty || {}; BTN_KEYS.forEach(k => { t.btnSty[k] = Object.assign(BTN_STY_DEF(), t.btnSty[k] || {}); }); t.btnSty.title = Object.assign({ on: false, link: '' }, t.btnSty.title); t.btnSty.contact = Object.assign({ on: false }, t.btnSty.contact); t.vidMode = t.vidMode === 'menu' ? 'menu' : 'player'; t.btnLbl = t.btnLbl === 'icon' ? 'icon' : 'both'; t.uiLang = ['he', 'en'].includes(t.uiLang) ? t.uiLang : 'auto';
    if (!t.cardMig) { t.cardMig = 1; if (t.contact.on && String(t.contact.value || '').trim() && !t.info.on) t.info.on = true; }   // the contact button moved into the details card
    t.vidSec = Object.assign({ on: t.videos.length > 0 }, t.vidSec || {}); t.tourSec = Object.assign({ on: t.tours.length > 0 }, t.tourSec || {});   // the videos / extra-tours buttons can be switched on and off
    if (t.logo) { t.logo.top = Number.isFinite(+t.logo.top) && t.logo.top !== '' && t.logo.top != null ? +t.logo.top : 14; t.logo.side = Number.isFinite(+t.logo.side) && t.logo.side !== '' && t.logo.side != null ? +t.logo.side : 14; }
    if (t.logo && ['tl', 'tc', 'tr'].indexOf(t.logo.pos) < 0) t.logo.pos = 'tl';   // the logo sits only at the top: left, centre or right
    return t;
  }
  async function load() {
    try { tours = (await db.all()) || []; } catch (e) { tours = []; }
    trash = tours.filter(t => t.deleted); tours = tours.filter(t => !t.deleted);
    for (const t of trash.filter(t => Date.now() - t.deleted > 30 * 864e5)) await purge(t);   // the bin empties itself after 30 days
    trash.sort((a, b) => b.deleted - a.deleted);
    settings.folders = settings.folders || []; settings.foldOpen = settings.foldOpen || {}; settings.locked = settings.locked || {};
    tours.forEach(normTour);
    tours.forEach(t => { if (t.folder && settings.folders.indexOf(t.folder) < 0) settings.folders.push(t.folder); });
    tours.sort((a, b) => (b.updated || 0) - (a.updated || 0));
    try { const s = await db.kget('settings'); if (s) Object.assign(settings, s); } catch (e) {}
  }
  function save(t) { t.updated = Date.now(); clearTimeout(saveT); saveT = setTimeout(() => { db.put(t).catch(() => {}); }, 250); renderList(); bkSoon(); }
  async function fileUrl(k) { if (urls[k]) return urls[k]; try { const r = await db.fget(k); if (r && r.blob) return (urls[k] = URL.createObjectURL(r.blob)); } catch (e) {} return ''; }
  async function fileMeta(k) { try { return await db.fget(k); } catch (e) { return null; } }
  function forgetUrl(k) { if (urls[k]) { URL.revokeObjectURL(urls[k]); delete urls[k]; } }

  let msgT = 0;
  function msg(s, err) { const m = $('lvMsg'); m.textContent = s; m.classList.toggle('err', !!err); m.hidden = !s; clearTimeout(msgT); if (s) msgT = setTimeout(() => { m.hidden = true; }, err ? 9000 : 6000); }

