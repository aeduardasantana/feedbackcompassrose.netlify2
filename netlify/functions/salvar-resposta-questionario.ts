import type { Config } from "@netlify/functions";
import { getSupabaseAdmin } from "./_supabase.js";

const TOKEN_PATH_PATTERN = /^\/api\/questionario\/resposta\/([A-Za-z0-9_-]{16,256})\/?$/;
const PUBLIC_RESPONSE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};
const SAVE_ERROR_MESSAGE = "Não foi possível salvar esta resposta.";

type DatabaseRow = Record<string, unknown>;
type AnswerPayload = {
  perguntaId?: unknown;
  valorNumerico?: unknown;
  valorTexto?: unknown;
};

function publicJson(body: unknown, status = 200) {
  return Response.json(body, { status, headers: PUBLIC_RESPONSE_HEADERS });
}

function saveError(status = 400) {
  return publicJson({ saved: false, error: SAVE_ERROR_MESSAGE }, status);
}

function stringValue(row: DatabaseRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

async function questionBelongsToQuestionnaire(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  question: DatabaseRow,
  questionnaireId: string,
) {
  if (stringValue(question, ["questionario_id"]) === questionnaireId) return true;

  const competencyId = stringValue(question, ["competencia_id", "questionario_competencia_id"]);
  if (!competencyId) return false;

  const { data: competency, error: competencyError } = await supabase
    .from("questionario_competencias")
    .select("*")
    .eq("id", competencyId)
    .maybeSingle();

  if (competencyError || !competency) return false;
  const competencyRow = competency as DatabaseRow;

  if (stringValue(competencyRow, ["questionario_id"]) === questionnaireId) return true;

  const pillarId = stringValue(competencyRow, ["pilar_id", "questionario_pilar_id"]);
  if (!pillarId) return false;

  const { data: pillar, error: pillarError } = await supabase
    .from("questionario_pilares")
    .select("questionario_id")
    .eq("id", pillarId)
    .maybeSingle();

  return !pillarError && pillar?.questionario_id === questionnaireId;
}

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { ...PUBLIC_RESPONSE_HEADERS, Allow: "POST" },
    });
  }

  const tokenMatch = new URL(req.url).pathname.match(TOKEN_PATH_PATTERN);
  if (!tokenMatch) return saveError(404);

  let payload: AnswerPayload;
  try {
    payload = (await req.json()) as AnswerPayload;
  } catch {
    return saveError();
  }

  const perguntaId = typeof payload.perguntaId === "string" ? payload.perguntaId.trim() : "";
  if (!perguntaId) return saveError();

  try {
    const supabase = getSupabaseAdmin();
    const { data: evaluation, error: evaluationError } = await supabase
      .from("avaliacoes")
      .select("id, status, respondido_em")
      .eq("token", tokenMatch[1])
      .maybeSingle();

    if (
      evaluationError ||
      !evaluation ||
      evaluation.status === "respondida" ||
      evaluation.respondido_em ||
      ["expirada", "cancelada"].includes(evaluation.status)
    ) {
      return saveError(404);
    }

    const { data: application, error: applicationError } = await supabase
      .from("questionario_aplicacoes")
      .select("id, questionario_id")
      .eq("avaliacao_id", evaluation.id)
      .maybeSingle();

    if (applicationError || !application) return saveError(404);

    const { data: question, error: questionError } = await supabase
      .from("questionario_perguntas")
      .select("*")
      .eq("id", perguntaId)
      .maybeSingle();

    if (
      questionError ||
      !question ||
      !(await questionBelongsToQuestionnaire(
        supabase,
        question as DatabaseRow,
        application.questionario_id,
      ))
    ) {
      return saveError(404);
    }

    const questionType = stringValue(question as DatabaseRow, ["tipo"]).toLowerCase();
    let valorNumerico: number | null = null;
    let valorTexto: string | null = null;

    if (questionType === "quantitativa") {
      if (
        typeof payload.valorNumerico !== "number" ||
        !Number.isInteger(payload.valorNumerico) ||
        payload.valorNumerico < 0 ||
        payload.valorNumerico > 10
      ) {
        return saveError();
      }
      valorNumerico = payload.valorNumerico;
    } else if (questionType === "qualitativa") {
      if (typeof payload.valorTexto !== "string") return saveError();
      valorTexto = payload.valorTexto;
    } else {
      return saveError();
    }

    const { error: responseError } = await supabase
      .from("questionario_respostas")
      .upsert(
        {
          aplicacao_id: application.id,
          pergunta_id: perguntaId,
          valor_numerico: valorNumerico,
          valor_texto: valorTexto,
        },
        { onConflict: "aplicacao_id,pergunta_id" },
      );

    if (responseError) return saveError(500);

    const answeredAt = new Date().toISOString();
    const [applicationUpdate, evaluationUpdate] = await Promise.all([
      supabase
        .from("questionario_aplicacoes")
        .update({ status: "em_andamento", ultimo_acesso_em: answeredAt })
        .eq("id", application.id)
        .neq("status", "concluida"),
      supabase
        .from("avaliacoes")
        .update({ status: "em_andamento" })
        .eq("id", evaluation.id)
        .in("status", ["criada", "enviada", "acessada"]),
    ]);

    if (applicationUpdate.error || evaluationUpdate.error) return saveError(500);

    return publicJson({ saved: true });
  } catch {
    return saveError(500);
  }
};

export const config: Config = {
  path: "/api/questionario/resposta/*",
};
