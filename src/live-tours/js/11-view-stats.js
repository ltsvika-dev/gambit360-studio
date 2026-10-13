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
    let j;
    try { j = await upPost({ key: settings.upKey, action: 'stats' }); } catch (e) { say(L('stFail', e.message || e) + ' · ' + upUrl()); return; }
    if (dlg.hidden) return;
    if (!j.ok) { say(j.error === 'action' ? L('stOld') : j.error === 'key' ? L('pingKey') : L('stFail', j.error)); return; }
    const st = j.stats || {}, today = j.today || new Date().toISOString().slice(0, 10);
    const rows = Object.keys(st).map(slug => ({ slug, t: stTourOf(slug), s: st[slug] }));
    tours.forEach(o => { const sl = o.upSlug; if (sl && !st[sl]) rows.push({ slug: sl, t: o, s: null }); });   // uploaded tours with no visits yet
    rows.sort((a, c) => ((c.s && c.s.d30) || 0) - ((a.s && a.s.d30) || 0) || ((c.s && c.s.n) || 0) - ((a.s && a.s.n) || 0));
    const nm = r => r.t ? (r.t.name || r.t.client || r.slug) : r.slug;
    if (!rows.some(r => r.s)) { say(L('stNone')); b.insertAdjacentHTML('beforeend', '<div class="note">' + esc(L('stNote')) + '</div>'); return; }
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
      if (!s) { det.innerHTML = '<div class="stMsg"></div>'; det.firstChild.textContent = L('stNone'); return; }
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
        + '<div class="row"><button type="button" class="pri" data-c></button></div>';
      det.querySelector('h4').textContent = nm(r);
      const cb = det.querySelector('[data-c]'); cb.textContent = L('stCopy');
      cb.onclick = () => {
        const link = settings.base.replace(/\/?$/, '/') + r.slug;
        const txt = [L('rpH', (r.t && (r.t.title || r.t.name)) || r.slug), link, L('rpAt', stDate(today)), '', '• ' + L('rpAll', s.n || 0, stDate(s.first).slice(0, 10)), '• ' + L('rp30', s.d30 || 0), '• ' + L('rp7', s.d7 || 0), '• ' + L('rpNew', s.u || 0)]
          .concat(devTxt ? ['• ' + L('rpDev', devTxt)] : [], mons.length ? ['• ' + L('rpMon', mons.slice(0, 6).map(m => (he() ? m.slice(5) + '/' + m.slice(0, 4) : m) + ': ' + s.mon[m]).join(', '))] : []).join('\n');
        copyText(txt, L('stCopied'));
      };
    }
    show();
  }
