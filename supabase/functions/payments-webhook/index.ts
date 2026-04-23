// Stripe webhook: marks orders as paid when the payment intent is captured.
import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _supabase;
}

async function updateOrderByIntent(intent: any, status: string) {
  const orderId = intent?.metadata?.order_id;
  if (!orderId) {
    console.warn("payment_intent missing order_id metadata", intent?.id);
    return;
  }
  await getSupabase()
    .from("orders")
    .update({ payment_status: status, stripe_payment_intent_id: intent.id })
    .eq("id", orderId);
}

async function handle(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  switch (event.type) {
    case "payment_intent.amount_capturable_updated":
      // Card has been authorized — order is awaiting studio review/capture
      await updateOrderByIntent(event.data.object, "authorized");
      break;
    case "payment_intent.succeeded":
      // Funds captured — order is paid
      await updateOrderByIntent(event.data.object, "paid");
      break;
    case "payment_intent.canceled":
      await updateOrderByIntent(event.data.object, "canceled");
      break;
    case "payment_intent.payment_failed":
      await updateOrderByIntent(event.data.object, "failed");
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    await handle(req, rawEnv as StripeEnv);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});
