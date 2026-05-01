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
    "You write punchy gallery copy for Velour Walls. Return STRICT JSON {\"title\":string,\"description\":string}. Title: 2-5 evocative words (Title Case). Description: 20-35 words, 1-2 short sentences, sensory and emotional, present tense, no markdown, no quotes.";
  const user = `Visual subject:\n${prompt.slice(0, 800)}\n\nCurrent title (may be generic): ${currentTitle}\nHouse style: ${HOUSE_STYLE_HINT}`;
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
  return {
    title: typeof parsed.title === "string" ? parsed.title.trim() : "",
    description: typeof parsed.description === "string" ? parsed.description.trim() : "",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Number(body.limit) || 10, 50);
    const overwriteTitle = body.overwriteTitle === true;
    const rewriteLong = body.rewriteLong === true;
    const maxLen = Number(body.maxLen) || 220;

    const query = admin.from("paintings").select("id, title, prompt, description").limit(limit);
    const { data: allRows, error } = rewriteLong
      ? await query
      : await query.or("description.is.null,description.eq.");
    if (error) throw error;
    const rows = rewriteLong
      ? (allRows ?? []).filter((r: any) => (r.description?.length ?? 0) > maxLen)
      : allRows;

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
