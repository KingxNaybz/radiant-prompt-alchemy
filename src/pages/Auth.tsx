import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SiteHeader from "@/components/SiteHeader";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function Auth() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) nav("/studio"); }, [user, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/studio" },
        });
        if (error) throw error;
        toast.success("Account created. You can sign in now.");
        setMode("in");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav("/studio");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader />
      <section className="max-w-md mx-auto px-6 py-24">
        <div className="eyebrow text-muted-foreground mb-4">Atelier Access</div>
        <h1 className="font-serif text-4xl mb-2">{mode === "in" ? "Sign in" : "Create account"}</h1>
        <p className="text-sm text-muted-foreground mb-8">
          The studio is private. Only the owner may paint here.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-ink"
          />
          <input
            type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-ink"
          />
          <button
            disabled={busy}
            className="w-full bg-ink text-paper eyebrow py-3.5 hover:bg-gold-deep transition-colors disabled:opacity-50"
          >
            {busy ? "…" : mode === "in" ? "Enter" : "Create"}
          </button>
        </form>
        <button
          onClick={() => setMode(mode === "in" ? "up" : "in")}
          className="mt-6 text-sm text-muted-foreground hover:text-ink"
        >
          {mode === "in" ? "Need an account? Create one" : "Already have an account? Sign in"}
        </button>
      </section>
    </div>
  );
}
