  // ---- backup reminder: a banner when there is no backup, or the last one is older than 3 days ----
  let bkDismiss = false;
  async function checkBk() {
    const bn = $('lvBanner'); let at = 0; try { at = await db.kget('bkAt'); } catch (e) {}
    const pr = [];
    if (tours.length) {
      const l = bkSt.local, s = bkSt.srv, srvOk = !!(s && s.ok);   // synced with the server: a local folder copy is a bonus, not a must
      if (l && !l.ok && !srvOk) pr.push(L('bkLocFail', l.err));
      else if (!l && !srvOk && !(at && Date.now() - at <= 3 * 864e5)) pr.push(at ? L('bkStale', new Date(at).toLocaleDateString()) : L('bkNever'));
      if (s && !s.ok) pr.push(L('srvBkFail', s.err));
      else if (!s && !settings.upKey && settings.srvBk !== false) pr.push(L('srvBkFail', L('bkNoKey')));
    }
    if (!pr.length || bkDismiss) { bn.hidden = true; return; }
    bn.innerHTML = '<span></span><span class="sp"></span><button type="button" data-b></button><button type="button" data-s></button><button type="button" data-d>\u2715</button>';
    bn.firstChild.textContent = pr.join('   \u00b7   ');
    bn.querySelector('[data-b]').textContent = L('bkNow'); bn.querySelector('[data-b]').onclick = bkNowClick;
    bn.querySelector('[data-s]').textContent = L(settings.upKey ? 'settings' : 'cloudIn'); bn.querySelector('[data-s]').onclick = settings.upKey ? openSet : cloudConnect;
    bn.querySelector('[data-d]').onclick = () => { bkDismiss = true; bn.hidden = true; };
    bn.hidden = false;
  }








