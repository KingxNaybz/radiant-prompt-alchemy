import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SiteHeader from "@/components/SiteHeader";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const STYLES = [
  "Gold Drip Portrait",
  "Renaissance Oil",
  "Hyper-Real Photography",
  "Surreal Dreamscape",
  "Editorial Fashion",
  "Cinematic Noir",
  "Abstract Expressionism",
  "Wildlife Macro",
];
const RATIOS = ["1:1", "3:4", "4:3", "16:9", "9:16", "21:9"];

interface Painting {
  id: string;
  title: string;
  prompt: string;
  style: string | null;
  aspect_ratio: string;
  image_url: string;
  is_published: boolean;
  price_cents: number | null;
  provider: string | null;
  model: string | null;
  external_id: string | null;
  created_at: string;
}

export default function Studio() {
  const { user, isOwner, loading } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [style, setStyle] = useState(STYLES[0]);
  const [ratio, setRatio] = useState("1:1");
  const [provider, setProvider] = useState<"lovable" | "openart">("lovable");
  const [publish, setPublish] = useState(false);
  const [painting, setPainting] = useState(false);
  const [works, setWorks] = useState<Painting[]>([]);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Atelier — Velour Walls";
    if (isOwner) refresh();
  }, [isOwner]);

  const refresh = async () => {
    const { data } = await supabase
      .from("paintings")
      .select("*")
      .order("created_at", { ascending: false });
    setWorks((data ?? []) as Painting[]);
  };

  if (loading) return <div className="min-h-screen bg-paper" />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isOwner)
    return (
      <div className="min-h-screen bg-paper">
        <SiteHeader />
        <div className="max-w-xl mx-auto py-32 px-6 text-center">
          <h1 className="font-serif text-4xl mb-3">Atelier locked</h1>
          <p className="text-muted-foreground">
            Your account does not have studio access. The atelier is reserved for the owner of Velour Walls.
          </p>
        </div>
      </div>
    );

  const paint = async () => {
    setErrorBanner(null);
    if (prompt.trim().length < 3) {
      toast.error("Describe the piece first.");
      return;
    }
    setPainting(true);
    try {
      const { data, error } = await supabase.functions.invoke("paint", {
        body: { prompt, title, style, aspect_ratio: ratio, provider, publish },
      });
      if (error) throw error;
      const errMsg = (data as any)?.error;
      if (errMsg) {
        if (typeof errMsg === "string" && errMsg.includes("OPENART_API_KEY")) {
          setErrorBanner("OpenArt key missing. Add OPENART_API_KEY in Cloud secrets to use OpenArt.");
        }
        throw new Error(errMsg);
      }
      toast.success("Naybz finished a new piece.");
      setPrompt("");
      setTitle("");
      refresh();
    } catch (e: any) {
      const msg = e.message ?? "Painting failed";
      if (typeof msg === "string" && msg.includes("OPENART_API_KEY")) {
        setErrorBanner("OpenArt key missing. Add OPENART_API_KEY in Cloud secrets to use OpenArt.");
      }
      toast.error(msg);
    } finally {
      setPainting(false);
    }
  };

  const togglePublish = async (p: Painting) => {
    const { error } = await supabase
      .from("paintings")
      .update({ is_published: !p.is_published })
      .eq("id", p.id);
    if (error) toast.error(error.message);
    else refresh();
  };

  const remove = async (p: Painting) => {
    if (!confirm(`Delete "${p.title}"?`)) return;
    const { error } = await supabase.from("paintings").delete().eq("id", p.id);
    if (error) toast.error(error.message);
    else refresh();
  };

  const providerBadge = (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 border eyebrow text-[0.65rem] ${
        provider === "openart"
          ? "border-gold-deep text-gold-deep bg-gold-deep/5"
          : "border-ink text-ink bg-ink/5"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${provider === "openart" ? "bg-gold-deep" : "bg-ink"}`} />
      {provider === "openart" ? "OpenArt · Your Credits" : "Lovable AI · Default"}
    </div>
  );

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader />
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-12 grid lg:grid-cols-12 gap-10">
        {/* COMPOSER */}
        <aside className="lg:col-span-4 lg:sticky lg:top-28 self-start space-y-5">
          <div>
            <div className="eyebrow text-muted-foreground mb-2">Atelier</div>
            <h1 className="font-serif text-4xl">Paint.</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Naybz, your personal painter. Describe the work — he renders it in 8K.
            </p>
            <div className="mt-4">{providerBadge}</div>
          </div>

          {errorBanner && (
            <div className="border-l-4 border-destructive bg-destructive/5 p-4 text-sm">
              <div className="eyebrow text-destructive mb-1">Engine error</div>
              <p className="text-foreground">{errorBanner}</p>
            </div>
          )}

          <div className="space-y-3 border border-border p-5 bg-card">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (optional)"
              className="w-full bg-transparent border-b border-border py-2 focus:outline-none focus:border-ink font-serif text-lg"
            />
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A woman in profile, half her face dripping in liquid gold, against deep teal velvet…"
              rows={6}
              className="w-full bg-transparent border border-border p-3 text-sm focus:outline-none focus:border-ink resize-none"
            />

            <div>
              <label className="eyebrow text-muted-foreground">Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full bg-transparent border border-border p-2.5 mt-1 focus:outline-none focus:border-ink"
              >
                {STYLES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="eyebrow text-muted-foreground">Format</label>
                <select
                  value={ratio}
                  onChange={(e) => setRatio(e.target.value)}
                  className="w-full bg-transparent border border-border p-2.5 mt-1 focus:outline-none focus:border-ink"
                >
                  {RATIOS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="eyebrow text-muted-foreground">Engine</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as any)}
                  className="w-full bg-transparent border border-border p-2.5 mt-1 focus:outline-none focus:border-ink"
                >
                  <option value="lovable">Lovable AI (default)</option>
                  <option value="openart">OpenArt (your credits)</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm pt-2">
              <input
                type="checkbox"
                checked={publish}
                onChange={(e) => setPublish(e.target.checked)}
              />
              Publish to public gallery immediately
            </label>

            <button
              onClick={paint}
              disabled={painting}
              className="w-full bg-ink text-paper eyebrow py-3.5 hover:bg-gold-deep transition-colors disabled:opacity-60"
            >
              {painting ? "Naybz is painting…" : "Paint it"}
            </button>
          </div>
        </aside>

        {/* GALLERY */}
        <main className="lg:col-span-8">
          <div className="flex items-end justify-between mb-6">
            <h2 className="font-serif text-3xl">Your works</h2>
            <span className="text-sm text-muted-foreground">{works.length} total</span>
          </div>
          {works.length === 0 ? (
            <div className="border border-dashed border-border p-16 text-center text-muted-foreground">
              <p className="font-serif italic text-2xl">A blank canvas awaits.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {works.map((p) => (
                <div key={p.id} className="border border-border bg-card overflow-hidden group">
                  <div className="relative">
                    <img src={p.image_url} alt={p.title} className="w-full h-auto" />
                    {!p.is_published && (
                      <span className="absolute top-3 left-3 eyebrow bg-ink text-paper px-2 py-1">
                        Private
                      </span>
                    )}
                    {p.provider && (
                      <span
                        className={`absolute top-3 right-3 eyebrow px-2 py-1 ${
                          p.provider === "openart"
                            ? "bg-gold-deep text-paper"
                            : "bg-ink/80 text-paper"
                        }`}
                      >
                        {p.provider === "openart" ? "OpenArt" : "Lovable"}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <div className="font-serif text-lg truncate">{p.title}</div>
                        <div className="eyebrow text-muted-foreground mt-1 truncate">
                          {p.style} · {p.aspect_ratio}
                        </div>
                        {p.model && (
                          <div className="text-[0.65rem] text-muted-foreground mt-1 font-mono truncate">
                            {p.model}{p.external_id ? ` · ${p.external_id.slice(0, 8)}` : ""}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => togglePublish(p)}
                          className="text-xs eyebrow border border-ink px-2 py-1 hover:bg-ink hover:text-paper transition-colors"
                        >
                          {p.is_published ? "Unpublish" : "Publish"}
                        </button>
                        <a
                          href={p.image_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs eyebrow border border-border px-2 py-1 hover:border-ink"
                        >
                          Open
                        </a>
                        <button
                          onClick={() => remove(p)}
                          className="text-xs eyebrow text-destructive hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground line-clamp-2">{p.prompt}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
