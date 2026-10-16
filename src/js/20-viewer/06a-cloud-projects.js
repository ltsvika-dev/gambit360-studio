  /*@STUDIO*/
  // ---- Projects in the cloud: when this computer is connected to the cloud (Live tours, Options, Cloud), every project with something in it
  // (title, tags, views, measurements) is kept on the server too, one per model, and opens from any computer and from the Studio online.
  // Only the project goes up, never the E57 itself: on another computer the scan file is picked once and remembered there.
  // Each computer keeps up by itself: a change here goes up within seconds, and a newer copy from another computer comes in when the model opens. ----
  Object.assign(I18N.he, { cpOpenBtn: 'פתיחת פרויקט מהשרת', cpH: 'פרויקטים בענן', cpLoading: 'טוען את הרשימה…', cpClose: 'סגירה', cpDel: 'מחיקה מהענן',
    cpNone: 'עוד אין פרויקטים בענן. כל פרויקט שיש בו משהו (כותרת, תגיות, נקודות מבט, מדידות) נשמר בענן לבד כשהמחשב מחובר לענן.',
    cpNote: 'רק קובץ הפרויקט נשמר בענן, לא קובץ ה-E57. במחשב שאין בו את קובץ הסריקה בוחרים אותו פעם אחת.',
    cpInfo: (d, n) => 'נשמר ' + d + (n ? ' · ' + n + ' תגיות' : ''), cpDelAsk: n => 'למחוק את "' + n + '" מהענן?\nקובץ הפרויקט וקובץ הסריקה במחשבים לא נמחקים, ועותק נשאר בשרת.',
    cpSaved: 'הפרויקט נשמר בענן ✓', cpSavedAlso: n => 'הפרויקט נשמר ב-"' + n + '" וגם בענן ✓', cpFail: e => 'השמירה בענן נכשלה: ' + e, cpErr: e => 'הענן לא ענה: ' + e, cpNoCloud: 'המחשב הזה לא מחובר לענן. מתחברים ב"סיורים חיים" ← אפשרויות ← ענן.',
    cpOld: 'upload.php בשרת ישן מכדי לשמור פרויקטים. פתחו פעם אחת את "סיורים חיים" במחשב הראשי והוא יתעדכן לבד.',
    cpStale: d => 'במחשב אחר נשמרה בינתיים גרסה של הפרויקט הזה (' + d + ').\nלשמור בענן את הגרסה שכאן במקומה?', cpGot: d => 'נטענה מהענן גרסה חדשה יותר של הפרויקט (' + d + ')',
    pubAsk: 'לפרסם את החבילה גם בשרת?\nהלקוח יקבל קישור ויצפה בה בדפדפן, ועם הקוד שהסטודיו ייתן לך הוא יוכל גם להוריד אותה. פרסום חוזר של אותו פרויקט מעדכן את אותו קישור.', pubYes: 'פרסום בשרת', pubNo: 'לא עכשיו',
    pubName: b => 'השם בכתובת ללקוח (אותיות באנגלית, ספרות ומקף):\n' + b + '…/', pubNameBad: 'השם צריך להיות באנגלית: אותיות, ספרות ומקף, לפחות שני תווים.', pubNameTaken: n => 'השם "' + n + '" כבר תפוס בשרת על ידי חבילה אחרת.\nלהחליף אותה בחבילה הזו? הקישור הזה יציג מעכשיו את החבילה הזו.', pubReplace: 'להחליף', pubOther: 'לבחור שם אחר',
    pubAskUpd: 'לעדכן גם את החבילה בשרת?\nהלקוח יראה את השינויים באותו קישור. עולים רק הקבצים שהשתנו.', pubSame: 'כבר בשרת', pkgPubBtn: 'פרסום החבילה בשרת', pkgPubTip: 'מעלה לשרת את החבילה שכבר נמצאת במחשב (Export\\Client Packages) ונותן קישור ללקוח וקוד הורדה. עולים רק הקבצים שהשתנו.',
    pubNoPkg: n => 'לא נמצאה חבילה בשם "' + n + '" בתיקייה Export\\Client Packages. צרו אותה קודם בלחיצה על "יצירת חבילה ללקוח" כש"מודל" מסומן.',
    pubBusy: (i, n) => 'מעלה את החבילה לשרת… ' + i + ' מתוך ' + n, pubDone: (u, c) => 'החבילה פורסמה בשרת ✓ הקישור ללקוח: ' + u + ' · קוד להורדת החבילה: ' + c, pubCodeLine: c => 'קוד להורדת החבילה: ' + c, pubFail: e => 'הפרסום בשרת נכשל: ' + e + '. החבילה במחשב מוכנה ותקינה.',
    pubBig: (f, mb) => 'הקובץ ' + f + ' גדול מדי לשרת (' + mb + 'MB, עד 45MB). אפשר לבחור איכות פנורמות נמוכה יותר או סרטון קצר יותר.' });
  Object.assign(I18N.en, { cpOpenBtn: 'Open a project from the server', cpH: 'Projects in the cloud', cpLoading: 'Loading the list…', cpClose: 'Close', cpDel: 'Delete from the cloud',
    cpNone: 'No projects in the cloud yet. Every project with something in it (title, tags, views, measurements) is kept in the cloud by itself while this computer is connected to the cloud.',
    cpNote: 'Only the project file is kept in the cloud, not the E57 file. On a computer without the scan file, it is picked once.',
    cpInfo: (d, n) => 'Saved ' + d + (n ? ' · ' + n + ' tags' : ''), cpDelAsk: n => 'Delete "' + n + '" from the cloud?\nThe project and scan files on the computers stay, and a copy stays on the server.',
    cpSaved: 'The project was saved in the cloud ✓', cpSavedAlso: n => 'The project was saved to "' + n + '" and in the cloud ✓', cpFail: e => 'Saving in the cloud failed: ' + e, cpErr: e => 'The cloud did not answer: ' + e, cpNoCloud: 'This computer is not connected to the cloud. Connect in Live tours, Options, Cloud.',
    cpOld: 'upload.php on the server is too old to keep projects. Open Live tours once on the main computer and it updates itself.',
    cpStale: d => 'Meanwhile another computer saved a version of this project (' + d + ').\nSave the version here in the cloud instead?', cpGot: d => 'A newer version of the project came in from the cloud (' + d + ')',
    pubAsk: 'Publish the package on the server too?\nThe client gets a link to view it in the browser, and with the code the Studio gives you, can also download it. Publishing the same project again updates the same link.', pubYes: 'Publish on the server', pubNo: 'Not now',
    pubName: b => 'The name in the client\'s address (English letters, digits and dashes):\n' + b + '…/', pubNameBad: 'The name must be in English: letters, digits and dashes, at least two characters.', pubNameTaken: n => 'The name "' + n + '" is already used on the server by another package.\nReplace it with this package? That link will show this package from now on.', pubReplace: 'Replace', pubOther: 'Choose another name',
    pubAskUpd: 'Update the package on the server too?\nThe client sees the changes at the same link. Only the files that changed are sent.', pubSame: 'already on the server', pkgPubBtn: 'Publish the package on the server', pkgPubTip: 'Uploads the package already on this computer (Export\\Client Packages) and gives a link for the client and a download code. Only the files that changed are sent.',
    pubNoPkg: n => 'No package named "' + n + '" was found in Export\\Client Packages. Create it first with "Create client package" with "Model" ticked.',
    pubBusy: (i, n) => 'Uploading the package… ' + i + ' of ' + n, pubDone: (u, c) => 'The package is on the server ✓ The client\'s link: ' + u + ' · Code to download the package: ' + c, pubCodeLine: c => 'Code to download the package: ' + c, pubFail: e => 'Publishing on the server failed: ' + e + '. The package on this computer is ready and fine.',
    pubBig: (f, mb) => 'The file ' + f + ' is too large for the server (' + mb + ' MB, up to 45 MB). Choose a lower panorama quality or a shorter video.' });
  const CP_HOSTED = /^https?:$/.test(location.protocol) && /\/app\/(index\.php)?$/.test(location.pathname);   // the Studio online, at <site>/app/
  let cpCfgP = null, cpCfgAt = 0, cpLast = { name:'', saved:'', json:'' }, cpSeen = { name:'', json:'' }, cpBusy = false;   // cpLast: the copy this computer last sent to or got from the cloud
  function cpCfg(force) {   // the cloud's address and key, from the Live tours module (null when this computer is not connected)
    if (force || !cpCfgP || Date.now() - cpCfgAt > 5 * 60e3) { cpCfgAt = Date.now(); cpCfgP = (window.G360_cloud ? window.G360_cloud() : Promise.resolve(null)).catch(() => null); }
    return cpCfgP;
  }
  async function cpId(name) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('g360pc:' + name)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('').slice(0, 24); }
  const cpNorm = d => JSON.stringify(Object.assign({}, d, { saved:undefined }));   // the project without its save time: equal means nothing changed
  const cpHas = d => !!(d.title || d.manager || d.views.length || d.measures.length || d.areas.length || (d.extras && d.extras.tags && d.extras.tags.length));
  const cpWhen = s => { const x = Date.parse(s); return x ? new Date(x).toLocaleString() : ''; };
  const cpAtKey = name => 'g360pcAt:' + name;   // when the project last changed on this computer: decides which copy is newer when the model opens
  const cpAt = name => { try { return +localStorage.getItem(cpAtKey(name)) || 0; } catch (err) { return 0; } };
  const cpSetAt = (name, v) => { try { localStorage.setItem(cpAtKey(name), String(v)); } catch (err) {} };
  async function cpPost(c, fields, blob, ka) {
    const fd = new FormData(); fd.append('key', c.key); Object.keys(fields).forEach(k => { if (fields[k] != null) fd.append(k, fields[k]); }); if (blob) fd.append('file', blob, 'project.g360');
    const r = await fetch(c.url, { method:'POST', body:fd, cache:'no-store', keepalive:!!ka });
    if (fields.action === 'pcget') { if (r.status === 404) return null; if (r.ok) return r.json(); }
    let j = null; try { j = await r.json(); } catch (err) {}
    if (!j) throw new Error('HTTP ' + r.status);
    if (!j.ok && j.error === 'action') throw new Error(t('cpOld'));
    return j;
  }
  // sends this project; prev = the save time of the cloud copy this one was based on (the server refuses when another computer saved after it)
  async function cpPush(d, force, ka) {
    const c = await cpCfg(); if (!c) return null;
    const name = d.model, id = await cpId(name), text = JSON.stringify(d);
    const j = await cpPost(c, { action:'pcput', id, prev:force ? null : (cpLast.name === name ? cpLast.saved : '') }, new Blob([text], { type:'application/json' }), ka && text.length < 60000);
    if (j.ok) { cpLast = { name, saved:d.saved, json:cpNorm(d) }; cpSetAt(name, Date.parse(d.saved) || Date.now()); }
    else if (j.error !== 'stale') throw new Error(j.error);
    return j;
  }
  // the model opened: the cloud copy is compared with this computer's, the newer one wins (a change here goes up, a newer one from another computer comes in)
  async function cpLink() {
    const name = currentName; if (!name || fromPkg || window.G360_CLIENT) return;
    const c = await cpCfg(); if (!c || name !== currentName) return;
    let r; try { r = await cpPost(c, { action:'pcget', id:await cpId(name) }); } catch (err) { console.warn('cloud project', err); return; }
    if (name !== currentName) return;
    const local = cpNorm(projectData());
    if (!r) { cpLast = { name, saved:'', json:'' }; cpSeen = { name, json:local }; return; }   // not in the cloud yet: it goes up with its first content
    const rt = Date.parse(r.saved) || 0;
    if (cpNorm(r) !== local && r.model === name && (rt > cpAt(name) || (!cpHas(projectData()) && cpHas(r)))) {   // an empty project here (the scan picked again) never wipes the one in the cloud
      applyProject(r); cpSetAt(name, rt); const m = t('cpGot', cpWhen(r.saved)); say(m); pkgMsg(m);
      cpLast = { name, saved:r.saved, json:cpNorm(projectData()) };
    } else cpLast = { name, saved:r.saved, json:cpNorm(r) === local ? local : '' };   // the same, or newer here: then it goes up at the next look
    cpSeen = { name, json:cpNorm(projectData()) };
  }
  // every 15 seconds (and when the window is left): a change is noted with its time, and goes up when this computer is connected
  async function cpTick(leaving) {
    if (!started || !currentName || fromPkg || window.G360_CLIENT || cpBusy) return;
    const name = currentName, d = projectData(), j = cpNorm(d);
    if (cpSeen.name === name && cpSeen.json !== j) cpSetAt(name, Date.now());
    cpSeen = { name, json:j };
    if (cpLast.name !== name || cpLast.json === j || (!cpLast.saved && !cpHas(d))) return;
    cpBusy = true;
    try { const r = await cpPush(d, false, leaving); if (r && r.error === 'stale') await cpLink(); }   // another computer saved in between: the newer copy decides
    catch (err) { console.warn('cloud project', err); }
    finally { cpBusy = false; }
  }
  setInterval(cpTick, 15000); window.G360_cpTick = cpTick;   // (the browser tests call it instead of waiting, and the next one)
  addEventListener('pagehide', () => cpTick(true)); document.addEventListener('visibilitychange', () => { if (document.hidden) cpTick(true); });
  // "Save project": the cloud copy too (in the Studio online, only the cloud)
  async function cpSaveNow(d, fileName) {
    const c = await cpCfg(true);
    if (!c) { if (CP_HOSTED) { pkgMsg(t('cpNoCloud')); say(t('cpNoCloud')); } return false; }
    cpBusy = true;
    try {
      let r = await cpPush(d, false);
      if (r && r.error === 'stale' && (await g360Ask(t('cpStale', cpWhen(r.saved))))) r = await cpPush(d, true);
      if (!r || !r.ok) return false;
      cpSeen = { name:d.model, json:cpNorm(d) };
      const m = fileName ? t('cpSavedAlso', fileName) : t('cpSaved'); pkgMsg(m); say(m); return true;
    } catch (err) { const m = t('cpFail', err.message || err); pkgMsg(m); say(m); return false; }
    finally { cpBusy = false; }
  }

  // ---- a client package on the site: after the package is made, the Studio asks whether the client should also get it as a link (packages/<token>/index.html).
  // The token is kept with the project, so publishing again (from any computer) updates the same link. ----
  const PKG_NM = /^[a-z0-9][a-z0-9-]{1,59}$/, pkgSlug = s => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  async function pkgPublish(entries, safe, viewerName, o) {
    o = o || {};
    const c = await cpCfg(true); if (!c) { if (o.noAsk) pkgMsg(t('cpNoCloud')); return; }
    let tk = pkgPubOf(currentName), code = '';
    const had = PKG_NM.test(tk), base = c.url.replace(/upload\.php$/, '') + 'packages/';
    let force = false, nm = had ? tk : PKG_NM.test(pkgSlug(safe)) ? pkgSlug(safe) : 'p' + [...crypto.getRandomValues(new Uint8Array(10))].map(b => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('');
    if (!(o.noAsk && had && !o.askName)) {   // the name in the client's address (packages/<name>/) is mine to choose; it is asked together with the question whether to publish
      let err = '';
      for (;;) {
        force = false;
        const v = await g360Ask((err ? err + '\n\n' : '') + (o.noAsk ? '' : t(had ? 'pubAskUpd' : 'pubAsk') + '\n\n') + t('pubName', base), { input:true, value:nm, ok:t('pubYes'), cancel:t('pubNo') });
        if (v == null) return;
        nm = pkgSlug(v);
        if (!PKG_NM.test(nm)) { err = t('pubNameBad'); continue; }
        if (nm !== tk) { let j = null; try { j = await cpPost(c, { action:'pkglist', token:nm, proj:currentName }); } catch (e) {} if (j && j.taken) { if (!(await g360Ask(t('pubNameTaken', nm), { ok:t('pubReplace'), cancel:t('pubOther') }))) { err = ''; continue; } force = true; } }   // the name is in use: replace that package, or choose another name
        break;
      }
    }
    try { code = localStorage.getItem('tourViewerPkgCode:' + currentName) || ''; } catch (err) {}
    if (had && nm !== tk) {   // a new name: the package on the server moves, and the old address sends on to the new one
      let j = null; try { j = await cpPost(c, { action:'pkgmove', token:tk, to:nm, proj:currentName, force:force ? 1 : 0 }); } catch (err) { pkgMsg(t('pubFail', err.message || err)); return; }
      if (!j.ok) { pkgMsg(t('pubFail', j.error === 'taken' ? t('pubNameTaken', nm) : j.error)); return; }
    }
    if (nm !== tk) { tk = nm; try { localStorage.setItem('tourViewerPkgPub:' + currentName, tk); } catch (err) {} }
    const list = entries.filter(e => e.path.startsWith(safe + '/')).map(e => { const rel = e.path.slice(safe.length + 1); return { rel:rel === viewerName ? 'index.html' : rel, fh:e.fh }; });
    try {
      let have = {}; try { const h = await cpPost(c, { action:'pkglist', token:tk, proj:currentName }); if (h && h.ok && h.have) have = h.have; } catch (err) {}   // what the server already has: a file that did not change is not sent again
      const sha = async f => [...new Uint8Array(await crypto.subtle.digest('SHA-256', await f.arrayBuffer()))].map(x => x.toString(16).padStart(2, '0')).join('');
      for (let i = 0; i < list.length; i++) {
        if (pkgAbort) throw new Error(t('pkgCancelledMsg'));
        pkgMsg(t('pubBusy', i + 1, list.length));
        const f = await list[i].fh.getFile(), was = have[list[i].rel];
        if (f.size > 45 * 1048576) throw new Error(t('pubBig', list[i].rel, Math.round(f.size / 1048576)));   // the server takes up to 50MB a request
        if (was && was[0] === f.size && was[1] === await sha(f)) continue;
        const j = await cpPost(c, { action:'pkgput', token:tk, path:list[i].rel }, f);
        if (!j.ok) throw new Error(j.error + ' (' + list[i].rel + ')');
      }
      const j = await cpPost(c, { action:'pkgdone', token:tk, keep:JSON.stringify(list.map(x => x.rel)) }); if (!j.ok) throw new Error(j.error);
      if (!/^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(code)) { code = [0, 1].map(() => [...crypto.getRandomValues(new Uint8Array(4))].map(b => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('')).join('-'); try { localStorage.setItem('tourViewerPkgCode:' + currentName, code); } catch (err) {} }
      const k = await cpPost(c, { action:'pkgcode', token:tk, code, exp:expiryEnd(), name:safe, proj:currentName }); if (!k.ok) throw new Error(k.error);   // the client downloads the package with this code (a ZIP the server builds from these same files)
    } catch (err) { pkgMsg(t('pubFail', err.message || err)); return; }
    const url = c.url.replace(/upload\.php$/, '') + 'packages/' + tk + '/index.html', txt = url + '\n' + t('pubCodeLine', code);
    pkgMsg(t('pubDone', url, code)); say(t('pubDone', url, code));
    $('pkgPath').textContent = txt; $('pkgPath').style.whiteSpace = 'pre-line'; $('pkgOpen').hidden = false;
    const copy = async (s, m) => { try { await navigator.clipboard.writeText(s); } catch (err) { const ta = document.createElement('textarea'); ta.value = s; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); } pkgMsg(t(m)); };
    $('pkgCopy').textContent = t('pkgCopyLink'); $('pkgCopy').onclick = () => copy(url, 'pkgLinkCopied');   // the link and the code are copied apart: they usually go to the client separately
    $('pkgCopyCode').textContent = t('pkgCopyCode'); $('pkgCopyCode').hidden = false; $('pkgCopyCode').onclick = () => copy(code, 'pkgCodeCopied');
  }

  window.G360_pkgPublish = pkgPublish;
  // "Publish the package on the server" in the package panel: the package already made on this computer goes up as it is (and again after a change, only what changed)
  { const pb = $('pkgBtn'), row = pb && pb.closest('.mprow');
    if (row) {
      const b = document.createElement('button'); b.type = 'button'; b.id = 'pkgPubBtn';
      const lbl = () => { b.textContent = t('pkgPubBtn'); b.title = t('pkgPubTip'); }; lbl();
      b.onclick = async () => {
        if (pkgBusy) return;
        if (!(await cpCfg(true))) { pkgMsg(t('cpNoCloud')); return; }
        b.disabled = true; try { await pkgPublishFolder({ noAsk:true, askName:true }); } finally { b.disabled = false; }   // the button asks only for the name in the address (to keep or change)
      };
      const r2 = document.createElement('div'); r2.className = 'mprow'; r2.appendChild(b); row.insertAdjacentElement('afterend', r2);
      const prev = window.G360_relang; window.G360_relang = function () { if (prev) prev.apply(this, arguments); lbl(); };
    } }

  // ---- "Open a project from the cloud" on the start screen: the list, then the same way as a project file ----
  let cpDlg = null;
  function cpBox() {
    if (cpDlg) return cpDlg;
    cpDlg = document.createElement('div'); cpDlg.id = 'cpDlg'; cpDlg.hidden = true;
    cpDlg.innerHTML = '<div class="box" role="dialog" aria-modal="true"><h3></h3><div class="note"></div><div class="list"></div><div class="row"><button type="button" class="no"></button></div></div>';
    document.body.appendChild(cpDlg);
    cpDlg.querySelector('.no').onclick = () => { cpDlg.hidden = true; };
    cpDlg.addEventListener('mousedown', e => { if (e.target === cpDlg) cpDlg.hidden = true; });
    addEventListener('keydown', e => { if (cpDlg.hidden) return; if (e.key === 'Escape') cpDlg.hidden = true; e.stopImmediatePropagation(); }, true);   // while it is open the Studio's shortcuts stay off (a question on top of it takes the keys first)
    return cpDlg;
  }
  async function cpOpenList() {
    const b = cpBox(), list = b.querySelector('.list');
    b.querySelector('h3').textContent = t('cpH'); b.querySelector('.note').textContent = t('cpNote'); b.querySelector('.no').textContent = t('cpClose');
    list.textContent = t('cpLoading'); b.hidden = false;
    const c = await cpCfg(true);
    if (!c) { list.textContent = t('cpNoCloud'); return; }
    let j; try { j = await cpPost(c, { action:'pclist' }); } catch (err) { list.textContent = t('cpErr', err.message || err); return; }
    const items = (j.list || []).sort((a, b) => (Date.parse(b.saved) || 0) - (Date.parse(a.saved) || 0));
    list.textContent = items.length ? '' : t('cpNone');
    items.forEach(it => {
      const row = document.createElement('div'); row.className = 'it';
      const go = document.createElement('button'); go.type = 'button'; go.className = 'go';
      const nm = document.createElement('b'), sm = document.createElement('small'), md = document.createElement('small');
      nm.textContent = it.title || String(it.model).replace(/^(cloud_\d+)_\d+$/i, '$1'); md.textContent = it.title ? String(it.model).replace(/^(cloud_\d+)_\d+$/i, '$1') : ''; sm.textContent = t('cpInfo', cpWhen(it.saved), it.tags);
      nm.dir = 'auto'; go.append(nm, md, sm);
      const del = document.createElement('button'); del.type = 'button'; del.className = 'del'; del.title = t('cpDel'); del.setAttribute('aria-label', t('cpDel'));
      del.innerHTML = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>';
      go.onclick = () => cpOpen(c, it);
      del.onclick = async () => { if (!(await g360Ask(t('cpDelAsk', nm.textContent)))) return; try { await cpPost(c, { action:'pcdel', id:it.id }); row.remove(); if (cpLast.name === it.model) cpLast = { name:'', saved:'', json:'' }; if (!list.children.length) list.textContent = t('cpNone'); } catch (err) { say(t('cpErr', err.message || err)); } };
      row.append(go, del); list.appendChild(row);
    });
  }
  async function cpOpen(c, it) {
    let d; try { d = await cpPost(c, { action:'pcget', id:it.id }); } catch (err) { say(t('cpErr', err.message || err)); return; }
    if (!d) return;
    cpBox().hidden = true; projHandle = null;
    hideImport(); $('boot').hidden = false; let ok = false;
    try { await sleep(40); ok = await openProjectData(d); } finally { hideBoot(); if (!ok) backToImport(); }
    if (d.saved) cpSetAt(d.model, Date.parse(d.saved) || 0);   // what came from the cloud counts as this computer's copy, so the cloud copy is not taken again over it
  }
  // the button beside "Open a local project" (one row) shows only on a computer connected to the cloud
  { const ps = $('projOpenStart');
    if (ps && ps.parentNode) {
      const row = document.createElement('div'); row.className = 'loadRow'; row.id = 'openRow'; ps.insertAdjacentElement('beforebegin', row); row.appendChild(ps);
      const b = document.createElement('button'); b.type = 'button'; b.id = 'cpOpenBtn'; b.className = 'resume'; b.hidden = true; b.onclick = cpOpenList; row.appendChild(b);
      const show = async () => { b.textContent = t('cpOpenBtn'); b.hidden = !(await cpCfg()); };
      setTimeout(show, 300); addEventListener('focus', () => { if (!started) { cpCfgAt = 0; show(); } });
      const prev = window.G360_relang; window.G360_relang = function () { if (prev) prev.apply(this, arguments); b.textContent = t('cpOpenBtn'); if (cpDlg && !cpDlg.hidden) cpOpenList(); };
    } }
  /*@/STUDIO*/
