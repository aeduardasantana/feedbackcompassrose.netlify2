import { useEffect, useState } from "react";
import { Compass, LoaderCircle, ShieldCheck } from "lucide-react";

export type Credito = "disponivel" | "reservado" | "consumido" | "pendente_confirmacao";
export type Etapa = "aguardando_configuracao" | "preparacao" | "enviado" | "em_andamento" | "concluido";
export type AvaliacaoPortal = {
  codigo: string;
  avaliado: string | null;
  situacao_credito: Credito;
  status: Etapa;
  formulario_token: string;
  link_formulario_externo: string | null;
  link_status_externo: string | null;
  link_relatorio_final: string | null;
  respostas_recebidas: number | null;
  respostas_previstas: number | null;
  atualizado_em: string;
};
export type Portal = {
  valid: true;
  consultora: {
    nome: string;
    razao_social: string;
    empresa_cliente: string;
  };
  avaliacoes: AvaliacaoPortal[];
};
export type EstadoPortal =
  | { tipo: "carregando" }
  | { tipo: "erro"; mensagem: string }
  | { tipo: "pronto"; dados: Portal };

export const creditoNome: Record<Credito, string> = {
  disponivel: "Crédito disponível",
  reservado: "Crédito reservado",
  consumido: "Crédito utilizado",
  pendente_confirmacao: "Crédito a confirmar",
};
export const etapaNome: Record<Etapa, string> = {
  aguardando_configuracao: "Aguardando preparação",
  preparacao: "Em preparação",
  enviado: "Convites enviados",
  em_andamento: "Em andamento",
  concluido: "Concluída",
};

export function usePortal(token: string): EstadoPortal {
  const [estado, setEstado] = useState<EstadoPortal>({ tipo: "carregando" });
  useEffect(() => {
    let ativa = true;
    setEstado({ tipo: "carregando" });
    fetch("/api/portal-provisorio/consultora/" + encodeURIComponent(token), { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(response.status === 404 ? "Acesso não encontrado ou expirado." : "Não foi possível carregar o acompanhamento.");
        return response.json() as Promise<Portal>;
      })
      .then((dados) => {
        if (ativa) setEstado(dados.valid ? { tipo: "pronto", dados } : { tipo: "erro", mensagem: "Acesso não encontrado." });
      })
      .catch((erro) => {
        if (ativa) setEstado({ tipo: "erro", mensagem: erro instanceof Error ? erro.message : "Ocorreu uma falha de conexão." });
      });
    return () => { ativa = false; };
  }, [token]);
  return estado;
}

export function PortalHeader({ subtitle = "Acompanhamento 360º" }: { subtitle?: string }) {
  return (
    <header className="border-b border-[#173f3a]/10 bg-[#f8f6ef]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-[#173f3a] text-[#e4c78a]">
            <Compass className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="font-serif text-lg font-semibold leading-tight text-[#173f3a]">Feedback Compass Rose</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#607c74]">{subtitle}</p>
          </div>
        </div>
        <span className="hidden items-center gap-2 rounded-full border border-[#173f3a]/15 px-3 py-2 text-xs font-semibold text-[#477168] sm:inline-flex">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Acesso reservado
        </span>
      </div>
    </header>
  );
}

export function PortalFooter() {
  return (
    <footer className="border-t border-[#173f3a]/10 px-5 py-7 text-center text-xs leading-relaxed text-[#688078]">
      Feedback Compass Rose · Compass Rose Systems · Acompanhamento operacional
      <p className="mt-1">Os resultados individuais e as respostas confidenciais não são exibidos neste portal.</p>
    </footer>
  );
}

export function PortalAviso({ mensagem, carregando = false }: { mensagem: string; carregando?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f8f6ef]">
      <PortalHeader />
      <main className="mx-auto grid w-full max-w-xl flex-1 place-items-center px-5 py-16 text-[#173f3a]">
        <div className="w-full rounded-[1.75rem] border border-[#173f3a]/10 bg-white p-9 text-center shadow-sm">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#eaf0eb]">
            {carregando ? <LoaderCircle className="h-6 w-6 animate-spin" /> : <Compass className="h-6 w-6" />}
          </div>
          <h1 className="mt-6 font-serif text-2xl font-semibold">{carregando ? "Carregando informações" : "Acompanhamento indisponível"}</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#637c74]">{mensagem}</p>
        </div>
      </main>
      <PortalFooter />
    </div>
  );
}

export function StatusChip({ status }: { status: Etapa }) {
  const done = status === "concluido";
  const active = status === "em_andamento" || status === "enviado";
  return <span className={"inline-flex rounded-full px-3 py-1.5 text-xs font-semibold " + (done ? "bg-emerald-50 text-emerald-800" : active ? "bg-sky-50 text-sky-800" : "bg-[#f1e9d7] text-[#78612d]")}>{etapaNome[status]}</span>;
}

export function CreditChip({ estado }: { estado: Credito }) {
  return <span className={"inline-flex rounded-full px-3 py-1.5 text-xs font-semibold " + (estado === "pendente_confirmacao" ? "bg-amber-50 text-amber-800" : "bg-[#e5eee9] text-[#28584f]")}>{creditoNome[estado]}</span>;
}
