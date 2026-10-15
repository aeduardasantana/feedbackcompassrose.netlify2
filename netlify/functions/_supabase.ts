import { createClient } from "@supabase/supabase-js";

function getSupabaseServerCredentials() {
  return {
    url: (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim(),
    key: (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim(),
  };
}

export function getSupabaseAdmin() {
  const { url, key } = getSupabaseServerCredentials();

  if (!url || !key) {
    throw new Error("Supabase server credentials are not configured");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function requireAdmin(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    return Response.json({ error: "Sessão obrigatória" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return Response.json({ error: "Sessão inválida" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("global_admin_profiles")
      .select("id")
      .eq("id", data.user.id)
      .eq("role", "global_admin")
      .maybeSingle();

    if (profileError || !profile) {
      return Response.json({ error: "Acesso administrativo obrigatório" }, { status: 403 });
    }

    return null;
  } catch {
    return Response.json(
      { error: "Supabase não está configurado no servidor" },
      { status: 500 },
    );
  }
}

export async function requireAuthenticatedAdminSession(
  req: Request,
): Promise<Response | null> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    return Response.json({ error: "Sessão obrigatória" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return Response.json({ error: "Sessão inválida" }, { status: 401 });
    }

    return null;
  } catch {
    return Response.json(
      { error: "Supabase não está configurado no servidor" },
      { status: 500 },
    );
  }
}
