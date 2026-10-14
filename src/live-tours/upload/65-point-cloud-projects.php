if ($action === 'pclist' || $action === 'pcget' || $action === 'pcput' || $action === 'pcdel') {   // point-cloud projects (.g360: tags, views, measurements; not the E57 itself), one per model, in the private folder
  $pd = $bd . '/pc'; $id = isset($_POST['id']) ? (string)$_POST['id'] : '';
  if ($action !== 'pclist' && !preg_match('#^[0-9a-f]{24}$#', $id)) out(400, array('ok' => false, 'error' => 'path'));
  $f = $pd . '/' . $id . '.json';
  if ($action === 'pclist') {   // what the Studio shows in "Open from the cloud": the title, the model and when it was saved, not the whole project
    $list = array();
    foreach ((array)glob($pd . '/*.json') as $g) {
      if (!preg_match('#/([0-9a-f]{24})\.json$#', $g, $m)) continue;
      $j = $meta($g); if (!$j) continue;
      $list[] = array('id' => $m[1], 'model' => isset($j['model']) ? (string)$j['model'] : '', 'title' => isset($j['title']) ? (string)$j['title'] : '', 'kind' => isset($j['kind']) ? (string)$j['kind'] : '',
        'saved' => isset($j['saved']) ? (string)$j['saved'] : '', 'by' => isset($j['by']) ? (string)$j['by'] : '', 'tags' => isset($j['extras']['tags']) && is_array($j['extras']['tags']) ? count($j['extras']['tags']) : 0, 'size' => filesize($g));
    }
    out(200, array('ok' => true, 'list' => $list));
  }
  if ($action === 'pcget') { if (!is_file($f)) out(404, array('ok' => false, 'error' => 'none')); header('Content-Type: application/json; charset=utf-8'); readfile($f); exit; }
  $lk = @fopen($bd . '/.lock', 'c'); if ($lk) flock($lk, LOCK_EX);
  $keep = function () use ($pd, $id, $f) {   // the 20 copies before this one stay in pc/history/
    if (!is_file($f)) return;
    $kd = $pd . '/history'; if (!is_dir($kd)) @mkdir($kd, 0755, true); @copy($f, $kd . '/' . $id . '.' . date('Ymd-His') . '.json');
    $old = glob($kd . '/' . $id . '.*.json'); if ($old && count($old) > 20) { sort($old); foreach (array_slice($old, 0, count($old) - 20) as $o) @unlink($o); }
  };
  if ($action === 'pcdel') { $keep(); @unlink($f); out(200, array('ok' => true)); }
  if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) out(400, array('ok' => false, 'error' => 'file'));
  $j = json_decode(file_get_contents($_FILES['file']['tmp_name']), true);
  if (!is_array($j) || !isset($j['g360project']) || empty($j['model'])) out(400, array('ok' => false, 'error' => 'json'));
  if (isset($_POST['prev']) && is_file($f)) { $c = $meta($f); $sv = $c && isset($c['saved']) ? (string)$c['saved'] : ''; if ($sv !== (string)$_POST['prev']) out(409, array('ok' => false, 'error' => 'stale', 'saved' => $sv, 'by' => $c && isset($c['by']) ? (string)$c['by'] : '')); }
  denyDir($bd); if (!is_dir($pd) && !@mkdir($pd, 0755, true)) out(500, array('ok' => false, 'error' => 'mkdir'));
  $keep();
  if (!move_uploaded_file($_FILES['file']['tmp_name'], $f . '.part')) out(500, array('ok' => false, 'error' => 'write'));
  if (!@rename($f . '.part', $f)) { @unlink($f); if (!@rename($f . '.part', $f)) out(500, array('ok' => false, 'error' => 'rename')); }
  out(200, array('ok' => true, 'saved' => isset($j['saved']) ? (string)$j['saved'] : ''));
}
