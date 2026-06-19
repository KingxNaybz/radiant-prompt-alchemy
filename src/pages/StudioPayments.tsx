import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

type Env = "live" | "sandbox" | "unconfigured";

function detectEnv(): Env {
  if (!clientToken) return "unconfigured";
  if (clientToken.startsWith("pk_live_")) return "live";
  if (clientToken.startsWith("pk_test_")) return "sandbox";
  return "unconfigured";
}

const STEPS = [
  {
    n: 1,
    title: "Claim your Stripe account",
    desc: "Link the test sandbox to your existing Stripe account (or create one).",
  },
  {
    n: 2,
    title: "Complete go-live in Stripe",
    desc: "Verify business details, add a bank account for payouts, and enable 2FA.",
  },
  {
    n: 3,
    title: "Install the Lovable app on your live account",
    desc: "Usually auto-completes if you copied the Lovable app from sandbox during step 2.",
  },
  {
    n: 4,
    title: "Provision live API keys",
    desc: "Automatic — Lovable creates live keys and webhooks once the app is installed.",
  },
  {
    n: 5,
    title: "Readiness check",
    desc: "Automated validation of products, prices, and webhooks in live mode.",
  },
];

export default function StudioPayments() {
  const { user, loading: authLoading } = useAuth();
  const [isOwner, setIsOwner] = useState<boolean | null>(null);
  const env = detectEnv();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "owner")
      .maybeSingle()
      .then(({ data }) => setIsOwner(!!data));
  }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (isOwner === false) return <Navigate to="/" replace />;
  if (isOwner === null) return null;

  const isLive = env === "live";
  const stepsCompleted = isLive ? 5 : 0;

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader />
      <main className="max-w-4xl mx-auto px-6 md:px-10 py-12">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-serif text-3xl md:text-4xl">Payments</h1>
          <Link to="/studio" className="eyebrow text-muted-foreground hover:text-ink">
            ← Atelier
          </Link>
        </div>
        <p className="text-muted-foreground mb-8">
          Stripe go-live checklist and live key status.
        </p>

        <section className="border border-border bg-paper-warm p-6 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="eyebrow text-muted-foreground mb-1">Current mode</div>
              <div className="text-2xl font-serif">
                {isLive ? "Live — accepting real payments" : env === "sandbox" ? "Test mode" : "Not configured"}
              </div>
            </div>
            <Badge
              className={
                isLive
                  ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                  : env === "sandbox"
                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                  : "bg-destructive/15 text-destructive border border-destructive/40"
              }
            >
              {isLive ? "LIVE KEYS ACTIVE" : env === "sandbox" ? "SANDBOX KEYS" : "NO KEYS"}
            </Badge>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Token prefix:{" "}
            <code className="font-mono">
              {clientToken ? `${clientToken.slice(0, 8)}…` : "(missing)"}
            </code>
            {" · "}
            Steps complete: <strong>{stepsCompleted} / 5</strong>
          </div>
          {!isLive && (
            <p className="mt-4 text-sm">
              To switch to live mode, open the Payments dashboard in Lovable and complete the
              five steps below. The site flips to live automatically once all five are green —
              no code changes needed.
            </p>
          )}
        </section>

        <section>
          <h2 className="font-serif text-2xl mb-4">Go-live checklist</h2>
          <ol className="space-y-3">
            {STEPS.map((step) => (
              <li
                key={step.n}
                className="border border-border bg-paper p-5 flex gap-4 items-start"
              >
                <div
                  className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center font-serif text-lg ${
                    isLive
                      ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {isLive ? "✓" : step.n}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{step.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">{step.desc}</div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    isLive
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {isLive ? "complete" : "pending"}
                </Badge>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-xs text-muted-foreground">
            Detailed per-step progress (claim status, onboarding, app install) lives in the
            Lovable Payments dashboard. This page reflects whether your published build is
            using live or sandbox keys.
          </p>
        </section>
      </main>
    </div>
  );
}
