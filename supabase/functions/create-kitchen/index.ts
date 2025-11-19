import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = roles?.some((r) => r.role === "admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { identifier, full_name, unit_id } = await req.json();

    if (!identifier || !full_name || !unit_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify identifier is unique
    const { data: existingKitchen } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("full_name", `KITCHEN-${identifier}`)
      .single();

    if (existingKitchen) {
      return new Response(
        JSON.stringify({ error: "Identificador já existe" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user with generated email
    const email = `kitchen-${identifier}@ponto-de-fuga.internal`;
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: identifier,
      email_confirm: true,
      user_metadata: { full_name: `KITCHEN-${identifier}` },
    });

    if (createError) throw createError;

    // Update profile with unit_id
    await supabaseAdmin
      .from("profiles")
      .update({ unit_id })
      .eq("id", newUser.user.id);

    // Create user role
    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newUser.user.id, role: "kitchen", unit_id });

    return new Response(
      JSON.stringify({ success: true, user_id: newUser.user.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
