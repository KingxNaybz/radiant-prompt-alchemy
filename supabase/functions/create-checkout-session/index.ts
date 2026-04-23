// Creates a Stripe Checkout Session (manual capture authorization)
// for a Velour Walls order. Uses the Lovable Stripe gateway.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const STRIPE_GATEWAY = "https://connector-gateway.lovable.dev/stripe-sandbox/v1";

function form(obj: Record<string, string>) {
  return new URLSearchParams(obj).toString();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const STRIPE_KEY = Deno.env.get("STRIPE_SANDBOX_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!STRIPE_KEY) throw new Error("STRIPE_SANDBOX_API_KEY not configured");

    const body = await req.json();
    const {
      paintingId,
      paintingTitle,
      finish,
      size,
      amountCents,
      customerName,
      customerEmail,
      shippingAddress,
      origin,
    } = body ?? {};

    if (
      !paintingTitle ||
      !finish ||
      !size ||
      !Number.isInteger(amountCents) ||
      amountCents < 100 ||
      !customerEmail ||
      !customerName ||
      !shippingAddress
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid order details." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 1) Pre-create the order row (status: pending, awaiting authorization)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: orderRow, error: insertErr } = await supabase
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
        payment_method: "card",
        payment_status: "pending",
      })
      .select("id")
      .single();

    if (insertErr) throw new Error(`Order insert failed: ${insertErr.message}`);

    const orderId = orderRow.id;
    const successUrl = `${origin}/order-success?order=${orderId}`;
    const cancelUrl = `${origin}/buy?canceled=1`;

    // 2) Create Stripe Checkout Session via gateway, manual capture
    const params: Record<string, string> = {
      mode: "payment",
      "payment_method_types[0]": "card",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(amountCents),
      "line_items[0][price_data][product_data][name]":
        `${paintingTitle} — ${finish}, ${size}`,
      "line_items[0][price_data][product_data][description]":
        "Velour Walls original. Studio-reviewed before fulfilment.",
      "payment_intent_data[capture_method]": "manual",
      "payment_intent_data[metadata][order_id]": orderId,
      "metadata[order_id]": orderId,
      customer_email: customerEmail,
      success_url: successUrl,
      cancel_url: cancelUrl,
    };

    const stripeRes = await fetch(`${STRIPE_GATEWAY}/checkout/sessions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": STRIPE_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form(params),
    });

    const session = await stripeRes.json();
    if (!stripeRes.ok) {
      console.error("Stripe error", session);
      throw new Error(
        `Stripe ${stripeRes.status}: ${session?.error?.message ?? "unknown"}`,
      );
    }

    // 3) Save the session id to the order
    await supabase
      .from("orders")
      .update({
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent ?? null,
        payment_status: "awaiting_authorization",
      })
      .eq("id", orderId);

    return new Response(
      JSON.stringify({ url: session.url, orderId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : "unknown";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
