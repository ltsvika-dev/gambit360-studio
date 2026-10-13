<?php
// Gambit360 live tours – receives the files the Gambit360 Studio publishes. Put it in the same folder as index.html.
// Only a request with the Studio's upload key is accepted, only into tours/<address>/ (plus index.html and .htaccess),
// and only image, audio, video and config files. The previous copy of every file is kept in _backup/.
// It also keeps the Studio's synced data (a private _bk_ folder), lets another computer connect with a password,
// serves the Studio online at /app/ after that password, and replaces itself when the Studio has a newer copy.
$KEY_SHA256 = '@@KEYHASH@@';
$VER = 3;   // grows with every change to this file: the Studio replaces an older copy on the server by itself
$LOGO = '@@LOGO@@';   // the Gambit360 logo for the sign-in page, filled in by the Studio
$MAX_BYTES = 500 * 1024 * 1024;

$root = __DIR__;
$keyOk = $KEY_SHA256 !== '' && strlen($KEY_SHA256) === 64;
$bd = $root . '/_bk_' . substr($KEY_SHA256, 0, 16);   // the private folder: an unguessable name, no public access
function denyDir($d) { if (!is_dir($d)) @mkdir($d, 0755, true); if (!is_file($d . '/.htaccess')) @file_put_contents($d . '/.htaccess', "<IfModule mod_authz_core.c>\nRequire all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\nOrder allow,deny\nDeny from all\n</IfModule>\n"); }
// the Studio online: a cookie set by a correct password, signed with the key's hash, good for 30 days
function appTok($exp, $h) { return $exp . '.' . hash_hmac('sha256', 'g360app' . $exp, $h); }
function appOk($h) { $c = isset($_COOKIE['g360app']) ? (string)$_COOKIE['g360app'] : ''; $p = explode('.', $c); return count($p) === 2 && preg_match("#^[0-9]{1,12}$#", $p[0]) && (int)$p[0] > time() && hash_equals(appTok($p[0], $h), $c); }

