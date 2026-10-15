import type { Config } from "@netlify/functions";
import { generateToken, hashToken } from "../../src/lib/tokens.js";
import { getSupabaseAdmin, requireAdmin } from "./_supabase.js";

export default async (req: Request) => {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const supabase = getSupabaseAdmin();
  const url = new URL(req.url);

  if (req.method === "POST") {
    const { questionario_id, avaliador_nome, avaliador_email, descricao, expires_at } = await req.json();

    if (!questionario_id || !avaliador_nome) {
      return Response.json(
        { error: "questionario_id e avaliador_nome obrigatórios" },
        { status: 400 },
      );
    }

    const token = generateToken();
    const tokenHashed = hashToken(token);

    const { data: created, error } = await supabase
      .from("questionario_tokens")
      .insert({
        questionario_id,
        avaliador_nome,
        avaliador_email: avaliador_email || null,
        token_hash: tokenHashed,
        descricao: descricao || null,
        expires_at: expires_at || null,
      })
      .select("id, questionario_id, avaliador_nome, avaliador_email, descricao, respondido, expires_at, ativo, created_at")
      .single();

    if (error) {
      return Response.json({ error: "Erro ao criar token" }, { status: 500 });
    }

    return Response.json({
      id: created.id,
      questionario_id: created.questionario_id,
      avaliador_nome: created.avaliador_nome,
      avaliador_email: created.avaliador_email,
      descricao: created.descricao,
      respondido: created.respondido,
      expires_at: created.expires_at,
      ativo: created.ativo,
      created_at: created.created_at,
      token,
    }, { status: 201 });
  }

  if (req.method === "GET") {
    const questionarioId = url.searchParams.get("questionario_id");

    if (!questionarioId) {
      return Response.json({ error: "questionario_id obrigatório" }, { status: 400 });
    }

    const { data: tokens, error } = await supabase
      .from("questionario_tokens")
      .select("id, questionario_id, avaliador_nome, avaliador_email, descricao, respondido, respondido_at, expires_at, ativo, created_at")
      .eq("questionario_id", questionarioId)
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json({ error: "Erro ao listar tokens" }, { status: 500 });
    }

    return Response.json(tokens);
  }

  if (req.method === "DELETE") {
    const id = url.searchParams.get("id");

    if (!id) {
      return Response.json({ error: "id obrigatório" }, { status: 400 });
    }

    const { error } = await supabase
      .from("questionario_tokens")
      .update({ ativo: false })
      .eq("id", Number(id));

    if (error) {
      return Response.json({ error: "Erro ao revogar token" }, { status: 500 });
    }

    return Response.json({ success: true });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/questionario-tokens",
};
