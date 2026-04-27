// Velour Walls painting engine.
// Modes:
//   - "create": text-to-image via Lovable AI (default) or OpenArt
//   - "remix":  edit/transform an existing source image (URL or data URL) via Lovable AI
//   - "suggest": same as create but stored with status="pending_approval", auto_suggested=true
//   - "comic":  multi-panel comic page (or single comic illustration) via Lovable AI
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PaintBody {
  prompt: string;
  title?: string;
  style?: string;
  aspect_ratio?: string;
  provider?: "lovable" | "openart";
  model?: string;
  publish?: boolean;
  mode?: "create" | "remix" | "suggest" | "comic";
  source_image_url?: string;
  category_id?: string | null;
  category_slug?: string | null;
  tags?: string[];
  affirmation?: string;
  affirmation_style?: string;
  // NEW: Crib-of-Art-inspired one-click style presets
  style_preset?:
    | "african_royalty"
    | "chrome_metallic"
    | "motivational"
    | "graffiti"
    | "abstract_ocean"
    | "modern_statement"
    | "comic_marvel"
    | "high_gloss";
  // NEW: comic-specific options
  comic_layout?: "single" | "2x2" | "3v" | "splash_2" | "6grid";
  comic_script?: string; // optional: per-panel beats; if omitted we derive from prompt
  // NEW: finish overlay — applies a high-gloss acrylic / resin print look on top of any style
  finish?: "matte" | "high_gloss";
}

const STYLE_PRESETS: Record<string, string> = {
  african_royalty:
    "Regal African subject in profile or three-quarter view, ornate beaded headwrap with real gold leaf accents, rich black and brown tones rendered with warm luminous highlights, ceremonial gold jewelry, refined textured background of weathered parchment and gold flake. Mixed-media gallery painting, palette knife strokes, gold-leaf inlay, museum quality.",
  chrome_metallic:
    "Liquid chrome and brushed gold abstract composition, sweeping painterly waves of metallic pigment over a soft cloudy background, dramatic side-lighting catching every ridge of impasto, white feather-like wisps drifting through molten gold. Resin-finished, ultra glossy, contemporary luxury wall art.",
  motivational:
    "Powerful silhouetted figure (back turned or seated), body subtly composed of hand-painted affirmation words flowing across the skin like calligraphic tattoos, the words clearly legible and beautifully integrated. Distressed concrete + gold-leaf splash background, charcoal and gold palette, modern motivational fine-art piece.",
  graffiti:
    "Raw urban canvas painting: dripping spray-paint, layered stencils, torn poster textures, bold tag lettering, gold leaf splatter over weathered brick. Banksy-meets-Basquiat energy, high-contrast, gallery-grade graffiti fine art.",
  abstract_ocean:
    "Abstract aerial seascape: golden molten waves crashing into rich navy and teal, generous palette-knife impasto, real gold-leaf foam, sun catching peaks of paint. Painterly, museum-grade, luminous contrast.",
  modern_statement:
    "Bold contemporary statement piece for a luxury living room, oversized scale energy, single striking subject, high-contrast palette of black + ivory + gold accents, layered mixed-media textures, refined gallery composition.",
  comic_marvel:
    "Modern cinematic comic illustration: photoreal anatomy, dramatic rim lighting, painted color rendering, subtle ink lines, cinematic composition, hyper-detailed costume textures, atmospheric background, dynamic action pose.",
  high_gloss:
    "Social-Culture-Art / Crib-of-Art-style HIGH-GLOSS ACRYLIC PRINT: ultra-saturated photoreal subject (legends, money, cars, sports icons, motivational typography or street-culture motifs) rendered as if printed on thick crystal-clear acrylic with a mirror-like resin finish. Bold isometric / 3D layered depth, crisp refined shadows, vivid color pops on elegant black accents, glossy reflections catching gallery lighting, sharp typographic accents in chrome / gold / iced-out diamond, premium luxury wall-art presentation.",
};

const COMIC_LAYOUTS: Record<string, string> = {
  single:
    "A single full-bleed comic illustration (one frame, no gutters).",
  "2x2":
    "A 2×2 grid comic page (4 equally-sized panels, clean white gutters ~12px between panels, thin black panel borders).",
  "3v":
    "A 3-panel vertical comic page (three stacked horizontal panels of equal height, clean white gutters, thin black borders).",
  splash_2:
    "A comic page with one large splash panel on top (full width, ~60% height) and two equal panels below it side-by-side, clean white gutters, thin black borders.",
  "6grid":
    "A classic 6-panel comic page (3 rows × 2 columns), uniform panels, clean white gutters ~12px, thin black borders.",
};

