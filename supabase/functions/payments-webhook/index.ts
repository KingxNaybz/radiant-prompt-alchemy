// Stripe webhook: marks orders as paid when the payment intent is captured,
// and triggers the customer + studio order emails when card is authorized.
import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

const STUDIO_INBOX = "studio@velourwalls.art";

let _supabase: any = null;
function getSupabase(): any {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _supabase;
}

function fmtUsd(cents: number | null | undefined): string {
  if (cents == null) return "";
  return `$${(cents / 100).toFixed(2)}`;
}

async function sendOrderEmails(orderId: string) {
  const supabase = getSupabase();
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (error || !order) {
    console.warn("sendOrderEmails: order not found", orderId, error);
    return;
  }

  const amountFormatted = fmtUsd(order.amount_cents as number);
  const sharedFields = {
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    paintingTitle: order.painting_title,
    finish: order.finish,
    size: order.size,
    amountFormatted,
    orderId: String(order.id).slice(0, 8),
  };

  // Customer "received / in studio review"
  await supabase.functions.invoke("send-transactional-email", {
    body: {
      templateName: "order-received",
      recipientEmail: order.customer_email,
      idempotencyKey: `order-received-${order.id}`,
      templateData: sharedFields,
    },
  }).catch((e: unknown) => console.error("customer email failed", e));

  // Studio "new order" alert
  await supabase.functions.invoke("send-transactional-email", {
    body: {
      templateName: "new-order-alert",
      recipientEmail: STUDIO_INBOX,
      idempotencyKey: `new-order-alert-${order.id}`,
      templateData: {
        ...sharedFields,
        paymentMethod: order.payment_method,
        paymentStatus: order.payment_status,
        shippingAddress: order.shipping_address,
        notes: order.notes,
      },
    },
  }).catch((e) => console.error("studio email failed", e));
}

async function updateOrderByIntent(intent: any, status: string, sendEmails = false) {
  const orderId = intent?.metadata?.order_id;
  if (!orderId) {
    console.warn("payment_intent missing order_id metadata", intent?.id);
    return;
  }
  await getSupabase()
    .from("orders")
    .update({ payment_status: status, stripe_payment_intent_id: intent.id })
    .eq("id", orderId);

  if (sendEmails) {
    await sendOrderEmails(orderId);
  }
}

async function handle(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  switch (event.type) {
    case "payment_intent.amount_capturable_updated":
      // Card authorized — order awaiting studio review/capture. Send emails now.
      await updateOrderByIntent(event.data.object, "authorized", true);
      break;
    case "payment_intent.succeeded":
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
