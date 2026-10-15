if ($action === 'ping') out(200, array('ok' => true, 'php' => PHP_VERSION, 'writable' => is_writable($root), 'ver' => $VER, 'self' => basename(__FILE__), 'pass' => is_file($bd . '/auth.json'), 'user' => (string)(($au = $meta($bd . '/auth.json')) && isset($au['user']) ? $au['user'] : ''), 'app' => $meta($bd . '/app.json'), 'sdk' => $meta($root . '/_stats/sdk.json')));
if ($action === 'setpass') {   // the cloud password: kept only as a hash, with the upload key encrypted by that password on the computer
  $pw = isset($_POST['pass']) ? (string)$_POST['pass'] : ''; $w = isset($_POST['wrap']) ? (string)$_POST['wrap'] : '';
  $u = trim(preg_replace('#\s+#u', ' ', isset($_POST['user']) ? (string)$_POST['user'] : '')); $old = $meta($bd . '/auth.json');
  if ($u === '' && $old && isset($old['user'])) $u = (string)$old['user'];   // an older Studio sends no user name: the one already set stays
  if (strlen($u) > 60) out(400, array('ok' => false, 'error' => 'user'));
  if ($pw === '' && $u !== '' && $old && isset($old['hash'])) {   // only the user name changes: the password and the key it wraps stay
    $old['user'] = $u; if (!@file_put_contents($bd . '/auth.json', json_encode($old))) out(500, array('ok' => false, 'error' => 'write'));
    out(200, array('ok' => true));
  }
  if (strlen($pw) < 8 || json_decode($w) === null) out(400, array('ok' => false, 'error' => 'pass'));
  denyDir($bd);
  if (!@file_put_contents($bd . '/auth.json', json_encode(array('hash' => password_hash($pw, PASSWORD_DEFAULT), 'wrap' => $w, 'user' => $u, 'at' => time())))) out(500, array('ok' => false, 'error' => 'write'));
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
    @file_put_contents($bd . '/app.json', json_encode(array('sha' => isset($_POST['sha']) ? substr(preg_replace('#[^0-9a-f]#', '', $_POST['sha']), 0, 64) : '', 'mtime' => isset($_POST['mtime']) ? (float)$_POST['mtime'] : 0, 'ver' => isset($_POST['ver']) ? substr(preg_replace('#[^0-9.]#', '', $_POST['ver']), 0, 20) : '', 'build' => isset($_POST['build']) ? substr(preg_replace('#[^0-9a-f]#', '', $_POST['build']), 0, 16) : '', 'at' => time())));
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
