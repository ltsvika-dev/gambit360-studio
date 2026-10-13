(function () {
  const $ = id => document.getElementById(id) || (($.m = $.m || {})[id] = $.m[id] || document.createElement('div'));   // an element cut out of the client's copy answers as a detached one, so the code that mentions it still runs
  // version line at the bottom of the Options menu
  const vl = document.createElement('div'); vl.id = 'verLine'; vl.textContent = 'v' + window.G360_VERSION; 
  try { if (!window.G360_CLIENT && matchMedia('(display-mode: standalone), (display-mode: minimal-ui)').matches && (outerWidth < screen.availWidth - 16 || outerHeight < screen.availHeight - 16)) { moveTo(screen.availLeft || 0, screen.availTop || 0); resizeTo(screen.availWidth, screen.availHeight); } } catch (err) {}
  { const sb = document.querySelector('.srcBox'); if (sb) { $('optMenu').insertBefore(sb, null); if (window.G360_CLIENT) sb.hidden = true; } } $('optMenu').appendChild(vl);
  // ---- Client: load an update file from the owner, save / restore his own changes ----
  const C = () => window.G360PKG || {}, key = () => 'g360Upd:' + location.pathname;
  const say2 = m => { if (window.G360_say) window.G360_say(m); };
  window.G360_syncClientBtns = () => {
    if (!window.G360_CLIENT) return;
    $('mineSaveBtn').hidden = !C().clientTags; $('mineLoadBtn').hidden = !C().clientTags;
  };
  const pick = id => { $('optMenu').hidden = true; $(id).click(); };
  $('mineSaveBtn').onclick = e => {
    e.stopPropagation(); $('optMenu').hidden = true;
    const d = window.G360_mineData ? window.G360_mineData() : null; if (!d) return;
    const nm = (window.PROJ_TITLE || 'Gambit360').replace(/[\\/:*?"<>|]+/g, '_').trim() || 'Gambit360';
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(d)], { type:'application/json' })); a.download = nm + ' - my changes.g360my';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); say2(t('mineSavedMsg'));
  };
  $('mineLoadBtn').onclick = e => { e.stopPropagation(); pick('mineFile'); };
  $('mineFile').onchange = async () => {   // the client restores his own file; in the Studio the items are added to the project
    const f = $('mineFile').files[0]; $('mineFile').value = ''; if (!f) return;
    const out = m => { if (window.G360_CLIENT) say2(m); else { const b = document.getElementById('pkgMsgBox'); if (b) b.textContent = m; } };
    try {
      const d = JSON.parse(await f.text());
      if (!d || d.g360mine !== 1) { out(t('mineBad')); return; }
      if (window.G360_CLIENT && C().name && d.name !== C().name) { out(t('mineOther')); return; }
      const n = await window.G360_loadMine(d, !window.G360_CLIENT);
      out(t('mineLoaded', n) + (!window.G360_CLIENT && d.name && window.G360_curName && d.name !== window.G360_curName() ? ' ' + t('mineOther') : ''));
    } catch (err) { console.error(err); out(t('mineBad')); }
  };
})();
