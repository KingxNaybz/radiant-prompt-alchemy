import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

type Env = "live" | "sandbox" | "unconfigured";

function detectEnv(): Env {
  if (!clientToken) return "unconfigured";
  if (clientToken.startsWith("pk_live_")) return "live";
  if (clientToken.startsWith("pk_test_")) return "sandbox";
  return "unconfigured";
}

type Step = {
  n: number;
  title: string;
  short: string;
  who: "you (in Stripe)" | "you (in Lovable)" | "automatic";
  body: React.ReactNode;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string }[];
};

const STEPS: Step[] = [
  {
    n: 1,
    title: "Claim your Stripe account",
    short: "Link the test sandbox to your existing Stripe account.",
    who: "you (in Stripe)",
    body: (
      <>
        <p>
          Open Lovable's <strong>Payments</strong> tab and click <em>Claim your Stripe account</em>.
          You'll land on a Stripe-hosted page titled <em>“Create a Stripe account to claim this
          sandbox from Lovable.”</em>
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Choose <strong>Sign in</strong> (you already have an account) and authenticate.</li>
          <li>Confirm the verification email Stripe sends.</li>
        </ul>
        <p className="mt-2 text-muted-foreground">
          The claim link is generated per-project and lives in your Lovable Payments tab — it
          isn't a public Stripe URL.
        </p>
      </>
    ),
    primary: { label: "Open Lovable Payments tab", href: "#open-payments" },
    secondary: [{ label: "Stripe Dashboard", href: "https://dashboard.stripe.com" }],
  },
  {
    n: 2,
    title: "Complete go-live in Stripe",
    short: "Business verification, bank account, 2FA, review & submit.",
    who: "you (in Stripe)",
    body: (
      <>
        <p>Stripe's “Activate your account” wizard has 5 sections:</p>
        <ol className="list-decimal pl-5 mt-2 space-y-1">
          <li><strong>Verify your business</strong> — type, personal details, business info.</li>
          <li><strong>Add your bank</strong> — for payouts.</li>
          <li><strong>Secure your account</strong> — two-step auth.</li>
          <li><strong>Add extras</strong> (optional) — tax / compliance.</li>
          <li><strong>Review & submit.</strong></li>
        </ol>
        <p className="mt-3 p-3 bg-amber-50 border border-amber-200 text-sm">
          <strong>Important:</strong> When Stripe asks <em>“Choose what to copy”</em> from sandbox
          to live, select <strong>copy everything</strong> and make sure the
          <strong> Lovable app</strong> is included. This auto-completes step 3.
        </p>
      </>
    ),
    primary: { label: "Stripe Activation", href: "https://dashboard.stripe.com/account/onboarding" },
  },
  {
    n: 3,
    title: "Install the Lovable app on your live account",
    short: "Usually auto-completes if you copied the Lovable app in step 2.",
    who: "you (in Stripe)",
    body: (
      <>
        <p>
          If you selected <em>“copy everything”</em> in step 2, this step completes on its own.
          Otherwise, return to the Lovable Payments tab and click <em>Install on live account</em>
          — it opens the install flow on your <strong>live</strong> Stripe account.
        </p>
        <p className="mt-2 text-muted-foreground">
          This step is locked until step 2 is submitted in Stripe.
        </p>
      </>
    ),
    primary: { label: "Open Lovable Payments tab", href: "#open-payments" },
  },
  {
    n: 4,
    title: "Provision live API keys",
    short: "Automatic — Lovable creates live keys and webhooks.",
    who: "automatic",
    body: (
      <>
        <p>
          Once step 3 finishes, Lovable provisions your live publishable and secret keys, creates
          live webhook endpoints, and wires them into your edge functions. No action from you.
        </p>
        <p className="mt-2 text-muted-foreground">
          Typically takes under a minute. The Payments tab polls every 10 seconds.
        </p>
      </>
    ),
  },
  {
    n: 5,
    title: "Readiness check",
    short: "Automated validation of products, prices, and webhooks in live.",
    who: "you (in Lovable)",
    body: (
      <>
        <p>
          In the Lovable Payments tab, click <em>Run readiness check</em>. It validates products,
          prices, webhook endpoints, and the live connection.
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li><strong>Pass</strong> — site flips to live automatically; test-mode banner disappears.</li>
          <li><strong>Warning / Fail</strong> — each failed check has an <em>Ask Lovable to fix</em> button.</li>
        </ul>
      </>
    ),
    primary: { label: "Open Lovable Payments tab", href: "#open-payments" },
  },
];

