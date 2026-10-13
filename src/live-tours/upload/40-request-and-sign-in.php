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
register_shutdown_function(function () use ($root, $bd, $KEY_SHA256) {   // email reports that are due go out after the answer, so the Studio does not wait for them
  $nx = @file_get_contents($root . '/_stats/.rep-next'); if ($nx === false || time() < (int)$nx) return;
  if (function_exists('fastcgi_finish_request')) @fastcgi_finish_request();
  repRun($root, $bd, $KEY_SHA256, false);
});

$meta = function ($f) { $j = @json_decode(@file_get_contents($f), true); return is_array($j) ? $j : null; };
