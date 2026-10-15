if ($action === 'pkgput' || $action === 'pkgdone' || $action === 'pkgcode' || $action === 'pkglist' || $action === 'pkgmove') {   // a client package published on the site: packages/<token>/index.html with its lib/ and model/ files, the link the client gets
  $tk = isset($_POST['token']) ? (string)$_POST['token'] : '';
  if (!preg_match('#^[a-z0-9][a-z0-9-]{1,59}$#', $tk)) out(400, array('ok' => false, 'error' => 'path'));   // the name in the client's address: chosen in the Studio (older packages got a random p + 10 characters)
  $pd = $root . '/packages/' . $tk;
  if (!is_file($root . '/packages/.htaccess')) { if (!is_dir($root . '/packages')) @mkdir($root . '/packages', 0755, true); @file_put_contents($root . '/packages/.htaccess', "Options -Indexes\n<IfModule mod_headers.c>\nHeader set X-Robots-Tag \"noindex, nofollow\"\n</IfModule>\n"); }
  $od = $root . '/p/' . $tk;   // a package from an older version lived in p/<token>/: it moves to packages/, and its old link keeps working through a small page that sends on
  $fwd = function ($dir, $to) { @mkdir($dir, 0755); @file_put_contents($dir . '/index.html', '<!DOCTYPE html><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=../../packages/' . $to . '/index.html"><' . 'script>location.replace("../../packages/' . $to . '/index.html"+location.search+location.hash)<' . '/script>'); };   // a page left at an old address that sends the client on
  if (is_dir($od) && !is_dir($pd) && @rename($od, $pd)) $fwd($od, $tk);
  $proj = mb_substr((string)(isset($_POST['proj']) ? $_POST['proj'] : ''), 0, 200);
  $owner = function ($t) use ($root, $bd) { $j = @json_decode((string)@file_get_contents($bd . '/pkg/' . $t . '.json'), true); return is_array($j) && isset($j['proj']) ? (string)$j['proj'] : null; };
  $stub = function ($d) { return is_dir($d) && !is_dir($d . '/lib'); };   // only a page that sends on: the name is free again
  $taken = function ($t) use ($root, $owner, $stub, $proj) { $d = $root . '/packages/' . $t; return is_dir($d) && !$stub($d) && $owner($t) !== $proj; };   // another project's package already has this name
  if ($action === 'pkgmove') {   // the package gets a new name: its folder moves, and the old address sends on to the new one
    $to = isset($_POST['to']) ? (string)$_POST['to'] : '';
    if (!preg_match('#^[a-z0-9][a-z0-9-]{1,59}$#', $to) || $to === $tk) out(400, array('ok' => false, 'error' => 'path'));
    $nd = $root . '/packages/' . $to;
    $force = !empty($_POST['force']);
    if ($taken($to) && !$force) out(200, array('ok' => false, 'error' => 'taken'));
    if (!is_dir($pd) || $stub($pd)) out(200, array('ok' => true, 'moved' => false));
    if ($stub($nd)) { @unlink($nd . '/index.html'); @rmdir($nd); }
    elseif (is_dir($nd)) { denyDir($bd . '/pkg-replaced'); if (!@rename($nd, $bd . '/pkg-replaced/' . $to . '-' . time())) out(500, array('ok' => false, 'error' => 'rename')); }   // the package it replaces is kept aside in the private folder, not deleted
    if (!@rename($pd, $nd)) out(500, array('ok' => false, 'error' => 'rename'));
    $fwd($pd, $to);
    if (is_file($bd . '/pkg/' . $tk . '.json')) @rename($bd . '/pkg/' . $tk . '.json', $bd . '/pkg/' . $to . '.json');
    out(200, array('ok' => true, 'moved' => true));
  }
  if ($action === 'pkgcode') {   // the client's download code (only its hash is kept, in the private folder), the last day of the package and its name in the ZIP
    $code = strtoupper(preg_replace('#[^A-Za-z0-9]#', '', isset($_POST['code']) ? (string)$_POST['code'] : '')); $exp = isset($_POST['exp']) ? (string)$_POST['exp'] : '';
    if (strlen($code) < 6 || ($exp !== '' && !preg_match('#^[0-9]{4}-[0-9]{2}-[0-9]{2}$#', $exp))) out(400, array('ok' => false, 'error' => 'code'));
    denyDir($bd); if (!is_dir($bd . '/pkg') && !@mkdir($bd . '/pkg', 0755, true)) out(500, array('ok' => false, 'error' => 'mkdir'));
    $nm = mb_substr(trim(isset($_POST['name']) ? (string)$_POST['name'] : ''), 0, 100);
    if (!@file_put_contents($bd . '/pkg/' . $tk . '.json', json_encode(array('hash' => password_hash($code, PASSWORD_DEFAULT), 'exp' => $exp, 'name' => $nm, 'proj' => $proj, 'at' => time())))) out(500, array('ok' => false, 'error' => 'write'));
    out(200, array('ok' => true));
  }
  if ($action === 'pkglist') {   // what is already there (size and sha256 of each file), so publishing again sends only the files that changed
    $have = array();
    foreach (array('', '/lib', '/model') as $sub) foreach ((array)glob($pd . $sub . '/*') as $g) { if (!is_file($g) || substr($g, -5) === '.part' || ($sub !== '' && basename($g) === 'index.html')) continue; $have[ltrim($sub . '/' . basename($g), '/')] = array(filesize($g), hash_file('sha256', $g)); }
    out(200, array('ok' => true, 'have' => (object)$have, 'taken' => $taken($tk)));
  }
  if ($action === 'pkgdone') {   // the files of an older version of the package that this one no longer has are taken away
    $keep = json_decode(isset($_POST['keep']) ? (string)$_POST['keep'] : '', true); if (!is_array($keep)) out(400, array('ok' => false, 'error' => 'json'));
    $n = 0;
    foreach (array('', '/lib', '/model') as $sub) foreach ((array)glob($pd . $sub . '/*') as $g) { if (!is_file($g) || ($sub !== '' && basename($g) === 'index.html')) continue; $rel = ltrim($sub . '/' . basename($g), '/'); if (!in_array($rel, $keep, true)) { @unlink($g); $n++; } }
    out(200, array('ok' => true, 'removed' => $n));
  }
  $path = isset($_POST['path']) ? (string)$_POST['path'] : '';
  if (!preg_match('#^(index\.html|lib/[A-Za-z0-9][A-Za-z0-9_.-]{0,80}\.js|model/[A-Za-z0-9][A-Za-z0-9_.-]{0,80}\.js|model/promo\.(mp4|webm|mov|m4v))$#', $path) || strpos($path, '..') !== false) out(400, array('ok' => false, 'error' => 'path'));
  if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) out(400, array('ok' => false, 'error' => 'file', 'code' => isset($_FILES['file']) ? $_FILES['file']['error'] : -1));
  if ($_FILES['file']['size'] > $MAX_BYTES) out(413, array('ok' => false, 'error' => 'size'));
  $dest = $pd . '/' . $path;
  if (!is_dir(dirname($dest)) && !@mkdir(dirname($dest), 0755, true)) out(500, array('ok' => false, 'error' => 'mkdir'));
  foreach (array($root . '/packages', dirname($dest)) as $dd) if ($dd !== $pd && !is_file($dd . '/index.html')) @file_put_contents($dd . '/index.html', '');   // an empty page in packages/, lib/ and model/: no list of the files even on a server that shows folder contents
  if (is_file($dest) && md5_file($dest) === md5_file($_FILES['file']['tmp_name'])) out(200, array('ok' => true, 'same' => true));
  if (!move_uploaded_file($_FILES['file']['tmp_name'], $dest . '.part')) out(500, array('ok' => false, 'error' => 'write'));
  @chmod($dest . '.part', 0644);
  if (!@rename($dest . '.part', $dest)) { @unlink($dest); if (!@rename($dest . '.part', $dest)) out(500, array('ok' => false, 'error' => 'rename')); }
  out(200, array('ok' => true));
}
