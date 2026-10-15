<?php
// Gambit360 live tours – receives the files the Gambit360 Studio publishes. Put it in the same folder as index.html.
// Only a request with the Studio's upload key is accepted, only into tours/<address>/ (plus index.html and .htaccess),
// and only image, audio, video and config files. The previous copy of every file is kept in _backup/.
// It also keeps the Studio's synced data (a private _bk_ folder: the live tours and the point-cloud projects), lets another computer connect with a password,
// serves the Studio online at /app/ after that password, replaces itself when the Studio has a newer copy, and emails the clients' view reports.
$KEY_SHA256 = '@@KEYHASH@@';
$VER = 12;   // grows with every change to this file: the Studio replaces an older copy on the server by itself
$LOGO = '@@LOGO@@';   // the Gambit360 logo for the sign-in page, filled in by the Studio
$MAX_BYTES = 500 * 1024 * 1024;

$root = __DIR__;
$keyOk = $KEY_SHA256 !== '' && strlen($KEY_SHA256) === 64;
$bd = $root . '/_bk_' . substr($KEY_SHA256, 0, 16);   // the private folder: an unguessable name, no public access
function denyDir($d) { if (!is_dir($d)) @mkdir($d, 0755, true); if (!is_file($d . '/.htaccess')) @file_put_contents($d . '/.htaccess', "<IfModule mod_authz_core.c>\nRequire all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\nOrder allow,deny\nDeny from all\n</IfModule>\n"); }
// the cloud user name: compared without case or outer spaces
function unorm($u) { return strtolower(trim(preg_replace('#\s+#u', ' ', (string)$u))); }
// the Studio online: a cookie set by a correct password, signed with the key's hash, good for 30 days
function appTok($exp, $h) { return $exp . '.' . hash_hmac('sha256', 'g360app' . $exp, $h); }
function appOk($h) { $c = isset($_COOKIE['g360app']) ? (string)$_COOKIE['g360app'] : ''; $p = explode('.', $c); return count($p) === 2 && preg_match("#^[0-9]{1,12}$#", $p[0]) && (int)$p[0] > time() && hash_equals(appTok($p[0], $h), $c); }
@@include(live-tours/upload/10-email-reports.php)@@

@@include(live-tours/upload/20-studio-online.php)@@

@@include(live-tours/upload/30-report-links.php)@@

@@include(live-tours/upload/35-package-download.php)@@

@@include(live-tours/upload/40-request-and-sign-in.php)@@
@@include(live-tours/upload/50-cloud-and-self-update.php)@@
@@include(live-tours/upload/60-tours-stats-reports.php)@@
@@include(live-tours/upload/65-point-cloud-projects.php)@@
@@include(live-tours/upload/67-client-packages.php)@@
@@include(live-tours/upload/70-file-upload.php)@@
