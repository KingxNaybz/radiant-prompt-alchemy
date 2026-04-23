// Records a wire/transfer order — no card capture. Studio sends invoice manually.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
      notes,
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
      return new Response(JSON.stringify({ error: "Invalid order details." }), {
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

    return new Response(JSON.stringify({ orderId: data.id }), {
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
