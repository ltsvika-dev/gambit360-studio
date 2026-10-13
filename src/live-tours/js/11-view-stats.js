  // ---- automatic view reports by email: recipients per tour and how often; upload.php keeps them and sends them (see repRun there) ----
  Object.assign(STR.he, {
    rpMailH: 'דוחות אוטומטיים במייל', rpMailN: 'הלקוח יקבל למייל דוח צפיות של הסיור הזה כל כמה זמן שתבחרו. הדוח נשלח ב-08:00 ביום שלו. בתחתית כל דוח יש קישור שבו הלקוח בוחר בעצמו את התדירות, או מפסיק.',
    rpEmailPh: 'מייל הלקוח', rpE_off: 'מושהה', rpE_day: 'כל יום', rpE_week: 'כל שבוע', rpE_2week: 'כל שבועיים', rpE_month: 'כל חודש',
    rpAdd: '+ נמען', rpSave: 'שמירה', rpSendNow: 'שליחת דוח עכשיו', rpDel: 'הסרה', rpNextS: d => 'הדוח הבא: ' + d, rpLastS: d => 'נשלח לאחרונה: ' + d, rpFailS: 'השליחה האחרונה נכשלה', rpOffS: 'מושהה, לא נשלח',
    rpByCl: 'הלקוח שינה את התדירות בעצמו', rpStopCl: 'הלקוח הפסיק את הדוחות', rpNotSaved: 'עוד לא נשמר', rpBadEmail: e => 'כתובת מייל לא תקינה: ' + e, rpSaved: 'הדוחות נשמרו בשרת ✓', rpSaveFail: d => 'השמירה נכשלה: ' + d,
    rpSent: e => 'הדוח נשלח אל ' + e, rpSendFail: 'השרת לא הצליח לשלוח את המייל (הפונקציה mail של PHP). כדאי לבדוק מול חברת האחסון שהיא פעילה.',
    rpFromH: 'הגדרות שליחה (לכל הסיורים)', rpFromName: 'שם השולח', rpReply: 'המייל שלך: תשובות של לקוחות יגיעו אליו', rpCopy: 'לשלוח לי עותק מכל דוח', rpAddr: 'כתובת השולח (לא חובה. בלי: reports@ הדומיין של האתר)',
    rpCronN: 'בלי הגדרה נוספת, דוח יוצא בביקור הראשון באחד הסיורים או בפתיחת הסטודיו אחרי 08:00 ביום שלו. כדי שיצא בדיוק בזמן גם בלי ביקורים, אפשר להוסיף Cron בלוח הבקרה של האחסון שיפתח כל שעה את הכתובת:',
    rpCopyUrl: 'העתקת הכתובת', rpOldPhp: 'upload.php בשרת עוד לא יודע לשלוח דוחות. הוא מתעדכן לבד מהסטודיו; לחצו "רענון" בעוד רגע.'
  });
  Object.assign(STR.en, {
    rpMailH: 'Automatic email reports', rpMailN: 'The client gets a views report of this tour by email as often as you choose. It is sent at 08:00 on its day. At the bottom of every report is a link where the client picks how often, or stops it.',
    rpEmailPh: 'Client email', rpE_off: 'Paused', rpE_day: 'Every day', rpE_week: 'Every week', rpE_2week: 'Every two weeks', rpE_month: 'Every month',
    rpAdd: '+ Recipient', rpSave: 'Save', rpSendNow: 'Send a report now', rpDel: 'Remove', rpNextS: d => 'Next report: ' + d, rpLastS: d => 'Last sent: ' + d, rpFailS: 'The last send failed', rpOffS: 'Paused, not sent',
    rpByCl: 'The client changed how often', rpStopCl: 'The client stopped the reports', rpNotSaved: 'Not saved yet', rpBadEmail: e => 'Not a valid email address: ' + e, rpSaved: 'Reports saved on the server ✓', rpSaveFail: d => 'Saving failed: ' + d,
    rpSent: e => 'The report was sent to ' + e, rpSendFail: 'The server could not send the email (PHP mail). Check with the hosting company that it is enabled.',
    rpFromH: 'Sending settings (all tours)', rpFromName: 'Sender name', rpReply: 'Your email: client replies go to it', rpCopy: 'Send me a copy of every report', rpAddr: 'Sender address (optional; otherwise reports@ the site\'s domain)',
    rpCronN: 'With nothing else set, a report goes out on the first visit to any tour, or when the Studio opens, after 08:00 on its day. To send exactly on time even without visits, add a cron job in the hosting control panel that opens this address every hour:',
    rpCopyUrl: 'Copy the address', rpOldPhp: 'upload.php on the server cannot send reports yet. It updates itself from the Studio; press "Refresh" in a moment.'
  });
  const REP_EV = ['day', 'week', '2week', 'month', 'off'];
  const repDate = ts => { if (!ts) return ''; const d = new Date(ts * 1000), z = n => String(n).padStart(2, '0'); return stDate(d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + ' ' + z(d.getHours()) + ':' + z(d.getMinutes())); };
  let rep = null;
  function repUi(box, r) {
    box.innerHTML = '<h4></h4>'; box.firstChild.textContent = L('rpMailH');
    if (!rep) { box.insertAdjacentHTML('beforeend', '<div class="note"></div>'); box.lastChild.textContent = L('rpOldPhp'); return; }
    const cur = rep.tours && rep.tours[r.slug], fr = rep.from || {};
    const list = cur ? cur.to.map(x => Object.assign({}, x)) : [{ email: '', every: 'week', fresh: 1 }];
    box.insertAdjacentHTML('beforeend', '<div class="note" data-n></div><div data-l></div><div class="row"><button type="button" data-a></button><button type="button" class="pri" data-s></button></div>'
      + '<details class="stRepF"><summary></summary><label><span></span><input type="text" data-fn></label><label><span></span><input type="email" data-fr></label><label class="ck"><input type="checkbox" data-fc><span></span></label><label><span></span><input type="email" data-fa></label>'
      + '<div class="note" data-cn></div><input type="text" readonly data-cu><div class="row"><button type="button" data-cc></button></div></details>');
    const q = s => box.querySelector(s), lb = box.querySelector('[data-l]');
    q('[data-n]').textContent = L('rpMailN'); q('[data-a]').textContent = L('rpAdd'); q('[data-s]').textContent = L('rpSave'); q('summary').textContent = L('rpFromH');
    const fl = box.querySelectorAll('.stRepF label span'); [L('rpFromName'), L('rpReply'), L('rpCopy'), L('rpAddr')].forEach((x, i) => { fl[i].textContent = x; });
    q('[data-fn]').value = fr.name || ''; q('[data-fn]').placeholder = 'Gambit360'; q('[data-fr]').value = fr.reply || ''; q('[data-fc]').checked = !!fr.copy; q('[data-fa]').value = fr.addr || '';
    q('[data-cn]').textContent = L('rpCronN'); q('[data-cu]').value = upUrl() + '?cron=1'; q('[data-cc]').textContent = L('rpCopyUrl'); q('[data-cc]').onclick = () => copyText(q('[data-cu]').value, L('shCopied'));
    function rows() {
      lb.innerHTML = '';
      list.forEach((x, i) => {
        const w = document.createElement('div'); w.className = 'stRepR';
        w.innerHTML = '<div class="ln"><input type="email" dir="ltr"><select></select><button type="button" data-g>✉</button><button type="button" data-x>✕</button></div><div class="stRepS"></div>';
        const inp = w.querySelector('input'), sel = w.querySelector('select');
        inp.value = x.email || ''; inp.placeholder = L('rpEmailPh'); inp.oninput = () => { x.email = inp.value.trim(); };
        REP_EV.forEach(k => { const o = document.createElement('option'); o.value = k; o.textContent = L('rpE_' + k); sel.appendChild(o); }); sel.value = x.every || 'week'; sel.onchange = () => { x.every = sel.value; };
        w.querySelector('[data-g]').title = L('rpSendNow'); w.querySelector('[data-g]').onclick = () => sendNow(x);
        w.querySelector('[data-x]').title = L('rpDel'); w.querySelector('[data-x]').onclick = () => { list.splice(i, 1); rows(); };
        w.querySelector('.stRepS').textContent = x.fresh || !x.email ? L('rpNotSaved') : x.every === 'off' ? (x.cl ? L('rpStopCl') : L('rpOffS'))
          : [L('rpNextS', repDate(x.next))].concat(x.last ? [L('rpLastS', repDate(x.last))] : [], x.fail ? [L('rpFailS')] : [], x.cl ? [L('rpByCl')] : []).join(' · ');
        lb.appendChild(w);
      });
    }
    rows();
    q('[data-a]').onclick = () => { list.push({ email: '', every: 'week', fresh: 1 }); rows(); lb.lastChild.querySelector('input').focus(); };
    async function save() {
      const to = list.filter(x => x.email).map(x => ({ email: x.email, every: x.every || 'week' }));
      const bad = to.find(x => !/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(x.email)); if (bad) { msg(L('rpBadEmail', bad.email), true); return false; }
      const t = r.t, base = settings.base.replace(/\/?$/, '/');
      let j; try {
        j = await upPost({ key: settings.upKey, action: 'repset', slug: r.slug, to: JSON.stringify(to), name: t ? (t.title || t.name || r.slug) : r.slug, lang: t ? tourLang(t) : (he() ? 'he' : 'en'),
          link: base + (t ? (t.upSlug || slugOf(t)) : r.slug), base, from: JSON.stringify({ name: q('[data-fn]').value.trim(), reply: q('[data-fr]').value.trim(), copy: q('[data-fc]').checked, addr: q('[data-fa]').value.trim() }) });
      } catch (e) { msg(L('rpSaveFail', e.message || e), true); return false; }
      if (!j.ok) { msg(j.error === 'email' ? L('rpBadEmail', j.email || '') : L('rpSaveFail', j.error), true); return false; }
      rep = j.rep; repUi(box, r); return true;
    }
    q('[data-s]').onclick = async () => { if (await save()) msg(L('rpSaved')); };
    async function sendNow(x) {
      if (!x.email) return;
      const em = x.email; if (!await save()) return;
      let j; try { j = await upPost({ key: settings.upKey, action: 'repsend', slug: r.slug, email: em }); } catch (e) { msg(L('rpSendFail'), true); return; }
      if (j.ok && j.sent) msg(L('rpSent', em)); else msg(j.ok ? L('rpSendFail') : L('rpSaveFail', j.error), true);
    }
  }
  // ---- view statistics: index.php on the server counts the visits (one line per visit in _stats/), upload.php sums them up for the Studio ----
  let stCur = '';
  const stDate = d => d ? (he() ? d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4) : d.slice(0, 10)) + (d.length > 10 ? ' ' + d.slice(11, 16) : '') : '';
  const stTourOf = slug => tours.find(o => o.upSlug === slug) || tours.find(o => slugOf(o) === slug) || null;
  async function openStats(t) {
    const dlg = $('lvDlg'), b = $('lvDlgB'); dlg.querySelector('.box').classList.add('wide');
    $('lvDlgH').textContent = L('stH'); b.innerHTML = '<div class="stMsg"></div>'; dlg.hidden = false;
    const say = s => { b.innerHTML = '<div class="stMsg"></div>'; b.firstChild.textContent = s; };
    if (!settings.upKey || !settings.base) { say(L('stNeedKey')); return; }
    if (t) stCur = t.upSlug || slugOf(t);
    say(L('stLoading'));
    try { await srvCheck(); } catch (e) {}   // an older upload.php on the server updates itself first (email reports need version 3)
    let j;
    try { j = await upPost({ key: settings.upKey, action: 'stats' }); } catch (e) { say(L('stFail', e.message || e) + ' · ' + upUrl()); return; }
    if (dlg.hidden) return;
    if (!j.ok) { say(j.error === 'action' ? L('stOld') : j.error === 'key' ? L('pingKey') : L('stFail', j.error)); return; }
    rep = j.rep || null;
    const st = j.stats || {}, today = j.today || new Date().toISOString().slice(0, 10);
    const rows = Object.keys(st).map(slug => ({ slug, t: stTourOf(slug), s: st[slug] }));
    tours.forEach(o => { const sl = o.upSlug; if (sl && !st[sl]) rows.push({ slug: sl, t: o, s: null }); });   // uploaded tours with no visits yet
    rows.sort((a, c) => ((c.s && c.s.d30) || 0) - ((a.s && a.s.d30) || 0) || ((c.s && c.s.n) || 0) - ((a.s && a.s.n) || 0));
    const nm = r => r.t ? (r.t.name || r.t.client || r.slug) : r.slug;
    if (!rows.some(r => r.s)) {   // no visits yet: the email reports can still be set for the chosen tour
      say(L('stNone')); b.insertAdjacentHTML('beforeend', '<div class="note">' + esc(L('stNote')) + '</div>');
      const r0 = rows.find(r => r.slug === stCur) || rows[0] || (t && t.upSlug ? { slug: t.upSlug, t, s: null } : null);
      if (r0) { b.insertAdjacentHTML('beforeend', '<h4 dir="auto"></h4><div class="stRep"></div>'); b.querySelector('h4').textContent = nm(r0); repUi(b.querySelector('.stRep'), r0); }
      return;
    }
    if (!rows.some(r => r.slug === stCur)) stCur = (rows.find(r => r.s) || rows[0]).slug;
    b.innerHTML = '<div class="stWrap"><table class="stT"><thead><tr><th>' + esc(L('stTour')) + '</th><th class="n">' + esc(L('st7')) + '</th><th class="n">' + esc(L('st30')) + '</th><th class="n">' + esc(L('stAll')) + '</th><th class="n">' + esc(L('stNew')) + '</th><th>' + esc(L('stLast')) + '</th></tr></thead><tbody></tbody></table></div><div data-d></div><div class="row"><button type="button" data-r></button></div><div class="note"></div>';
    const tb = b.querySelector('tbody'), det = b.querySelector('[data-d]');
    rows.forEach(r => {
      const s = r.s || {}, tr = document.createElement('tr'); tr.dataset.slug = r.slug;
      tr.innerHTML = '<td class="nm" dir="auto"></td><td class="n">' + (s.d7 || 0) + '</td><td class="n">' + (s.d30 || 0) + '</td><td class="n">' + (s.n || 0) + '</td><td class="n">' + (s.u || 0) + '</td><td>' + esc(stDate(s.last)) + '</td>';
      tr.firstChild.textContent = nm(r) + (r.t ? '' : ' (' + L('stUnknown') + ')');
      tr.onclick = () => { stCur = r.slug; show(); };
      tb.appendChild(tr);
    });
    b.querySelector('[data-r]').textContent = L('stRefresh'); b.querySelector('[data-r]').onclick = () => openStats();
    b.lastChild.textContent = L('stNote');
    function show() {
      tb.querySelectorAll('tr').forEach(x => x.classList.toggle('sel', x.dataset.slug === stCur));
      const r = rows.find(x => x.slug === stCur), s = r && r.s;
      if (!s) { det.innerHTML = '<div class="stMsg"></div><div class="stRep"></div>'; det.firstChild.textContent = L('stNone'); repUi(det.lastChild, r); return; }
      const days = []; { const d0 = new Date(today + 'T12:00:00Z'); for (let i = 29; i >= 0; i--) { const d = new Date(d0 - i * 864e5).toISOString().slice(0, 10); days.push([d, (s.day || {})[d] || 0]); } }
      const mx = Math.max(1, ...days.map(x => x[1])), dv = s.dev || {}, dn = (dv.d || 0) + (dv.m || 0) + (dv.t || 0) || 1;
      const pct = n => Math.round(100 * (n || 0) / dn) + '%';
      const devTxt = [['d', 'stDevD'], ['m', 'stDevM'], ['t', 'stDevT']].filter(([k]) => dv[k]).map(([k, l]) => L(l) + ' ' + pct(dv[k])).join(', ');
      const mons = Object.keys(s.mon || {}).sort().reverse().slice(0, 12);
      const refs = Object.keys(s.ref || {});
      det.innerHTML = '<h4 dir="auto"></h4><div class="stKv"><div><b>' + (s.n || 0) + '</b><span>' + esc(L('stAll') + ' · ' + L('stSince', stDate(s.first).slice(0, 10))) + '</span></div><div><b>' + (s.d30 || 0) + '</b><span>' + esc(L('st30')) + '</span></div><div><b>' + (s.d7 || 0) + '</b><span>' + esc(L('st7')) + '</span></div><div><b>' + (s.u || 0) + '</b><span>' + esc(L('stNew')) + '</span></div></div>'
        + '<h4>' + esc(L('stDays')) + '</h4><div class="stBars">' + days.map(([d, n]) => '<i' + (n ? '' : ' class="z"') + ' style="height:' + Math.max(2, Math.round(n / mx * 100)) + '%" title="' + esc(stDate(d) + ': ' + n) + '"></i>').join('') + '</div><div class="stAx"><span>' + esc(stDate(days[0][0])) + '</span><span>' + esc(stDate(today)) + '</span></div>'
        + '<h4>' + esc(L('stMonths')) + '</h4><ul class="stList">' + mons.map(m => '<li><span>' + esc(he() ? m.slice(5) + '/' + m.slice(0, 4) : m) + '</span><b>' + s.mon[m] + '</b></li>').join('') + '</ul>'
        + '<h4>' + esc(L('stDev')) + '</h4><ul class="stList">' + [['d', 'stDevD'], ['m', 'stDevM'], ['t', 'stDevT']].map(([k, l]) => '<li><span>' + esc(L(l)) + '</span><b>' + (dv[k] || 0) + ' · ' + pct(dv[k]) + '</b></li>').join('') + '</ul>'
        + '<h4>' + esc(L('stRef')) + '</h4><ul class="stList">' + refs.map(k => '<li><span dir="ltr">' + esc(k === '-' ? L('stDirect') : k) + '</span><b>' + s.ref[k] + '</b></li>').join('') + '</ul>'
        + '<div class="row"><button type="button" class="pri" data-c></button></div><div class="stRep" data-rep></div>';
      det.querySelector('h4').textContent = nm(r);
      const cb = det.querySelector('[data-c]'); cb.textContent = L('stCopy');
      cb.onclick = () => {
        const link = settings.base.replace(/\/?$/, '/') + r.slug;
        const txt = [L('rpH', (r.t && (r.t.title || r.t.name)) || r.slug), link, L('rpAt', stDate(today)), '', '• ' + L('rpAll', s.n || 0, stDate(s.first).slice(0, 10)), '• ' + L('rp30', s.d30 || 0), '• ' + L('rp7', s.d7 || 0), '• ' + L('rpNew', s.u || 0)]
          .concat(devTxt ? ['• ' + L('rpDev', devTxt)] : [], mons.length ? ['• ' + L('rpMon', mons.slice(0, 6).map(m => (he() ? m.slice(5) + '/' + m.slice(0, 4) : m) + ': ' + s.mon[m]).join(', '))] : []).join('\n');
        copyText(txt, L('stCopied'));
      };
      repUi(det.querySelector('[data-rep]'), r);
    }
    show();
  }
