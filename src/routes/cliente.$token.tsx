import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Building2, ClipboardList, Coins, FileText, LockKeyhole, RefreshCw, UsersRound } from "lucide-react";
import {
  CreditChip, PortalAviso, PortalFooter, PortalHeader, StatusChip, usePortal,
  type AvaliacaoPortal,
} from "@/lib/portal-provisorio";

export const Route = createFileRoute("/cliente/$token")({
  head: () => ({
    meta: [
      { title: "Área da consultora — Feedback Compass Rose" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: PortalConsultora,
});

function Metric({ rotulo, valor, detalhe }: { rotulo: string; valor: number; detalhe: string }) {
  return <div className="rounded-2xl border border-[#173f3a]/10 bg-white px-5 py-5 shadow-sm">
    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6b8178]">{rotulo}</p>
    <p className="mt-2 font-serif text-4xl font-semibold text-[#173f3a]">{valor}</p>
    <p className="mt-1 text-xs text-[#6b8178]">{detalhe}</p>
  </div>;
}

function Item({ item, token }: { item: AvaliacaoPortal; token: string }) {
  const formUrl = "/formulario/" + encodeURIComponent(item.formulario_token);
  const statusUrl = "/cliente/" + encodeURIComponent(token) + "/status/" + encodeURIComponent(item.codigo);
  const ready = Boolean(item.link_formulario_externo) && item.situacao_credito !== "pendente_confirmacao";
  return <article className="rounded-[1.5rem] border border-[#173f3a]/10 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#94783b]">Avaliação {item.codigo}</p>
        <h3 className="mt-2 font-serif text-2xl font-semibold text-[#173f3a]">{item.avaliado || "Avaliado a definir"}</h3>
        <p className="mt-1 text-sm text-[#6b8178]">Feedback 360º · Grupo Bemec</p>
      </div>
      <div className="flex flex-wrap gap-2"><CreditChip estado={item.situacao_credito} /><StatusChip status={item.status} /></div>
    </div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl bg-[#f6f5f0] px-4 py-3 text-sm text-[#47655e]">
        <p className="font-semibold">Formulário</p>
        <p className="mt-1 text-xs leading-relaxed">{ready ? "Acesso individual preparado." : "Aguardando configuração para envio."}</p>
      </div>
      <div className="rounded-xl bg-[#f6f5f0] px-4 py-3 text-sm text-[#47655e]">
        <p className="font-semibold">Relatório de status</p>
        <p className="mt-1 text-xs leading-relaxed">Acompanhamento gerencial independente do formulário.</p>
      </div>
    </div>
    <div className="mt-5 flex flex-wrap gap-3 border-t border-[#173f3a]/10 pt-5">
      <a href={statusUrl} className="inline-flex items-center gap-2 rounded-full bg-[#173f3a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#255d53]">
        <FileText className="h-4 w-4" /> Ver status <ArrowRight className="h-4 w-4" />
      </a>
      <a href={formUrl} className="inline-flex items-center gap-2 rounded-full border border-[#173f3a]/20 px-5 py-2.5 text-sm font-semibold text-[#173f3a] transition hover:bg-[#eaf0e9]">
        <ClipboardList className="h-4 w-4" /> Página do formulário
      </a>
      {!ready && <span className="self-center text-xs text-[#8d7441]">Não compartilhar com respondentes antes da liberação.</span>}
    </div>
  </article>;
}

function PortalConsultora() {
  const { token } = Route.useParams();
  const estado = usePortal(token);
  if (estado.tipo === "carregando") return <PortalAviso carregando mensagem="Acessando o painel da consultora..." />;
  if (estado.tipo === "erro") return <PortalAviso mensagem={estado.mensagem} />;

  const { consultora, avaliacoes } = estado.dados;
  const disponiveis = avaliacoes.filter((v) => v.situacao_credito === "disponivel").length;
  const pendentes = avaliacoes.filter((v) => v.situacao_credito === "pendente_confirmacao").length;
  const emCurso = avaliacoes.filter((v) => ["enviado", "em_andamento"].includes(v.status)).length;
  const concluidas = avaliacoes.filter((v) => v.status === "concluido").length;

  return <div className="min-h-screen bg-[#f8f6ef] text-[#173f3a]">
    <PortalHeader subtitle="Portal da consultora" />
    <main className="mx-auto max-w-6xl px-5 py-9 sm:px-8 sm:py-12">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#173f3a] px-6 py-9 text-white sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-[#d6b66f]/20" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-6 -top-8 h-44 w-44 rounded-full border border-[#d6b66f]/25" aria-hidden="true" />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d6b66f]">Área exclusiva</p>
          <h1 className="mt-3 max-w-3xl font-serif text-3xl leading-tight sm:text-5xl">Bem-vinda ao seu acompanhamento 360º</h1>
          <p className="mt-5 text-lg font-medium text-[#f6f2e6]">{consultora.nome}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/75">
            <span className="inline-flex items-center gap-2"><Building2 className="h-4 w-4 text-[#d6b66f]" />{consultora.razao_social}</span>
            <span className="inline-flex items-center gap-2"><UsersRound className="h-4 w-4 text-[#d6b66f]" />Empresa atendida: {consultora.empresa_cliente}</span>
          </div>
        </div>
      </section>

      <section aria-label="Indicadores" className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric rotulo="Disponíveis" valor={disponiveis} detalhe="Créditos confirmados" />
        <Metric rotulo="A confirmar" valor={pendentes} detalhe="Dependem de validação" />
        <Metric rotulo="Em andamento" valor={emCurso} detalhe="Avaliações abertas" />
        <Metric rotulo="Concluídas" valor={concluidas} detalhe="Relatórios em finalização" />
      </section>

      <section className="mt-10">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#92753d]">Grupo Bemec</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold">Avaliações previstas</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#668077]">Cada avaliação dispõe de um link de formulário e de uma página gerencial de status. O painel não mostra respostas individuais.</p>
          </div>
          <span className="inline-flex items-center gap-2 text-xs text-[#668077]"><RefreshCw className="h-4 w-4" /> Atualizado ao abrir a página</span>
        </div>
        <div className="grid gap-4">{avaliacoes.map((item) => <Item key={item.codigo} item={item} token={token} />)}</div>
      </section>

      <aside className="mt-8 flex gap-4 rounded-2xl border border-[#dac99c]/60 bg-[#f4eddb] p-5 text-sm leading-relaxed text-[#65562f]">
        <Coins className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div><strong>Conferência de créditos:</strong> os códigos 023 e 024 constam como disponíveis na planilha de controle. O código 025 será liberado após confirmação do terceiro crédito. Os indicadores refletem o registro operacional provisório, não uma sincronização automática com a planilha.</div>
      </aside>
      <p className="mt-5 flex items-center gap-2 text-xs text-[#668077]"><LockKeyhole className="h-4 w-4" /> Não encaminhe o link deste painel aos participantes da pesquisa.</p>
    </main>
    <PortalFooter />
  </div>;
}
