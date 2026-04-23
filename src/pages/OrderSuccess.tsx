import { Link, useSearchParams } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { useEffect } from "react";

export default function OrderSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const orderId = params.get("order");

  useEffect(() => {
    document.title = "Order received — Velour Walls";
  }, []);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <PaymentTestModeBanner />
      <SiteHeader />
      <section className="max-w-2xl mx-auto px-6 py-32 text-center">
        <div className="eyebrow text-gold-deep mb-4">Authorization received</div>
        <h1 className="font-serif text-5xl mb-6">Thank you.</h1>
        <p className="text-muted-foreground mb-8">
          Your card has been authorized. The studio will review your order, match it
          with the best print partner, and capture payment only when production is
          confirmed. You'll get an email at every step.
        </p>
        {(orderId || sessionId) && (
          <div className="eyebrow text-xs text-muted-foreground mb-8">
            Order reference · {(orderId ?? sessionId)!.slice(0, 12)}
          </div>
        )}
        <Link
          to="/"
          className="inline-block bg-ink text-paper eyebrow px-6 py-3 hover:bg-gold-deep transition-colors"
        >
          Back to gallery
        </Link>
      </section>
      <SiteFooter />
    </div>
  );
}
