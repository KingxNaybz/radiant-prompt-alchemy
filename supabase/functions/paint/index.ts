// Naybz painting engine — calls Lovable AI (Nano Banana 2) by default.
// Optionally uses an external OpenArt API key if the user has set one.
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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // Verify owner role via service role
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "owner")
      .maybeSingle();
    if (!roleRow) {
      return new Response(
        JSON.stringify({ error: "Only Naybz can paint here." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json()) as PaintBody;
    if (!body.prompt || body.prompt.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const provider = body.provider ?? "lovable";
    const aspectRatio = body.aspect_ratio ?? "1:1";
    const finalPrompt = `${body.prompt}\n\nStyle: ${body.style ?? "signature Naybz aesthetic"}. Hyper-realistic, 8K, ultra detailed, museum-grade fine art, dramatic lighting, painterly textures, masterpiece composition, aspect ratio ${aspectRatio}.`;

    let imageBytes: Uint8Array;
    let contentType = "image/png";

    if (provider === "openart") {
      const OPENART_API_KEY = Deno.env.get("OPENART_API_KEY");
      if (!OPENART_API_KEY) {
        return new Response(
          JSON.stringify({ error: "OPENART_API_KEY not configured. Add it in Cloud secrets." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      // Map aspect ratio to dimensions (square defaults to high res for 8K-style output)
      const dims =
        aspectRatio === "16:9"
          ? { width: 1820, height: 1024 }
          : aspectRatio === "9:16"
          ? { width: 1024, height: 1820 }
          : { width: 1536, height: 1536 };

      // Kick off OpenArt generation
      const create = await fetch("https://openart.ai/api/v1/text2image/creations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENART_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          model: body.model ?? "flux-pro",
          width: dims.width,
          height: dims.height,
          num_images: 1,
        }),
      });
      const createJson = await create.json();
      if (!create.ok) {
        throw new Error(`OpenArt create failed [${create.status}]: ${JSON.stringify(createJson)}`);
      }
      const creationId =
        createJson?.id ?? createJson?.creation_id ?? createJson?.data?.id;
      if (!creationId) throw new Error("OpenArt: no creation id returned");

      // Poll for completion
      let url: string | undefined;
      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const poll = await fetch(
          `https://openart.ai/api/v1/text2image/creations/${creationId}`,
          { headers: { Authorization: `Bearer ${OPENART_API_KEY}` } },
        );
        const pollJson = await poll.json();
        const status = pollJson?.status ?? pollJson?.data?.status;
        const imgs =
          pollJson?.image_urls ??
          pollJson?.images ??
          pollJson?.data?.image_urls ??
          pollJson?.data?.images;
        if (imgs && imgs.length > 0) {
          const first = imgs[0];
          url = typeof first === "string" ? first : first?.url ?? first?.image_url;
          if (url) break;
        }
        if (status === "FAILED" || status === "failed") {
          throw new Error(`OpenArt generation failed: ${JSON.stringify(pollJson)}`);
        }
      }
      if (!url) throw new Error("OpenArt timed out");
      const imgResp = await fetch(url);
      contentType = imgResp.headers.get("content-type") ?? "image/png";
      imageBytes = new Uint8Array(await imgResp.arrayBuffer());
    } else {
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          messages: [{ role: "user", content: finalPrompt }],
          modalities: ["image", "text"],
        }),
      });
      if (!aiResp.ok) {
        const t = await aiResp.text();
        if (aiResp.status === 429)
          return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        if (aiResp.status === 402)
          return new Response(
            JSON.stringify({ error: "Out of AI credits. Add funds in Settings → Workspace → Usage." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        throw new Error(`AI gateway error ${aiResp.status}: ${t}`);
      }
      const aiJson = await aiResp.json();
      const dataUrl: string | undefined =
        aiJson?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (!dataUrl) throw new Error("No image returned");
      const m = dataUrl.match(/^data:(.+?);base64,(.+)$/);
      if (!m) throw new Error("Bad image payload");
      contentType = m[1];
      const bin = atob(m[2]);
      imageBytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) imageBytes[i] = bin.charCodeAt(i);
    }

    // Upload to storage
    const ext = contentType.includes("jpeg") ? "jpg" : contentType.includes("webp") ? "webp" : "png";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await admin.storage
      .from("paintings")
      .upload(path, imageBytes, { contentType, upsert: false });
    if (upErr) throw upErr;
    const { data: pub } = admin.storage.from("paintings").getPublicUrl(path);
    const imageUrl = pub.publicUrl;

    // Insert painting row
    const { data: painting, error: insErr } = await admin
      .from("paintings")
      .insert({
        owner_id: userId,
        title: body.title?.trim() || "Untitled",
        prompt: body.prompt,
        style: body.style ?? null,
        aspect_ratio: aspectRatio,
        image_url: imageUrl,
        is_published: !!body.publish,
      })
      .select()
      .single();
    if (insErr) throw insErr;

    return new Response(JSON.stringify({ painting }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("paint error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
