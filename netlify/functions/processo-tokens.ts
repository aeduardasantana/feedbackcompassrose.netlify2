import type { Config } from "@netlify/functions";
import { generateToken } from "../../src/lib/tokens.js";
import { getSupabaseAdmin, requireAuthenticatedAdminSession } from "./_supabase.js";

const publicBaseUrl = "https://feedbackcompassrose.netlify.app";

type ProcessoSnapshot = {
  nome?: string;
  empresa?: string;
  setor?: string;
  consultora_id?: string;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function findSavedProcessoId(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  processoId: string,
  processo?: ProcessoSnapshot,
) {
  if (isUuid(processoId)) {
    const { data: byId, error: byIdError } = await supabase
      .from("processos")
      .select("id")
      .eq("id", processoId)
      .maybeSingle();

    if (byIdError) {
      throw byIdError;
    }

    if (byId?.id) {
      return byId.id;
    }
  }

  if (!processo?.nome || !processo.empresa) {
    return null;
  }

  let query = supabase
    .from("processos")
    .select("id")
    .eq("nome", processo.nome)
    .eq("empresa", processo.empresa)
    .order("created_at", { ascending: false })
    .limit(1);

  if (processo.setor) {
    query = query.eq("setor", processo.setor);
  }

  if (processo.consultora_id) {
    query = query.eq("consultora_id", processo.consultora_id);
  }

  const { data: matches, error } = await query;

  if (error) {
    throw error;
  }

  return matches?.[0]?.id ?? null;
}

export default async (req: Request) => {
  const authError = await requireAuthenticatedAdminSession(req);
  if (authError) return authError;

  const supabase = getSupabaseAdmin();
  const url = new URL(req.url);

  if (req.method === "POST") {
    const { processo_id, processo, descricao, expires_at } = await req.json();

    if (!processo_id) {
      return Response.json({ error: "processo_id obrigatório" }, { status: 400 });
    }

    let savedProcessoId = null;
    try {
      savedProcessoId = await findSavedProcessoId(supabase, processo_id, processo);
    } catch {
      return Response.json({ error: "Erro ao localizar processo salvo" }, { status: 500 });
    }

    if (!savedProcessoId) {
      return Response.json(
        { error: "Processo salvo no Supabase não encontrado" },
        { status: 404 },
      );
    }

    let updatedProcesso = null;
    let updateError = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const token = generateToken();
      const { data, error } = await supabase
        .from("processos")
        .update({ token })
        .eq("id", savedProcessoId)
        .select("id, token, updated_at")
        .single();

      if (!error) {
        updatedProcesso = data;
        updateError = null;
        break;
      }

      updateError = error;
      if (error.code !== "23505") break;
    }

    if (updateError || !updatedProcesso?.token) {
      return Response.json({ error: "Erro ao criar token" }, { status: 500 });
    }

    return Response.json({
      id: updatedProcesso.id,
      processo_id: updatedProcesso.id,
      descricao: descricao || null,
      expires_at: expires_at || null,
      ativo: true,
      created_at: updatedProcesso.updated_at,
      token: updatedProcesso.token,
      link: `${publicBaseUrl}/processo/${updatedProcesso.token}`,
    }, { status: 201 });
  }

  if (req.method === "GET") {
    const processoId = url.searchParams.get("processo_id");

    if (!processoId) {
      return Response.json({ error: "processo_id obrigatório" }, { status: 400 });
    }

    const { data: processo, error } = await supabase
      .from("processos")
      .select("id, token, updated_at")
      .eq("id", processoId)
      .single();

    if (error) {
      return Response.json({ error: "Erro ao listar tokens" }, { status: 500 });
    }

    if (!processo.token) {
      return Response.json([]);
    }

    return Response.json([
      {
        id: processo.id,
        processo_id: processo.id,
        descricao: "Link de acesso",
        expires_at: null,
        ativo: true,
        created_at: processo.updated_at,
      },
    ]);
  }

  if (req.method === "DELETE") {
    const id = url.searchParams.get("id");

    if (!id) {
      return Response.json({ error: "id obrigatório" }, { status: 400 });
    }

    const { error } = await supabase
      .from("processos")
      .update({ token: null })
      .eq("id", id);

    if (error) {
      return Response.json({ error: "Erro ao revogar token" }, { status: 500 });
    }

    return Response.json({ success: true });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/processo-tokens",
};
