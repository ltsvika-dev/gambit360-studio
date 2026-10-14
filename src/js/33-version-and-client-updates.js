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
  // ---- Client: a package published on the site (…/p/<token>/) can be downloaded as a ZIP with the code the owner gave ----
  Object.assign(I18N.he, { dlPkgBtn: 'הורדת החבילה', dlPkgAsk: 'הקלידו את הקוד להורדת החבילה (קיבלתם אותו יחד עם הקישור):', dlPkgBad: 'הקוד שגוי.', dlPkgWait: 'יותר מדי ניסיונות. נסו שוב בעוד רבע שעה.', dlPkgNone: 'אי אפשר להוריד את החבילה הזו.', dlPkgFail: 'השרת לא ענה. נסו שוב.', dlPkgGo: 'ההורדה מתחילה…' });
  Object.assign(I18N.en, { dlPkgBtn: 'Download the package', dlPkgAsk: 'Type the code to download the package (you got it with the link):', dlPkgBad: 'Wrong code.', dlPkgWait: 'Too many tries. Try again in 15 minutes.', dlPkgNone: 'This package cannot be downloaded.', dlPkgFail: 'The server did not answer. Try again.', dlPkgGo: 'The download is starting…' });
  const pkgTk = (location.pathname.match(/\/p\/(p[a-z0-9]{10})\/(index\.html)?$/) || [])[1] || '', siteBase = () => location.href.slice(0, location.href.indexOf('/p/' + pkgTk + '/') + 1);
  if (window.G360_CLIENT && pkgTk && /^https?:$/.test(location.protocol)) {
    const b = document.createElement('button'); b.type = 'button'; b.id = 'dlPkgBtn'; b.className = 'ib'; b.hidden = true;
    b.innerHTML = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M4 19h16"/></svg><span></span>';
    const lbl = () => { b.querySelector('span').textContent = t('dlPkgBtn'); }; lbl();
    $('optMenu').insertBefore(b, $('mineSaveBtn').parentNode === $('optMenu') ? $('mineSaveBtn') : $('optMenu').firstChild);
    const post = async (f) => { const fd = new FormData(); fd.append('token', pkgTk); Object.keys(f).forEach(k => fd.append(k, f[k])); return (await fetch(siteBase() + 'upload.php', { method:'POST', body:fd, cache:'no-store' })).json(); };
    post({ action:'pkginfo' }).then(j => { b.hidden = !(j && j.dl); }).catch(() => {});
    b.onclick = async e => {
      e.stopPropagation(); $('optMenu').hidden = true;
      const code = await g360Ask(t('dlPkgAsk'), { input:true }); if (!code) return;
      let j = null; try { j = await post({ action:'pkgdl', code }); } catch (err) {}
      if (!j) { say2(t('dlPkgFail')); return; }
      if (!j.ok) { say2(t(j.error === 'code' ? 'dlPkgBad' : j.error === 'wait' ? 'dlPkgWait' : 'dlPkgNone')); return; }
      say2(t('dlPkgGo')); location.href = siteBase() + j.url;
    };
    const prev = window.G360_relang; window.G360_relang = function () { if (prev) prev.apply(this, arguments); lbl(); };
  }
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
