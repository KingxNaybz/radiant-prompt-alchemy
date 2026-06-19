// Stripe webhook: tracks order/payment lifecycle AND keeps painting inventory
// in sync (reserved on auth, sold on capture, freed on cancel/fail). Also
// records refunds and disputes and alerts the studio.
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

async function getOrder(orderId: string) {
  const { data, error } = await getSupabase()
    .from("orders").select("*").eq("id", orderId).maybeSingle();
  if (error || !data) {
    console.warn("order not found", orderId, error);
    return null;
  }
  return data;
}

async function sendOrderEmails(orderId: string) {
  const order = await getOrder(orderId);
  if (!order) return;
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

  await getSupabase().functions.invoke("send-transactional-email", {
    body: {
      templateName: "order-received",
      recipientEmail: order.customer_email,
      idempotencyKey: `order-received-${order.id}`,
      templateData: sharedFields,
    },
  }).catch((e: unknown) => console.error("customer email failed", e));

  await getSupabase().functions.invoke("send-transactional-email", {
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
  }).catch((e: unknown) => console.error("studio email failed", e));
}

async function sendStudioAlert(subject: string, body: string, idempotencyKey: string) {
  await getSupabase().functions.invoke("send-transactional-email", {
    body: {
      templateName: "studio-alert",
      recipientEmail: STUDIO_INBOX,
      idempotencyKey,
      templateData: { subject, body },
    },
  }).catch((e: unknown) => console.error("studio alert failed", e));
}

// Painting inventory transitions. We only flip status when we have a painting_id.
// `approved` -> `reserved` -> `sold`. Cancel/fail returns to `approved`.
// Refunds/disputes do NOT auto-relist — studio decides manually.
async function setPaintingStatus(
  paintingId: string | null | undefined,
  newStatus: "reserved" | "sold" | "approved",
  orderId: string | null,
) {
  if (!paintingId) return;
  const patch: Record<string, unknown> = { status: newStatus };
  if (newStatus === "reserved") patch.reserved_at = new Date().toISOString();
  if (newStatus === "sold") {
    patch.sold_at = new Date().toISOString();
    patch.sold_order_id = orderId;
  }
  if (newStatus === "approved") {
    patch.reserved_at = null;
    patch.sold_at = null;
    patch.sold_order_id = null;
  }
  await getSupabase().from("paintings").update(patch).eq("id", paintingId);
}

async function updateOrderByIntent(
  intent: any,
  status: string,
  opts: { sendEmails?: boolean; paintingTransition?: "reserved" | "sold" | "approved" | null } = {},
) {
  const orderId = intent?.metadata?.order_id;
  if (!orderId) {
    console.warn("payment_intent missing order_id metadata", intent?.id);
    return;
  }
  await getSupabase().from("orders")
    .update({ payment_status: status, stripe_payment_intent_id: intent.id })
    .eq("id", orderId);

  if (opts.paintingTransition) {
    const order = await getOrder(orderId);
    if (order?.painting_id) {
      await setPaintingStatus(order.painting_id, opts.paintingTransition, orderId);
    }
  }
  if (opts.sendEmails) await sendOrderEmails(orderId);
}

async function handleRefund(charge: any) {
  // charge.refunded fires when any refund is created. amount_refunded is cumulative.
  const orderId = charge?.metadata?.order_id
    ?? charge?.payment_intent_metadata?.order_id;
  // Stripe doesn't put PI metadata on charge directly — look it up via PI id if needed.
  let resolvedOrderId = orderId;
  if (!resolvedOrderId && charge?.payment_intent) {
    // Cheap path: search orders by stripe_payment_intent_id.
    const { data } = await getSupabase().from("orders")
      .select("id, amount_cents, painting_id, painting_title")
      .eq("stripe_payment_intent_id", charge.payment_intent)
      .maybeSingle();
    if (data) resolvedOrderId = data.id;
  }
  if (!resolvedOrderId) {
    console.warn("refund: could not resolve order_id for charge", charge?.id);
    return;
  }

  const order = await getOrder(resolvedOrderId);
  if (!order) return;
  const amountRefunded = charge?.amount_refunded ?? 0;
  const fullRefund = amountRefunded >= (order.amount_cents ?? 0);

  await getSupabase().from("orders").update({
    payment_status: fullRefund ? "refunded" : "partially_refunded",
    refunded_amount_cents: amountRefunded,
    refunded_at: new Date().toISOString(),
  }).eq("id", resolvedOrderId);

  await sendStudioAlert(
    `Refund processed — ${order.painting_title}`,
    `Order ${String(order.id).slice(0, 8)} refunded ${fmtUsd(amountRefunded)} of ${fmtUsd(order.amount_cents)}.\n\nThe painting is NOT automatically relisted. Review the piece in the studio dashboard and re-approve it manually if you want it back in the gallery.`,
    `refund-${charge.id}`,
  );
}

async function handleDispute(dispute: any) {
  const chargeId = dispute?.charge;
  if (!chargeId) return;
  const { data: order } = await getSupabase().from("orders")
    .select("id, painting_title, amount_cents")
    .or(`stripe_payment_intent_id.eq.${dispute.payment_intent ?? ""}`)
    .maybeSingle();

  if (order) {
    await getSupabase().from("orders").update({
      payment_status: "disputed",
      dispute_reason: dispute.reason ?? "unknown",
      disputed_at: new Date().toISOString(),
    }).eq("id", order.id);
  }

  await sendStudioAlert(
    `⚠️ Chargeback opened — ${order?.painting_title ?? "unknown order"}`,
    `Dispute ${dispute.id} reason: ${dispute.reason}. Amount: ${fmtUsd(dispute.amount)}.\n\nRespond in Stripe Dashboard before the evidence deadline. Reference the Returns & Refunds policy on velourwalls.art/returns when submitting evidence.`,
    `dispute-${dispute.id}`,
  );
}

async function handle(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  switch (event.type) {
    case "payment_intent.amount_capturable_updated":
      // Card authorized — reserve the painting and email customer + studio.
      await updateOrderByIntent(event.data.object, "authorized", {
        sendEmails: true, paintingTransition: "reserved",
      });
      break;
    case "payment_intent.succeeded":
      // Captured by studio — painting is sold.
      await updateOrderByIntent(event.data.object, "paid", { paintingTransition: "sold" });
      break;
    case "payment_intent.canceled":
      await updateOrderByIntent(event.data.object, "canceled", { paintingTransition: "approved" });
      break;
    case "payment_intent.payment_failed":
      await updateOrderByIntent(event.data.object, "failed", { paintingTransition: "approved" });
      break;
    case "charge.refunded":
      await handleRefund(event.data.object);
      break;
    case "charge.dispute.created":
    case "charge.dispute.funds_withdrawn":
      await handleDispute(event.data.object);
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
      status: 200, headers: { "Content-Type": "application/json" },
    });
  }
  try {
    await handle(req, rawEnv as StripeEnv);
    return new Response(JSON.stringify({ received: true }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});