const HOUSE_STYLE = "Velour Walls house style: use black as a refined luxury accent, not a sinister mood. Keep the imagery warm, elegant, soulful, aspirational, and sellable; avoid evil, horror, occult, menacing, demonic, gothic, oppressive, or bleak visual language. Shape rich blacks with luminous gallery light, gold warmth, tactile impasto ridges, palette-knife structure, scraped paint, and surface texture that catches real room light. Portraits must feel dignified and alive with hyper-real micro-expression detail; abstracts must balance confident color blocks with graceful linework and emotionally uplifting brush velocity. The final artwork should feel like an architectural window into beauty and strength, not darkness.";

const COMIC_IP_PATTERN = /\b(wolverine|marvel|x-men|avengers|deadpool|spider[- ]?man|venom|batman|joker|superman|iron man|captain america|hulk)\b/i;

function jsonResponse(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extractModelTextContent(content: unknown): string {
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "text" in item && typeof item.text === "string") {
          return item.text;
        }
        return "";
      })
      .join("\n")
      .trim();
  }
  return "";
}

function sanitizeModelDeclineText(text: string): string {
  const cleaned = text
    .replace(/```+/g, " ")
    .replace(/'''+/g, " ")
    .replace(/^[`'"\s]+|[`'"\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned;
}

const ANALYSIS_PROMPT_PATTERN = /(###|\*\*|\[image generation request\]|artistic interpretation|visual style applied|here is the breakdown|weaponizing the void|the kinetic velocity of ink)/i;

function compactWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function stripPromptMarkup(prompt: string): string {
  return compactWhitespace(
    prompt
      .replace(/\[image generation request\][\s\S]*$/i, " ")
      .replace(/^here is (?:the )?(?:breakdown|artistic interpretation|analysis)[^\n.:]*[.:]?/i, " ")
      .replace(/^\s{0,3}#{1,6}\s+/gm, "")
      .replace(/^\s*[-*•]\s+/gm, "")
      .replace(/^\s*\d+[.)]\s+/gm, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/[\t\r]+/g, " ")
      .replace(/\n{2,}/g, "\n"),
  );
}

async function condensePromptIfNeeded(prompt: string, apiKey: string | null): Promise<string> {
  const stripped = stripPromptMarkup(prompt);
  const needsCondense =
    stripped.length > 500 ||
    stripped.split(/\s+/).length > 90 ||
    ANALYSIS_PROMPT_PATTERN.test(prompt);

  if (!apiKey || !needsCondense) return stripped;

  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content:
              "Convert the user's text into one concise image-generation prompt. Preserve the subject, mood, colors, environment, and composition. Remove markdown, headings, explanations, bullets, and meta commentary. Return only the visual prompt in plain English, under 90 words.",
          },
          { role: "user", content: stripped },
        ],
      }),
    });

    if (!resp.ok) return stripped;
    const json = await resp.json();
    const condensed = stripPromptMarkup(
      sanitizeModelDeclineText(extractModelTextContent(json?.choices?.[0]?.message?.content)),
    );
    return condensed || stripped;
  } catch {
    return stripped;
  }
}

async function rewriteComicPromptIfNeeded(prompt: string, apiKey: string | null): Promise<string> {
  if (!apiKey || !COMIC_IP_PATTERN.test(prompt)) return prompt;

  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content:
              "Rewrite the user's comic-art prompt into a legally-safe original-character prompt. Preserve tone, mood, setting, color, motion, and emotional energy, but remove all trademarked characters, franchise names, and exact likeness references. Return only the rewritten visual prompt.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!resp.ok) return prompt;
    const json = await resp.json();
    const rewritten = sanitizeModelDeclineText(extractModelTextContent(json?.choices?.[0]?.message?.content));
    return rewritten || prompt;
  } catch {
    return prompt;
  }
}

