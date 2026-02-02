import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS configuration - restrict to known application domains only
const ALLOWED_ORIGINS = [
  "https://app-turkiye-gelisimi.lovable.app",
  "https://id-preview--d2145a40-41cf-49e6-8968-88ef491c1ef8.lovable.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) 
    ? origin 
    : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
  };
}

interface LoginAttemptRequest {
  email: string;
  success: boolean;
  failure_reason?: string;
}

serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { email, success, failure_reason }: LoginAttemptRequest = await req.json();

    // Get IP from headers
    const ip_address = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                       req.headers.get("x-real-ip") || 
                       "unknown";
    const user_agent = req.headers.get("user-agent") || null;

    // Find user ID if email matches
    let user_id = null;
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("full_name", email)
      .limit(1);
    
    if (profiles && profiles.length > 0) {
      user_id = profiles[0].user_id;
    }

    // Insert login attempt
    const { error } = await supabaseAdmin.from("login_attempts").insert({
      user_id,
      email,
      ip_address,
      user_agent,
      success,
      failure_reason: failure_reason || null,
    });

    if (error) {
      console.error("Error logging login attempt:", error);
      return new Response(
        JSON.stringify({ error: "Failed to log login attempt" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in log-login-attempt:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...getCorsHeaders(req.headers.get("Origin")), "Content-Type": "application/json" } }
    );
  }
});
