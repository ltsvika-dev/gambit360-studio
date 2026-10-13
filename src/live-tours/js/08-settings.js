  // ---- settings ----
  async function openSet() {
    $('lvSdk').value = settings.sdk || ''; $('lvBase').value = settings.base || '';
    let d = null; try { d = await db.kget('outDir'); } catch (e) {} if (!d) d = await studioDirHandle();
    $('lvOutP').textContent = d ? d.name + '\\Export\\Live Tours' : L('outNone');
    $('lvUpOn').checked = settings.upOn !== false; $('lvTopIco').checked = !!settings.topIco; texts(); srvTexts(); cloudTexts(); srvSt(); $('lvSrvBk').checked = settings.srvBk !== false; refreshBk(); refreshSplash();
    $('lvSet').hidden = false;
  }
  $('lvOutBtn').onclick = async () => { try { const d = await outDir(true); $('lvOutP').textContent = d.name + '\\Export\\Live Tours'; } catch (e) {} };
  function readSet() {
    settings.sdk = $('lvSdk').value.trim(); settings.upOn = $('lvUpOn').checked; settings.srvBk = $('lvSrvBk').checked;
    let b = $('lvBase').value.trim(); if (b && !/^https?:\/\//i.test(b)) b = 'https://' + b; settings.base = b ? b.replace(/\/?$/, '/') : 'https://studio.gambit360.co.il/';
  }
  $('lvKeyBtn').onclick = async () => {
    if (settings.upKey && !confirm(L('keyConfirm'))) return;
    readSet(); const oldKey = settings.upKey;
    const a = new Uint8Array(24); crypto.getRandomValues(a); settings.upKey = [...a].map(x => x.toString(16).padStart(2, '0')).join('');
    try { await db.kset('settings', settings); } catch (e) {}
    if (oldKey && await cloudRekey(oldKey)) return;   // the server took the new key from the old one: nothing to upload by hand
    try {
      const root = await outDir(false), dir = await exportDir(root, 'Live Tours', true);
      await writeFile(dir, 'upload.php', await uploadPhp());
      await writeFile(dir, 'index.html', new Blob([wrapperHtml()], { type: 'text/html' }));
      await writeFile(dir, '.htaccess', HTACCESS);
      $('lvUpSt').textContent = L('keyDone', root.name); texts(); $('lvUpSt').textContent = L('keyDone', root.name);
    } catch (e) { if (e && e.name !== 'AbortError') msg(L('pubFail') + (e.message || e), true); }
  };
  $('lvPingBtn').onclick = async () => {
    readSet(); const st = $('lvUpSt');
    if (!settings.upKey) { st.textContent = L('upNoKey'); return; }
    st.textContent = '…';
    try { const j = await upPost({ key: settings.upKey, action: 'ping' }); st.textContent = j.ok ? (j.writable ? L('pingOk', j.php) : L('pingNoWrite')) : (j.error === 'key' ? L('pingKey') : j.error); }
    catch (e) { st.textContent = L('pingNo') + upUrl(); }
  };
  $('lvSetOk').onclick = async () => {
    readSet(); settings.setAt = Date.now();
    try { await db.kset('settings', settings); } catch (e) {}
    $('lvSet').hidden = true; msg(L('saved')); renderEdit();
  };
  $('lvSet').addEventListener('click', e => { if (e.target === $('lvSet')) $('lvSet').hidden = true; });
  $('lvSetX').onclick = $('lvSetClose').onclick = () => { $('lvSet').hidden = true; };

