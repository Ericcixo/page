<?php
header('Content-Type: application/json; charset=UTF-8');

// 1. Sanitización de entradas
$choice = isset($_POST['choice']) && in_array($_POST['choice'], ['accept', 'reject']) ? $_POST['choice'] : 'unknown';
$ts = date('c');
$ua = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 200); // Limitamos longitud

// 2. ANONIMIZACIÓN DE IP (CRÍTICO GDPR)
$raw_ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
// Si es IPv4, ponemos a 0 el último octeto. Si es IPv6, cortamos.
$ip = (strpos($raw_ip, '.') !== false) 
    ? preg_replace('/\.\d+$/', '.0', $raw_ip) 
    : substr($raw_ip, 0, 16) . '::';

$m = isset($_POST['m']) ? substr($_POST['m'], 0, 1000) : '';

// 3. Gestión de archivo segura
$dir = __DIR__ . '/data';
$file = $dir . '/consents.csv';
$ok = true; 
$err = '';

if (!is_dir($dir)) {
    if (!@mkdir($dir, 0755, true)) { $ok=false; $err='mkdir_failed'; }
}

// Formato CSV seguro: Timestamp, Choice, AnonIP, UserAgent(sanitizado)
$line = sprintf("%s,%s,%s,\"%s\"\n", 
    $ts, 
    $choice, 
    $ip, 
    str_replace('"', '""', $ua) // Escapar comillas en UA
);

if ($ok) {
    if (@file_put_contents($file, $line, FILE_APPEND | LOCK_EX) === false) { 
        $ok=false; $err='write_failed'; 
    }
}

// 4. Cookie HttpOnly y Secure
$secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
setcookie('rf_cookie_consent', $choice, [
    'expires' => time() + 3600*24*365,
    'path' => '/',
    'secure' => $secure,
    'httponly' => true, // Importante: JS no puede leerla, mejor seguridad
    'samesite' => 'Lax'
]);

http_response_code($ok ? 200 : 500);
echo json_encode(['ok'=>$ok, 'err'=>$err]);
?>
