if ($action === 'rmtour') {   // the tour was published under another address: take the old folder off the site (a copy stays in _backup/removed/)
  $sl = isset($_POST['slug']) ? (string)$_POST['slug'] : '';
  if (!preg_match('#^[a-z0-9][a-z0-9-]{0,63}$#', $sl)) out(400, array('ok' => false, 'error' => 'path'));
  $d = $root . '/tours/' . $sl;
  if (!is_dir($d)) out(200, array('ok' => true, 'gone' => true));
  $rd = $root . '/_backup/removed';
  if (!is_dir($rd) && !@mkdir($rd, 0755, true)) out(500, array('ok' => false, 'error' => 'mkdir'));
  if (!@rename($d, $rd . '/' . $sl . '-' . date('Ymd-His'))) out(500, array('ok' => false, 'error' => 'rename'));
  out(200, array('ok' => true));
}
if ($action === 'stats') {   // view statistics for the Studio, from the visit logs index.php writes in _stats/
  try { $tz = new DateTimeZone('Asia/Jerusalem'); } catch (Exception $x) { $tz = null; }
  $today = $tz ? new DateTime('now', $tz) : new DateTime();
  $cut = function ($days) use ($today) { $d = clone $today; $d->modify('-' . $days . ' days'); return $d->format('Y-m-d'); };
  $c7 = $cut(6); $c30 = $cut(29); $c90 = $cut(89);
  $res = array();
  foreach ((array)glob($root . '/_stats/*.log') as $f) {
    $s = basename($f, '.log'); if (!preg_match('#^[a-z0-9][a-z0-9_-]{0,63}$#', $s)) continue;
    $a = array('n' => 0, 'u' => 0, 'd7' => 0, 'd30' => 0, 'first' => '', 'last' => '', 'day' => array(), 'mon' => array(), 'dev' => array('d' => 0, 'm' => 0, 't' => 0), 'ref' => array());
    $h = @fopen($f, 'r'); if (!$h) continue;
    while (($ln = fgets($h)) !== false) {
      $p = explode("\t", rtrim($ln, "\r\n")); if (count($p) < 3 || !preg_match('#^\d{4}-\d\d-\d\d#', $p[0])) continue;
      $day = substr($p[0], 0, 10); $a['n']++; if ($p[2] === '1') $a['u']++;
      if ($a['first'] === '') $a['first'] = $p[0]; $a['last'] = $p[0];
      if ($day >= $c7) $a['d7']++; if ($day >= $c30) $a['d30']++;
      if ($day >= $c90) $a['day'][$day] = (isset($a['day'][$day]) ? $a['day'][$day] : 0) + 1;
      $m = substr($day, 0, 7); $a['mon'][$m] = (isset($a['mon'][$m]) ? $a['mon'][$m] : 0) + 1;
      if (isset($a['dev'][$p[1]])) $a['dev'][$p[1]]++;
      $r = isset($p[3]) && $p[3] !== '' ? $p[3] : '-'; $a['ref'][$r] = (isset($a['ref'][$r]) ? $a['ref'][$r] : 0) + 1;
    }
    fclose($h);
    arsort($a['ref']); $a['ref'] = array_slice($a['ref'], 0, 10, true);
    $res[$s] = $a;
  }
  out(200, array('ok' => true, 'today' => $today->format('Y-m-d'), 'stats' => (object)$res, 'rep' => repLoad($bd), 'now' => time()));
}
if ($action === 'repset' || $action === 'repsend') {   // the email reports of one tour: who gets them and how often (repset), or one report right now (repsend)
  $j = repLoad($bd); $slug = isset($_POST['slug']) ? (string)$_POST['slug'] : ''; $now = time();
  if (!preg_match('#^[a-z0-9][a-z0-9_-]{0,63}$#', $slug)) out(400, array('ok' => false, 'error' => 'path'));
  if ($action === 'repset') {
    $to = json_decode(isset($_POST['to']) ? (string)$_POST['to'] : '', true); if (!is_array($to)) out(400, array('ok' => false, 'error' => 'to'));
    $was = array(); if (isset($j['tours'][$slug])) foreach ($j['tours'][$slug]['to'] as $r) $was[strtolower($r['email'])] = $r;
    $list = array(); $seen = array();
    foreach (array_slice($to, 0, 20) as $x) {
      $em = is_array($x) && isset($x['email']) ? trim((string)$x['email']) : ''; $ev = is_array($x) && isset($x['every']) ? (string)$x['every'] : '';
      if (!filter_var($em, FILTER_VALIDATE_EMAIL) || ($ev !== 'off' && repStep($ev) === '')) out(400, array('ok' => false, 'error' => 'email', 'email' => $em));
      $k = strtolower($em); if (isset($seen[$k])) continue; $seen[$k] = 1;
      $r = isset($was[$k]) ? $was[$k] : array('email' => $em, 'every' => 'off', 'next' => 0, 'last' => 0, 'fail' => 0, 'cl' => 0);
      if ($r['every'] !== $ev) { $r['every'] = $ev; $r['next'] = $ev === 'off' ? 0 : repNext($ev, $now); $r['cl'] = 0; }
      $r['email'] = $em; $list[] = $r;
    }
    $str = function ($k, $n) { return isset($_POST[$k]) ? substr(trim((string)$_POST[$k]), 0, $n) : ''; };
    $link = $str('link', 300); if (!preg_match('#^https?://#i', $link)) $link = '';
    if ($list) $j['tours'][$slug] = array('name' => $str('name', 200), 'lang' => $str('lang', 2) === 'en' ? 'en' : 'he', 'link' => $link, 'to' => $list); else unset($j['tours'][$slug]);
    $b = $str('base', 300); if (preg_match('#^https?://#i', $b)) $j['base'] = $b;
    $f = json_decode(isset($_POST['from']) ? (string)$_POST['from'] : '', true);
    if (is_array($f)) { $fv = function ($k) use ($f) { $v = isset($f[$k]) ? trim((string)$f[$k]) : ''; return filter_var($v, FILTER_VALIDATE_EMAIL) ? $v : ''; };
      $j['from'] = array('name' => isset($f['name']) ? substr(trim(preg_replace('#[\r\n]+#', ' ', (string)$f['name'])), 0, 80) : '', 'reply' => $fv('reply'), 'copy' => !empty($f['copy']), 'addr' => $fv('addr')); }
    if (!repSave($root, $bd, $j)) out(500, array('ok' => false, 'error' => 'write'));
    out(200, array('ok' => true, 'rep' => $j, 'now' => $now));
  }
  $em = isset($_POST['email']) ? (string)$_POST['email'] : ''; $r = null;
  if (isset($j['tours'][$slug])) foreach ($j['tours'][$slug]['to'] as $x) if (strtolower($x['email']) === strtolower($em)) $r = $x;
  if (!$r) out(404, array('ok' => false, 'error' => 'none'));
  $ev = $r['every'] === 'off' ? '' : $r['every'];
  $sent = repMail($root, $j, $slug, $r['email'], $ev, !empty($r['last']) ? $r['last'] : repBack($ev, $now), $now, $KEY_SHA256);
  out(200, array('ok' => true, 'sent' => $sent, 'rep' => $j, 'now' => $now));
}
