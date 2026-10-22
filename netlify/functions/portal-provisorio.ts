import type { Config } from "@netlify/functions";
import { createHash } from "node:crypto";
import { getSupabaseAdmin } from "./_supabase.js";

const HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};
const TOKEN = /^[a-f0-9]{64}$/i;
const digest = (token: string) => createHash("sha256").update(token.toLowerCase()).digest("hex");
const invalid = () => Response.json({ valid: false, error: "Acesso inválido ou indisponível." }, { status: 404, headers: HEADERS });

export default async function handler(request: Request) {
  if (request.method !== "GET") {
    return Response.json({ error: "Método não permitido." }, { status: 405, headers: HEADERS });
  }

  const pathname = new URL(request.url).pathname;
  const consultant = pathname.match(/^\/api\/portal-provisorio\/consultora\/([^/]+)\/?$/);
  const form = pathname.match(/^\/api\/portal-provisorio\/formulario\/([^/]+)\/?$/);
  const token = consultant?.[1] ?? form?.[1];
  if (!token || !TOKEN.test(token)) return invalid();

  try {
    const db = getSupabaseAdmin();

    if (consultant) {
      const { data: owner, error } = await db
        .from("portal_consultoras_provisorio")
        .select("id,nome,razao_social,empresa_cliente,ativo")
        .eq("token_sha256", digest(token))
        .eq("ativo", true)
        .maybeSingle();
      if (error || !owner) return invalid();

      const { data: evaluations, error: listError } = await db
        .from("portal_avaliacoes_provisorio")
        .select("codigo,avaliado,situacao_credito,status,formulario_token,link_formulario_externo,link_status_externo,link_relatorio_final,respostas_recebidas,respostas_previstas,atualizado_em")
        .eq("consultora_id", owner.id)
        .order("codigo", { ascending: true });
      if (listError) throw listError;

      return Response.json({
        valid: true,
        consultora: {
          nome: owner.nome,
          razao_social: owner.razao_social,
          empresa_cliente: owner.empresa_cliente,
        },
        avaliacoes: evaluations ?? [],
      }, { headers: HEADERS });
    }

    const { data: evaluation, error } = await db
      .from("portal_avaliacoes_provisorio")
      .select("consultora_id,codigo,avaliado,situacao_credito,status,link_formulario_externo")
      .eq("formulario_token_sha256", digest(token))
      .maybeSingle();
    if (error || !evaluation) return invalid();

    const { data: owner, error: ownerError } = await db
      .from("portal_consultoras_provisorio")
      .select("nome,razao_social,empresa_cliente")
      .eq("id", evaluation.consultora_id)
      .eq("ativo", true)
      .maybeSingle();
    if (ownerError || !owner) return invalid();

    return Response.json({
      valid: true,
      codigo: evaluation.codigo,
      avaliado: evaluation.avaliado,
      empresa: owner.empresa_cliente,
      consultora: owner.nome,
      situacao_credito: evaluation.situacao_credito,
      status: evaluation.status,
      formulario: evaluation.link_formulario_externo,
    }, { headers: HEADERS });
  } catch {
    return Response.json(
      { valid: false, error: "Não foi possível carregar os dados no momento." },
      { status: 503, headers: HEADERS },
    );
  }
}

export const config: Config = {
  path: "/api/portal-provisorio/*",
};