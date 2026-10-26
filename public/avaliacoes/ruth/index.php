<?php
declare(strict_types=1);
ini_set('display_errors', '0');
session_set_cookie_params(['httponly'=>true,'secure'=>true,'samesite'=>'Strict','path'=>'/avaliacoes/ruth/']);
session_start();
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
// Redireciona exclusivamente páginas de status para a rota pública, sem abrir acesso ao painel.
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET' && ($_GET['recurso'] ?? '') === 'status.html') {
  $codigo=(string)($_GET['avaliacao'] ?? '');
  if (!preg_match('/^[0-9]{3}$/', $codigo)) { http_response_code(404); exit; }
  header('Location: ./status-publico.php?avaliacao='.rawurlencode($codigo), true, 302);
  exit;
}
$config = __DIR__ . '/.senha-config.php';
if (!is_file($config)) { http_response_code(503); exit('Acesso temporariamente indisponível.'); }
$hash = require $config;
if (isset($_GET['sair'])) { $_SESSION = []; session_destroy(); header('Location: ./'); exit; }
$erro = false;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $senha = (string)($_POST['senha'] ?? '');
  if (strlen($senha) <= 256 && password_verify($senha, $hash)) {
    session_regenerate_id(true);
    $_SESSION['ruth_autorizada'] = true;
    header('Location: ./');
    exit;
  }
  $erro = true;
}
$autorizada = !empty($_SESSION['ruth_autorizada']);
if (!$autorizada) {
 header('Content-Type: text/html; charset=utf-8');
 ?><!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Acesso reservado | Feedback Compass Rose</title><style>body{font:16px system-ui,Arial;background:#f7f6f2;color:#193e38;margin:0;min-height:100vh;display:grid;place-items:center}.box{width:min(420px,90vw);background:white;border:1px solid #dce7e1;border-radius:16px;padding:28px;box-sizing:border-box}h1{font:600 27px Georgia,serif}input,button{box-sizing:border-box;width:100%;padding:12px;font:inherit;border-radius:9px}input{border:1px solid #a9bbb2}button{border:0;background:#193e38;color:white;margin-top:12px;cursor:pointer}.erro{color:#a92323}</style></head><body><main class="box"><p>Feedback Compass Rose</p><h1>Área reservada da consultora</h1><p>Informe sua senha de acesso.</p><?php if ($erro): ?><p class="erro" role="alert">Senha incorreta.</p><?php endif ?><form method="post" autocomplete="off"><label for="senha">Senha</label><input type="password" name="senha" id="senha" required autofocus autocomplete="current-password"><button type="submit">Entrar</button></form></main></body></html><?php exit;
}
$recurso = (string)($_GET['recurso'] ?? 'index.html');
$permitidos=['index.html'=>'text/html; charset=utf-8','dados.js'=>'application/javascript; charset=utf-8','status.html'=>'text/html; charset=utf-8','final.html'=>'text/html; charset=utf-8'];
if (!array_key_exists($recurso, $permitidos)) { http_response_code(404); exit; }
header('Content-Type: '.$permitidos[$recurso]);
$html = file_get_contents(__DIR__ . '/' . $recurso);
if ($html === false) { http_response_code(404); exit; }
if ($recurso === 'dados.js') {
  $historyFile = __DIR__ . '/historico-privado.php';
  if (is_file($historyFile)) {
    $historic = require $historyFile;
    if (is_array($historic) && isset($historic['avaliacoes']) && is_array($historic['avaliacoes'])) {
      header('Content-Type: application/javascript; charset=utf-8');
      echo 'window.COMP_RUTH=' . json_encode($historic, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT) . ';';
      exit;
    }
  }
  http_response_code(503);
  exit('Historico privado ainda nao instalado na hospedagem.');
}
if ($recurso === 'index.html') {
  $html = str_replace('src="./dados.js"', 'src="./index.php?recurso=dados.js"', $html);
  $html = str_replace('href="./estilo.css"', 'href="./estilo.css"', $html);
}
if ($recurso === 'status.html' || $recurso === 'final.html') {
  $html = str_replace('src="./dados.js"', 'src="./index.php?recurso=dados.js"', $html);
}
echo $html;
