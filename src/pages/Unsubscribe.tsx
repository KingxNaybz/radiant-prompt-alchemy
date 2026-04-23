import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type State = "loading" | "valid" | "already" | "invalid" | "submitting" | "done" | "error";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setState("invalid");
      setMessage("This link is missing its unsubscribe token.");
      return;
    }
    fetch(
      `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
      { headers: { apikey: SUPABASE_ANON_KEY } },
    )
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (data.valid) setState("valid");
        else if (data.reason === "already_unsubscribed") setState("already");
        else {
          setState("invalid");
          setMessage(data.error ?? "This unsubscribe link is invalid or expired.");
        }
      })
      .catch(() => {
        setState("error");
        setMessage("We couldn't reach the unsubscribe service. Please try again.");
      });
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setState("submitting");
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });
      const data = await r.json().catch(() => ({}));
      if (data.success || data.reason === "already_unsubscribed") setState("done");
      else {
        setState("error");
        setMessage(data.error ?? "Something went wrong.");
      }
    } catch {
      setState("error");
      setMessage("We couldn't reach the unsubscribe service. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-md px-6 py-20 text-center">
        <p className="text-xs tracking-[0.3em] text-accent font-bold">VELOUR WALLS</p>
        <h1 className="mt-3 font-serif text-3xl">Email preferences</h1>

        <div className="mt-10 border border-border rounded-sm bg-card p-8">
          {state === "loading" && <p className="text-muted-foreground">Verifying your link…</p>}

          {state === "valid" && (
            <>
              <p className="text-foreground mb-6">
                Confirm you'd like to unsubscribe from Velour Walls emails. You will no longer
                receive order updates or studio notifications.
              </p>
              <Button onClick={confirm}>Confirm unsubscribe</Button>
            </>
          )}

          {state === "submitting" && <p className="text-muted-foreground">Processing…</p>}

          {state === "already" && (
            <p className="text-foreground">You've already been unsubscribed. No action needed.</p>
          )}

          {state === "done" && (
            <p className="text-foreground">
              You've been unsubscribed. We're sorry to see you go.
            </p>
          )}

          {(state === "invalid" || state === "error") && (
            <p className="text-destructive">{message}</p>
          )}
        </div>
      </main>
    </div>
  );
}
