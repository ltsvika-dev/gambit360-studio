<?php
// Gambit360 live tours: serves index.html with a link preview (title, description, picture) for WhatsApp, Facebook and the like,
// which read the page without running it. Everything else is exactly index.html.
header('Content-Type: text/html; charset=utf-8');
header('X-Robots-Tag: noindex');
$html = @file_get_contents(__DIR__ . '/index.html');
if ($html === false) { http_response_code(500); exit('index.html is missing'); }
$t = isset($_GET['t']) ? strtolower((string)$_GET['t']) : '';
// The old MPEmbed address (/show/?m=MODEL): opens the tour made in the Studio from that Matterport model,
// so links that clients already have keep working. New tours keep their short address (/name).
if ($t === 'show') {
  $mm = isset($_GET['m']) ? (string)$_GET['m'] : '';
  if (!preg_match('/^[A-Za-z0-9]{6,20}$/', $mm)) { http_response_code(404); exit('Tour not found'); }
  $hit = ''; $when = '';
  foreach ((array)glob(__DIR__ . '/tours/*/config.json') as $f) {
    $c = @json_decode((string)@file_get_contents($f), true);
    if (!is_array($c) || !isset($c['model']) || $c['model'] !== $mm) continue;
    $s = basename(dirname($f)); $p = isset($c['published']) ? (string)$c['published'] : '';
    if ($s === strtolower($mm)) { $hit = $s; break; }   // a tour published under the model's own name wins
    if ($hit === '' || strcmp($p, $when) > 0) { $hit = $s; $when = $p; }   // otherwise the one published last
  }
  if ($hit === '') {   // no tour of ours for this model yet: the plain Matterport tour, with the same parameters
    header('Location: https://my.matterport.com/show/?' . preg_replace('/(^|&)t=show(&|$)/', '$1', $_SERVER['QUERY_STRING']), true, 302); exit;
  }
  $t = $hit;
  $html = str_replace('</head>', '<meta name="g360-tour" content="' . $t . '">' . "\n" . '</head>', $html);
}
$cfg = preg_match('/^[a-z0-9][a-z0-9_-]{0,63}$/', $t) ? @json_decode((string)@file_get_contents(__DIR__ . '/tours/' . $t . '/config.json'), true) : null;
if (is_array($cfg)) g360_count(isset($cfg['alias']) && preg_match('/^[a-z0-9][a-z0-9_-]{0,63}$/', (string)$cfg['alias']) ? strtolower($cfg['alias']) : $t);
if (is_array($cfg)) {
  $e = function ($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); };
  $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
  $dir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
  $base = ($https ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . $dir . '/';
  $sh = isset($cfg['share']) && is_array($cfg['share']) ? $cfg['share'] : array();
  $title = trim(isset($cfg['title']) && $cfg['title'] !== '' ? $cfg['title'] : (isset($cfg['name']) ? $cfg['name'] : ''));
  if ($title === '') $title = 'Gambit360';
  $desc = trim(isset($sh['desc']) ? $sh['desc'] : '');
  if ($desc === '') $desc = (isset($cfg['uiLang']) && $cfg['uiLang'] === 'en') ? '360° virtual tour' : 'סיור וירטואלי 360°';
  $img = !empty($sh['image']) ? $base . 'tours/' . $t . '/' . rawurlencode($sh['image']) : (!empty($cfg['model']) ? 'https://my.matterport.com/api/v1/player/models/' . rawurlencode($cfg['model']) . '/thumb' : '');
  $m = '<title>' . $e($title) . '</title>' . "\n"
     . '<meta property="og:type" content="website">' . "\n"
     . '<meta property="og:site_name" content="Gambit360">' . "\n"
     . '<meta property="og:title" content="' . $e($title) . '">' . "\n"
     . '<meta property="og:description" content="' . $e($desc) . '">' . "\n"
     . '<meta name="description" content="' . $e($desc) . '">' . "\n"
     . '<meta property="og:url" content="' . $e($base . $t) . '">' . "\n"
     . ($img !== '' ? '<meta property="og:image" content="' . $e($img) . '">' . "\n" . '<meta name="twitter:image" content="' . $e($img) . '">' . "\n" : '')
     . '<meta name="twitter:card" content="summary_large_image">';
  $html = preg_replace('#<title>[^<]*</title>#', str_replace(array('\\', '$'), array('\\\\', '\\$'), $m), $html, 1);
}
echo $html;
// automatic email reports (written by upload.php): when one is due, it goes out now, after the page already reached the visitor
$rn = __DIR__ . '/_stats/.rep-next';
if (is_file($rn) && time() >= (int)@file_get_contents($rn) && is_file(__DIR__ . '/upload.php')) g360_reports();
function g360_reports() { if (function_exists('fastcgi_finish_request')) @fastcgi_finish_request(); else @flush(); $G360_CRON = true; include __DIR__ . '/upload.php'; }

