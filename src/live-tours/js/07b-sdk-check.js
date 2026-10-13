  // ---- Matterport SDK key: options that need it (nadir, Photos tab, map position) warn when they are turned on and the key is missing,
  // or when the tour pages on the site reported that Matterport refused the key (upload.php keeps that note, ping returns it) ----
  Object.assign(STR.he, {
    sdkAskNone: 'אין מפתח SDK בהגדרות, ולכן האפשרות הזו לא תעבוד באתר. הסיור עצמו ייפתח כרגיל, רק בלי האפשרות.\n\nלהפעיל בכל זאת?',
    sdkAskBad: (d, h) => 'מפתח ה-SDK שבהגדרות לא מתחבר באתר: Matterport דחה אותו (' + d + '). בדרך כלל זה אומר שהכתובת ' + h + ' לא נמצאת ברשימת הכתובות המורשות של המפתח (Matterport: Account Settings ← Developer Tools ← SDK Key Management), או שהמפתח שגוי.\n\nעד שזה יתוקן האפשרות לא תעבוד. הסיור עצמו ייפתח כרגיל, רק בלי האפשרות.\n\nלהפעיל בכל זאת?',
    sdkBadNote: (d, h) => 'המפתח לא מתחבר באתר (' + d + '): כנראה ש-' + h + ' לא ברשימת הכתובות המורשות של המפתח. הסיורים נפתחים בלי נדיר, תמונות ומיקום על המפה.',
    sdkOkNote: d => 'המפתח מתחבר באתר ✓ (' + d + ')'
  });
  Object.assign(STR.en, {
    sdkAskNone: 'There is no SDK key in Settings, so this option will not work on the site. The tour itself opens as usual, just without it.\n\nTurn it on anyway?',
    sdkAskBad: (d, h) => 'The SDK key in Settings does not connect on the site: Matterport refused it (' + d + '). Usually this means ' + h + ' is not in the key\'s allowed addresses (Matterport: Account Settings → Developer Tools → SDK Key Management), or the key is wrong.\n\nUntil that is fixed this option will not work. The tour itself opens as usual, just without it.\n\nTurn it on anyway?',
    sdkBadNote: (d, h) => 'The key does not connect on the site (' + d + '): ' + h + ' is probably not in the key\'s allowed addresses. Tours open without the nadir, photos and map position.',
    sdkOkNote: d => 'The key connects on the site ✓ (' + d + ')'
  });
  // 'none' = no key, 'bad' = the site reported a refusal of this key since its last good connection, 'ok' = it connected, '' = not known yet
  function sdkState() {
    if (!settings.sdk) return { s: 'none' };
    const r = srvInfo && srvInfo.sdk, k4 = settings.sdk.slice(-4), mine = x => x && x.key === k4 ? x : null;
    const f = mine(r && r.fail), o = mine(r && r.ok), when = x => new Date(x.at * 1000).toLocaleString();
    if (f && (!o || f.at > o.at) && !(settings.sdkAt && settings.sdkAt > f.at * 1000)) return { s: 'bad', d: when(f), h: f.host || settings.base };
    if (o) return { s: 'ok', d: when(o) };
    return { s: '' };
  }
  async function sdkWarn() {   // before an option that needs the SDK is turned on: true = go ahead
    try { await Promise.race([srvCheck(false), new Promise(r => setTimeout(r, 2500))]); } catch (e) {}
    const st = sdkState();
    if (st.s === 'none') return g360Ask(L('sdkAskNone'));
    if (st.s === 'bad') return g360Ask(L('sdkAskBad', st.d, st.h));
    return true;
  }
  function sdkNoteText(base) { const st = sdkState(); return st.s === 'bad' ? base + ' ' + L('sdkBadNote', st.d, st.h) : base; }
  const sdkNoteWarn = () => { const s = sdkState().s; return s === 'none' || s === 'bad'; };
  function sdkSetNote() {   // the line under the key in Settings
    const st = sdkState(), n = $('lvSdkN');
    n.textContent = L('sdkN') + (st.s === 'bad' ? '\n' + L('sdkBadNote', st.d, st.h) : st.s === 'ok' ? '\n' + L('sdkOkNote', st.d) : '');
    n.classList.toggle('warn', st.s === 'bad'); n.style.whiteSpace = 'pre-line';
  }
