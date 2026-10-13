// ---- automatic view reports by email: a tour can have recipients (usually the client), each with how often it is sent.
// Kept in the private folder (reports.json). Sent with PHP mail() at 08:00 (Israel) on the due day: by the server's cron (upload.php?cron=1) when one is set,
// otherwise by the first tour visit (index.php) or Studio request after that time. _stats/.rep-next holds the next due time, so a visit checks one small file.
function repStep($e) { $m = array('day' => '+1 day', 'week' => '+7 days', '2week' => '+14 days', 'month' => '+1 month'); return isset($m[$e]) ? $m[$e] : ''; }
function repDt($ts) { $d = new DateTime('@' . (int)$ts); try { $d->setTimezone(new DateTimeZone('Asia/Jerusalem')); } catch (Exception $x) {} return $d; }
function repNext($e, $after) { $st = repStep($e); if ($st === '') return 0; $d = repDt($after); $d->modify($st); $d->setTime(8, 0); return $d->getTimestamp(); }
function repBack($e, $ts) { $st = repStep($e); $d = repDt($ts); $d->modify($st !== '' ? str_replace('+', '-', $st) : '-7 days'); return $d->getTimestamp(); }
function repSig($h, $slug, $em) { return substr(hash_hmac('sha256', 'rep|' . $slug . '|' . strtolower($em), $h), 0, 32); }
function repLoad($bd) {
  $j = @json_decode(@file_get_contents($bd . '/reports.json'), true); if (!is_array($j)) $j = array();
  foreach (array('tours', 'from') as $k) if (!isset($j[$k]) || !is_array($j[$k])) $j[$k] = array();
  if (!isset($j['base'])) $j['base'] = '';
  return $j;
}
function repSave($root, $bd, $j) {
  denyDir($bd);
  $ok = @file_put_contents($bd . '/reports.json.part', json_encode($j)) !== false && @rename($bd . '/reports.json.part', $bd . '/reports.json');
  $nx = 0; foreach ($j['tours'] as $t) foreach ($t['to'] as $r) if ($r['every'] !== 'off' && $r['next'] && (!$nx || $r['next'] < $nx)) $nx = $r['next'];
  if ($nx) { denyDir($root . '/_stats'); @file_put_contents($root . '/_stats/.rep-next', (string)$nx); } else @unlink($root . '/_stats/.rep-next');
  return $ok;
}
function repTxt($lang) {
  if ($lang === 'en') return array('dir' => 'ltr', 'subj' => array('day' => 'Daily views report', 'week' => 'Weekly views report', '2week' => 'Views report (2 weeks)', 'month' => 'Monthly views report', '' => 'Views report'),
    'period' => 'Period', 'visits' => 'Visits to the tour', 'prev' => 'Previous period', 'new' => 'New visitors (estimate)', 'total' => 'All visits since', 'dev' => 'Devices', 'devs' => array('d' => 'Computer', 'm' => 'Phone', 't' => 'Tablet'),
    'ref' => 'Where they came from', 'direct' => 'Direct (link, WhatsApp, email, QR)', 'days' => 'Last 30 days', 'open' => 'Open the tour', 'none' => 'No visits in this period.',
    'note' => 'A visit is counted once per browser every 30 minutes. Search engines and link previews are not counted.', 'chg' => 'Change how often you get this report, or stop it',
    'pgH' => 'Views reports', 'pgQ' => 'How often should we send you the report?', 'opts' => array('day' => 'Every day', 'week' => 'Every week', '2week' => 'Every two weeks', 'month' => 'Every month', 'off' => 'Stop the reports'),
    'pgSaved' => 'Saved. The next report will be sent on ', 'pgOff' => 'The reports were stopped. You can turn them back on here at any time.', 'pgBad' => 'This link is no longer valid.');
  return array('dir' => 'rtl', 'subj' => array('day' => 'דוח צפיות יומי', 'week' => 'דוח צפיות שבועי', '2week' => 'דוח צפיות דו-שבועי', 'month' => 'דוח צפיות חודשי', '' => 'דוח צפיות'),
    'period' => 'התקופה', 'visits' => 'ביקורים בסיור', 'prev' => 'בתקופה הקודמת', 'new' => 'מבקרים חדשים (הערכה)', 'total' => 'סה״כ ביקורים מאז', 'dev' => 'מכשירים', 'devs' => array('d' => 'מחשב', 'm' => 'נייד', 't' => 'טאבלט'),
    'ref' => 'מאיפה הגיעו', 'direct' => 'ישירות (קישור, WhatsApp, מייל, QR)', 'days' => '30 הימים האחרונים', 'open' => 'לצפייה בסיור', 'none' => 'לא היו ביקורים בתקופה הזו.',
    'note' => 'ביקור נספר פעם אחת לכל דפדפן בכל 30 דקות. מנועי חיפוש ותצוגות מקדימות של קישורים לא נספרים.', 'chg' => 'לשינוי התדירות של הדוח או להפסקתו',
    'pgH' => 'דוחות צפיות', 'pgQ' => 'כל כמה זמן לשלוח לך את הדוח?', 'opts' => array('day' => 'כל יום', 'week' => 'כל שבוע', '2week' => 'כל שבועיים', 'month' => 'כל חודש', 'off' => 'הפסקת הדוחות'),
    'pgSaved' => 'נשמר. הדוח הבא יישלח ב-', 'pgOff' => 'הדוחות הופסקו. אפשר לחדש אותם כאן בכל זמן.', 'pgBad' => 'הקישור הזה כבר לא בתוקף.');
}
function repDate($ts, $lang) { return repDt($ts)->format($lang === 'en' ? 'Y-m-d' : 'd/m/Y'); }
// the numbers for one tour: visits between $from and $to, the same length before it, everything so far, and the last 30 days day by day
function repStats($root, $slug, $from, $to) {
  $f0 = repDt($from)->format('Y-m-d H:i'); $f1 = repDt($to)->format('Y-m-d H:i'); $fp = repDt($from - ($to - $from))->format('Y-m-d H:i');
  $days = array(); for ($i = 29; $i >= 0; $i--) $days[repDt($to - $i * 86400)->format('Y-m-d')] = 0;
  $a = array('n' => 0, 'prev' => 0, 'u' => 0, 'all' => 0, 'first' => '', 'dev' => array('d' => 0, 'm' => 0, 't' => 0), 'ref' => array(), 'day' => $days);
  $h = @fopen($root . '/_stats/' . $slug . '.log', 'r'); if (!$h) return $a;
  while (($ln = fgets($h)) !== false) {
    $p = explode("\t", rtrim($ln, "\r\n")); if (count($p) < 3 || !preg_match('#^\d{4}-\d\d-\d\d#', $p[0]) || $p[0] >= $f1) continue;
    $a['all']++; if ($a['first'] === '') $a['first'] = $p[0];
    $d = substr($p[0], 0, 10); if (isset($a['day'][$d])) $a['day'][$d]++;
    if ($p[0] >= $fp && $p[0] < $f0) $a['prev']++;
    if ($p[0] < $f0) continue;
    $a['n']++; if ($p[2] === '1') $a['u']++; if (isset($a['dev'][$p[1]])) $a['dev'][$p[1]]++;
    $r = isset($p[3]) && $p[3] !== '' ? $p[3] : '-'; $a['ref'][$r] = (isset($a['ref'][$r]) ? $a['ref'][$r] : 0) + 1;
  }
  fclose($h); arsort($a['ref']); $a['ref'] = array_slice($a['ref'], 0, 5, true);
  return $a;
}
function repMail($root, $j, $slug, $em, $every, $from, $to, $h) {
  $t = $j['tours'][$slug]; $lang = isset($t['lang']) && $t['lang'] === 'en' ? 'en' : 'he'; $T = repTxt($lang); $rtl = $T['dir'] === 'rtl';
  $e = function ($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); };
  $s = repStats($root, $slug, $from, $to);
  $name = isset($t['name']) && $t['name'] !== '' ? $t['name'] : $slug; $link = isset($t['link']) ? (string)$t['link'] : '';
  $base = $j['base'] !== '' ? rtrim($j['base'], '/') . '/' : '';
  $chg = $base !== '' ? $base . 'upload.php?rep=' . rawurlencode($slug) . '&to=' . rawurlencode($em) . '&s=' . repSig($h, $slug, $em) : '';
  $per = repDate($from, $lang) . ' – ' . repDate($to, $lang);
  $dn = max(1, $s['dev']['d'] + $s['dev']['m'] + $s['dev']['t']); $devs = array();
  foreach ($T['devs'] as $k => $l) if ($s['dev'][$k]) $devs[] = $l . ' ' . round(100 * $s['dev'][$k] / $dn) . '%';
  $refs = array(); foreach ($s['ref'] as $k => $n) $refs[] = array($k === '-' ? $T['direct'] : $k, $n, $k === '-' ? 'auto' : 'ltr');
  $al = $rtl ? 'right' : 'left';
  // the plain-text part
  $tx = $name . "\n" . $T['period'] . ': ' . $per . "\n\n" . $T['visits'] . ': ' . $s['n'] . ' (' . $T['prev'] . ': ' . $s['prev'] . ")\n" . $T['new'] . ': ' . $s['u'] . "\n"
    . ($s['first'] !== '' ? $T['total'] . ' ' . repDate(strtotime(substr($s['first'], 0, 10)), $lang) . ': ' . $s['all'] . "\n" : '')
    . ($devs ? $T['dev'] . ': ' . implode(', ', $devs) . "\n" : '');
  if ($refs) { $tx .= $T['ref'] . ":\n"; foreach ($refs as $r) $tx .= '  ' . $r[0] . ': ' . $r[1] . "\n"; }
  $tx .= ($link !== '' ? "\n" . $T['open'] . ': ' . $link . "\n" : '') . "\n" . $T['note'] . "\n" . ($chg !== '' ? $T['chg'] . ': ' . $chg . "\n" : '');
  // the HTML part: tables and inline styles only, so mail programs show it the same
  $mx = max(1, max($s['day'])); $bars = '';
  foreach ($s['day'] as $d => $n) { $ht = $n ? max(3, round($n / $mx * 60)) : 2; $bars .= '<td valign="bottom" style="padding:0 1px" title="' . $e($d . ': ' . $n) . '"><div style="height:' . $ht . 'px;background:' . ($n ? '#3aa596' : '#d6dee0') . ';border-radius:2px 2px 0 0;font-size:0;line-height:0">&nbsp;</div></td>'; }
  $kv = function ($v, $l) use ($e) { return '<td style="padding:10px 12px;background:#f3f7f7;border-radius:8px;width:33%"><div style="font-size:24px;font-weight:700;color:#14302c">' . $e($v) . '</div><div style="font-size:12px;color:#5d7175">' . $e($l) . '</div></td>'; };
  $ht = '<!doctype html><html dir="' . $T['dir'] . '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>'
    . '<body style="margin:0;padding:0;background:#eef2f3"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f3"><tr><td align="center" style="padding:20px 10px">'
    . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="' . $T['dir'] . '" style="max-width:560px;background:#ffffff;border-radius:12px;font-family:Arial,Helvetica,sans-serif;color:#1d2b2e;text-align:' . $al . '">'
    . '<tr><td style="padding:22px 24px 6px"><div style="font-size:13px;color:#3aa596;font-weight:700">Gambit360 · ' . $e($T['subj'][$every]) . '</div><div style="font-size:21px;font-weight:700;margin-top:4px" dir="auto">' . $e($name) . '</div>'
    . '<div style="font-size:13px;color:#5d7175;margin-top:4px">' . $e($T['period']) . ': <span dir="ltr">' . $e($per) . '</span></div></td></tr>'
    . '<tr><td style="padding:12px 18px"><table role="presentation" width="100%" cellpadding="0" cellspacing="6"><tr>' . $kv($s['n'], $T['visits']) . $kv($s['prev'], $T['prev']) . $kv($s['u'], $T['new']) . '</tr></table>'
    . ($s['n'] ? '' : '<div style="padding:4px 6px;color:#5d7175;font-size:14px">' . $e($T['none']) . '</div>') . '</td></tr>'
    . '<tr><td style="padding:4px 24px"><div style="font-size:13px;font-weight:700;color:#5d7175;margin-bottom:6px">' . $e($T['days']) . '</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="ltr" style="height:62px"><tr>' . $bars . '</tr></table></td></tr>'
    . '<tr><td style="padding:12px 24px;font-size:14px;line-height:1.6">'
    . ($s['first'] !== '' ? '<div>' . $e($T['total']) . ' ' . $e(repDate(strtotime(substr($s['first'], 0, 10)), $lang)) . ': <b>' . $s['all'] . '</b></div>' : '')
    . ($devs ? '<div>' . $e($T['dev']) . ': ' . $e(implode(', ', $devs)) . '</div>' : '');
  if ($refs) { $ht .= '<div style="margin-top:6px">' . $e($T['ref']) . ':</div>'; foreach ($refs as $r) $ht .= '<div style="color:#40565a">• <span dir="' . $r[2] . '">' . $e($r[0]) . '</span>: ' . $r[1] . '</div>'; }
  $ht .= '</td></tr>' . ($link !== '' ? '<tr><td style="padding:8px 24px 18px"><a href="' . $e($link) . '" style="display:inline-block;background:#3aa596;color:#ffffff;text-decoration:none;font-weight:700;padding:10px 20px;border-radius:8px;font-size:15px">' . $e($T['open']) . '</a></td></tr>' : '')
    . '<tr><td style="padding:12px 24px 20px;border-top:1px solid #e3eaeb;font-size:12px;color:#7a8b8f">' . $e($T['note']) . ($chg !== '' ? '<br><a href="' . $e($chg) . '" style="color:#3aa596">' . $e($T['chg']) . '</a>' : '') . '</td></tr>'
    . '</table></td></tr></table></body></html>';
  // sender: the site's own address; replies go to the Studio owner's email when one was set
  $fr = $j['from']; $host = strtolower((string)parse_url($base !== '' ? $base : 'https://' . (isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'localhost') . '/', PHP_URL_HOST));
  $host = preg_replace('#^www\.#', '', preg_replace('#[^a-z0-9.-]#', '', $host));
  $faddr = !empty($fr['addr']) && filter_var($fr['addr'], FILTER_VALIDATE_EMAIL) ? $fr['addr'] : 'reports@' . ($host !== '' ? $host : 'localhost');
  $fname = isset($fr['name']) && trim($fr['name']) !== '' ? trim($fr['name']) : 'Gambit360';
  $b64h = function ($s) { return '=?UTF-8?B?' . base64_encode($s) . '?='; };
  $bnd = 'g360-' . bin2hex(function_exists('random_bytes') ? random_bytes(8) : uniqid());
  $hd = 'MIME-Version: 1.0' . "\r\n" . 'From: ' . $b64h($fname) . ' <' . $faddr . '>' . "\r\n" . 'Content-Type: multipart/alternative; boundary="' . $bnd . '"' . "\r\n";
  if (!empty($fr['reply']) && filter_var($fr['reply'], FILTER_VALIDATE_EMAIL)) { $hd .= 'Reply-To: ' . $fr['reply'] . "\r\n"; if (!empty($fr['copy'])) $hd .= 'Bcc: ' . $fr['reply'] . "\r\n"; }
  if ($chg !== '') $hd .= 'List-Unsubscribe: <' . $chg . '>' . "\r\n";
  $body = '--' . $bnd . "\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($tx))
    . '--' . $bnd . "\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($ht)) . '--' . $bnd . "--\r\n";
  return @mail($em, $b64h($T['subj'][$every] . ': ' . $name), $body, $hd);
}
// sends every report that is due (once at a time: a lock), then writes down the next time
function repRun($root, $bd, $h, $force) {
  $nx = @file_get_contents($root . '/_stats/.rep-next');
  if (!$force && ($nx === false || time() < (int)$nx)) return 0;
  $lk = @fopen($bd . '/.replock', 'c'); if (!$lk || !flock($lk, LOCK_EX | LOCK_NB)) return 0;
  @set_time_limit(300); @ignore_user_abort(true);
  $j = repLoad($bd); $now = time(); $n = 0;
  foreach ($j['tours'] as $slug => $t) foreach ($t['to'] as $i => $r) {
    if ($r['every'] === 'off' || !$r['next'] || $r['next'] > $now) continue;
    $ok = repMail($root, $j, $slug, $r['email'], $r['every'], !empty($r['last']) ? $r['last'] : repBack($r['every'], $now), $now, $h);
    if ($ok) { $r['last'] = $now; $r['fail'] = 0; $n++; } else $r['fail'] = $now;
    $r['next'] = repNext($r['every'], $r['next']); if ($r['next'] <= $now) $r['next'] = repNext($r['every'], $now);
    $j['tours'][$slug]['to'][$i] = $r;
  }
  repSave($root, $bd, $j);
  flock($lk, LOCK_UN); fclose($lk);
  return $n;
}
