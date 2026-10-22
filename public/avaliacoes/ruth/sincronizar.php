<?php
declare(strict_types=1);
ini_set('display_errors','0');
header('Cache-Control: no-store');
header('Content-Type: application/json; charset=utf-8');
function fail(int $status): void { http_response_code($status); echo '{"ok":false}'; exit; }
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') fail(405);
$config = __DIR__ . '/.sync-config.php';
if (!is_file($config)) fail(503);
$expected = require $config;
$authorization = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (!is_string($expected) || strlen($expected) < 32 || !hash_equals($expected, hash('sha256', preg_replace('/^Bearer\s+/i','',$authorization)))) fail(403);
if (($_SERVER['CONTENT_LENGTH'] ?? 0) > 500000) fail(413);
$raw = file_get_contents('php://input');
if ($raw === false || strlen($raw)>500000) fail(413);
$data=json_decode($raw,true);
if (!is_array($data) || !isset($data['avaliacoes']) || !is_array($data['avaliacoes']) || count($data['avaliacoes'])>1000) fail(422);
foreach ($data['avaliacoes'] as $item) {
 if (!is_array($item) || !isset($item['codigo']) || !preg_match('/^[0-9]{3}$/',(string)$item['codigo'])) fail(422);
}
$target = __DIR__ . '/historico-privado.php';
$tmp=tempnam(__DIR__,'.sync-');
if (!$tmp) fail(500);
if (file_put_contents($tmp,'<?php return '.var_export($data,true).';',LOCK_EX)===false) { @unlink($tmp); fail(500); }
@chmod($tmp,0600);
if (!rename($tmp,$target)) { @unlink($tmp); fail(500); }
echo '{"ok":true,"registros":'.count($data['avaliacoes']).'}';
