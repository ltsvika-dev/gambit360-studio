if (!empty($G360_CRON) || PHP_SAPI === 'cli' || isset($_GET['cron'])) {   // due email reports: from index.php after a visit, or the server's cron (upload.php?cron=1, or php upload.php)
  $n = $keyOk ? repRun($root, $bd, $KEY_SHA256, false) : 0;
  if (!empty($G360_CRON)) return;
  if (PHP_SAPI !== 'cli') { header('Content-Type: text/plain; charset=utf-8'); header('X-Robots-Tag: noindex'); header('Cache-Control: no-store'); }
  echo 'ok ' . $n . "\n"; exit;
}
if (isset($_GET['rep'])) {   // the link at the bottom of a report: the recipient picks how often it comes, or stops it
  header('Content-Type: text/html; charset=utf-8'); header('X-Robots-Tag: noindex'); header('Cache-Control: no-store'); header('Referrer-Policy: no-referrer'); header('X-Frame-Options: DENY');
  $slug = (string)$_GET['rep']; $em = isset($_GET['to']) ? (string)$_GET['to'] : ''; $sg = isset($_GET['s']) ? (string)$_GET['s'] : '';
  $j = $keyOk ? repLoad($bd) : null; $ix = -1;
  if ($j && isset($j['tours'][$slug]) && hash_equals(repSig($KEY_SHA256, $slug, $em), $sg)) foreach ($j['tours'][$slug]['to'] as $i => $r) if (strtolower($r['email']) === strtolower($em)) $ix = $i;
  $lang = $ix >= 0 && isset($j['tours'][$slug]['lang']) && $j['tours'][$slug]['lang'] === 'en' ? 'en' : 'he'; $T = repTxt($lang);
  $e = function ($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); };
  $say = '';
  if ($ix >= 0 && $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['set']) && ($_POST['set'] === 'off' || repStep((string)$_POST['set']) !== '')) {
    $r = $j['tours'][$slug]['to'][$ix]; $r['every'] = (string)$_POST['set']; $r['next'] = $r['every'] === 'off' ? 0 : repNext($r['every'], time()); $r['cl'] = time();
    $j['tours'][$slug]['to'][$ix] = $r; repSave($root, $bd, $j);
    $say = $r['every'] === 'off' ? $T['pgOff'] : $T['pgSaved'] . repDate($r['next'], $lang);
  }
  echo '<!doctype html><html lang="', $lang, '" dir="', $T['dir'], '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>', $e($T['pgH']), '</title>',
    '<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#eef2f3;color:#1d2b2e;font:16px Arial,Helvetica,sans-serif;padding:16px;box-sizing:border-box}',
    'main{width:min(420px,100%);background:#fff;border-radius:14px;padding:24px;box-sizing:border-box}h1{margin:0 0 4px;font-size:1.2rem}.t{color:#3aa596;font-weight:700;font-size:.85rem}p{color:#5d7175}',
    'button{display:block;width:100%;margin-top:8px;padding:11px;border:1px solid #cfdadc;border-radius:8px;background:#f3f7f7;color:inherit;font:inherit;cursor:pointer}button.on{background:#3aa596;border-color:#3aa596;color:#fff;font-weight:700}.ok{background:#e5f5f2;border-radius:8px;padding:10px 12px;color:#14302c}</style></head><body><main>';
  if ($ix < 0) echo '<h1>', $e($T['pgH']), '</h1><p>', $e($T['pgBad']), '</p>';
  else {
    $cur = $j['tours'][$slug]['to'][$ix]['every'];
    echo '<div class="t">Gambit360 · ', $e($T['pgH']), '</div><h1 dir="auto">', $e($j['tours'][$slug]['name'] !== '' ? $j['tours'][$slug]['name'] : $slug), '</h1><p dir="ltr" style="text-align:', $T['dir'] === 'rtl' ? 'right' : 'left', '">', $e($em), '</p>',
      $say !== '' ? '<div class="ok">' . $e($say) . '</div>' : '', '<p>', $e($T['pgQ']), '</p><form method="post">';
    foreach ($T['opts'] as $k => $l) echo '<button name="set" value="', $k, '"', $k === $cur ? ' class="on"' : '', '>', $e($l), '</button>';
    echo '</form>';
  }
  echo '</main></body></html>';
  exit;
}