if (!empty($G360_APP) || isset($_GET['app'])) {   // app/index.php: the Studio itself, or the password page
  header('X-Robots-Tag: noindex'); header('Cache-Control: no-store'); header('Referrer-Policy: no-referrer'); header('X-Frame-Options: DENY');
  if ($keyOk && appOk($KEY_SHA256) && is_file($bd . '/app.html')) { header('Content-Type: text/html; charset=utf-8'); readfile($bd . '/app.html'); exit; }
  header('Content-Type: text/html; charset=utf-8');
  $none = $keyOk && appOk($KEY_SHA256);   // signed in, but no Studio was uploaded yet
  $S = '<' . 'script>'; $E = '<' . '/script>';
  $logo = strpos($LOGO, 'data:image/') === 0 ? '<div class="lg"><img src="' . $LOGO . '" alt="Gambit360"></div>' : '<div class="lg txt">Gambit<b>360</b></div>';
  echo '<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta name="theme-color" content="#0b1113"><title>Gambit360 Studio</title>',
    '<style>:root{color-scheme:dark;--ac:#5ec4b6;--ac2:#2f8fd8}*{box-sizing:border-box}',
    'body{margin:0;min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:16px;color:#e8eef0;font:16px/1.45 system-ui,"Segoe UI",Arial,sans-serif;',
    'background:radial-gradient(900px 520px at 85% -10%,rgba(47,143,216,.22),transparent 60%),radial-gradient(800px 520px at 0% 110%,rgba(94,196,182,.18),transparent 60%),#0b1113}',
    '.card{width:min(380px,100%);background:rgba(20,28,31,.92);border:1px solid #26363a;border-radius:18px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.45)}',
    '.lg{background:#fff;padding:22px 28px;display:flex;justify-content:center}.lg img{display:block;width:100%;max-width:280px;height:auto}.lg.txt{color:#14286b;font:800 1.9rem system-ui,sans-serif;direction:ltr}.lg.txt b{color:#2f8fd8}',
    '.in{padding:24px 26px 26px}h1{margin:0;font-size:1.3rem;font-weight:700}.en{display:block;color:#8ea4a9;font-size:.84rem;font-weight:400;margin-top:2px}',
    'label{display:block;margin:20px 0 6px;font-size:.88rem;color:#b9c9cc}.pw{position:relative}',
    'input{width:100%;height:46px;padding:0 14px 0 46px;border-radius:10px;border:1px solid #33464b;background:#0d1416;color:inherit;font:inherit;direction:ltr;outline:0;transition:border-color .15s,box-shadow .15s}',
    'input:focus{border-color:var(--ac);box-shadow:0 0 0 3px rgba(94,196,182,.22)}',
    '.eye{position:absolute;top:0;left:0;width:46px;height:46px;border:0;background:none;color:#8ea4a9;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:10px}.eye:hover{color:#e8eef0}.eye svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.eye .x{display:none}.eye.on .x{display:inline}',
    '.go{margin-top:16px;width:100%;height:46px;border:0;border-radius:10px;background:linear-gradient(90deg,var(--ac),#4fb0d8);color:#06201c;font:inherit;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;transition:filter .15s,transform .05s}',
    '.go:hover{filter:brightness(1.07)}.go:active{transform:translateY(1px)}.go:disabled{filter:saturate(.4);cursor:default}',
    '.sp{width:18px;height:18px;border:2.5px solid rgba(6,32,28,.3);border-top-color:#06201c;border-radius:50%;animation:r .8s linear infinite;display:none}.busy .sp{display:block}@keyframes r{to{transform:rotate(360deg)}}',
    '#m{min-height:1.3em;white-space:pre-line;margin-top:12px;color:#ff9a8a;font-size:.88rem}.note{margin:4px 0 0;color:#7f9499;font-size:.8rem}p{margin:16px 0 0;color:#b9c9cc;font-size:.92rem}',
    '.ft{color:#6f8489;font-size:.8rem;text-decoration:none}.ft:hover{color:#b9c9cc}</style></head><body><main class="card">', $logo, '<div class="in">',
    $none ? '<h1>הסטודיו עוד לא באתר<span class="en">No Studio on the server yet</span></h1><p>פתחו את הסטודיו במחשב שלכם: סיורים חיים ← אפשרויות ← "עדכון הסטודיו באתר".</p><p class="note" dir="ltr" style="text-align:right">In your own Studio: Live tours, Options, "Update the Studio online".</p></div></main>'
      : '<form id="f"><h1>כניסה לסטודיו<span class="en">Sign in to Gambit360 Studio</span></h1>' .
        '<input type="text" name="username" autocomplete="username" value="Gambit360 Studio" hidden>' .
        '<label for="p">סיסמת הענן · Cloud password</label><div class="pw"><input id="p" name="password" type="password" autocomplete="current-password" autofocus required>' .
        '<button type="button" class="eye" id="eye" aria-label="הצגת הסיסמה · Show password" title="הצגת הסיסמה · Show password"><svg viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path class="x" d="M4 4l16 16"/></svg></button></div>' .
        '<button class="go" id="go"><span class="sp"></span><span>כניסה · Sign in</span></button><div id="m" role="alert"></div>' .
        '<p class="note">המכשיר הזה יישאר מחובר 30 יום<br>This device stays signed in for 30 days</p></form></div></main>' .
        $S . 'const f=document.getElementById("f"),m=document.getElementById("m"),p=document.getElementById("p"),go=document.getElementById("go"),eye=document.getElementById("eye"),b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));' .
        'eye.onclick=()=>{const on=p.type==="password";p.type=on?"text":"password";eye.classList.toggle("on",on);p.focus();};' .
        'const busy=b=>{go.disabled=b;go.classList.toggle("busy",b);};' .
        'f.onsubmit=async e=>{e.preventDefault();m.textContent="";busy(true);const pw=p.value;try{const fd=new FormData();fd.append("action","login");fd.append("pass",pw);' .
        'const j=await (await fetch("../upload.php",{method:"POST",body:fd,credentials:"same-origin",cache:"no-store"})).json();' .
        'if(!j.ok){busy(false);m.textContent=j.error==="wait"?"יותר מדי ניסיונות. נסו שוב בעוד רבע שעה\nToo many tries, wait 15 minutes":j.error==="nopass"?"עוד לא נקבעה סיסמה בסטודיו\nNo password was set yet":"סיסמה שגויה\nWrong password";p.select();return;}' .
        'const w=JSON.parse(j.wrap),k0=await crypto.subtle.importKey("raw",new TextEncoder().encode(pw),"PBKDF2",false,["deriveKey"]),' .
        'k=await crypto.subtle.deriveKey({name:"PBKDF2",salt:b64(w.salt),iterations:w.it,hash:"SHA-256"},k0,{name:"AES-GCM",length:256},false,["decrypt"]),' .
        'key=new TextDecoder().decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:b64(w.iv)},k,b64(w.ct)));' .
        'localStorage.setItem("g360cloudKey",key);location.reload();}catch(x){busy(false);m.textContent=String(x&&x.message||x);}};' . $E,
    '<a class="ft" href="https://gambit360.co.il/" target="_blank" rel="noopener">gambit360.co.il</a></body></html>';
  exit;
}

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }
function out($code, $arr) { http_response_code($code); echo json_encode($arr); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(405, array('ok' => false, 'error' => 'method'));
$action = isset($_POST['action']) ? (string)$_POST['action'] : '';

if ($action === 'login' || $action === 'logout') {   // another computer: the cloud password gives back the upload key (encrypted with that same password)
  if ($action === 'logout') { header('Set-Cookie: g360app=; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=Lax'); out(200, array('ok' => true)); }
  if (!$keyOk || !is_file($bd . '/auth.json')) { sleep(1); out(200, array('ok' => false, 'error' => 'nopass')); }
  $ff = $bd . '/login-fails.json'; $fl = @json_decode(@file_get_contents($ff), true); if (!is_array($fl)) $fl = array('n' => 0, 't' => 0);
  if ($fl['n'] >= 5 && time() - $fl['t'] < 900) out(429, array('ok' => false, 'error' => 'wait'));
  $a = json_decode(file_get_contents($bd . '/auth.json'), true); $pw = isset($_POST['pass']) ? (string)$_POST['pass'] : '';
  if (!is_array($a) || !password_verify($pw, $a['hash'])) { $fl = array('n' => ($fl['n'] >= 5 ? 0 : $fl['n']) + 1, 't' => time()); @file_put_contents($ff, json_encode($fl)); sleep(2); out(200, array('ok' => false, 'error' => 'pass')); }
  @unlink($ff); $exp = time() + 30 * 86400;
  header('Set-Cookie: g360app=' . appTok($exp, $KEY_SHA256) . '; Max-Age=' . (30 * 86400) . '; Path=/; Secure; HttpOnly; SameSite=Lax');
  out(200, array('ok' => true, 'wrap' => $a['wrap']));
}

$key = isset($_POST['key']) ? (string)$_POST['key'] : '';
if (!$keyOk || !hash_equals($KEY_SHA256, hash('sha256', $key))) { sleep(2); out(403, array('ok' => false, 'error' => 'key')); }

$meta = function ($f) { $j = @json_decode(@file_get_contents($f), true); return is_array($j) ? $j : null; };
if ($action === 'ping') out(200, array('ok' => true, 'php' => PHP_VERSION, 'writable' => is_writable($root), 'ver' => $VER, 'self' => basename(__FILE__), 'pass' => is_file($bd . '/auth.json'), 'app' => $meta($bd . '/app.json')));
if ($action === 'setpass') {   // the cloud password: kept only as a hash, with the upload key encrypted by that password on the computer
  $pw = isset($_POST['pass']) ? (string)$_POST['pass'] : ''; $w = isset($_POST['wrap']) ? (string)$_POST['wrap'] : '';
  if (strlen($pw) < 8 || json_decode($w) === null) out(400, array('ok' => false, 'error' => 'pass'));
  denyDir($bd);
  if (!@file_put_contents($bd . '/auth.json', json_encode(array('hash' => password_hash($pw, PASSWORD_DEFAULT), 'wrap' => $w, 'at' => time())))) out(500, array('ok' => false, 'error' => 'write'));
  @unlink($bd . '/login-fails.json');
  out(200, array('ok' => true));
}
if ($action === 'selfup') {   // a newer upload.php from the Studio: written next to this one as upload.new.php, tested by the Studio, then put in place (selfswap)
  if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) out(400, array('ok' => false, 'error' => 'file'));
  $src = file_get_contents($_FILES['file']['tmp_name']);
  if (strncmp($src, '<?php', 5) !== 0 || strpos($src, 'Gambit360 live tours') === false || !preg_match("#\\\$KEY_SHA256 = '[0-9a-f]{64}';#", $src)) out(400, array('ok' => false, 'error' => 'php'));
  if (@file_put_contents($root . '/upload.new.php', $src) === false) out(500, array('ok' => false, 'error' => 'write'));
  out(200, array('ok' => true));
}
if ($action === 'selfdel') { @unlink($root . '/upload.new.php'); out(200, array('ok' => true)); }
if ($action === 'selfswap') {   // runs in upload.new.php, after the Studio checked it answers
  if (basename(__FILE__) !== 'upload.new.php') out(400, array('ok' => false, 'error' => 'self'));
  $old = @file_get_contents($root . '/upload.php');
  if ($old !== false) {
    $kb = $root . '/_backup'; if (!is_dir($kb)) @mkdir($kb, 0755, true); @file_put_contents($kb . '/upload.php.' . date('Ymd-His'), $old);
    if (preg_match("#\\\$KEY_SHA256 = '([0-9a-f]{64})';#", $old, $m) && $m[1] !== $KEY_SHA256) {   // a new upload key: the private folder follows it
      $ob = $root . '/_bk_' . substr($m[1], 0, 16); if (is_dir($ob) && !is_dir($bd)) @rename($ob, $bd);
      @unlink($bd . '/auth.json');   // the password wrapped the old key: it is set again from the Studio
    }
  }
  if (!@rename(__FILE__, $root . '/upload.php')) out(500, array('ok' => false, 'error' => 'rename'));
  out(200, array('ok' => true, 'ver' => $VER));
}
if ($action === 'appput') {   // the Studio online: its page goes into the private folder (served by app/index.php after the password), its lib/*.js into app/lib/
  $n = isset($_POST['name']) ? (string)$_POST['name'] : '';
  if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) out(400, array('ok' => false, 'error' => 'file'));
  if ($n === 'studio.html') {
    denyDir($bd);
    if (!move_uploaded_file($_FILES['file']['tmp_name'], $bd . '/app.html.part') || !@rename($bd . '/app.html.part', $bd . '/app.html')) out(500, array('ok' => false, 'error' => 'write'));
    @file_put_contents($bd . '/app.json', json_encode(array('sha' => isset($_POST['sha']) ? substr(preg_replace('#[^0-9a-f]#', '', $_POST['sha']), 0, 64) : '', 'mtime' => isset($_POST['mtime']) ? (float)$_POST['mtime'] : 0, 'ver' => isset($_POST['ver']) ? substr(preg_replace('#[^0-9.]#', '', $_POST['ver']), 0, 20) : '', 'at' => time())));
    if (!is_dir($root . '/app')) @mkdir($root . '/app', 0755, true);
    @file_put_contents($root . '/app/index.php', "<?php\n// Gambit360 Studio online: the page itself is served by upload.php after the cloud password\n\$G360_APP = true;\nrequire __DIR__ . '/../upload.php';\n");
    out(200, array('ok' => true));
  }
  if (!preg_match('#^lib/[A-Za-z0-9][A-Za-z0-9_.-]{0,80}\.js$#', $n) || strpos($n, '..') !== false) out(400, array('ok' => false, 'error' => 'path'));
  if (!is_dir($root . '/app/lib')) @mkdir($root . '/app/lib', 0755, true);
  if (!move_uploaded_file($_FILES['file']['tmp_name'], $root . '/app/' . $n)) out(500, array('ok' => false, 'error' => 'write'));
  @chmod($root . '/app/' . $n, 0644);
  out(200, array('ok' => true));
}
if ($action === 'bkput' || $action === 'bkget') {   // the Studio's synced data: tours.json and the tours' files
  $n = isset($_POST['name']) ? (string)$_POST['name'] : '';
  if (!preg_match('#^(tours\.json|files/[A-Za-z0-9_.-]{1,120})$#', $n) || strpos($n, '..') !== false) out(400, array('ok' => false, 'error' => 'path'));
  $f = $bd . '/' . $n;
  if ($action === 'bkget') { if (!is_file($f)) out(404, array('ok' => false, 'error' => 'none')); header('Content-Type: application/octet-stream'); header('Content-Length: ' . filesize($f)); readfile($f); exit; }
  if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) out(400, array('ok' => false, 'error' => 'file'));
  if (!is_dir(dirname($f)) && !mkdir(dirname($f), 0755, true)) out(500, array('ok' => false, 'error' => 'mkdir'));
  denyDir($bd);
  $lk = null;
  if ($n === 'tours.json') {   // another computer saved in between: the Studio merges that first and sends again
    $lk = @fopen($bd . '/.lock', 'c'); if ($lk) flock($lk, LOCK_EX);
    if (isset($_POST['prev']) && is_file($f)) { $c = $meta($f); $at = $c && isset($c['at']) ? (string)$c['at'] : ''; if ($at !== (string)$_POST['prev']) out(409, array('ok' => false, 'error' => 'stale')); }
    if (json_decode(file_get_contents($_FILES['file']['tmp_name'])) === null) out(400, array('ok' => false, 'error' => 'json'));
    if (is_file($f)) { $kd = $bd . '/history'; if (!is_dir($kd)) @mkdir($kd, 0755, true); @copy($f, $kd . '/tours.' . date('Ymd-His') . '.json'); $old = glob($kd . '/tours.*.json'); if ($old && count($old) > 60) { sort($old); foreach (array_slice($old, 0, count($old) - 60) as $o) @unlink($o); } }
  }
  if (!move_uploaded_file($_FILES['file']['tmp_name'], $f . '.part')) out(500, array('ok' => false, 'error' => 'write'));
  if (!@rename($f . '.part', $f)) { @unlink($f); if (!@rename($f . '.part', $f)) out(500, array('ok' => false, 'error' => 'rename')); }
  out(200, array('ok' => true));
}
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
  out(200, array('ok' => true, 'today' => $today->format('Y-m-d'), 'stats' => (object)$res));
}
if ($action !== 'put') out(400, array('ok' => false, 'error' => 'action'));

