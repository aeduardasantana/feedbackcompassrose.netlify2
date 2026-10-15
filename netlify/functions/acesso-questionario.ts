import type { Config } from "@netlify/functions";
import { getSupabaseAdmin } from "./_supabase.js";

const TOKEN_PATH_PATTERN = /^\/api\/acesso\/questionario\/([A-Za-z0-9_-]{16,256})\/?$/;
const PUBLIC_RESPONSE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};
const INVALID_LINK_MESSAGE = "Este link de avaliação é inválido ou não está mais disponível.";
const QUESTIONNAIRE_CODE = "FCR360-LIDERANCA";
const QUESTIONNAIRE_VERSION = 1;

type DatabaseRow = Record<string, unknown>;

function publicJson(body: unknown, status = 200) {
  return Response.json(body, { status, headers: PUBLIC_RESPONSE_HEADERS });
}

function invalidLinkResponse() {
  return publicJson({ valid: false, error: INVALID_LINK_MESSAGE }, 404);
}

function stringValue(row: DatabaseRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function numberValue(row: DatabaseRow, keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = Number(row[key]);
    if (Number.isFinite(value)) return value;
  }
  return fallback;
}

function relationLabel(relation: string) {
  const labels: Record<string, string> = {
    autoavaliacao: "Autoavaliação",
    superior: "Superior",
    liderado: "Liderado",
    par: "Par",
    outro: "Outro",
  };

  return labels[relation] ?? "Outro";
}

function belongsTo(row: DatabaseRow, possibleKeys: string[], ids: Set<string>) {
  return possibleKeys.some((key) => {
    const value = row[key];
    return typeof value === "string" && ids.has(value);
  });
}

