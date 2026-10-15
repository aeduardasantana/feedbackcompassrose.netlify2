import type { Config } from "@netlify/functions";
import { getSupabaseAdmin } from "./_supabase.js";

const TOKEN_PATH_PATTERN = /^\/api\/questionario\/finalizar\/([A-Za-z0-9_-]{16,256})\/?$/;
const PUBLIC_RESPONSE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};
function publicJson(body: unknown, status = 200) {
  return Response.json(body, { status, headers: PUBLIC_RESPONSE_HEADERS });
}

function completionError(status = 400) {
  return publicJson(
    { completed: false, error: "Não foi possível finalizar a avaliação." },
    status,
  );
}

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { ...PUBLIC_RESPONSE_HEADERS, Allow: "POST" },
    });
  }

  const tokenMatch = new URL(req.url).pathname.match(TOKEN_PATH_PATTERN);
  if (!tokenMatch) return completionError(404);

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
      ["expirada", "cancelada"].includes(evaluation.status)
    ) {
      return completionError(404);
    }

    const { data: application, error: applicationError } = await supabase
      .from("questionario_aplicacoes")
      .select("id, questionario_id, status, concluido_em")
      .eq("avaliacao_id", evaluation.id)
      .maybeSingle();

    if (applicationError || !application) return completionError(404);

    const completedAt =
      application.concluido_em || evaluation.respondido_em || new Date().toISOString();
    const [applicationUpdate, evaluationUpdate] = await Promise.all([
      supabase
        .from("questionario_aplicacoes")
        .update({ status: "concluida", concluido_em: completedAt })
        .eq("id", application.id)
        .in("status", ["em_andamento", "concluida"])
        .select("id")
        .maybeSingle(),
      supabase
        .from("avaliacoes")
        .update({ status: "respondida", respondido_em: completedAt })
        .eq("id", evaluation.id)
        .in("status", ["criada", "enviada", "acessada", "em_andamento", "respondida"])
        .select("id")
        .maybeSingle(),
    ]);

    if (
      applicationUpdate.error ||
      evaluationUpdate.error ||
      !applicationUpdate.data ||
      !evaluationUpdate.data
    ) {
      return completionError(500);
    }

    return publicJson({ completed: true });
  } catch {
    return completionError(500);
  }
};

export const config: Config = {
  path: "/api/questionario/finalizar/*",
};
