import { createClient } from "npm:@supabase/supabase-js@2";

type PairRow = {
  id: string;
  user_a_id: string;
  user_b_id: string | null;
};

function buildUnlinkedPairUpdate(pair: PairRow, userId: string) {
  if (pair.user_a_id === userId) {
    if (!pair.user_b_id) {
      return { action: "delete" as const };
    }

    return {
      action: "update" as const,
      values: {
        user_a_id: pair.user_b_id,
        user_b_id: null,
        status: "unlinked" as const,
      },
    };
  }

  return {
    action: "update" as const,
    values: {
      user_a_id: pair.user_a_id,
      user_b_id: null,
      status: "unlinked" as const,
    },
  };
}

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Supabase service credentials are not configured" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const authClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });

  const { data: { user }, error: authErr } = await authClient.auth.getUser();
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const { data: pairData, error: pairErr } = await supabase
    .from("pairs")
    .select("id,user_a_id,user_b_id")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .in("status", ["pending", "active"])
    .maybeSingle();

  if (pairErr) {
    return new Response(JSON.stringify({ error: pairErr.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  if (pairData) {
    const mutation = buildUnlinkedPairUpdate(pairData as PairRow, user.id);
    if (mutation.action === "delete") {
      const { error } = await supabase.from("pairs").delete().eq("id", pairData.id);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "content-type": "application/json" },
        });
      }
    } else {
      const { error } = await supabase.from("pairs").update(mutation.values).eq("id", pairData.id);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "content-type": "application/json" },
        });
      }
    }
  }

  const { error: deleteErr } = await supabase.auth.admin.deleteUser(user.id);
  if (deleteErr) {
    return new Response(JSON.stringify({ error: deleteErr.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "content-type": "application/json" },
  });
});
