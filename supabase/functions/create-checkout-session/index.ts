// Embedded Checkout session for a Velour Walls order.
// Uses dynamic price_data because each painting/finish/size combo is unique.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
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
      returnUrl,
      environment,
    } = body ?? {};

    if (
      !paintingTitle ||
      !finish ||
      !size ||
      !Number.isInteger(amountCents) ||
      amountCents < 50 ||
      !customerEmail ||
      !customerName ||
      !shippingAddress ||
      !returnUrl ||
      (environment !== "sandbox" && environment !== "live")
    ) {
      return new Response(JSON.stringify({ error: "Invalid request." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const env: StripeEnv = environment;

    // Pre-create the order row
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
        payment_status: "awaiting_authorization",
      })
      .select("id")
      .single();

    if (insertErr) throw new Error(`Order insert failed: ${insertErr.message}`);
    const orderId = orderRow.id as string;

    const stripe = createStripeClient(env);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded",
      return_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&order=${orderId}`,
      customer_email: customerEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: {
              name: `${paintingTitle} — ${finish}, ${size}`,
              description: "Velour Walls original. Studio-reviewed before fulfilment.",
            },
          },
        },
      ],
      payment_intent_data: {
        capture_method: "manual",
        metadata: { order_id: orderId },
      },
      metadata: { order_id: orderId },
    });

    await supabase
      .from("orders")
      .update({
        stripe_session_id: session.id,
        stripe_payment_intent_id:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
      })
      .eq("id", orderId);

    return new Response(
      JSON.stringify({ clientSecret: session.client_secret, orderId }),
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
