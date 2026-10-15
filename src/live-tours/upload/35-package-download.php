if (isset($_GET['pkgget']) || (isset($_POST['action']) && ($_POST['action'] === 'pkginfo' || $_POST['action'] === 'pkgdl'))) {   // a client package on the site (packages/<token>/): may it be downloaded, the client's code, and the download itself
  $pj = function ($c, $a) { http_response_code($c); header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store'); header('X-Robots-Tag: noindex'); echo json_encode($a); exit; };
  $tk = (string)(isset($_GET['pkgget']) ? $_GET['pkgget'] : (isset($_POST['token']) ? $_POST['token'] : ''));
  if (!$keyOk || !preg_match('#^[a-z0-9][a-z0-9-]{1,59}$#', $tk)) $pj(400, array('ok' => false, 'error' => 'path'));
  $pd = $root . '/packages/' . $tk; if (!is_dir($pd)) $pd = $root . '/p/' . $tk; $jf = $bd . '/pkg/' . $tk . '.json'; $info = @json_decode((string)@file_get_contents($jf), true);   // older packages are still in p/<token>/
  try { $today = (new DateTime('now', new DateTimeZone('Asia/Jerusalem')))->format('Y-m-d'); } catch (Exception $x) { $today = date('Y-m-d'); }
  $live = is_array($info) && !empty($info['hash']) && is_file($pd . '/index.html') && (empty($info['exp']) || $today <= $info['exp']);   // the package's storage period has not ended
  $sig = function ($e) use ($tk, $KEY_SHA256) { return hash_hmac('sha256', 'pkgget' . $tk . $e, $KEY_SHA256); };
  if (isset($_GET['pkgget'])) {   // the ZIP is built while it is sent, from the files already on the site: nothing is kept twice
    $e = isset($_GET['e']) ? (string)$_GET['e'] : ''; $s = isset($_GET['s']) ? (string)$_GET['s'] : '';
    if (!$live || !preg_match('#^[0-9]{1,12}$#', $e) || (int)$e < time() || !hash_equals($sig($e), $s)) { http_response_code(403); header('Content-Type: text/plain; charset=utf-8'); echo "This download link has expired. Open the package page again and enter the code.\nקישור ההורדה פג. פתחו שוב את דף החבילה והקלידו את הקוד."; exit; }
    $nm = preg_replace('#[\\\\/:*?"<>|\x00-\x1f]+#u', '_', isset($info['name']) ? (string)$info['name'] : '') ?: 'Gambit360';
    $list = array(array($pd . '/index.html', $nm . '.html'));
    foreach (array('lib', 'model') as $sub) foreach ((array)glob($pd . '/' . $sub . '/*') as $g) if (is_file($g) && basename($g) !== 'index.html') $list[] = array($g, $sub . '/' . basename($g));
    $len = 22; foreach ($list as $i => $f) { $list[$i][1] = $nm . '/' . $f[1]; $list[$i][2] = filesize($f[0]); $len += 76 + 2 * strlen($list[$i][1]) + $list[$i][2]; }
    @set_time_limit(0); while (ob_get_level()) @ob_end_clean();
    header('Content-Type: application/zip'); header('Content-Length: ' . $len); header('Cache-Control: no-store'); header('X-Robots-Tag: noindex');
    header("Content-Disposition: attachment; filename=\"Gambit360.zip\"; filename*=UTF-8''" . rawurlencode($nm . '.zip'));
    $cd = ''; $off = 0;
    foreach ($list as $f) {   // a plain ZIP (stored, no compression), file names in UTF-8
      $t = getdate(filemtime($f[0])); $dt = (($t['hours'] << 11) | ($t['minutes'] << 5) | ($t['seconds'] >> 1)); $dd = ((max(0, $t['year'] - 1980) << 9) | ($t['mon'] << 5) | $t['mday']);
      $crc = hexdec(hash_file('crc32b', $f[0])); $n = $f[1]; $sz = $f[2];
      $h = pack('vvvvvVVVv', 20, 0x0800, 0, $dt, $dd, $crc, $sz, $sz, strlen($n));
      echo "PK\x03\x04", $h, pack('v', 0), $n; readfile($f[0]);
      $cd .= "PK\x01\x02" . pack('v', 20) . $h . pack('vvvvVV', 0, 0, 0, 0, 0, $off) . $n;
      $off += 30 + strlen($n) + $sz;
    }
    echo $cd, "PK\x05\x06", pack('vvvvVVv', 0, 0, count($list), count($list), strlen($cd), $off, 0);
    exit;
  }
  if ($_POST['action'] === 'pkginfo') $pj(200, array('ok' => true, 'dl' => $live));
  if (!$live) $pj(200, array('ok' => false, 'error' => 'none'));
  $fl = isset($info['fails']) && is_array($info['fails']) ? $info['fails'] : array(0, 0);
  if ($fl[0] >= 10 && time() - $fl[1] < 900) $pj(429, array('ok' => false, 'error' => 'wait'));
  $code = strtoupper(preg_replace('#[^A-Za-z0-9]#', '', isset($_POST['code']) ? (string)$_POST['code'] : ''));
  if (!password_verify($code, $info['hash'])) { $info['fails'] = array(($fl[0] >= 10 ? 0 : $fl[0]) + 1, time()); @file_put_contents($jf, json_encode($info)); sleep(1); $pj(200, array('ok' => false, 'error' => 'code')); }
  if (!empty($info['fails'])) { unset($info['fails']); @file_put_contents($jf, json_encode($info)); }
  $e = time() + 600;   // the link that downloads works for ten minutes
  $pj(200, array('ok' => true, 'url' => 'upload.php?pkgget=' . $tk . '&e=' . $e . '&s=' . $sig($e)));
}
