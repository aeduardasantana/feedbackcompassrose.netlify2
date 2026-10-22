import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, BarChart3, CheckCircle2, Clock3, FileText, ShieldCheck } from "lucide-react";
import {
  CreditChip, PortalAviso, PortalFooter, PortalHeader, StatusChip, usePortal,
  etapaNome,
} from "@/lib/portal-provisorio";

export const Route = createFileRoute("/cliente/$token/status/$codigo")({
  head: () => ({
    meta: [
      { title: "Relatório de status — Feedback Compass Rose" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: RelatorioStatus,
});

function RelatorioStatus() {
  const { token, codigo } = Route.useParams();
  const estado = usePortal(token);
  if (estado.tipo === "carregando") return <PortalAviso carregando mensagem="Consultando o relatório operacional..." />;
  if (estado.tipo === "erro") return <PortalAviso mensagem={estado.mensagem} />;
  const item = estado.dados.avaliacoes.find((v) => v.codigo === codigo);
  if (!item) return <PortalAviso mensagem="A avaliação solicitada não consta neste acesso." />;

  const portalUrl = "/cliente/" + encodeURIComponent(token);
  const realizadas = item.respostas_recebidas;
  const previstas = item.respostas_previstas;
  const percentual = realizadas !== null && previstas !== null && previstas > 0
    ? Math.min(100, Math.round((realizadas / previstas) * 100)) : null;
  const atualizado = new Date(item.atualizado_em).toLocaleDateString("pt-BR");

  return <div className="min-h-screen bg-[#f8f6ef] text-[#173f3a]">
    <PortalHeader subtitle="Relatório de status · Acesso da consultora" />
    <main className="mx-auto max-w-5xl px-5 py-9 sm:px-8 sm:py-12">
      <a href={portalUrl} className="inline-flex items-center gap-2 text-sm font-semibold text-[#416d62] hover:underline">
        <ArrowLeft className="h-4 w-4" /> Voltar ao portal
      </a>

      <div className="mt-6 rounded-[2rem] bg-[#173f3a] p-7 text-white sm:p-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[#e3c780]/40 px-3 py-1 text-xs font-bold tracking-[0.14em] text-[#e3c780]">AVALIAÇÃO {item.codigo}</span>
          <span className="text-xs text-white/65">Grupo Bemec</span>
        </div>
        <h1 className="mt-5 font-serif text-3xl font-semibold sm:text-5xl">Relatório de acompanhamento</h1>
        <p className="mt-3 text-sm text-white/75">{item.avaliado || "Participante avaliado ainda não identificado"}</p>
        <p className="mt-5 text-xs text-white/50">Última atualização registrada: {atualizado}</p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#173f3a]/10 bg-white p-5">
          <Clock3 className="h-5 w-5 text-[#917540]" />
          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[#6f857d]">Etapa</p>
          <p className="mt-2 font-semibold">{etapaNome[item.status]}</p>
        </div>
        <div className="rounded-2xl border border-[#173f3a]/10 bg-white p-5">
          <CheckCircle2 className="h-5 w-5 text-[#917540]" />
          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[#6f857d]">Respondidas</p>
          <p className="mt-2 font-semibold">{realizadas === null ? "Aguardando apuração" : realizadas}</p>
        </div>
        <div className="rounded-2xl border border-[#173f3a]/10 bg-white p-5">
          <BarChart3 className="h-5 w-5 text-[#917540]" />
          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[#6f857d]">Progresso</p>
          <p className="mt-2 font-semibold">{percentual === null ? "Não apurado" : String(percentual) + "%"}</p>
        </div>
      </div>

      <section className="mt-8 rounded-[1.5rem] border border-[#173f3a]/10 bg-white p-6 sm:p-8">
        <h2 className="font-serif text-2xl font-semibold">Situação da avaliação</h2>
        <div className="mt-5 flex flex-wrap gap-2"><CreditChip estado={item.situacao_credito} /><StatusChip status={item.status} /></div>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#627d73]">
          {item.status === "aguardando_configuracao"
            ? "O processo ainda aguarda a definição do avaliado e a disponibilização do formulário. Nenhum envio ou resposta foi confirmado."
            : "Este painel apresenta informações operacionais de acompanhamento, sem expor notas, comentários ou a identidade dos respondentes."}
        </p>
        {percentual !== null && <div className="mt-6">
          <div className="h-3 overflow-hidden rounded-full bg-[#e9eee8]">
            <div className="h-full rounded-full bg-[#c5a365]" style={{ width: String(percentual) + "%" }} />
          </div>
          <p className="mt-2 text-xs text-[#627d73]">{realizadas} de {previstas} respostas previstas.</p>
        </div>}
      </section>

      <section className="mt-5 rounded-[1.5rem] border border-[#173f3a]/10 bg-white p-6 sm:p-8">
        <h2 className="font-serif text-2xl font-semibold">Documentos disponíveis</h2>
        {item.link_status_externo ? <div className="mt-5">
          <a href={item.link_status_externo} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="inline-flex items-center gap-2 rounded-full bg-[#173f3a] px-5 py-3 text-sm font-semibold text-white">
            Abrir relatório operacional <ArrowUpRight className="h-4 w-4" />
          </a>
          <p className="mt-3 text-xs text-[#668077]">O relatório publicado pode ser consultado sem acesso às respostas individuais.</p>
        </div> : <div className="mt-5 flex items-start gap-3 rounded-xl bg-[#f5f4ef] p-4 text-sm text-[#668077]">
          <FileText className="h-5 w-5 shrink-0" /> O relatório externo de status ainda não foi vinculado.
        </div>}
        {item.link_relatorio_final && <a href={item.link_relatorio_final} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#173f3a] underline">
          Relatório final disponibilizado <ArrowUpRight className="h-4 w-4" />
        </a>}
      </section>
      <p className="mt-7 flex items-center gap-2 text-xs text-[#668077]"><ShieldCheck className="h-4 w-4" /> Visualização restrita ao link privado da consultora.</p>
    </main>
    <PortalFooter />
  </div>;
}
