// Returns a list of inspiration concepts (with optional reference image URLs)
// based on a search query. Uses Lovable AI to brainstorm. Owner-only.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: r } = await admin.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "owner").maybeSingle();
    if (!r) return new Response(JSON.stringify({ error: "Owner only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { query } = await req.json();
    if (!query || String(query).trim().length < 2) {
      return new Response(JSON.stringify({ error: "query required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const sys = `You are an art director. Given a theme, output 6 unique fine-art concepts as a JSON array.
Schema: [{"title":"...","prompt":"detailed visual description for an AI painter","style":"...","category_slug":"sports|cars|abstract|nature|animals|portrait|architecture|african-royalty|chrome-metallic|motivational|graffiti|abstract-ocean|modern-statement|surreal|comics|still-life|fantasy"}]
Pick the single best-fitting category_slug for each idea from the list above. Bias toward variety across the set when the theme is broad.
Return JSON only, no prose.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: `Theme: ${query}` },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!resp.ok) throw new Error(await resp.text());
    const j = await resp.json();
    let raw = j?.choices?.[0]?.message?.content ?? "[]";
    raw = String(raw).replace(/```json|```/g, "").trim();
    let ideas: any[] = [];
    try {
      const p = JSON.parse(raw);
      ideas = Array.isArray(p) ? p : (p.ideas ?? p.concepts ?? p.suggestions ?? []);
    } catch { ideas = []; }

    return new Response(JSON.stringify({ ideas }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("inspire-search:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
