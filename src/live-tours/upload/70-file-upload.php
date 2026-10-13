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