export default async (req: Request) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { ...PUBLIC_RESPONSE_HEADERS, Allow: "GET" },
    });
  }

  const tokenMatch = new URL(req.url).pathname.match(TOKEN_PATH_PATTERN);
  if (!tokenMatch) return invalidLinkResponse();

  try {
    const supabase = getSupabaseAdmin();
    const { data: evaluation, error: evaluationError } = await supabase
      .from("avaliacoes")
      .select("id, processo_id, participante_avaliado_id, participante_avaliador_id, relacao, status, respondido_em")
      .eq("token", tokenMatch[1])
      .maybeSingle();

    if (evaluationError || !evaluation) return invalidLinkResponse();
    if (["expirada", "cancelada"].includes(evaluation.status)) return invalidLinkResponse();

    const [evaluatedParticipantResult, evaluatorParticipantResult, processResult] = await Promise.all([
      supabase
        .from("participantes")
        .select("nome")
        .eq("id", evaluation.participante_avaliado_id)
        .maybeSingle(),
      supabase
        .from("participantes")
        .select("nome")
        .eq("id", evaluation.participante_avaliador_id)
        .maybeSingle(),
      supabase
        .from("processos")
        .select("consultora_id, consultor_responsavel")
        .eq("id", evaluation.processo_id)
        .maybeSingle(),
    ]);

    if (
      evaluatedParticipantResult.error ||
      evaluatorParticipantResult.error ||
      processResult.error ||
      !evaluatedParticipantResult.data?.nome ||
      !evaluatorParticipantResult.data?.nome ||
      !processResult.data
    ) {
      return invalidLinkResponse();
    }

    let consultantName = processResult.data.consultor_responsavel?.trim() || "";
    if (processResult.data.consultora_id) {
      const { data: consultant, error: consultantError } = await supabase
        .from("consultoras")
        .select("nome")
        .eq("id", processResult.data.consultora_id)
        .maybeSingle();

      if (consultantError) return invalidLinkResponse();
      if (consultant?.nome) consultantName = consultant.nome;
    }

    if (!consultantName) return invalidLinkResponse();

    const completed = evaluation.status === "respondida" || Boolean(evaluation.respondido_em);
    const identification = {
      avaliado: evaluatedParticipantResult.data.nome,
      avaliador: evaluatorParticipantResult.data.nome,
      relacao: relationLabel(evaluation.relacao),
    };
    const license = { consultor: consultantName };

    if (completed) {
      return publicJson({ valid: true, completed: true, identification, license });
    }

    const { data: questionnaire, error: questionnaireError } = await supabase
      .from("questionarios")
      .select("*")
      .eq("codigo", QUESTIONNAIRE_CODE)
      .eq("versao", QUESTIONNAIRE_VERSION)
      .eq("ativo", true)
      .maybeSingle();

    const questionnaireRow = questionnaire as DatabaseRow | null;
    const questionnaireId = questionnaireRow ? stringValue(questionnaireRow, ["id"]) : "";
    if (questionnaireError || !questionnaireRow || !questionnaireId) {
      return publicJson({ valid: false, error: INVALID_LINK_MESSAGE }, 503);
    }

    const [pillarsResult, competenciesResult, questionsResult] = await Promise.all([
      supabase.from("questionario_pilares").select("*").eq("questionario_id", questionnaireId),
      supabase.from("questionario_competencias").select("*"),
      supabase.from("questionario_perguntas").select("*"),
    ]);

    if (pillarsResult.error || competenciesResult.error || questionsResult.error) {
      return publicJson({ valid: false, error: INVALID_LINK_MESSAGE }, 503);
    }

    const pillarRows = (pillarsResult.data ?? []) as DatabaseRow[];
    const pillarIds = new Set(pillarRows.map((row) => stringValue(row, ["id"])).filter(Boolean));
    const competencyRows = ((competenciesResult.data ?? []) as DatabaseRow[]).filter(
      (row) =>
        stringValue(row, ["questionario_id"]) === questionnaireId ||
        belongsTo(row, ["pilar_id", "questionario_pilar_id"], pillarIds),
    );
    const competencyIds = new Set(
      competencyRows.map((row) => stringValue(row, ["id"])).filter(Boolean),
    );
    const questionRows = ((questionsResult.data ?? []) as DatabaseRow[]).filter(
      (row) =>
        stringValue(row, ["questionario_id"]) === questionnaireId ||
        belongsTo(
          row,
          ["competencia_id", "questionario_competencia_id"],
          competencyIds,
        ),
    );
    let nextQuestionNumber = 1;
    const normalizeQuestion = (row: DatabaseRow) => {
      const explicitNumber = numberValue(row, ["numero"], 0);
      const numero = explicitNumber > 0 ? explicitNumber : nextQuestionNumber;
      nextQuestionNumber = Math.max(nextQuestionNumber + 1, numero + 1);
      return {
        id: stringValue(row, ["id"]),
        numero,
        texto: stringValue(row, ["texto", "enunciado", "pergunta"]),
        tipo: stringValue(row, ["tipo"]).toLowerCase(),
      };
    };

    const pillars = pillarRows
      .sort((left, right) => numberValue(left, ["ordem"]) - numberValue(right, ["ordem"]))
      .map((pillarRow) => {
        const pillarId = stringValue(pillarRow, ["id"]);
        const currentPillarIds = new Set([pillarId]);
        const competencies = competencyRows
          .filter((row) =>
            belongsTo(row, ["pilar_id", "questionario_pilar_id"], currentPillarIds),
          )
          .sort((left, right) => numberValue(left, ["ordem"]) - numberValue(right, ["ordem"]))
          .map((competencyRow) => {
            const competencyId = stringValue(competencyRow, ["id"]);
            const currentCompetencyIds = new Set([competencyId]);
            return {
              nome: stringValue(competencyRow, ["nome", "titulo"]),
              ordem: numberValue(competencyRow, ["ordem"]),
              perguntas: questionRows
                .filter(
                  (questionRow) =>
                    stringValue(questionRow, ["tipo"]).toLowerCase() === "quantitativa" &&
                    belongsTo(
                      questionRow,
                      ["competencia_id", "questionario_competencia_id"],
                      currentCompetencyIds,
                    ),
                )
                .sort(
                  (left, right) =>
                    numberValue(left, ["ordem", "numero"]) -
                    numberValue(right, ["ordem", "numero"]),
                )
                .map(normalizeQuestion),
            };
          })
          .filter((competency) => competency.perguntas.length > 0);

        return {
          nome: stringValue(pillarRow, ["nome", "titulo"]),
          ordem: numberValue(pillarRow, ["ordem"]),
          competencias: competencies,
        };
      })
      .filter((pillar) => pillar.competencias.length > 0);

    const perceptions = questionRows
      .filter((questionRow) => stringValue(questionRow, ["tipo"]).toLowerCase() === "qualitativa")
      .sort(
        (left, right) =>
          numberValue(left, ["ordem", "numero"]) - numberValue(right, ["ordem", "numero"]),
      )
      .map(normalizeQuestion);
    const quantitativeCount = pillars.reduce(
      (total, pillar) =>
        total + pillar.competencias.reduce((subtotal, competency) => subtotal + competency.perguntas.length, 0),
      0,
    );
    const competencyCount = pillars.reduce(
      (total, pillar) => total + pillar.competencias.length,
      0,
    );

    if (
      pillars.length !== 4 ||
      competencyCount !== 16 ||
      quantitativeCount !== 32 ||
      perceptions.length !== 2 ||
      pillars.some((pillar) =>
        pillar.competencias.some((competency) =>
          competency.perguntas.some((question) => !question.id || !question.texto),
        ),
      ) ||
      perceptions.some((question) => !question.id || !question.texto)
    ) {
      return publicJson({ valid: false, error: INVALID_LINK_MESSAGE }, 503);
    }

    const accessedAt = new Date().toISOString();
    const { error: applicationInsertError } = await supabase
      .from("questionario_aplicacoes")
      .upsert(
        {
          avaliacao_id: evaluation.id,
          questionario_id: questionnaireId,
          relacao_snapshot: evaluation.relacao,
          status: "em_andamento",
          iniciado_em: accessedAt,
          ultimo_acesso_em: accessedAt,
        },
        { onConflict: "avaliacao_id", ignoreDuplicates: true },
      );

    if (applicationInsertError) {
      return publicJson({ valid: false, error: INVALID_LINK_MESSAGE }, 503);
    }

    const { data: application, error: applicationError } = await supabase
      .from("questionario_aplicacoes")
      .update({ ultimo_acesso_em: accessedAt })
      .eq("avaliacao_id", evaluation.id)
      .select("id, questionario_id")
      .single();

    if (applicationError || !application || application.questionario_id !== questionnaireId) {
      return publicJson({ valid: false, error: INVALID_LINK_MESSAGE }, 503);
    }

    const { error: accessedStatusError } = await supabase
      .from("avaliacoes")
      .update({ status: "acessada" })
      .eq("id", evaluation.id)
      .in("status", ["criada", "enviada"]);

    if (accessedStatusError) {
      return publicJson({ valid: false, error: INVALID_LINK_MESSAGE }, 503);
    }

    const questionIds = new Set([
      ...pillars.flatMap((pillar) =>
        pillar.competencias.flatMap((competency) =>
          competency.perguntas.map((question) => question.id),
        ),
      ),
      ...perceptions.map((question) => question.id),
    ]);
    const { data: savedAnswers, error: savedAnswersError } = await supabase
      .from("questionario_respostas")
      .select("pergunta_id, valor_numerico, valor_texto")
      .eq("aplicacao_id", application.id)
      .in("pergunta_id", [...questionIds]);

    if (savedAnswersError) {
      return publicJson({ valid: false, error: INVALID_LINK_MESSAGE }, 503);
    }

    return publicJson({
      valid: true,
      completed: false,
      identification,
      license,
      questionnaire: {
        codigo: QUESTIONNAIRE_CODE,
        versao: QUESTIONNAIRE_VERSION,
        pilares: pillars,
        percepcoes: perceptions,
      },
      respostas: (savedAnswers ?? []).map((answer) => ({
        perguntaId: answer.pergunta_id,
        valorNumerico: answer.valor_numerico,
        valorTexto: answer.valor_texto,
      })),
    });
  } catch {
    return publicJson({ valid: false, error: INVALID_LINK_MESSAGE }, 500);
  }
};

export const config: Config = {
  path: "/api/acesso/questionario/*",
};