$path = isset($_POST['path']) ? str_replace('\\', '/', (string)$_POST['path']) : '';
$okPath = preg_match('#^tours/[a-z0-9][a-z0-9-]{0,63}/[A-Za-z0-9][A-Za-z0-9._-]{0,80}\.(png|jpe?g|webp|gif|mp3|m4a|aac|ogg|wav|mp4|webm|mov|m4v|json)$#', $path) || $path === 'index.html' || $path === 'index.php' || $path === '.htaccess';
if (!$okPath || strpos($path, '..') !== false) out(400, array('ok' => false, 'error' => 'path'));
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) out(400, array('ok' => false, 'error' => 'file', 'code' => isset($_FILES['file']) ? $_FILES['file']['error'] : -1));
if ($_FILES['file']['size'] > $MAX_BYTES) out(413, array('ok' => false, 'error' => 'size'));
if (substr($path, -5) === '.json') { $j = json_decode(file_get_contents($_FILES['file']['tmp_name'])); if ($j === null) out(400, array('ok' => false, 'error' => 'json')); }

$dest = $root . '/' . $path;
$dir = dirname($dest);
if (!is_dir($dir) && !mkdir($dir, 0755, true)) out(500, array('ok' => false, 'error' => 'mkdir'));
if (is_file($dest) && md5_file($dest) === md5_file($_FILES['file']['tmp_name'])) out(200, array('ok' => true, 'path' => $path, 'same' => true));
if (is_file($dest)) {   // keep the previous copy
  $bdir = $root . '/_backup/' . dirname($path);
  if (!is_dir($bdir)) @mkdir($bdir, 0755, true);
  @copy($dest, $bdir . '/' . basename($path) . '.' . date('Ymd-His'));
}
$tmp = $dest . '.part';
if (!move_uploaded_file($_FILES['file']['tmp_name'], $tmp)) out(500, array('ok' => false, 'error' => 'write'));
@chmod($tmp, 0644);
if (!@rename($tmp, $dest)) { @unlink($dest); if (!@rename($tmp, $dest)) out(500, array('ok' => false, 'error' => 'rename')); }
out(200, array('ok' => true, 'path' => $path, 'bytes' => filesize($dest)));
