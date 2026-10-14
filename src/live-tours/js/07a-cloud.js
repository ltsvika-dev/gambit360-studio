  // ---- cloud: the server keeps the shared copy. The tours sync between computers (each tour: the newer one wins),
  // another computer connects with a password, the Studio itself opens online at <site>/app/ after that password,
  // and upload.php on the server replaces itself when this Studio carries a newer one ----
  Object.assign(STR.he, {
    cloudL: 'ענן: עבודה מכל מחשב', cloudN: 'הסיורים, הקבצים וההגדרות נשמרים גם בשרת ומסתנכרנים אוטומטית: בכל פתיחה, בכל חזרה לחלון ואחרי כל שינוי. במחשב אחר: "חיבור עם סיסמה", או פשוט לפתוח את הסטודיו באתר. אם אותו סיור נערך בשני מחשבים, הגרסה שנשמרה אחרונה נשארת.',
    cloudIn: 'חיבור עם סיסמה…', cloudSync: 'סנכרון עכשיו', cloudPass: 'קביעת שם משתמש וסיסמה…', cloudPass2: 'שינוי שם משתמש וסיסמה…', cloudApp: 'עדכון הסטודיו באתר', cloudOpen: 'פתיחת הסטודיו באתר', cloudOut: 'ניתוק המחשב הזה',
    cloudOff: 'המחשב הזה לא מחובר לענן.', cloudOn: b => 'מחובר לענן: ' + b, cloudAt: d => 'סנכרון אחרון: ' + d, cloudNoPass: 'עוד לא נקבעה סיסמה, ולכן אי אפשר להתחבר ממחשב אחר.', cloudHasPass: 'יש סיסמה לחיבור ממחשבים אחרים.',
    cloudAppAt: (u, d) => 'הסטודיו באתר: ' + u + ' (עודכן ' + d + ')', cloudAppNone: 'הסטודיו עוד לא הועלה לאתר.', cloudPhpOld: 'upload.php בשרת ישן מכדי להתעדכן לבד. פעם אחרונה: "שמירת upload.php מעודכן" והעלאה ידנית, ומאז הוא יתעדכן לבד.',
    cloudPhpUp: 'upload.php בשרת עודכן לגרסה החדשה ✓', cloudPhpFail: e => 'העדכון של upload.php בשרת נכשל (' + e + '). הקובץ הקיים נשאר בשרת ועובד.',
    inH: 'חיבור לענן', inBase: 'כתובת האתר של הסיורים', inUser: 'שם משתמש', inPass: 'סיסמת הענן', inGo: 'חיבור', inBad: 'שם משתמש או סיסמה שגויים.', inWait: 'יותר מדי ניסיונות. נסו שוב בעוד רבע שעה.', inNoPass: 'עוד לא נקבעה סיסמה. קובעים אותה בסטודיו של המחשב הראשי: אפשרויות ← ענן ← "קביעת שם משתמש וסיסמה".', inNoSrv: 'השרת לא ענה. בדקו את הכתובת.', inOld: 'upload.php בשרת עדיין לא תומך בחיבור עם סיסמה. עדכנו אותו מהמחשב הראשי.',
    inDone: n => 'מחובר לענן ✓ ' + n + ' סיורים במחשב הזה.',
    passH: 'שם משתמש וסיסמה לענן', passUser: 'שם משתמש', pass1Keep: 'סיסמה חדשה (להשאיר ריק כדי לא לשנות)', passUserShort: 'שם המשתמש קצר מדי (לפחות 2 תווים).', userDone: 'שם המשתמש נשמר ✓', cloudUser: u => 'שם משתמש: ' + u,
    cloudNoUser: 'עוד לא נקבע שם משתמש לכניסה לענן. קבעו אותו עכשיו, ומאז הכניסה ממחשב אחר ולסטודיו באתר תבקש גם אותו.', passUserN: 'קבעו שם משתמש לכניסה לענן (למשל השם או המייל שלכם). הסיסמה נשארת כמו שהיא. מעכשיו הכניסה ממחשב אחר ולסטודיו באתר תבקש את שניהם.',
    passN: 'בשם המשתמש ובסיסמה האלה מתחברים ממחשב אחר ונכנסים לסטודיו באתר. סיסמה של לפחות 8 תווים. השרת שומר רק גרסה מוצפנת שלה, ואם שוכחים אותה פשוט קובעים חדשה כאן.', pass1: 'סיסמה', pass2: 'שוב, לאימות', passGo: 'שמירה', passShort: 'הסיסמה קצרה מדי (לפחות 8 תווים).', passDiff: 'הסיסמאות לא זהות.', passDone: 'הסיסמה נשמרה ✓', passOld: 'upload.php בשרת עדיין לא תומך בסיסמה. הוא יתעדכן לבד בסנכרון הבא, או ידנית: "שמירת upload.php מעודכן".',
    appBusy: (i, n) => 'מעלה את הסטודיו לאתר… ' + i + ' מתוך ' + n, appDone: u => 'הסטודיו עודכן באתר ✓ ' + u, appSame: u => 'הסטודיו באתר כבר מעודכן: ' + u, appNoHtml: 'לא מצאתי בתיקייה הזו את קובץ הסטודיו (Gambit360 Studio.html). בחרו את התיקייה שבה הוא נמצא.', appFail: e => 'העלאת הסטודיו נכשלה: ' + e,
    outAsk: 'לנתק את המחשב הזה מהענן? הסיורים בשרת לא נמחקים, ואפשר להתחבר שוב עם הסיסמה.', outWipe: 'למחוק גם את העותק של הסיורים מהמחשב הזה? (מומלץ במחשב שאינו שלכם)\n\nאישור = למחוק מהמחשב הזה\nביטול = להשאיר', outDone: 'המחשב נותק מהענן.',
    syncGot: n => 'התקבלו מהענן ' + n + ' עדכונים ממחשב אחר.', syncBusy: 'מסנכרן עם הענן…', syncDone: n => 'מסונכרן עם הענן ✓ (' + n + ' סיורים)', rekeyDone: 'נוצר מפתח חדש והשרת עבר אליו לבד ✓ קבעו שוב את סיסמת הענן.',
    keyConfirm: 'מפתח חדש יחליף את הקודם. כשהשרת זמין הוא עובר למפתח החדש לבד; אחרת צריך להעלות שוב את upload.php. להמשיך?',
    srvBkOn: 'סנכרון אוטומטי עם הענן (בין כל המחשבים)', srvRestore: 'שחזור מלא מהענן'
  });
  Object.assign(STR.en, {
    cloudL: 'Cloud: work from any computer', cloudN: 'Tours, files and settings are also kept on the server and sync by themselves: on opening, on coming back to the window and after every change. On another computer: "Connect with password", or just open the Studio online. If one tour was edited on two computers, the one saved last stays.',
    cloudIn: 'Connect with password…', cloudSync: 'Sync now', cloudPass: 'Set user name and password…', cloudPass2: 'Change user name and password…', cloudApp: 'Update the Studio online', cloudOpen: 'Open the Studio online', cloudOut: 'Disconnect this computer',
    cloudOff: 'This computer is not connected to the cloud.', cloudOn: b => 'Connected to the cloud: ' + b, cloudAt: d => 'Last sync: ' + d, cloudNoPass: 'No password yet, so no other computer can connect.', cloudHasPass: 'A password for other computers is set.',
    cloudAppAt: (u, d) => 'The Studio online: ' + u + ' (updated ' + d + ')', cloudAppNone: 'The Studio is not online yet.', cloudPhpOld: 'upload.php on the server is too old to update itself. One last time: "Save updated upload.php" and upload it by hand; from then on it updates itself.',
    cloudPhpUp: 'upload.php on the server was updated ✓', cloudPhpFail: e => 'Updating upload.php on the server failed (' + e + '). The existing file stays and works.',
    inH: 'Connect to the cloud', inBase: 'Live tours site address', inUser: 'User name', inPass: 'Cloud password', inGo: 'Connect', inBad: 'Wrong user name or password.', inWait: 'Too many tries. Try again in 15 minutes.', inNoPass: 'No password was set yet. Set it in the Studio on the main computer: Options, Cloud, "Set user name and password".', inNoSrv: 'The server did not answer. Check the address.', inOld: 'upload.php on the server does not support passwords yet. Update it from the main computer.',
    inDone: n => 'Connected to the cloud ✓ ' + n + ' tours on this computer.',
    passH: 'Cloud user name and password', passUser: 'User name', pass1Keep: 'New password (leave empty to keep it)', passUserShort: 'The user name is too short (at least 2 characters).', userDone: 'User name saved ✓', cloudUser: u => 'User name: ' + u,
    cloudNoUser: 'No user name is set for the cloud yet. Set one now; from then on another computer and the Studio online ask for it too.', passUserN: 'Set a user name for the cloud (your name or email, for example). The password stays as it is. From now on another computer and the Studio online ask for both.',
    passN: 'This user name and password connect another computer and open the Studio online. A password of at least 8 characters. The server keeps only a scrambled form of it; if you forget it, just set a new one here.', pass1: 'Password', pass2: 'Again, to check', passGo: 'Save', passShort: 'Too short (at least 8 characters).', passDiff: 'The passwords differ.', passDone: 'Password saved ✓', passOld: 'upload.php on the server does not support passwords yet. It updates itself on the next sync, or by hand: "Save updated upload.php".',
    appBusy: (i, n) => 'Uploading the Studio… ' + i + ' of ' + n, appDone: u => 'The Studio online was updated ✓ ' + u, appSame: u => 'The Studio online is already up to date: ' + u, appNoHtml: 'No Studio file (Gambit360 Studio.html) in that folder. Choose the folder it is in.', appFail: e => 'Uploading the Studio failed: ' + e,
    outAsk: 'Disconnect this computer from the cloud? Nothing is deleted on the server, and you can connect again with the password.', outWipe: 'Also delete the copy of the tours from this computer? (best on a computer that is not yours)\n\nOK = delete from this computer\nCancel = keep it', outDone: 'This computer was disconnected.',
    syncGot: n => n + ' updates from another computer came in from the cloud.', syncBusy: 'Syncing with the cloud…', syncDone: n => 'In sync with the cloud ✓ (' + n + ' tours)', rekeyDone: 'A new key was made and the server switched to it by itself ✓ Set the cloud password again.',
    keyConfirm: 'A new key replaces the old one. When the server answers it switches to the new key by itself; otherwise upload.php must be uploaded again. Continue?',
    srvBkOn: 'Sync with the cloud automatically (between all computers)', srvRestore: 'Full restore from the cloud'
  });
  STR.he.upN += ' מאז upload.php מתעדכן בשרת לבד, בלי FTP.'; STR.en.upN += ' After that upload.php updates itself on the server, no FTP.';
  const HOSTED = /^https?:$/.test(location.protocol) && /\/app\/(index\.php)?$/.test(location.pathname);   // this Studio was opened online, from <site>/app/
  const hostedBase = () => location.origin + location.pathname.replace(/app\/(index\.php)?$/, '');
  const PHP_VER = +(($('g360UploadTpl').textContent.match(/\$VER = (\d+);/) || [])[1] || 0);
  const b64 = u => { let s = ''; for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s); };
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const fmeta = m => m && m.blob ? { size: m.blob.size, ts: m.ts || 0, name: m.name || '' } : null;
  const fsame = (a, b) => !!(a && b && a.size === b.size && (a.ts || 0) === (b.ts || 0) && (a.name || '') === (b.name || ''));
  const baseOf = b => { b = String(b || '').trim(); if (b && !/^https?:\/\//i.test(b)) b = 'https://' + b; return b ? b.replace(/\/?$/, '/') : ''; };
  let userAsked = false, srvInfo = null, srvInfoAt = 0, syncAt = 0, phpNote = '';

  // the upload key travels to another computer only encrypted with the cloud password (PBKDF2 + AES-GCM, in the browser)
  async function pwKey(pw, salt, it, use) { const k0 = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']); return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: it, hash: 'SHA-256' }, k0, { name: 'AES-GCM', length: 256 }, false, [use]); }
  async function wrapKey(pw, key) {
    const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12)), it = 310000;
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await pwKey(pw, salt, it, 'encrypt'), new TextEncoder().encode(key));
    return JSON.stringify({ v: 1, it, salt: b64(salt), iv: b64(iv), ct: b64(new Uint8Array(ct)) });
  }
  async function unwrapKey(pw, w) { w = JSON.parse(w); return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(w.iv) }, await pwKey(pw, unb64(w.salt), w.it, 'decrypt'), unb64(w.ct))); }

  // ---- upload.php keeps itself up to date: the newer copy is written as upload.new.php, answers a test, and only then takes the place of the old one ----
  async function phpUpdate(authKey) {
    let j = await upPost({ key: authKey, action: 'selfup' }, new Blob([await uploadPhp()], { type: 'text/plain' }));
    if (!j.ok) throw new Error(j.error);
    const nu = settings.base.replace(/\/?$/, '/') + 'upload.new.php';
    const post = async a => { const fd = new FormData(); fd.append('key', settings.upKey); fd.append('action', a); return (await fetch(nu, { method: 'POST', body: fd, cache: 'no-store' })).json(); };
    let ok = false; try { const p = await post('ping'); ok = !!(p.ok && p.ver === PHP_VER); } catch (e) {}
    if (!ok) { try { await upPost({ key: authKey, action: 'selfdel' }); } catch (e) {} throw new Error('test'); }
    j = await post('selfswap'); if (!j.ok) throw new Error(j.error || 'swap');
    if (srvInfo) srvInfo.ver = PHP_VER;
  }
  async function srvCheck(force) {   // asks the server how it is (now and then): replaces an older upload.php, and puts a newer Studio online
    if (!settings.upKey || !settings.base) return null;
    if (!force && srvInfo && Date.now() - srvInfoAt < 10 * 60e3) return srvInfo;
    let j; try { j = await upPost({ key: settings.upKey, action: 'ping' }); } catch (e) { return null; }
    if (!j || !j.ok) return null;
    srvInfo = j; srvInfoAt = Date.now(); phpNote = '';
    if ((j.ver || 0) < PHP_VER) {
      if (!j.ver) phpNote = L('cloudPhpOld');   // from before this version: it cannot replace itself, so once more by hand
      else { try { await phpUpdate(settings.upKey); msg(L('cloudPhpUp')); const j2 = await upPost({ key: settings.upKey, action: 'ping' }); if (j2 && j2.ok) srvInfo = j2; } catch (e) { phpNote = L('cloudPhpFail', e.message || e); } }
    }
    if (srvInfo.pass && srvInfo.user === '' && !userAsked && $('lvDlg').hidden && !$('live').hidden) { userAsked = true; msg(L('cloudNoUser')); cloudPass(true); }   // a password from before user names: ask for one, once a session
    if (!HOSTED && srvInfo.ver >= 2) appUpload(false).catch(() => {});
    return srvInfo;
  }
  async function cloudRekey(oldKey) {   // a new upload key: the server takes it from a request signed with the old one
    try { await phpUpdate(oldKey); } catch (e) { return false; }
    srvInfo = null; texts(); $('lvUpSt').textContent = L('rekeyDone'); msg(L('rekeyDone')); cloudSt(); bkSoon(500);
    return true;
  }

  // ---- sync: the server's tours.json against this computer's tours; each tour by its last change, deleted tours stay deleted ----
  async function srvData() { try { return await (await srvPost('bkget', 'tours.json')).json(); } catch (e) { if (e && e.message === 'HTTP 404') return null; throw e; } }
  async function purgedMap() { try { return (await db.kget('purged')) || {}; } catch (e) { return {}; } }
  async function mergeRemote(rd) {
    const ids = new Set(), now = Date.now(), pg = await purgedMap(), rp = rd.purged || {}, rf = rd.files || {};
    let pgCh = false, setCh = false;
    Object.keys(rp).forEach(id => { if (!pg[id]) { pg[id] = rp[id]; pgCh = true; } });
    Object.keys(pg).forEach(id => { if (now - pg[id] > 365 * 864e5) { delete pg[id]; pgCh = true; } });
    if (pgCh) try { await db.kset('purged', pg); } catch (e) {}
    const local = {}; (await db.all()).forEach(t => { local[t.id] = t; });
    for (const id of Object.keys(pg)) if (local[id]) { await purge(local[id]); delete local[id]; ids.add(id); }
    for (const rt of (rd.tours || [])) {
      if (!rt || !rt.id || pg[rt.id]) continue;
      const lt = local[rt.id];
      if (lt && (lt.updated || 0) >= (rt.updated || 0)) continue;
      if (!lt && rt.deleted && now - rt.deleted > 30 * 864e5) continue;
      normTour(rt);
      const keys = new Set(fileKeys(rt).concat(lt ? fileKeys(normTour(lt)) : []));
      for (const k of keys) {   // the files first, the tour after them: a failed download leaves the tour for the next sync
        const key = rt.id + ':' + k, e = rf[key], m = await fileMeta(key);
        if (!e) { if (m) { try { await db.fdel(key); } catch (x) {} forgetUrl(key); } continue; }
        if (fsame(e, fmeta(m))) continue;
        const b = await (await srvPost('bkget', 'files/' + e.file)).blob();
        await db.fset(key, { blob: new Blob([b], { type: e.type || b.type }), name: e.name, type: e.type, ts: e.ts || 0 }); forgetUrl(key);
      }
      await db.put(rt); ids.add(rt.id);
    }
    { const e = rf.splash, m = await fileMeta('splash');
      if (e && !fsame(e, fmeta(m)) && (e.ts || 0) > ((m && m.ts) || 0)) { const b = await (await srvPost('bkget', 'files/' + e.file)).blob(); await db.fset('splash', { blob: new Blob([b], { type: e.type || b.type }), name: e.name, type: e.type, ts: e.ts || 0 }); forgetUrl('splash'); setCh = true; } }
    const rs = rd.settings;
    if (rs && (rs.setAt || 0) > (settings.setAt || 0)) {
      const fo = settings.folders || [];
      Object.keys(rs).forEach(k => { if (k !== 'upKey' && k !== 'ui' && k !== 'base') settings[k] = rs[k]; });
      settings.folders = [...new Set((rs.folders || []).concat(fo))];
      try { await db.kset('settings', settings); } catch (e) {} setCh = true;
    }
    return { ids, setCh };
  }
  async function afterPull(ids, setCh) {   // the changed tours are swapped in place, so the tour being edited here is not disturbed
    const by = {}; (await db.all()).forEach(t => { by[t.id] = t; });
    const keep = t => !ids.has(t.id);
    tours = tours.filter(keep); trash = trash.filter(keep);
    ids.forEach(id => { const t = by[id]; if (t) (t.deleted ? trash : tours).push(normTour(t)); });
    tours.sort((a, b) => (b.updated || 0) - (a.updated || 0)); trash.sort((a, b) => b.deleted - a.deleted);
    tours.forEach(t => { if (t.folder && settings.folders.indexOf(t.folder) < 0) settings.folders.push(t.folder); });
    const hit = !cur || ids.has(cur.id); if (hit) cur = (cur && tours.find(t => t.id === cur.id)) || tours[0] || null;   // nothing was open here yet: the first tour opens
    if (setCh) brandPush();   // my logo or its width came from another computer
    if (!$('live').hidden) { if (setCh) { texts(); modLook(true); } renderList(); if (hit || setCh) { pvModel = null; renderEdit(); preview(true); } }
    if (ids.size) msg(L('syncGot', ids.size));
  }
  async function pushAll(rd) {
    const prev = rd && rd.files || {}, list = await db.all(), files = {}, pg = await purgedMap(), ups = [];
    const keys = ['splash']; list.forEach(t => { normTour(t); fileKeys(t).forEach(k => keys.push(t.id + ':' + k)); });
    for (const key of keys) {
      const m = await fileMeta(key); if (!m || !m.blob) continue;
      const fn = key.replace(/[^A-Za-z0-9_.-]/g, '_') + '.bin', e = files[key] = { name: m.name || '', type: m.type || '', size: m.blob.size, ts: m.ts || 0, file: fn };
      if (!(fsame(prev[key], e) && prev[key].file === fn)) ups.push([fn, m.blob]);
    }
    const cfg = Object.assign({}, settings); delete cfg.upKey; delete cfg.ui;
    if (rd && !ups.length && JSON.stringify([rd.settings, rd.tours, rd.files, rd.purged || {}]) === JSON.stringify([cfg, list, files, pg])) return list;   // nothing new here
    for (const [fn, b] of ups) await srvPost('bkput', 'files/' + fn, b);
    await srvPost('bkput', 'tours.json', new Blob([JSON.stringify({ v: 1, at: Date.now(), settings: cfg, tours: list, files, purged: pg })], { type: 'application/json' }), { prev: rd ? String(rd.at || '') : '' });
    return list;
  }
  async function srvSync(interactive) {
    if (sbBusy || !settings.upKey || !settings.base) return false;
    if (!interactive && settings.srvBk === false) return false;
    sbBusy = true;
    try {
      await srvCheck(interactive);
      for (let i = 0; i < 4; i++) {
        const rd = await srvData(), mg = rd ? await mergeRemote(rd) : null;
        if (mg && (mg.ids.size || mg.setCh)) await afterPull(mg.ids, mg.setCh);
        let list;
        try { list = await pushAll(rd); } catch (e) { if (e && e.message === 'stale') continue; throw e; }   // another computer saved in between: merge that too
        syncAt = Date.now(); try { await db.kset('srvBkAt', syncAt); } catch (e) {}
        return list.filter(t => !t.deleted).length;
      }
      throw new Error('stale');
    } finally { sbBusy = false; }
  }
  // back to the window (another computer may have saved meanwhile), and leaving the screen sends what is still waiting
  const syncSoon = () => { if (!$('live').hidden && settings.upKey && Date.now() - syncAt > 30e3) bkSrvAuto(); };
  addEventListener('focus', syncSoon); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncSoon(); });

  // ---- the Studio online: this Studio's own file and its lib folder go to the server (only from a computer, never from the online copy itself) ----
  async function appSrcDir(ask) {
    let d = null; try { d = await db.kget('appDir'); } catch (e) {} if (!d) d = await studioDirHandle();
    if (d) { try { let p = await d.queryPermission({ mode: 'read' }); if (p !== 'granted' && ask) p = await d.requestPermission({ mode: 'read' }); if (p !== 'granted') d = null; } catch (e) { d = null; } }
    if (!d && ask) d = await g360Pick.dir({ id: 'g360studio', mode: 'read' });
    return d;
  }
  async function appFiles(d) {
    let html = null; const lib = [];
    for await (const [n, h] of d.entries()) {
      if (h.kind === 'file' && /^gambit360 studio\.html?$/i.test(n)) html = h;
      if (h.kind === 'directory' && n.toLowerCase() === 'lib') for await (const [n2, h2] of h.entries()) if (h2.kind === 'file' && /\.js$/i.test(n2)) lib.push(h2);
    }
    return { html, lib };
  }
  const appUrl = () => settings.base.replace(/\/?$/, '/') + 'app/';
  let appBusy = false;
  async function appUpload(ask) {   // automatic: only when the file here is newer than the one online; from the button: whenever it differs
    if (HOSTED || appBusy || !settings.upKey || !window.showDirectoryPicker) return false;
    appBusy = true;
    try {
      const d = await appSrcDir(ask); if (!d) return false;
      const { html, lib } = await appFiles(d); if (!html) { if (ask) throw new Error(L('appNoHtml')); return false; }
      const f = await html.getFile(), txt = await f.text(), sha = await sha256hex(txt), a = srvInfo && srvInfo.app;
      if (a && a.sha === sha) { if (ask) msg(L('appSame', appUrl())); return false; }
      if (!ask && a && (a.mtime || 0) >= f.lastModified) return false;   // the copy online came from a newer file (another computer)
      const n = lib.length + 1;
      for (let i = 0; i < lib.length; i++) { if (ask) msg(L('appBusy', i + 1, n)); const j = await upPost({ key: settings.upKey, action: 'appput', name: 'lib/' + lib[i].name }, await lib[i].getFile()); if (!j.ok) throw new Error(j.error); }
      if (ask) msg(L('appBusy', n, n));
      const ver = (txt.match(/G360_VERSION\s*=\s*'([^']*)'/) || [])[1] || '';
      const j = await upPost({ key: settings.upKey, action: 'appput', name: 'studio.html', sha, mtime: f.lastModified, ver }, new Blob([txt], { type: 'text/html' }));
      if (!j.ok) throw new Error(j.error === 'action' ? L('srvOld') : j.error);
      try { await db.kset('appDir', d); } catch (e) {}
      if (srvInfo) srvInfo.app = { sha, mtime: f.lastModified, ver, at: Date.now() / 1000 };
      if (ask) msg(L('appDone', appUrl())); cloudSt();
      return true;
    } finally { appBusy = false; }
  }

  // ---- connecting, the password, disconnecting ----
  function dlgForm(h, html) { $('lvDlgH').textContent = h; $('lvDlg').querySelector('.box').classList.remove('wide'); const b = $('lvDlgB'); b.innerHTML = html; $('lvDlg').hidden = false; return b; }
  function cloudConnect() {
    const b = dlgForm(L('inH'), '<h4></h4><input type="url" data-b spellcheck="false"><h4></h4><input type="text" data-u autocomplete="username" autocapitalize="none" spellcheck="false"><h4></h4><input type="password" data-p autocomplete="current-password"><div class="row"><button type="button" class="pri" data-go></button></div><div class="note" data-m style="margin-top:8px;min-height:1.3em"></div>');
    const hs = b.querySelectorAll('h4'); hs[0].textContent = L('inBase'); hs[1].textContent = L('inUser'); hs[2].textContent = L('inPass');
    const ib = b.querySelector('[data-b]'), iu = b.querySelector('[data-u]'), ip = b.querySelector('[data-p]'), m = b.querySelector('[data-m]'), go = b.querySelector('[data-go]');
    ib.value = HOSTED ? hostedBase() : settings.base || 'https://studio.gambit360.co.il/'; ib.disabled = HOSTED; go.textContent = L('inGo'); try { iu.value = localStorage.getItem('g360user') || ''; } catch (e) {} setTimeout(() => (iu.value ? ip : iu).focus(), 50);
    ip.onkeydown = e => { if (e.key === 'Enter') go.click(); };
    go.onclick = async () => {
      const base = baseOf(ib.value), pw = ip.value; if (!base || !pw) return;
      m.textContent = '…'; go.disabled = true;
      try {
        let j = null; const fd = new FormData(); fd.append('action', 'login'); fd.append('user', iu.value); fd.append('pass', pw);
        try { j = await (await fetch(base + 'upload.php', { method: 'POST', body: fd, cache: 'no-store' })).json(); } catch (e) { m.textContent = L('inNoSrv'); return; }
        if (!j.ok) { m.textContent = j.error === 'wait' ? L('inWait') : j.error === 'nopass' ? L('inNoPass') : j.error === 'pass' ? L('inBad') : j.error === 'key' || j.error === 'action' ? L('inOld') : String(j.error); return; }
        settings.upKey = await unwrapKey(pw, j.wrap); settings.base = base; srvInfo = null; try { localStorage.setItem('g360user', iu.value.trim()); } catch (e) {}
        try { await db.kset('settings', settings); } catch (e) {}
        $('lvDlg').hidden = true; texts(); cloudSt(); msg(L('syncBusy'));
        const n = await srvSync(true); bkSt.srv = { ok: true, n, at: Date.now() }; checkBk(); srvSt(); cloudSt(); msg(L('inDone', n));
      } catch (e) { m.textContent = bkErr(e); }
      finally { go.disabled = false; }
    };
  }
  function cloudPass(userOnly) {   // the user name and the cloud password; with a password already set, the password may stay empty (only the user name changes)
    userOnly = userOnly === true;
    const b = dlgForm(L('passH'), '<div class="note" data-n></div><h4></h4><input type="text" data-u autocomplete="username" autocapitalize="none" spellcheck="false"><div data-pw><h4></h4><input type="password" data-1 autocomplete="new-password"><h4></h4><input type="password" data-2 autocomplete="new-password"></div><div class="row"><button type="button" class="pri" data-go></button></div><div class="note" data-m style="margin-top:8px;min-height:1.3em"></div>');
    const has = !!(srvInfo && srvInfo.pass), hs = b.querySelectorAll('h4'); hs[0].textContent = L('passUser'); hs[1].textContent = L(has ? 'pass1Keep' : 'pass1'); hs[2].textContent = L('pass2');
    b.querySelector('[data-n]').textContent = L(userOnly ? 'passUserN' : 'passN'); b.querySelector('[data-pw]').hidden = userOnly;
    const u = b.querySelector('[data-u]'), p1 = b.querySelector('[data-1]'), p2 = b.querySelector('[data-2]'), m = b.querySelector('[data-m]'), go = b.querySelector('[data-go]');
    u.value = (srvInfo && srvInfo.user) || ''; go.textContent = L('passGo'); setTimeout(() => u.focus(), 50);
    u.onkeydown = e => { if (e.key === 'Enter') { if (userOnly) go.click(); else p1.focus(); } }; p2.onkeydown = e => { if (e.key === 'Enter') go.click(); };
    go.onclick = async () => {
      const un = u.value.trim().replace(/\s+/g, ' '), pw = userOnly ? '' : p1.value;
      if (un.length < 2) { m.textContent = L('passUserShort'); return; }
      if (pw || !has) { if (pw.length < 8) { m.textContent = L('passShort'); return; } if (pw !== p2.value) { m.textContent = L('passDiff'); return; } }
      m.textContent = '…'; go.disabled = true;
      try {
        await srvCheck(true);
        const j = await upPost(Object.assign({ key: settings.upKey, action: 'setpass', user: un, pass: pw }, pw ? { wrap: await wrapKey(pw, settings.upKey) } : {}));
        if (!j.ok) { m.textContent = j.error === 'action' ? L('passOld') : j.error === 'key' ? L('pingKey') : String(j.error); return; }
        if (srvInfo) { srvInfo.pass = true; srvInfo.user = un; } try { localStorage.setItem('g360user', un); } catch (e) {}
        $('lvDlg').hidden = true; msg(L(pw ? 'passDone' : 'userDone')); cloudSt();
      } catch (e) { m.textContent = bkErr(e); }
      finally { go.disabled = false; }
    };
  }
  async function cloudOut() {
    if (!(await g360Ask(L('outAsk')))) return;
    const wipe = await g360Ask(L('outWipe'));
    if (HOSTED) { try { await upPost({ action: 'logout' }); } catch (e) {} }
    delete settings.upKey; srvInfo = null;
    if (wipe) { try { if (db.h) db.h.close(); } catch (e) {} db.h = null; await new Promise(res => { const r = indexedDB.deleteDatabase('gambit360live'); r.onsuccess = r.onerror = r.onblocked = () => res(); }); location.reload(); return; }
    try { await db.kset('settings', settings); } catch (e) {}
    if (HOSTED) { location.reload(); return; }
    texts(); cloudSt(); msg(L('outDone'));
  }
  async function cloudSt() {
    const st = $('lvCloudSt'), on = !!settings.upKey;
    ['lvCloudSync', 'lvCloudPass', 'lvCloudOut'].forEach(id => { $(id).hidden = !on; }); $('lvCloudIn').hidden = on;
    $('lvCloudApp').hidden = !on || HOSTED || !window.showDirectoryPicker; $('lvCloudOpen').hidden = !on || HOSTED || !(srvInfo && srvInfo.app);
    $('lvCloudPass').textContent = L(srvInfo && srvInfo.pass ? 'cloudPass2' : 'cloudPass');
    if (!on) { st.textContent = L('cloudOff'); return; }
    let at = 0; try { at = await db.kget('srvBkAt'); } catch (e) {}
    const ln = [L('cloudOn', settings.base)]; if (at) ln.push(L('cloudAt', new Date(at).toLocaleString()));
    if (srvInfo) { ln.push(L(srvInfo.pass ? 'cloudHasPass' : 'cloudNoPass')); if (srvInfo.pass && srvInfo.user) ln.push(L('cloudUser', srvInfo.user)); else if (srvInfo.pass && srvInfo.user === '') ln.push(L('cloudNoUser')); if (!HOSTED) ln.push(srvInfo.app ? L('cloudAppAt', appUrl(), new Date(srvInfo.app.at * 1000).toLocaleString()) : L('cloudAppNone')); }
    if (phpNote) ln.push(phpNote);
    st.textContent = ln.join(' · ');
  }
  function cloudTexts() {
    $('lvCloudL').textContent = L('cloudL'); $('lvCloudN').textContent = L('cloudN');
    $('lvCloudIn').textContent = L('cloudIn'); $('lvCloudSync').textContent = L('cloudSync'); $('lvCloudApp').textContent = L('cloudApp'); $('lvCloudOpen').textContent = L('cloudOpen'); $('lvCloudOut').textContent = L('cloudOut');
    cloudSt(); if (settings.upKey) srvCheck(false).then(() => cloudSt());
  }
  $('lvCloudIn').onclick = cloudConnect;
  $('lvCloudPass').onclick = () => cloudPass();
  $('lvCloudOut').onclick = cloudOut;
  $('lvCloudOpen').onclick = () => window.open(appUrl(), '_blank', 'noopener');
  $('lvCloudSync').onclick = async () => {
    msg(L('syncBusy'));
    try { srvInfo = null; const n = await srvSync(true); bkSt.srv = { ok: true, n, at: Date.now() }; msg(n === false ? '' : L('syncDone', n)); }
    catch (e) { bkSt.srv = { ok: false, err: bkErr(e) }; msg(L('srvBkFail', bkSt.srv.err), true); }
    checkBk(); srvSt(); cloudSt();
  };
  $('lvCloudApp').onclick = async () => { try { await srvCheck(true); while (appBusy) await new Promise(r => setTimeout(r, 200)); await appUpload(true); } catch (e) { if (e && e.name !== 'AbortError') msg(L('appFail', bkErr(e)), true); } cloudSt(); };
  // signed in on the password page of the Studio online: the key it unwrapped waits here for the tours screen
  async function cloudBoot() {
    let k = null; try { k = localStorage.getItem('g360cloudKey'); } catch (e) {}
    if (HOSTED) settings.base = hostedBase();
    if (k) { try { localStorage.removeItem('g360cloudKey'); } catch (e) {} if (/^[0-9a-f]{48}$/.test(k)) { settings.upKey = k; srvInfo = null; } }
    if (k || HOSTED) try { await db.kset('settings', settings); } catch (e) {}
    return !!k;
  }
  // the point-cloud viewer keeps its projects in the same cloud (06a-cloud-projects.js): it gets the address, the key and an up-to-date upload.php from here
  window.G360_cloud = async () => {
    if (!settings.upKey) { try { const s = await db.kget('settings'); if (s) Object.assign(settings, s); } catch (e) {} }
    await cloudBoot();
    if (!settings.upKey || !settings.base) return null;
    const i = await srvCheck(false);
    let user = ''; try { user = localStorage.getItem('g360user') || ''; } catch (e) {}
    return { url: upUrl(), key: settings.upKey, ver: i ? i.ver || 0 : 0, user: (i && i.user) || user };
  };
  if (HOSTED) { let k = null; try { k = localStorage.getItem('g360cloudKey'); } catch (e) {} if (k) setTimeout(() => { if (window.G360_openLive) window.G360_openLive(); }, 300); }
