(() => {
 "use strict";
 const d=window.COMP_RUTH; if(!d) return;
 const el=id=>document.getElementById(id);
 const enc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const url=s=>{try{const u=new URL(s);return u.protocol==="https:"?u.href:""}catch{return""}};
 const code=new URLSearchParams(location.search).get("avaliacao");
 const entry=d.avaliacoes.find(a=>a.codigo===code);
 const credit=c=>({disponivel:"Crédito disponível",a_confirmar:"Crédito a confirmar",atribuido:"Avaliação atribuída",utilizado:"Crédito utilizado"}[c]||"Reservado");
 const step=s=>({preparacao:"Aguardando preparação",pendente:"Pendente",enviada:"Enviada",andamento:"Em andamento",concluida:"Concluída"}[s]||"Em preparação");
 const tag=(t,cls="")=>'<span class="badge '+cls+'">'+enc(t)+'</span>';
 const route=(pg,c)=>"./"+pg+".html?avaliacao="+encodeURIComponent(c);
 const view=document.body.getAttribute("data-page");
 if(view==="home"){
   el("nome").textContent=d.consultora;
   const metrics=[["Créditos disponíveis",d.creditosDisponiveis??"—"],["Avaliações",d.avaliacoes.length],["Pendentes",d.avaliacoes.filter(a=>a.situacao==="pendente").length]];
   el("metrics").innerHTML=metrics.map(([t,n])=>'<div class="metric"><small>'+enc(t)+'</small><strong>'+n+'</strong></div>').join("");
   el("list").innerHTML=d.avaliacoes.map(a=>'<article class="card"><div class="card-head"><div><div class="eyebrow">Avaliação '+enc(a.codigo)+'</div><h3>'+enc(a.avaliado||"Avaliado a definir")+'</h3><p class="muted">'+enc(d.empresa)+'</p></div><div class="badges">'+tag(credit(a.credito),a.credito==="a_confirmar"?"warn":"")+tag(step(a.situacao),"neutral")+'</div></div><div class="actions"><a class="btn" href="'+route("status",a.codigo)+'">Ver status →</a><a class="btn secondary" href="'+route("formulario",a.codigo)+'">Formulário ↗</a><a class="btn secondary" href="'+route("final",a.codigo)+'">Relatório final ↗</a></div></article>').join("");
 } else if(view==="form"){
   if(!entry){el("area").innerHTML='<div class="empty"><h2>Avaliação não encontrada</h2><p>Confirme o link recebido.</p></div>';return}
   el("codigo").textContent="Avaliação "+entry.codigo+" · "+d.empresa;
   const href=url(entry.formulario);
   if(!href){el("area").innerHTML='<div class="empty"><h2>Formulário em preparação</h2><p>Esta avaliação ainda não está liberada para preenchimento. Confirme com a consultora.</p></div>';return}
   const formEmbed=href.replace("https://forms.gle/","https://forms.gle/");
   el("area").innerHTML='<h2>Formulário de avaliação</h2><p class="muted">Responda diretamente no formulário do Google abaixo. Caso não carregue, utilize o acesso alternativo.</p><div class="actions"><a class="btn secondary" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer" id="link">Abrir no Google Forms ↗</a></div><div id="form-embed"></div>';
   el("link").href=href;
   const frame=document.createElement("iframe");
   frame.className="embed";frame.title="Formulário Google da avaliação "+entry.codigo;
   frame.src=formEmbed;frame.loading="lazy";frame.referrerPolicy="no-referrer";
   frame.setAttribute("allow","clipboard-write");
   el("form-embed").append(frame);
 } else if(view==="final"){
   if(!entry){el("area").innerHTML='<div class="empty"><h2>Relatório indisponível</h2><p>Confirme o link da avaliação.</p></div>';return}
   el("codigo").textContent="Avaliação "+entry.codigo;
   el("avaliado").textContent=entry.avaliado||"";
   const href=url(entry.relatorioFinal);
   if(!href){el("area").innerHTML='<div class="empty"><h2>Relatório final em preparação</h2><p>O documento será disponibilizado aqui após a conclusão e a autorização da consultora.</p></div>';return}
   el("area").innerHTML='<h2>Relatório final</h2><p>O documento permanece armazenado no Google Drive e respeita as permissões de acesso definidas pelo proprietário.</p><div class="actions"><a class="btn" id="final-link" target="_blank" rel="noopener noreferrer">Consultar relatório ↗</a></div>';
   el("final-link").href=href;
 } else if(view==="status"){
   if(!entry){el("area").innerHTML='<div class="empty"><h2>Avaliação não encontrada</h2></div>';return}
   el("codigo").textContent="Avaliação "+entry.codigo+" · "+d.empresa;
   el("avaliado").textContent=entry.avaliado||"Avaliado a definir";
   const n=entry.respondidas,m=entry.previstas;
   const progress=Number.isInteger(n)&&Number.isInteger(m)&&m>0?Math.round(100*n/m):null;
   el("area").innerHTML='<section class="card section"><h2>Andamento</h2><div class="badges">'+tag(credit(entry.credito),entry.credito==="a_confirmar"?"warn":"")+tag(step(entry.situacao),"neutral")+'</div><div class="stats-row"><div class="value"><small>Situação</small><strong>'+enc(step(entry.situacao))+'</strong></div><div class="value"><small>Respostas</small><strong>'+(progress===null?"Aguardando apuração":n+" de "+m)+'</strong></div></div><p class="muted">Controle provisório, atualizado manualmente. Respostas individuais não são exibidas.</p></section><section class="card section"><h2>Relatório de status</h2><div id="report"></div></section>';
   const href=url(entry.status);
   if(!href){el("report").innerHTML='<div class="empty"><h3>Relatório em preparação</h3><p>O link da planilha de status desta avaliação ainda não foi vinculado.</p></div>';return}
   el("report").innerHTML='<div class="actions"><a class="btn" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer" id="report-link">Abrir status ↗</a></div>';
   el("report-link").href=href;
   const link=new URL(href);
   if(link.hostname==="docs.google.com" && link.pathname.includes("/spreadsheets/") && link.pathname.includes("/pubhtml")){
     const frame=document.createElement("iframe");
     frame.className="embed";frame.title="Relatório de status "+entry.codigo;
     frame.src=href;frame.loading="lazy";frame.referrerPolicy="no-referrer";
     el("report").append(frame);
   }
 }
})();