async function generateTitleAndDescription(
  visualPrompt: string,
  existingTitle: string | undefined,
  apiKey: string | null,
): Promise<{ title: string; description: string }> {
  const fallbackTitle = (existingTitle ?? "").trim() || "Untitled";
  const fallback = {
    title: fallbackTitle,
    description: visualPrompt.slice(0, 280),
  };
  if (!apiKey) return fallback;

  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content:
              "You write gallery copy for Velour Walls, a luxury fine-art studio. From the user's visual prompt, produce a poetic 2–5 word title and a single evocative paragraph (60–110 words) describing the artwork's mood, lighting, texture, and emotional pull. No emoji, no hashtags, no quotes around the title.",
          },
          { role: "user", content: visualPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "set_artwork_copy",
              description: "Return the title and description for this artwork.",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "2-5 word evocative title, no quotes." },
                  description: { type: "string", description: "60-110 word gallery description." },
                },
                required: ["title", "description"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "set_artwork_copy" } },
      }),
    });

    if (!resp.ok) return fallback;
    const json = await resp.json();
    const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return fallback;
    const parsed = typeof args === "string" ? JSON.parse(args) : args;
    const title = (existingTitle?.trim()) || sanitizeModelDeclineText(String(parsed.title ?? "")) || fallbackTitle;
    const description = sanitizeModelDeclineText(String(parsed.description ?? "")) || fallback.description;
    return { title, description };
  } catch (err) {
    console.warn("generateTitleAndDescription failed:", err);
    return fallback;
  }
}

function bytesToDataUrl(buf: Uint8Array, ct: string): string {
  let bin = "";
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
  return `data:${ct};base64,${btoa(bin)}`;
}

const TRACKING_QUERY_KEYS = [
  /^utm_/i,
  /^fbclid$/i,
  /^gclid$/i,
  /^twclid$/i,
  /^campaign_id$/i,
  /^ad_id$/i,
  /^tw_source$/i,
  /^mc_cid$/i,
  /^mc_eid$/i,
];

function stripTrackingParams(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const keys = [...parsed.searchParams.keys()];
    for (const key of keys) {
      if (TRACKING_QUERY_KEYS.some((pattern) => pattern.test(key))) {
        parsed.searchParams.delete(key);
      }
    }
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .trim();
}

function toAbsoluteUrl(candidate: string, pageUrl: string): string | null {
  try {
    if (!candidate) return null;
    if (candidate.startsWith("//")) {
      const protocol = new URL(pageUrl).protocol || "https:";
      return new URL(`${protocol}${candidate}`).toString();
    }
    return new URL(candidate, pageUrl).toString();
  } catch {
    return null;
  }
}