// View statistics: one line per visit in _stats/<tour>.log (closed to the web), read by the Studio through upload.php.
// A visit = a browser that opens the tour after 30 minutes away (a cookie), so reloads and switching between tours do not count again.
// Search engines, link previews (WhatsApp, Facebook) and the like are not counted. Nothing personal is kept: date, device type, new visitor, referring site.
function g360_count($slug) {
  if ($slug === '' || (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] !== 'GET') || isset($_GET['calib'])) return;
  $ua = isset($_SERVER['HTTP_USER_AGENT']) ? (string)$_SERVER['HTTP_USER_AGENT'] : '';
  if ($ua === '' || preg_match('/bot|crawl|spider|slurp|facebookexternalhit|facebot|whatsapp|telegram|skype|discord|slack|preview|embedly|curl|wget|python|java\/|headless|lighthouse|pingdom|uptime|monitor/i', $ua)) return;
  $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
  $ck = function ($n, $v, $secs) use ($https) {
    if (PHP_VERSION_ID >= 70300) @setcookie($n, $v, array('expires' => time() + $secs, 'path' => '/', 'secure' => $https, 'httponly' => true, 'samesite' => $https ? 'None' : 'Lax'));   // None: also inside a client's website (iframe)
    else @setcookie($n, $v, time() + $secs, '/', '', $https, true);
  };
  $vn = 'g360v_' . preg_replace('/[^a-z0-9_]/', '_', $slug);
  if (isset($_COOKIE[$vn])) { $ck($vn, '1', 1800); return; }   // the same visit
  $ck($vn, '1', 1800);
  $new = isset($_COOKIE['g360u']) ? 0 : 1; $ck('g360u', '1', 2 * 365 * 86400);
  $dev = preg_match('/iPad|Tablet|Android(?!.*Mobile)/i', $ua) ? 't' : (preg_match('/Mobi|iPhone|iPod|Android/i', $ua) ? 'm' : 'd');
  $ref = isset($_SERVER['HTTP_REFERER']) ? strtolower((string)parse_url((string)$_SERVER['HTTP_REFERER'], PHP_URL_HOST)) : '';
  $host = isset($_SERVER['HTTP_HOST']) ? strtolower(preg_replace('/:\d+$/', '', (string)$_SERVER['HTTP_HOST'])) : '';
  if ($ref === $host) $ref = '';
  $ref = preg_replace('/^(www\.|m\.|l\.|lm\.)/', '', preg_replace('/[^a-z0-9.-]/', '', $ref));
  try { $now = new DateTime('now', new DateTimeZone('Asia/Jerusalem')); } catch (Exception $x) { $now = new DateTime(); }
  $d = __DIR__ . '/_stats';
  if (!is_dir($d) && !@mkdir($d, 0755, true)) return;
  if (!is_file($d . '/.htaccess')) @file_put_contents($d . '/.htaccess', "<IfModule mod_authz_core.c>\nRequire all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\nOrder allow,deny\nDeny from all\n</IfModule>\n");
  @file_put_contents($d . '/' . $slug . '.log', $now->format('Y-m-d H:i') . "\t" . $dev . "\t" . $new . "\t" . $ref . "\n", FILE_APPEND | LOCK_EX);
}
