// Generates a batch of auto-suggested paintings, stored as pending_approval.
// Can be called manually (Inspire Me) or via daily cron (no auth = service role).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SuggestBody {
  count?: number;          // default 3
  category_slug?: string;  // optional: bias toward a category
  style_preset?: string;   // optional: Crib-style preset key
  description?: string;    // optional: free-form direction from the user
}

const PRESET_DIRECTIONS: Record<string, string> = {
  african_royalty: "Regal African subjects with beaded headwraps, gold-leaf accents, ceremonial jewelry, mixed-media gallery painting.",
  chrome_metallic: "Liquid chrome and brushed-gold abstract waves with painterly impasto and dramatic side-lighting.",
  motivational: "Powerful silhouetted figure whose body is composed of legible affirmation words integrated as calligraphic tattoos.",
  graffiti: "Raw urban canvas: drips, stencils, torn posters, gold-leaf splatter, Banksy-meets-Basquiat energy.",
  abstract_ocean: "Aerial seascapes with golden molten waves crashing into navy and teal, palette-knife impasto.",
  modern_statement: "Bold contemporary statement piece — single striking subject, ivory + black + gold accents, mixed-media texture.",
  comic_marvel: "Modern Marvel-realism comic illustrations: photoreal anatomy, painted color, cinematic rim lighting, dynamic poses.",
  high_gloss: "Social Culture Art best-seller energy: high-gloss acrylic / resin wall print look, mirror-like surface, ultra-saturated color, painterly impasto under glass.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Determine owner: either authed owner OR fall back to first owner row (cron path)
    let ownerId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: u } = await userClient.auth.getUser();
      if (u?.user) {
        const { data: r } = await admin.from("user_roles")
          .select("user_id").eq("user_id", u.user.id).eq("role", "owner").maybeSingle();
        if (r) ownerId = u.user.id;
      }
    }
    if (!ownerId) {
      const { data: anyOwner } = await admin.from("user_roles")
        .select("user_id").eq("role", "owner").limit(1).maybeSingle();
      ownerId = anyOwner?.user_id ?? null;
    }
    if (!ownerId) {
      return new Response(JSON.stringify({ error: "No owner configured." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = (await req.json().catch(() => ({}))) as SuggestBody;
    const count = Math.min(Math.max(body.count ?? 3, 1), 20);

    // Pull categories
    const { data: cats } = await admin.from("categories").select("id, slug, name");
    const catList = cats ?? [];

    const presetDirection = body.style_preset && PRESET_DIRECTIONS[body.style_preset]
      ? `\nAll concepts MUST follow this visual direction: ${PRESET_DIRECTIONS[body.style_preset]}`
      : "";
    // Ask Lovable AI to brainstorm prompts
    const sysPrompt = `You are Naybz's creative director for Velour Walls, a luxury fine-art atelier.
Suggest ${count} brand-new museum-grade painting concepts. Each must be unique, evocative, and gallery-worthy.
Pick a category from this list: ${catList.map((c) => c.slug).join(", ")}.${presetDirection}
Return ONLY a JSON array, no prose. Schema:
[{"title": "...", "prompt": "...", "style": "...", "category_slug": "...", "aspect_ratio": "1:1|3:4|4:3|16:9"}]`;

    const ideaResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sysPrompt },
          { role: "user", content: body.category_slug
              ? `Lean toward category: ${body.category_slug}.`
              : "Mix several categories." },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!ideaResp.ok) throw new Error(`Idea gen failed: ${await ideaResp.text()}`);
    const ideaJson = await ideaResp.json();
    let raw = ideaJson?.choices?.[0]?.message?.content ?? "[]";
    // Strip code fences if any
    raw = String(raw).replace(/```json|```/g, "").trim();
    let ideas: Array<{ title: string; prompt: string; style?: string; category_slug?: string; aspect_ratio?: string }> = [];
    try {
      const parsed = JSON.parse(raw);
      ideas = Array.isArray(parsed) ? parsed : (parsed.ideas ?? parsed.suggestions ?? []);
    } catch {
      ideas = [];
    }
    if (ideas.length === 0) throw new Error("No ideas generated");

    const results: any[] = [];
    for (const idea of ideas.slice(0, count)) {
      try {
        const ar = idea.aspect_ratio ?? "1:1";
        const finalPrompt = `${idea.prompt}\n\nStyle: ${idea.style ?? "signature Velour Walls aesthetic"}. Hyper-realistic, 8K, ultra detailed, museum-grade fine art, dramatic lighting, painterly textures, aspect ratio ${ar}.`;
        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3.1-flash-image-preview",
            messages: [{ role: "user", content: finalPrompt }],
            modalities: ["image", "text"],
          }),
        });
        if (!aiResp.ok) { console.error("img gen failed", await aiResp.text()); continue; }
        const aiJson = await aiResp.json();
        const dataUrl: string | undefined = aiJson?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        if (!dataUrl) continue;
        const m = dataUrl.match(/^data:(.+?);base64,(.+)$/);
        if (!m) continue;
        const contentType = m[1];
        const bin = atob(m[2]);
        const imageBytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) imageBytes[i] = bin.charCodeAt(i);
        const ext = contentType.includes("jpeg") ? "jpg" : contentType.includes("webp") ? "webp" : "png";
        const path = `${ownerId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await admin.storage.from("paintings")
          .upload(path, imageBytes, { contentType, upsert: false });
        if (upErr) { console.error(upErr); continue; }
        const { data: pub } = admin.storage.from("paintings").getPublicUrl(path);

        const cat = catList.find((c) => c.slug === idea.category_slug) ?? catList[0];

        const { data: painting } = await admin.from("paintings").insert({
          owner_id: ownerId,
          title: idea.title || "Suggested Work",
          prompt: idea.prompt,
          style: idea.style ?? null,
          aspect_ratio: ar,
          image_url: pub.publicUrl,
          is_published: false,
          provider: "lovable",
          model: "google/gemini-3.1-flash-image-preview",
          final_prompt: finalPrompt,
          category_id: cat?.id ?? null,
          status: "pending_approval",
          auto_suggested: true,
        }).select().single();
        if (painting) results.push(painting);
      } catch (e) {
        console.error("suggest item failed:", e);
      }
    }

    return new Response(JSON.stringify({ created: results.length, paintings: results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("suggest-art error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
