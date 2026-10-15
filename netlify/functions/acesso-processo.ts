import type { Config } from "@netlify/functions";
import { getSupabaseAdmin } from "./_supabase.js";

export default async (req: Request) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const token = url.pathname.split("/").pop();

  if (!token) {
    return Response.json({ error: "Token obrigatório" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: found, error } = await supabase
    .from("processos")
    .select("id, nome, token")
    .eq("token", token)
    .maybeSingle();

  if (error || !found) {
    return Response.json(
      { valid: false, error: "Token inválido ou revogado" },
      { status: 404 },
    );
  }

  return Response.json({
    valid: true,
    processo_id: found.id,
    descricao: found.nome,
  });
};

export const config: Config = {
  path: "/api/acesso/processo/*",
};
