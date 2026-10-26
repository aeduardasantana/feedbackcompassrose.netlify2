<?php
declare(strict_types=1);
ini_set('display_errors','0');
header('Content-Type: text/html; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('Cache-Control: no-store, private');
header('X-Robots-Tag: noindex, nofollow, noarchive');
$codigo=(string)($_GET['avaliacao']??'');
if(!preg_match('/^[0-9]{3}$/',$codigo)){http_response_code(404);exit('Avaliação não encontrada.');}
$arquivo=__DIR__.'/historico-privado.php';
if(!is_file($arquivo)){http_response_code(503);exit('Relatório temporariamente indisponível.');}
$dados=require $arquivo;
$avaliacao=null;
foreach(($dados['avaliacoes']??[]) as $item){
 if((string)($item['codigo']??'')===$codigo){$avaliacao=$item;break;}
}
if(!$avaliacao){http_response_code(404);exit('Avaliação não encontrada.');}
$link=(string)($avaliacao['status']??'');
if($link && (!filter_var($link,FILTER_VALIDATE_URL)||parse_url($link,PHP_URL_SCHEME)!=='https'||parse_url($link,PHP_URL_HOST)!=='docs.google.com'))$link='';
$e=static fn($s)=>htmlspecialchars((string)$s,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');
?><!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive"><title>Relatório de status — Avaliação <?= $e($codigo) ?> | Feedback Compass Rose</title>
<link rel="stylesheet" href="./estilo.css"></head>
<body data-page="status"><header class="header"><div class="container"><div class="logo" aria-hidden="true">✧</div><div class="brand">Feedback Compass Rose<small>Relatório de status da avaliação</small></div></div></header>
<main class="container main"><section class="hero"><div class="eyebrow">Avaliação <?= $e($codigo) ?></div>
<h1>Relatório de acompanhamento</h1><p><?= $e($avaliacao['avaliado']??'') ?></p></section>
<section class="card section"><h2>Relatório de status</h2>
<?php if($link): ?>
<iframe class="embed" loading="lazy" title="Relatório de status da avaliação <?= $e($codigo) ?>" referrerpolicy="no-referrer" src="<?= $e($link) ?>"></iframe>
<details class="form-help"><summary>Problemas para visualizar o relatório?</summary><p>Se a visualização não carregar, utilize a versão original do Google.</p><a class="fallback-link" href="<?= $e($link) ?>" target="_blank" rel="noopener noreferrer">Abrir relatório original em outra aba ↗</a></details>
<?php else: ?><p>O relatório de status ainda não foi disponibilizado.</p><?php endif; ?>
</section></main><footer class="footer">Feedback Compass Rose · GEB Tecnologia</footer></body></html>
