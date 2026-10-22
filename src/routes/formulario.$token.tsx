import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowUpRight, ClipboardList, LoaderCircle, ShieldCheck } from "lucide-react";
import { PortalFooter, PortalHeader } from "@/lib/portal-provisorio";

export const Route = createFileRoute("/formulario/$token")({
  head: () => ({
    meta: [
      { title: "Formulário de avaliação — Feedback Compass Rose" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: FormularioUnico,
});

type FormData = {
  valid: boolean;
  codigo: string;
  avaliado: string | null;
  empresa: string;
  consultora: string;
  situacao_credito: string;
  status: string;
  formulario: string | null;
};
type State = { type: "loading" } | { type: "error" } | { type: "ready"; data: FormData };

function FormularioUnico() {
  const { token } = Route.useParams();
  const [state, setState] = useState<State>({ type: "loading" });

  useEffect(() => {
    let active = true;
    setState({ type: "loading" });
    fetch("/api/portal-provisorio/formulario/" + encodeURIComponent(token), { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Formulário indisponível");
        return response.json() as Promise<FormData>;
      })
      .then((data) => {
        if (active) setState(data.valid ? { type: "ready", data } : { type: "error" });
      })
      .catch(() => { if (active) setState({ type: "error" }); });
    return () => { active = false; };
  }, [token]);

  const data = state.type === "ready" ? state.data : null;
  const liberado = Boolean(data?.formulario) && data?.situacao_credito !== "pendente_confirmacao";
  const url = liberado && data?.formulario ? data.formulario : null;
  // Google Forms publicados em URL completa podem ser incorporados. Links curtos
  // permanecem disponíveis pelo botão oficial, sem iframe redirecionado.
  const incorporavel = url !== null && /^https:\/\/docs\.google\.com\/forms\//i.test(url) && /\/viewform/i.test(url);
  const embed = incorporavel && url ? url + (url.includes("?") ? "&" : "?") + "embedded=true" : null;

  return <div className="min-h-screen bg-[#f8f6ef] text-[#173f3a]">
    <PortalHeader subtitle="Formulário de avaliação" />
    <main className="mx-auto max-w-5xl px-5 py-9 sm:px-8 sm:py-12">
      <div className="rounded-[2rem] bg-[#173f3a] p-7 text-white sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d8bd7d]">Avaliação 360º</p>
        <h1 className="mt-3 font-serif text-3xl font-semibold sm:text-5xl">Sua participação faz a diferença</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75">Este espaço é destinado exclusivamente ao preenchimento do formulário. Nenhum dado de acompanhamento gerencial ou saldo de créditos é disponibilizado aqui.</p>
        {data && <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/85">
          <span>Avaliação {data.codigo}</span><span>{data.empresa}</span>
        </div>}
      </div>

      <section className="mt-5 rounded-[1.75rem] border border-[#173f3a]/10 bg-white p-6 shadow-sm sm:p-8">
        {state.type === "loading" ? <div className="flex flex-col items-center gap-3 py-20 text-[#60776f]">
          <LoaderCircle className="h-8 w-8 animate-spin" />
          <p className="text-sm">Verificando o acesso ao formulário...</p>
        </div> : state.type === "error" ? <div className="py-16 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-[#a68c56]" />
          <h2 className="mt-4 font-serif text-2xl font-semibold">Acesso não disponível</h2>
          <p className="mt-3 text-sm text-[#637c74]">Verifique o link fornecido pela consultora.</p>
        </div> : !url ? <div className="py-16 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-[#a68c56]" />
          <h2 className="mt-4 font-serif text-2xl font-semibold">Formulário em preparação</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#637c74]">A avaliação {data?.codigo} ainda não foi liberada para respostas. Solicite à consultora a confirmação do início da coleta.</p>
        </div> : <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#a18445]">Formulário oficial</p>
              <h2 className="mt-1 font-serif text-2xl font-semibold">Preencha sua avaliação</h2>
            </div>
            <a href={url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#173f3a] px-5 py-3 text-sm font-semibold text-white hover:bg-[#24594e]">
              Abrir formulário <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
          {embed ? <iframe title={"Formulário de avaliação " + data?.codigo} src={embed} loading="lazy" referrerPolicy="no-referrer" className="mt-6 h-[950px] w-full rounded-xl border border-[#173f3a]/10" /> : <p className="mt-6 rounded-xl bg-[#f6f4ed] p-5 text-sm leading-relaxed text-[#637c74]">Para responder, selecione <strong>Abrir formulário</strong>. O questionário será exibido em uma nova guia.</p>}
        </>}
      </section>
      <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-[#668077]"><ShieldCheck className="h-4 w-4 shrink-0" /> A participação deve seguir as orientações de confidencialidade da avaliação. Este link não concede acesso a relatórios de terceiros.</p>
    </main>
    <PortalFooter />
  </div>;
}
