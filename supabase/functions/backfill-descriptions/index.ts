// Backfills AI-generated titles/descriptions for paintings missing them.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HOUSE_STYLE_HINT =
  "Velour Walls house style: matte voids, chiaroscuro highlights, sculptural impasto, emotional architectural windows.";

async function generateDescription(prompt: string, currentTitle: string, apiKey: string) {
  const sys =
    "You write short, punchy gallery copy for Velour Walls. Return STRICT JSON {\"title\":string,\"description\":string}. Title: 2-5 evocative words (Title Case). Description: 2-3 sentences, 20-30 words max. Evocative, sensory, present tense. Every word must earn its place. No markdown, no quotes, no lists. Hard cap: 30 words.";
  const user = `Visual subject:\n${prompt.slice(0, 600)}\n\nCurrent title (may be generic): ${currentTitle}\nHouse style: ${HOUSE_STYLE_HINT}\n\nReminder: description must be 30 words or fewer.`;
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!resp.ok) throw new Error(`AI ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content);
  let description = typeof parsed.description === "string" ? parsed.description.trim() : "";
  // Hard cap to ~30 words as a safety net
  const words = description.split(/\s+/);
  if (words.length > 32) description = words.slice(0, 30).join(" ").replace(/[,;:\-]+$/, "") + ".";
  return {
    title: typeof parsed.title === "string" ? parsed.title.trim() : "",
    description,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Owner-only: this writes to every painting and burns AI credits.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: roleRow } = await admin.from("user_roles")
      .select("user_id").eq("user_id", u.user.id).eq("role", "owner").maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Number(body.limit) || 10, 50);
    const overwriteTitle = body.overwriteTitle === true;
    const rewriteLong = body.rewriteLong === true;
    const maxLen = Number(body.maxLen) || 220;

    let rows: any[] = [];
    if (rewriteLong) {
      const { data, error: e2 } = await admin
        .from("paintings")
        .select("id, title, prompt, description")
        .limit(500);
      if (e2) {
        console.error("rewriteLong query error:", e2);
        throw e2;
      }
      console.log("rewriteLong total fetched:", data?.length);
      rows = (data ?? []).filter((r: any) => (r.description?.length ?? 0) > maxLen).slice(0, limit);
      console.log("rewriteLong after filter:", rows.length, "maxLen:", maxLen);
    } else {
      const { data, error: e2 } = await admin
        .from("paintings")
        .select("id, title, prompt, description")
        .or("description.is.null,description.eq.")
        .limit(limit);
      if (e2) throw e2;
      rows = data ?? [];
    }

    const results: any[] = [];
    for (const row of rows ?? []) {
      try {
        const { title, description } = await generateDescription(
          row.prompt || row.title || "",
          row.title || "Untitled",
          apiKey,
        );
        const update: Record<string, string> = {};
        if (description) update.description = description;
        if (title && (overwriteTitle || !row.title || row.title === "Untitled")) {
          update.title = title;
        }
        if (Object.keys(update).length > 0) {
          const { error: upErr } = await admin.from("paintings").update(update).eq("id", row.id);
          if (upErr) throw upErr;
        }
        results.push({ id: row.id, ok: true, ...update });
      } catch (e) {
        results.push({ id: row.id, ok: false, error: String(e) });
      }
    }

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
