// Records a wire/transfer order — no card capture. Studio sends invoice manually.
// Also fires the "order received" email to the customer and a studio alert.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { computePriceCents } from "../_shared/pricing.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const STUDIO_INBOX = "studio@velourwalls.art";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      paintingId,
      paintingTitle,
      finish,
      size,
      signed,
      customerName,
      customerEmail,
      shippingAddress,
      notes,
    } = body ?? {};

    if (
      !paintingTitle ||
      typeof finish !== "string" ||
      typeof size !== "string" ||
      typeof signed !== "boolean" ||
      !customerEmail ||
      !customerName ||
      !shippingAddress
    ) {
      return new Response(JSON.stringify({ error: "Invalid order details." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Server-authoritative price. Never trust any client-supplied amount.
    const amountCents = computePriceCents(finish, size, signed);
    if (amountCents === null) {
      return new Response(JSON.stringify({ error: "Unknown finish or size." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase
      .from("orders")
      .insert({
        painting_id: paintingId ?? null,
        painting_title: paintingTitle,
        finish,
        size,
        amount_cents: amountCents,
        customer_name: customerName,
        customer_email: customerEmail,
        shipping_address: shippingAddress,
        payment_method: "wire",
        payment_status: "awaiting_invoice",
        notes: notes ?? null,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    const orderId = data.id as string;

    const amountFormatted = `$${(amountCents / 100).toFixed(2)}`;
    const sharedFields = {
      customerName,
      customerEmail,
      paintingTitle,
      finish,
      size,
      amountFormatted,
      orderId: String(orderId).slice(0, 8),
    };

    // Fire-and-forget email sends
    await Promise.all([
      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "order-received",
          recipientEmail: customerEmail,
          idempotencyKey: `order-received-${orderId}`,
          templateData: sharedFields,
        },
      }).catch((e) => console.error("customer email failed", e)),
      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "new-order-alert",
          recipientEmail: STUDIO_INBOX,
          idempotencyKey: `new-order-alert-${orderId}`,
          templateData: {
            ...sharedFields,
            paymentMethod: "wire",
            paymentStatus: "awaiting_invoice",
            shippingAddress,
            notes: notes ?? undefined,
          },
        },
      }).catch((e) => console.error("studio email failed", e)),
    ]);

    return new Response(JSON.stringify({ orderId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
