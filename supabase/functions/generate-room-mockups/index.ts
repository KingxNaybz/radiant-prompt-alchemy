// Generates 3 room mockups (living room, bedroom, office) showing the painting
// hung on a wall, using Lovable AI image editing. Results are cached on
// paintings.room_mockups so we only ever generate once per piece.
//
// Public endpoint (no auth required). Idempotent: if mockups already exist
// they are returned immediately.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type RoomKey = "living_room" | "bedroom" | "office";

interface RoomMockup {
  key: RoomKey;
  label: string;
  url: string;
}

const ROOMS: { key: RoomKey; label: string; prompt: string }[] = [
  {
    key: "living_room",
    label: "Living room",
    prompt:
      "Place the provided artwork as a large framed canvas hanging on the main wall of an upscale modern living room. Warm gallery lighting, neutral linen sofa, brass accents, oak floors, soft shadows on the wall, photorealistic interior photography, slightly angled three-quarter view, the painting is the clear focal point and remains perfectly recognizable and uncropped, do not alter the artwork itself.",
  },
  {
    key: "bedroom",
    label: "Bedroom",
    prompt:
      "Place the provided artwork as a large framed canvas above the headboard of an elegant boutique-hotel-style bedroom. Soft morning light, ivory linens, walnut nightstands, subtle plants, photorealistic interior photography, straight-on view, the painting is the clear focal point and remains perfectly recognizable and uncropped, do not alter the artwork itself.",
  },
  {
    key: "office",
    label: "Office",
    prompt:
      "Place the provided artwork as a large framed canvas on the feature wall of a refined executive home office. Walnut desk, leather chair, brass desk lamp, bookshelves softly out of focus, warm directional light, photorealistic interior photography, slight three-quarter angle, the painting is the clear focal point and remains perfectly recognizable and uncropped, do not alter the artwork itself.",
  },
];

async function fetchImageAsDataUrl(url: string): Promise<string> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Failed to fetch source image (${r.status})`);
  const ct = (r.headers.get("content-type") ?? "image/png").toLowerCase();
  const buf = new Uint8Array(await r.arrayBuffer());
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < buf.length; i += chunk) {
    bin += String.fromCharCode(...buf.subarray(i, i + chunk));
  }
  return `data:${ct};base64,${btoa(bin)}`;
}

async function generateMockup(
  artworkDataUrl: string,
  prompt: string,
  apiKey: string,
): Promise<{ contentType: string; bytes: Uint8Array }> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: artworkDataUrl } },
          ],
        },
      ],
      modalities: ["image", "text"],
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI gateway error ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const dataUrl: string | undefined =
    data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!dataUrl) throw new Error("AI gateway returned no image");
  const m = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!m) throw new Error("Bad image payload from AI gateway");
  const contentType = m[1];
  const bin = atob(m[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { contentType, bytes };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SUPABASE_ANON_KEY =
      Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { painting_id } = await req.json();
    if (typeof painting_id !== "string" || !/^[0-9a-f-]{36}$/i.test(painting_id)) {
      return new Response(JSON.stringify({ error: "painting_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const caller = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: authHeader ? { Authorization: authHeader } : {} },
      auth: { persistSession: false },
    });
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Read as the caller first so private owner pieces are visible through RLS,
    // while unknown/private pieces still return "not found" to everyone else.
    const { data: painting, error: pErr } = await caller
      .from("paintings")
      .select("id, image_url, room_mockups, owner_id")
      .eq("id", painting_id)
      .maybeSingle();
    if (pErr) throw pErr;
    if (!painting) {
      return new Response(JSON.stringify({ error: "Painting not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const existing = (painting.room_mockups ?? []) as RoomMockup[];
    if (Array.isArray(existing) && existing.length >= ROOMS.length) {
      return new Response(JSON.stringify({ mockups: existing, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const artworkDataUrl = await fetchImageAsDataUrl(painting.image_url);

    const have = new Map(existing.map((m) => [m.key, m]));
    const results: RoomMockup[] = [...existing];

    for (const room of ROOMS) {
      if (have.has(room.key)) continue;
      try {
        const { contentType, bytes } = await generateMockup(
          artworkDataUrl,
          room.prompt,
          LOVABLE_API_KEY,
        );
        const ext = contentType.includes("jpeg")
          ? "jpg"
          : contentType.includes("webp")
            ? "webp"
            : "png";
        const path = `${painting.owner_id ?? "public"}/mockups/${painting.id}-${room.key}-${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await admin.storage
          .from("paintings")
          .upload(path, bytes, { contentType, upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = admin.storage.from("paintings").getPublicUrl(path);
        results.push({ key: room.key, label: room.label, url: pub.publicUrl });
      } catch (e) {
        console.error("mockup failed for", room.key, e);
        // Continue with the other rooms instead of failing the whole batch.
      }
    }

    if (results.length > existing.length) {
      const { error: updErr } = await admin
        .from("paintings")
        .update({ room_mockups: results })
        .eq("id", painting.id);
      if (updErr) throw updErr;
    }

    return new Response(JSON.stringify({ mockups: results, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-room-mockups error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
