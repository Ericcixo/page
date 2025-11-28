<?php
// cookies.php - Registro avanzado de consentimiento
header('Content-Type: application/json; charset=UTF-8');

// 1. Captura de datos extendida
$choice = $_POST['choice'] ?? 'unknown';
$ip_raw = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';

// Anonimización de IP (Cumplimiento GDPR - Opcional, pero recomendado)
// Si quieres la IP completa para análisis interno, comenta estas líneas:

if (strpos($ip_raw, '.') !== false) {
    $ip = preg_replace('/\.\d+$/', '.0', $ip_raw); // IPv4: 192.168.1.0
} else {
    $ip = substr($ip_raw, 0, 16) . '::'; // IPv6
}

$ip = $ip_raw; // Guardamos IP completa (Bajo tu responsabilidad legal)

$ua = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
$lang = $_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? 'Unknown';
$referer = $_SERVER['HTTP_REFERER'] ?? 'Direct';
$timestamp = date('Y-m-d H:i:s');

// 2. Preparar línea CSV
// Formato: Fecha, Elección, IP, Navegador, Idioma, Origen
$data = [
    $timestamp,
    $choice,
    $ip,
    str_replace([',', '"'], '', $ua), // Limpiar comas para no romper CSV
    str_replace([',', '"'], '', $lang),
    str_replace([',', '"'], '', $referer)
];

$line = implode(',', $data) . "\n";

// 3. Guardar en archivo
$file = __DIR__ . '/data/consents.csv';
$dir = dirname($file);

if (!is_dir($dir)) {
    @mkdir($dir, 0755, true);
}

// Intentar escribir (Append)
if (@file_put_contents($file, $line, FILE_APPEND | LOCK_EX) !== false) {
    http_response_code(200);
    echo json_encode(['status' => 'success']);
} else {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Write failed']);
}
?>
