if ($action === 'pkgput' || $action === 'pkgdone') {   // a client package published on the site: p/<token>/index.html with its lib/ and model/ files, the link the client gets
  $tk = isset($_POST['token']) ? (string)$_POST['token'] : '';
  if (!preg_match('#^p[a-z0-9]{10}$#', $tk)) out(400, array('ok' => false, 'error' => 'path'));
  $pd = $root . '/p/' . $tk;
  if (!is_file($root . '/p/.htaccess')) { if (!is_dir($root . '/p')) @mkdir($root . '/p', 0755, true); @file_put_contents($root . '/p/.htaccess', "Options -Indexes\n<IfModule mod_headers.c>\nHeader set X-Robots-Tag \"noindex, nofollow\"\n</IfModule>\n"); }
  if ($action === 'pkgdone') {   // the files of an older version of the package that this one no longer has are taken away
    $keep = json_decode(isset($_POST['keep']) ? (string)$_POST['keep'] : '', true); if (!is_array($keep)) out(400, array('ok' => false, 'error' => 'json'));
    $n = 0;
    foreach (array('', '/lib', '/model') as $sub) foreach ((array)glob($pd . $sub . '/*') as $g) { if (!is_file($g)) continue; $rel = ltrim($sub . '/' . basename($g), '/'); if (!in_array($rel, $keep, true)) { @unlink($g); $n++; } }
    out(200, array('ok' => true, 'removed' => $n));
  }
  $path = isset($_POST['path']) ? (string)$_POST['path'] : '';
  if (!preg_match('#^(index\.html|lib/[A-Za-z0-9][A-Za-z0-9_.-]{0,80}\.js|model/[A-Za-z0-9][A-Za-z0-9_.-]{0,80}\.js|model/promo\.(mp4|webm|mov|m4v))$#', $path) || strpos($path, '..') !== false) out(400, array('ok' => false, 'error' => 'path'));
  if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) out(400, array('ok' => false, 'error' => 'file', 'code' => isset($_FILES['file']) ? $_FILES['file']['error'] : -1));
  if ($_FILES['file']['size'] > $MAX_BYTES) out(413, array('ok' => false, 'error' => 'size'));
  $dest = $pd . '/' . $path;
  if (!is_dir(dirname($dest)) && !@mkdir(dirname($dest), 0755, true)) out(500, array('ok' => false, 'error' => 'mkdir'));
  if (is_file($dest) && md5_file($dest) === md5_file($_FILES['file']['tmp_name'])) out(200, array('ok' => true, 'same' => true));
  if (!move_uploaded_file($_FILES['file']['tmp_name'], $dest . '.part')) out(500, array('ok' => false, 'error' => 'write'));
  @chmod($dest . '.part', 0644);
  if (!@rename($dest . '.part', $dest)) { @unlink($dest); if (!@rename($dest . '.part', $dest)) out(500, array('ok' => false, 'error' => 'rename')); }
  out(200, array('ok' => true));
}