const WHO_TONE: Record<Step["who"], string> = {
  "you (in Stripe)": "bg-indigo-50 text-indigo-900 border-indigo-200",
  "you (in Lovable)": "bg-violet-50 text-violet-900 border-violet-200",
  automatic: "bg-emerald-50 text-emerald-900 border-emerald-200",
};

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
                {isLive
                  ? "Live — accepting real payments"
                  : env === "sandbox"
                  ? "Test mode"
                  : "Not configured"}
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

          <div className="mt-5 p-4 bg-paper border border-border text-sm">
            <p className="font-medium mb-2">How to open the Lovable Payments tab</p>
            <p className="text-muted-foreground">
              The actual go-live buttons (claim URL, install-on-live, readiness check) live
              inside the Lovable editor, not on this site. In your Lovable project window:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
              <li>
                <strong>Desktop:</strong> click the <em>More</em> icon in the top nav →{" "}
                <strong>Payments</strong>. Or press <kbd className="px-1.5 py-0.5 border border-border bg-muted">⌘K</kbd> / <kbd className="px-1.5 py-0.5 border border-border bg-muted">Ctrl+K</kbd> and type <em>payments</em>.
              </li>
              <li>
                <strong>Mobile:</strong> Chat mode → bottom-right <strong>⋯</strong> →{" "}
                <em>More</em> → <strong>Payments</strong>.
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl mb-4">Go-live checklist</h2>
          <Accordion type="multiple" className="space-y-3">
            {STEPS.map((step) => {
              const done = isLive;
              return (
                <AccordionItem
                  key={step.n}
                  value={`step-${step.n}`}
                  className="border border-border bg-paper px-5"
                >
                  <AccordionTrigger className="py-4 hover:no-underline">
                    <div className="flex items-center gap-4 text-left flex-1 pr-3">
                      <div
                        className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center font-serif text-lg ${
                          done
                            ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {done ? "✓" : step.n}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{step.title}</div>
                        <div className="text-sm text-muted-foreground mt-0.5">{step.short}</div>
                      </div>
                      <Badge variant="outline" className={`shrink-0 ${WHO_TONE[step.who]}`}>
                        {step.who}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 pt-1 pl-[52px] text-sm leading-relaxed">
                    {step.body}
                    {(step.primary || step.secondary) && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {step.primary && step.primary.href !== "#open-payments" && (
                          <a
                            href={step.primary.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-ink text-paper text-xs eyebrow hover:bg-ink/85"
                          >
                            {step.primary.label} ↗
                          </a>
                        )}
                        {step.primary?.href === "#open-payments" && (
                          <span className="px-4 py-2 bg-muted text-muted-foreground text-xs eyebrow border border-border">
                            {step.primary.label} (inside Lovable editor)
                          </span>
                        )}
                        {step.secondary?.map((link) => (
                          <a
                            key={link.href}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 border border-ink text-ink text-xs eyebrow hover:bg-ink hover:text-paper"
                          >
                            {link.label} ↗
                          </a>
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          <p className="mt-6 text-xs text-muted-foreground">
            Per-step live status (claim status, onboarding submission, app install) is tracked
            inside the Lovable Payments tab. This page reflects whether your published build is
            using live or sandbox keys.
          </p>
        </section>
      </main>
    </div>
  );
}
