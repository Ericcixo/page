<?php
header('Content-Type: application/json; charset=UTF-8');
$choice = isset($_POST['choice']) ? $_POST['choice'] : 'unknown';
$ts = isset($_POST['ts']) ? $_POST['ts'] : date('c');
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
$m = isset($_POST['m']) ? $_POST['m'] : '';
$dir = __DIR__ . '/data';
$file = $dir . '/consents.csv';
$ok = true; $err = '';
if (!is_dir($dir)) {
  if (!@mkdir($dir, 0755, true)) { $ok=false; $err='mkdir_failed'; }
}
if ($ok && !file_exists($file)) {
  @touch($file);
  @chmod($file, 0644);
}
$line = sprintf("%s,%s,%s,%s,%s
", $ts, $choice, $ip, str_replace(["
","",","], ' ', $ua), substr($m,0,1200));
if ($ok) {
  if (@file_put_contents($file, $line, FILE_APPEND | LOCK_EX) === false) { $ok=false; $err='write_failed'; }
}
// Set cookie with modern attributes
$secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
$cookieParams = [
  'expires' => time()+3600*24*365,
  'path' => '/',
  'secure' => $secure,
  'httponly' => false,
  'samesite' => 'Lax'
];
@setcookie('rf_cookie_consent', $choice, $cookieParams);
http_response_code($ok ? 200 : 500);
echo json_encode(['ok'=>$ok, 'err'=>$err]);
?>
