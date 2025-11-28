<?php
// Simple script para procesar contacto
header('Content-Type: application/json');
if($_SERVER['REQUEST_METHOD'] !== 'POST'){ echo json_encode(['ok'=>false]); exit; }

$email = filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL);
$msg = substr($_POST['message'] ?? '', 0, 2000);

if(!$email || !$msg){
    echo json_encode(['ok'=>false, 'err'=>'invalid_input']);
    exit;
}

// Aquí podrías guardar en CSV o enviar mail con mail()
// Para demo, guardamos en un log seguro
$logEntry = date('c') . " | $email | " . str_replace("\n", " ", $msg) . "\n";
@file_put_contents(__DIR__ . '/data/messages_safe.log', $logEntry, FILE_APPEND);

echo json_encode(['ok'=>true]);
?>
