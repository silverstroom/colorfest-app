import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action } = await req.json();

    if (action === "setup_admin") {
      // Check if admin already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const adminExists = existingUsers?.users?.find(u => u.email === "salvobilotti@colorfest.it");
      
      let userId: string;
      
      if (adminExists) {
        userId = adminExists.id;
      } else {
        // Create admin user
        const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: "salvobilotti@colorfest.it",
          password: "ColorFest26",
          email_confirm: true,
          user_metadata: { username: "salvobilotti" },
        });
        if (createErr) throw createErr;
        userId = newUser.user.id;
      }

      // Ensure admin role
      const { data: existingRole } = await supabaseAdmin
        .from("user_roles")
        .select("*")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (!existingRole) {
        await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "admin" });
      }

      return new Response(JSON.stringify({ success: true, userId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
