import type { Config } from "@netlify/functions";
import { getSupabaseAdmin } from "./_supabase.js";

const TOKEN_PATH_PATTERN = /^\/api\/acompanhamento\/matriz\/([a-f0-9]{64})\/?$/i;
const PUBLIC_RESPONSE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

function invalidLinkResponse() {
  return Response.json(
    { valid: false, error: "Link de acompanhamento inválido ou indisponível." },
    { status: 404, headers: PUBLIC_RESPONSE_HEADERS },
  );
}

export default async (req: Request) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const tokenMatch = new URL(req.url).pathname.match(TOKEN_PATH_PATTERN);
  if (!tokenMatch) return invalidLinkResponse();

  const token = tokenMatch[1];

  try {
    const supabase = getSupabaseAdmin();
    const { data: matriz, error: matrizError } = await supabase
      .from("matrizes_relacionais")
      .select("id, codigo_operacional, processo_id, avaliado_id")
      .eq("token_acompanhamento", token)
      .maybeSingle();

    if (matrizError || !matriz) return invalidLinkResponse();

    const [processoResult, avaliadoResult, avaliacoesResult] = await Promise.all([
      supabase
        .from("processos")
        .select("nome, empresa, empresa_id, consultora_id, consultor_responsavel")
        .eq("id", matriz.processo_id)
        .maybeSingle(),
      supabase
        .from("participantes")
        .select("nome")
        .eq("id", matriz.avaliado_id)
        .maybeSingle(),
      supabase
        .from("avaliacoes")
        .select("participante_avaliador_id, relacao, status, enviado_em, respondido_em")
        .eq("matriz_relacional_id", matriz.id)
        .order("created_at", { ascending: true }),
    ]);

    if (
      processoResult.error ||
      avaliadoResult.error ||
      avaliacoesResult.error ||
      !processoResult.data ||
      !avaliadoResult.data
    ) {
      return invalidLinkResponse();
    }

    let empresaNome = processoResult.data.empresa || "Não informada";
    if (processoResult.data.empresa_id) {
      const { data: empresa } = await supabase
        .from("empresas")
        .select("nome")
        .eq("id", processoResult.data.empresa_id)
        .maybeSingle();
      if (empresa?.nome) empresaNome = empresa.nome;
    }

    let consultantName = processoResult.data.consultor_responsavel?.trim() || "";
    if (processoResult.data.consultora_id) {
      const { data: consultant, error: consultantError } = await supabase
        .from("consultoras")
        .select("nome")
        .eq("id", processoResult.data.consultora_id)
        .maybeSingle();

      if (consultantError) return invalidLinkResponse();
      if (consultant?.nome) consultantName = consultant.nome;
    }

    if (!consultantName) return invalidLinkResponse();

    const avaliacoes = avaliacoesResult.data ?? [];
    const avaliadorIds = [...new Set(avaliacoes.map((item) => item.participante_avaliador_id))];
    const { data: avaliadores, error: avaliadoresError } = avaliadorIds.length
      ? await supabase.from("participantes").select("id, nome").in("id", avaliadorIds)
      : { data: [], error: null };

    if (avaliadoresError) return invalidLinkResponse();

    const nomesPorId = new Map((avaliadores ?? []).map((item) => [item.id, item.nome]));

    return Response.json(
      {
        valid: true,
        matriz: {
          codigo: matriz.codigo_operacional,
          avaliado: avaliadoResult.data.nome,
          empresa: empresaNome,
          processo: processoResult.data.nome,
        },
        license: {
          consultor: consultantName,
        },
        avaliacoes: avaliacoes.map((avaliacao) => ({
          avaliador: nomesPorId.get(avaliacao.participante_avaliador_id) ?? "Participante indisponível",
          relacao: avaliacao.relacao,
          status: avaliacao.status,
          enviado_em: avaliacao.enviado_em,
          respondido_em: avaliacao.respondido_em,
        })),
      },
      { headers: PUBLIC_RESPONSE_HEADERS },
    );
  } catch {
    return Response.json(
      { valid: false, error: "Não foi possível carregar o acompanhamento." },
      { status: 500, headers: PUBLIC_RESPONSE_HEADERS },
    );
  }
};

export const config: Config = {
  path: "/api/acompanhamento/matriz/*",
};