function extractPageImageUrl(html: string, pageUrl: string): string | null {
  const patterns = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["'][^>]*>/i,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["'][^>]*>/i,
    /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["'][^>]*>/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']image_src["'][^>]*>/i,
    new RegExp('"image"\\s*:\\s*"(https?:\\\\/\\\\/[^"\\\\]+)"', 'i'),
    new RegExp('"image"\\s*:\\s*\\[\\s*"(https?:\\\\/\\\\/[^"\\\\]+)"', 'i'),
    new RegExp('"featured_image"\\s*:\\s*"(\\/\\/[^"\\\\]+)"', 'i'),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    const raw = match?.[1];
    if (!raw) continue;
    const cleaned = decodeHtmlEntities(raw.replace(/\\\//g, "/"));
    const absolute = toAbsoluteUrl(cleaned, pageUrl);
    if (absolute) return absolute;
  }

  return null;
}

async function fetchRemote(url: string, accept: string): Promise<Response> {
  const candidates = [url, stripTrackingParams(url)].filter((value, index, arr) => arr.indexOf(value) === index);
  let lastResponse: Response | null = null;
  let lastError: Error | null = null;

  for (const candidate of candidates) {
    const headerSets: HeadersInit[] = [
      {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: accept,
      },
      {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: accept,
        Referer: new URL(candidate).origin + "/",
      },
    ];

    for (const headers of headerSets) {
      try {
        const response = await fetch(candidate, { headers, redirect: "follow" });
        if (response.ok) return response;
        lastResponse = response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }
  }

  if (lastResponse) return lastResponse;
  throw lastError ?? new Error("Failed to fetch remote asset");
}

async function resolvePageImageAsDataUrl(pageUrl: string): Promise<string> {
  const pageResponse = await fetchRemote(pageUrl, "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8");
  if (!pageResponse.ok) {
    throw new Error(
      `Failed to open source page (${pageResponse.status}). Please upload the image file instead, or use a direct image URL ending in .jpg/.png/.webp.`,
    );
  }

  const html = await pageResponse.text();
  const extractedImageUrl = extractPageImageUrl(html, pageUrl);
  if (!extractedImageUrl) {
    throw new Error(
      "That link points to a webpage, but I couldn't detect its main artwork image. Please upload the image file instead, or paste a direct image URL ending in .jpg/.png/.webp.",
    );
  }

  const imageResponse = await fetchRemote(extractedImageUrl, "image/*,*/*;q=0.8");
  if (!imageResponse.ok) {
    throw new Error(
      `I found the artwork image on that page, but the host blocked downloading it (${imageResponse.status}). Please upload the image file instead.`,
    );
  }

  const contentType = (imageResponse.headers.get("content-type") ?? "image/png").toLowerCase();
  if (!contentType.startsWith("image/")) {
    throw new Error(
      "The page resolved to non-image content. Please upload the image file instead, or paste a direct image URL.",
    );
  }

  const imageBuffer = new Uint8Array(await imageResponse.arrayBuffer());
  return bytesToDataUrl(imageBuffer, contentType);
}

async function fetchAsDataUrl(
  url: string,
  admin: any,
): Promise<string> {
  if (url.startsWith("data:")) return url;
  const m = url.match(/\/storage\/v1\/object\/(?:public\/)?paintings\/([^?]+)/);
  if (m) {
    const objectPath = decodeURIComponent(m[1]);
    const { data, error } = await admin.storage.from("paintings").download(objectPath);
    if (error || !data) throw new Error(`Storage download failed: ${error?.message ?? "no data"}`);
    const ct = data.type || "image/png";
    const buf = new Uint8Array(await data.arrayBuffer());
    return bytesToDataUrl(buf, ct);
  }
  const normalizedUrl = stripTrackingParams(url);
  const lower = normalizedUrl.toLowerCase();
  const looksLikeDirectImage = /\.(png|jpe?g|webp|gif|bmp|svg)(?:[?#].*)?$/i.test(lower);
  const looksLikePage =
    /(^|\.)etsy\.com|(^|\.)pinterest\.|(^|\.)amazon\.|(^|\.)ebay\.|(^|\.)myshopify\.com|(^|\.)shopify\.com|\/listing\/|\/pin\/|\/dp\/|\/products\/|\/collections\//.test(lower);
  if (looksLikePage) {
    return await resolvePageImageAsDataUrl(normalizedUrl);
  }

  const r = await fetchRemote(normalizedUrl, looksLikeDirectImage ? "image/*,*/*;q=0.8" : "image/*,text/html,*/*;q=0.8");
  if (!r.ok) {
    return await resolvePageImageAsDataUrl(normalizedUrl);
  }
  const ct = (r.headers.get("content-type") ?? "image/png").toLowerCase();
  if (ct.includes("text/html") || ct.includes("application/xhtml+xml")) {
    return await resolvePageImageAsDataUrl(normalizedUrl);
  }
  if (!ct.startsWith("image/")) {
    throw new Error(
      `That URL returned ${ct || "non-image content"}, not an image. Please upload the image file or paste a direct image link.`,
    );
  }
  const buf = new Uint8Array(await r.arrayBuffer());
  return bytesToDataUrl(buf, ct);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: roleRow } = await admin.from("user_roles")
      .select("role").eq("user_id", userId).eq("role", "owner").maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Only Naybz can paint here." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as PaintBody;
    if (!body.prompt || body.prompt.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mode = body.mode ?? "create";
    const cleanedPrompt = await condensePromptIfNeeded(body.prompt.trim(), LOVABLE_API_KEY ?? null);
    const rewrittenPrompt = mode === "comic"
      ? await rewriteComicPromptIfNeeded(cleanedPrompt, LOVABLE_API_KEY ?? null)
      : cleanedPrompt;
    const provider = mode === "remix" ? "lovable" : (body.provider ?? "lovable");
    const aspectRatio = body.aspect_ratio ?? (mode === "comic" ? "3:4" : "1:1");
    const affirmation = (body.affirmation ?? "").trim();
    const affStyle = (body.affirmation_style ?? "").trim() || "elegant hand-lettered script in warm metallic gold leaf";
    const affirmationBlock = affirmation
      ? `\n\nIntegrate the affirmation text "${affirmation}" as a CREATIVE, ARTISTIC part of the composition — woven into the scene (e.g. painted on a wall, stitched into fabric, glowing in neon, formed by smoke, brushed across the sky, carved into stone). Treat it as fine-art typography in the style of: ${affStyle}. The text must be spelled correctly, legible, beautifully kerned, and feel like it belongs in the painting — not a watermark or sticker. Do not show any other text, captions, or signatures.`
      : "";
    const presetBlock = body.style_preset && STYLE_PRESETS[body.style_preset]
      ? `\n\nVisual direction (preset ${body.style_preset}): ${STYLE_PRESETS[body.style_preset]}`
      : "";
    const finishBlock = body.finish === "high_gloss"
      ? `\n\nFINISH OVERLAY — render the entire image as a HIGH-GLOSS ACRYLIC / RESIN WALL PRINT: mirror-like glossy surface, crystal-clear acrylic depth, crisp specular highlights catching gallery lighting, ultra-saturated colors, sharp edges, premium luxury wall-art presentation in the spirit of Social Culture Art / Crib of Art best-sellers.`
      : "";

    let finalPrompt: string;
    if (mode === "comic") {
      const layoutKey = body.comic_layout ?? "2x2";
      const layoutBlock = COMIC_LAYOUTS[layoutKey] ?? COMIC_LAYOUTS["2x2"];
      const scriptBlock = (body.comic_script ?? "").trim()
        ? `\n\nPanel script (render each beat in its own panel, in reading order left→right, top→bottom):\n${body.comic_script}`
        : "";
      finalPrompt =
`Create a high-end realistic comic page in a cinematic modern comic style. ${HOUSE_STYLE} Use original characters only, never branded heroes or franchise-specific likenesses. Keep anatomy powerful, lighting dramatic, silhouettes legible, and page composition easy for the image model to render.

${layoutBlock}

Story / scene: ${rewrittenPrompt}${scriptBlock}${affirmationBlock}${presetBlock}${finishBlock}

Render speech bubbles and caption boxes ONLY where the script explicitly indicates dialogue or narration; lettering must be minimal, crisp, and sparse. If no dialogue is given, render the page silent (no text). Favor clear panel storytelling over excessive detail. Aspect ratio ${aspectRatio}, cohesive color palette across all panels.`;
    } else {
      finalPrompt = `${rewrittenPrompt}${presetBlock}${affirmationBlock}${finishBlock}\n\nStyle: ${body.style ?? "Velour Walls house style"}. ${HOUSE_STYLE} Hyper-realistic, museum-grade fine art, dramatic lighting, painterly textures, masterpiece composition, aspect ratio ${aspectRatio}.`;
    }

    let categoryId: string | null = body.category_id ?? null;
    if (!categoryId && body.category_slug) {
      const { data: cat } = await admin.from("categories").select("id").eq("slug", body.category_slug).maybeSingle();
      categoryId = cat?.id ?? null;
    }

    let imageBytes: Uint8Array;
    let contentType = "image/png";
    let modelUsed = "";
    const externalId: string | null = null;

    if (mode === "remix") {
      if (!body.source_image_url) throw new Error("source_image_url required for remix");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
      modelUsed = body.model ?? "google/gemini-3.1-flash-image-preview";
      const sourceDataUrl = await fetchAsDataUrl(body.source_image_url, admin);
      const callRemixModel = async (model: string, promptOverride?: string) => {
        return await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            messages: [{
              role: "user",
              content: [
                { type: "text", text: `Transform this image into one polished original artwork. ${promptOverride ?? finalPrompt}` },
                { type: "image_url", image_url: { url: sourceDataUrl } },
              ],
            }],
            modalities: ["image", "text"],
          }),
        });
      };

      let aiResp = await callRemixModel(modelUsed);
      if (!aiResp.ok) {
        const t = await aiResp.text();
        if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Out of AI credits." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error(`AI gateway error ${aiResp.status}: ${t}`);
      }
      let aiJson = await aiResp.json();
      let dataUrl: string | undefined = aiJson?.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      const remixFallbackChain = [
        "google/gemini-3-pro-image-preview",
        "google/gemini-3.1-flash-image-preview",
        "google/gemini-2.5-flash-image",
      ].filter((m) => m !== modelUsed);

      for (const fallbackModel of remixFallbackChain) {
        if (dataUrl) break;
        const textOut = extractModelTextContent(aiJson?.choices?.[0]?.message?.content);
        console.warn(`img-to-img: no image from ${modelUsed}, retrying with ${fallbackModel}. text=`, textOut);
        const fallback = await callRemixModel(fallbackModel);
        if (!fallback.ok) {
          console.warn(`img-to-img: fallback ${fallbackModel} failed http`, fallback.status, await fallback.text());
          continue;
        }
        aiJson = await fallback.json();
        dataUrl = aiJson?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        if (dataUrl) modelUsed = fallbackModel;
      }

      if (!dataUrl) {
        const simplifiedPrompt = `Restyle the source image into one clear, high-end finished artwork. Preserve the main subject, simplify the composition, remove any text or layout elements, and render it in ${body.style ?? "Velour Walls house style"}. ${HOUSE_STYLE} Focus on one visually coherent scene with strong light, tactile paint texture, and no captions or extra graphic elements. Aspect ratio ${aspectRatio}.`;
        for (const simplifiedModel of ["google/gemini-3.1-flash-image-preview", "google/gemini-2.5-flash-image"]) {
          const retry = await callRemixModel(simplifiedModel, simplifiedPrompt);
          if (!retry.ok) {
            console.warn(`img-to-img: simplified retry ${simplifiedModel} failed http`, retry.status, await retry.text());
            continue;
          }
          aiJson = await retry.json();
          dataUrl = aiJson?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          if (dataUrl) {
            modelUsed = simplifiedModel;
            break;
          }
        }
      }

      if (!dataUrl) {
        const rawTextOut = extractModelTextContent(aiJson?.choices?.[0]?.message?.content);
        const textOut = sanitizeModelDeclineText(rawTextOut);
        console.error("img-to-img: no image returned. model=", modelUsed, "text=", textOut || rawTextOut);
        const hint = textOut
          ? `Model declined: ${textOut.slice(0, 240)}`
          : "No image returned from model. Try a shorter, more visual prompt without analysis or formatting.";
        return new Response(JSON.stringify({ error: hint, code: "NO_IMAGE" }), {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const m = dataUrl.match(/^data:(.+?);base64,(.+)$/);
      if (!m) throw new Error("Bad image payload");
      contentType = m[1];
      const bin = atob(m[2]);
      imageBytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) imageBytes[i] = bin.charCodeAt(i);
    } else if (provider === "openart") {
      return jsonResponse({
        error: 'OpenArt generation is not available from this Studio yet. Switch the Engine to "Lovable AI" to generate here.',
        code: "OPENART_UNSUPPORTED",
        provider: "openart",
      }, 422);
    } else {
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
      // Comic pages benefit from the higher-fidelity image model when available
      const defaultModel = mode === "comic"
        ? "google/gemini-3-pro-image-preview"
        : "google/gemini-3.1-flash-image-preview";
      modelUsed = body.model ?? defaultModel;

      // Try requested model, then fall back to flash if no image came back (model refusal / text-only response).
      const callModel = async (model: string, promptOverride?: string) => {
        const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: promptOverride ?? finalPrompt }],
            modalities: ["image", "text"],
          }),
        });
        return r;
      };

      let aiResp = await callModel(modelUsed);
      if (!aiResp.ok) {
        const t = await aiResp.text();
        if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited. Please wait a moment and try again." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Out of AI credits. Top up Lovable AI to continue generating." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error(`AI gateway error ${aiResp.status}: ${t}`);
      }
      let aiJson = await aiResp.json();
      let dataUrl: string | undefined = aiJson?.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      // Fallback chain: try the stable Nano Banana models if the requested one returned no image.
      const fallbackChain = [
        "google/gemini-3-pro-image-preview",
        "google/gemini-3.1-flash-image-preview",
        "google/gemini-2.5-flash-image",
      ].filter((m) => m !== modelUsed);

      for (const fallbackModel of fallbackChain) {
        if (dataUrl) break;
        const textOut = extractModelTextContent(aiJson?.choices?.[0]?.message?.content);
        console.warn(`paint: no image from ${modelUsed}, retrying with ${fallbackModel}. text=`, textOut);
        const fallback = await callModel(fallbackModel);
        if (!fallback.ok) {
          console.warn(`paint: fallback ${fallbackModel} failed http`, fallback.status, await fallback.text());
          continue;
        }
        aiJson = await fallback.json();
        dataUrl = aiJson?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        if (dataUrl) modelUsed = fallbackModel;
      }

      if (!dataUrl && mode === "comic") {
        const simplifiedPrompt = `Create one polished original-character comic illustration for this scene: ${rewrittenPrompt}. ${HOUSE_STYLE} Keep it visually clean and easy to render, with dynamic pose, strong silhouette, cinematic lighting, painted comic style, and no text unless explicitly required. Aspect ratio ${aspectRatio}.`;
        for (const simplifiedModel of ["google/gemini-3.1-flash-image-preview", "google/gemini-2.5-flash-image"]) {
          const retry = await callModel(simplifiedModel, simplifiedPrompt);
          if (!retry.ok) {
            console.warn(`paint: simplified comic retry ${simplifiedModel} failed http`, retry.status, await retry.text());
            continue;
          }
          aiJson = await retry.json();
          dataUrl = aiJson?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          if (dataUrl) {
            modelUsed = simplifiedModel;
            break;
          }
        }
      }

      if (!dataUrl) {
        const rawTextOut = extractModelTextContent(aiJson?.choices?.[0]?.message?.content);
        const textOut = sanitizeModelDeclineText(rawTextOut);
        console.error("paint: no image returned. model=", modelUsed, "text=", textOut || rawTextOut);
        const hint = textOut
          ? `Model declined: ${textOut.slice(0, 240)}`
          : mode === "comic"
            ? "The comic prompt still did not return an image. Try an original character or scene description instead of a named franchise character."
            : "The model returned no image. Try rephrasing the prompt — it may have been blocked by safety filters.";
        return new Response(JSON.stringify({ error: hint, code: "NO_IMAGE" }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const m = dataUrl.match(/^data:(.+?);base64,(.+)$/);
      if (!m) throw new Error("Bad image payload");
      contentType = m[1];
      const bin = atob(m[2]);
      imageBytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) imageBytes[i] = bin.charCodeAt(i);
    }

    const ext = contentType.includes("jpeg") ? "jpg" : contentType.includes("webp") ? "webp" : "png";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await admin.storage.from("paintings")
      .upload(path, imageBytes, { contentType, upsert: false });
    if (upErr) throw upErr;
    const { data: pub } = admin.storage.from("paintings").getPublicUrl(path);
    const imageUrl = pub.publicUrl;

    // Auto-resolve "comics" category when in comic mode and no category given
    if (!categoryId && mode === "comic") {
      const { data: cat } = await admin.from("categories").select("id").eq("slug", "comics").maybeSingle();
      categoryId = cat?.id ?? null;
    }

    const status = mode === "suggest" ? "pending_approval" : "approved";
    const isPublished = mode === "suggest" ? false : !!body.publish;
    const tags = [...(body.tags ?? [])];
    if (body.style_preset) tags.push(`preset:${body.style_preset}`);
    if (mode === "comic") tags.push("comic", `layout:${body.comic_layout ?? "2x2"}`);

    const { title: generatedTitle, description: generatedDescription } = await generateTitleAndDescription(
      rewrittenPrompt,
      body.title,
      LOVABLE_API_KEY ?? null,
    );

    const { data: painting, error: insErr } = await admin.from("paintings").insert({
      owner_id: userId,
      title: body.title?.trim() || generatedTitle || (mode === "comic" ? "Untitled Comic" : "Untitled"),
      description: generatedDescription,
      prompt: body.prompt,
      style: body.style ?? (body.style_preset ?? null),
      aspect_ratio: aspectRatio,
      image_url: imageUrl,
      is_published: isPublished,
      provider,
      model: modelUsed,
      external_id: externalId,
      final_prompt: finalPrompt,
      source_image_url: body.source_image_url ?? null,
      category_id: categoryId,
      status,
      auto_suggested: mode === "suggest",
      tags,
    }).select().single();
    if (insErr) throw insErr;

    return jsonResponse({ painting }, 200);
  } catch (e) {
    console.error("paint error:", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
