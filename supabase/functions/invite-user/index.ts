import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Create regular client to verify the requesting user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: authHeader } },
      }
    );

    // Get the requesting user
    const { data: { user: requestingUser }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if requesting user has users.manage permission
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .single();

    // Check permission based on role_permissions table
    const { data: permData } = await supabaseAdmin
      .from("role_permissions")
      .select("permission")
      .eq("role", roleData?.role || "viewer")
      .eq("permission", "users.manage")
      .maybeSingle();

    if (roleError || !permData) {
      return new Response(
        JSON.stringify({ error: "Only users with manage permission can invite users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get invitation data from request body
    const { email, password, full_name, role } = await req.json();

    if (!email || !password || !full_name) {
      return new Response(
        JSON.stringify({ error: "Email, password, and full_name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user with admin API (auto-confirms email)
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    });

    if (createError) {
      console.error("Error creating user:", createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newUserId = userData.user?.id;

    if (!newUserId) {
      return new Response(
        JSON.stringify({ error: "Failed to create user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update role if specified (default is staff from trigger which was employee before)
    const validRoles = ['admin', 'manager', 'staff', 'viewer'];
    if (role && validRoles.includes(role) && role !== 'staff') {
      await supabaseAdmin
        .from("user_roles")
        .update({ role })
        .eq("user_id", newUserId);
    }

    console.log(`User ${email} created successfully with id ${newUserId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "User created successfully",
        user_id: newUserId 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
