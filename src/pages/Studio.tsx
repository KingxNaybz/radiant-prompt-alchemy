import { useEffect, useMemo, useState } from "react";
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
const AFFIRMATION_STYLES = [
  "elegant gold-leaf script",
  "hand-painted brushed serif",
  "neon glow signage",
  "graffiti spray-paint",
  "embroidered thread on velvet",
  "carved into stone",
  "smoke and mist lettering",
  "chrome liquid metal",
  "vintage tattoo flash",
  "celestial constellation stars",
];

interface Category { id: string; slug: string; name: string; sort_order: number; }
interface Painting {
  id: string; title: string; prompt: string; style: string | null;
  aspect_ratio: string; image_url: string; is_published: boolean;
  price_cents: number | null; provider: string | null; model: string | null;
  external_id: string | null; created_at: string;
  category_id: string | null; status: string; auto_suggested: boolean;
  source_image_url: string | null; etsy_listing_id: string | null;
  pinterest_pin_id: string | null; tags: string[] | null;
}
interface Idea { title: string; prompt: string; style?: string; category_slug?: string; aspect_ratio?: string; }

type Tab = "create" | "remix" | "inspire" | "mass" | "pending" | "library" | "marketplace";

function getFunctionErrorMessage(error: unknown, data: unknown) {
  const payloadError = (data as { error?: unknown } | null)?.error;
  if (typeof payloadError === "string") return payloadError;

  const context = (error as { context?: string } | null)?.context;
  if (typeof context === "string") {
    try {
      const parsed = JSON.parse(context);
      if (typeof parsed?.error === "string") return parsed.error;
    } catch {
      return context;
    }
  }

  const message = (error as { message?: string } | null)?.message;
  return typeof message === "string" ? message : "Failed";
}

export default function Studio() {
  const { user, isOwner, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("create");
  const [cats, setCats] = useState<Category[]>([]);
  const [works, setWorks] = useState<Painting[]>([]);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Atelier — Velour Walls";
    if (isOwner) { refreshCats(); refresh(); }
  }, [isOwner]);

  const refreshCats = async () => {
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setCats((data ?? []) as Category[]);
  };
  const refresh = async () => {
    const { data } = await supabase.from("paintings").select("*").order("created_at", { ascending: false });
    setWorks((data ?? []) as Painting[]);
  };

  if (loading) return <div className="min-h-screen bg-paper" />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isOwner) return (
    <div className="min-h-screen bg-paper">
      <SiteHeader />
      <div className="max-w-xl mx-auto py-32 px-6 text-center">
        <h1 className="font-serif text-4xl mb-3">Atelier locked</h1>
        <p className="text-muted-foreground">Reserved for the owner of Velour Walls.</p>
      </div>
    </div>
  );

  const pending = works.filter((w) => w.status === "pending_approval");
  const approved = works.filter((w) => w.status === "approved");

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader />
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-10">
        <div className="flex items-end justify-between mb-2 flex-wrap gap-4">
          <div>
            <div className="eyebrow text-muted-foreground mb-2">Atelier · Private</div>
            <h1 className="font-serif text-4xl md:text-5xl">Naybz Studio</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-lg">
              Create with Naybz, remix anything, review auto-suggestions, and push approved works to your storefronts.
            </p>
          </div>
          <div className="flex flex-wrap gap-1 border border-border bg-card p-1">
            {([
              ["create", "Create"],
              ["remix", "Remix"],
              ["inspire", "Inspire"],
              ["mass", "Mass Produce"],
              ["pending", `Pending (${pending.length})`],
              ["library", `Library (${approved.length})`],
              ["marketplace", "Marketplace"],
            ] as [Tab, string][]).map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)}
                className={`eyebrow px-4 py-2 transition-colors ${tab === t ? "bg-ink text-paper" : "hover:bg-secondary"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {errorBanner && (
          <div className="mt-6 border-l-4 border-destructive bg-destructive/5 p-4 text-sm">
            <div className="eyebrow text-destructive mb-1">Engine error</div>
            <p>{errorBanner}</p>
          </div>
        )}

        <div className="mt-8">
          {tab === "create" && <CreateTab cats={cats} onDone={refresh} setError={setErrorBanner} />}
          {tab === "remix" && <RemixTab cats={cats} onDone={refresh} setError={setErrorBanner} />}
          {tab === "inspire" && <InspireTab cats={cats} onDone={refresh} />}
          {tab === "mass" && <MassProduceTab cats={cats} onDone={refresh} />}
          {tab === "pending" && <PendingTab works={pending} cats={cats} onChange={refresh} />}
          {tab === "library" && <LibraryTab works={approved} cats={cats} onChange={refresh} onCatsChange={refreshCats} />}
          {tab === "marketplace" && <MarketplaceTab works={approved} onChange={refresh} />}
        </div>
      </div>
    </div>
  );
}

/* ---------------- CREATE ---------------- */
function CreateTab({ cats, onDone, setError }: { cats: Category[]; onDone: () => void; setError: (e: string | null) => void; }) {
  const [prompt, setPrompt] = useState(""); const [title, setTitle] = useState("");
  const [style, setStyle] = useState(STYLES[0]); const [ratio, setRatio] = useState("1:1");
  const [provider, setProvider] = useState<"lovable" | "openart">("lovable");
  const [publish, setPublish] = useState(false); const [loading, setLoading] = useState(false);
  const [categoryId, setCategoryId] = useState<string>("");
  const [affirmation, setAffirmation] = useState(""); const [affStyle, setAffStyle] = useState(AFFIRMATION_STYLES[0]);

  const paint = async () => {
    setError(null);
    if (prompt.trim().length < 3) return toast.error("Describe the piece.");
    if (provider === "openart") {
      const message = 'OpenArt generation is not available from this Studio yet. Switch the Engine to "Lovable AI" to generate here.';
      setError(message);
      return toast.error(message);
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("paint", {
        body: {
          prompt, title, style, aspect_ratio: ratio, provider, publish, mode: "create",
          category_id: categoryId || null,
          affirmation: affirmation.trim() || undefined,
          affirmation_style: affirmation.trim() ? affStyle : undefined,
        },
      });
      if (error || (data as any)?.error) {
        const msg = getFunctionErrorMessage(error, data) ?? "Failed to paint.";
        setError(msg);
        toast.error(msg);
        return;
      }
      toast.success("Naybz finished a new piece.");
      setPrompt(""); setTitle(""); setAffirmation(""); onDone();
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="grid lg:grid-cols-12 gap-8">
      <div className="lg:col-span-5 space-y-3 border border-border p-6 bg-card">
        <div className="eyebrow text-muted-foreground">New original</div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)"
          className="w-full bg-transparent border-b border-border py-2 focus:outline-none focus:border-ink font-serif text-lg" />
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={6}
          placeholder="A woman in profile, half her face dripping in liquid gold…"
          className="w-full bg-transparent border border-border p-3 text-sm focus:outline-none focus:border-ink resize-none" />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Category" value={categoryId} onChange={setCategoryId}>
            <option value="">Uncategorized</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select label="Style" value={style} onChange={setStyle}>
            {STYLES.map((s) => <option key={s}>{s}</option>)}
          </Select>
          <Select label="Format" value={ratio} onChange={setRatio}>
            {RATIOS.map((r) => <option key={r}>{r}</option>)}
          </Select>
          <Select label="Engine" value={provider} onChange={(v) => setProvider(v as any)}>
            <option value="lovable">Lovable AI</option>
            <option value="openart">OpenArt</option>
          </Select>
        </div>
        <div className="flex items-center justify-between border border-border bg-secondary/40 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Active engine</span>
          <span className="eyebrow border border-border px-2 py-1">
            {provider === "lovable" ? "Lovable AI" : "OpenArt"}
          </span>
        </div>
        {provider === "openart" && (
          <div className="border-l-4 border-destructive bg-destructive/5 p-3 text-sm">
            OpenArt generation is not available from this Studio yet. Use Lovable AI to paint here.
          </div>
        )}
        <div className="border border-border bg-secondary/30 p-3 space-y-2">
          <div className="eyebrow text-[0.65rem] text-gold-deep">Affirmation (optional)</div>
          <input value={affirmation} onChange={(e) => setAffirmation(e.target.value)}
            placeholder='e.g. "Stay golden." — woven into the art'
            className="w-full bg-transparent border-b border-border py-1.5 text-sm focus:outline-none focus:border-ink" />
          {affirmation.trim() && (
            <Select label="Lettering style" value={affStyle} onChange={setAffStyle}>
              {AFFIRMATION_STYLES.map((s) => <option key={s}>{s}</option>)}
            </Select>
          )}
          <p className="text-[0.7rem] text-muted-foreground italic">
            Naybz will paint these words into the piece — gold leaf, neon, smoke, embroidery — never as a watermark.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm pt-2">
          <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
          Publish to public gallery immediately
        </label>
        <button onClick={paint} disabled={loading}
          className="w-full bg-ink text-paper eyebrow py-3.5 hover:bg-gold-deep transition-colors disabled:opacity-60">
          {loading ? "Naybz is painting…" : "Paint it"}
        </button>
      </div>
      <div className="lg:col-span-7 border border-dashed border-border p-12 text-center text-muted-foreground self-start">
        <p className="font-serif italic text-2xl">Naybz, your personal painter.</p>
        <p className="mt-2 text-sm">Describe a vision. He renders it in 8K and files it under the right category.</p>
      </div>
    </div>
  );
}

/* ---------------- REMIX ---------------- */
function RemixTab({ cats, onDone, setError }: { cats: Category[]; onDone: () => void; setError: (e: string | null) => void; }) {
  const [sourceUrl, setSourceUrl] = useState(""); const [file, setFile] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(""); const [title, setTitle] = useState("");
  const [style, setStyle] = useState(STYLES[0]); const [ratio, setRatio] = useState("1:1");
  const [categoryId, setCategoryId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [affirmation, setAffirmation] = useState(""); const [affStyle, setAffStyle] = useState(AFFIRMATION_STYLES[0]);

  const onFile = (f?: File | null) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setFile(reader.result as string);
    reader.readAsDataURL(f);
  };
  const source = file || sourceUrl;

  const remix = async () => {
    setError(null);
    if (!source) return toast.error("Provide an image (URL or upload).");
    if (prompt.trim().length < 3) return toast.error("Describe the transformation.");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("paint", {
        body: {
          prompt, title, style, aspect_ratio: ratio, mode: "remix",
          source_image_url: source, category_id: categoryId || null,
          affirmation: affirmation.trim() || undefined,
          affirmation_style: affirmation.trim() ? affStyle : undefined,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("Remix complete.");
      setPrompt(""); setTitle(""); setFile(null); setSourceUrl(""); setAffirmation(""); onDone();
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="grid lg:grid-cols-12 gap-8">
      <div className="lg:col-span-5 space-y-3 border border-border p-6 bg-card">
        <div className="eyebrow text-muted-foreground">Find online & remix</div>
        <input value={sourceUrl} onChange={(e) => { setSourceUrl(e.target.value); setFile(null); }}
          placeholder="Paste image URL…"
          className="w-full bg-transparent border border-border p-2.5 text-sm focus:outline-none focus:border-ink" />
        <div className="text-xs text-muted-foreground text-center">— or —</div>
        <label className="block border border-dashed border-border p-4 text-sm text-center cursor-pointer hover:border-ink">
          {file ? "Change file…" : "Upload image"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)"
          className="w-full bg-transparent border-b border-border py-2 focus:outline-none focus:border-ink font-serif text-lg" />
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={5}
          placeholder="Reimagine in liquid gold and deep teal velvet, painterly oil texture…"
          className="w-full bg-transparent border border-border p-3 text-sm focus:outline-none focus:border-ink resize-none" />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Category" value={categoryId} onChange={setCategoryId}>
            <option value="">Uncategorized</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select label="Style" value={style} onChange={setStyle}>
            {STYLES.map((s) => <option key={s}>{s}</option>)}
          </Select>
          <Select label="Format" value={ratio} onChange={setRatio}>
            {RATIOS.map((r) => <option key={r}>{r}</option>)}
          </Select>
        </div>
        <button onClick={remix} disabled={loading}
          className="w-full bg-ink text-paper eyebrow py-3.5 hover:bg-gold-deep transition-colors disabled:opacity-60">
          {loading ? "Remixing…" : "Remix it"}
        </button>
      </div>
      <div className="lg:col-span-7 border border-border bg-card p-4">
        {source ? (
          <img src={source} alt="source" className="w-full h-auto" />
        ) : (
          <div className="aspect-square flex items-center justify-center text-muted-foreground font-serif italic">
            Source preview will appear here.
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- INSPIRE ---------------- */
function InspireTab({ cats, onDone }: { cats: Category[]; onDone: () => void; }) {
  const [query, setQuery] = useState(""); const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false); const [generating, setGenerating] = useState<string | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);

  const search = async () => {
    if (query.trim().length < 2) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("inspire-search", { body: { query } });
      if (error) throw error;
      setIdeas((data as any)?.ideas ?? []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const paintIdea = async (idea: Idea) => {
    setGenerating(idea.title);
    try {
      const { data, error } = await supabase.functions.invoke("paint", {
        body: {
          prompt: idea.prompt, title: idea.title, style: idea.style,
          aspect_ratio: idea.aspect_ratio ?? "1:1", mode: "create",
          category_slug: idea.category_slug,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(`Painted: ${idea.title}`);
      onDone();
    } catch (e: any) { toast.error(e.message); }
    finally { setGenerating(null); }
  };

  const batchSuggest = async () => {
    setBatchLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-art", { body: { count: 3 } });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(`${(data as any).created} new suggestions awaiting approval.`);
      onDone();
    } catch (e: any) { toast.error(e.message); }
    finally { setBatchLoading(false); }
  };

  return (
    <div className="space-y-8">
      <div className="border border-border bg-card p-6">
        <div className="eyebrow text-muted-foreground mb-3">Inspire me</div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={batchSuggest} disabled={batchLoading}
            className="bg-ink text-paper eyebrow px-5 py-3 hover:bg-gold-deep transition-colors disabled:opacity-60">
            {batchLoading ? "Generating…" : "Auto-suggest 3 new pieces"}
          </button>
          <span className="text-sm text-muted-foreground self-center">Sent to Pending for your approval.</span>
        </div>
      </div>

      <div className="border border-border bg-card p-6">
        <div className="eyebrow text-muted-foreground mb-3">Search concepts</div>
        <div className="flex gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="e.g. moody NBA portraits, golden hour wildlife…"
            className="flex-1 bg-transparent border border-border p-3 focus:outline-none focus:border-ink" />
          <button onClick={search} disabled={loading}
            className="border border-ink eyebrow px-5 hover:bg-ink hover:text-paper transition-colors disabled:opacity-60">
            {loading ? "…" : "Search"}
          </button>
        </div>
        {ideas.length > 0 && (
          <div className="mt-6 grid md:grid-cols-2 gap-4">
            {ideas.map((idea, i) => (
              <div key={i} className="border border-border p-4">
                <div className="flex justify-between gap-2">
                  <div className="font-serif text-lg">{idea.title}</div>
                  <span className="eyebrow text-[0.6rem] text-gold-deep">{idea.category_slug}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{idea.prompt}</p>
                <button onClick={() => paintIdea(idea)} disabled={generating === idea.title}
                  className="mt-3 w-full bg-ink text-paper eyebrow py-2 text-xs hover:bg-gold-deep transition-colors disabled:opacity-60">
                  {generating === idea.title ? "Painting…" : "Paint this"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- PENDING ---------------- */
function PendingTab({ works, cats, onChange }: { works: Painting[]; cats: Category[]; onChange: () => void; }) {
  const approve = async (p: Painting, publish = false) => {
    const { error } = await supabase.from("paintings").update({ status: "approved", is_published: publish }).eq("id", p.id);
    if (error) toast.error(error.message); else { toast.success(publish ? "Approved & published." : "Approved."); onChange(); }
  };
  const reject = async (p: Painting) => {
    const { error } = await supabase.from("paintings").update({ status: "rejected" }).eq("id", p.id);
    if (error) toast.error(error.message); else { toast.success("Rejected."); onChange(); }
  };
  const updateCat = async (p: Painting, categoryId: string) => {
    await supabase.from("paintings").update({ category_id: categoryId || null }).eq("id", p.id);
    onChange();
  };

  if (works.length === 0) return (
    <div className="border border-dashed border-border p-16 text-center text-muted-foreground">
      <p className="font-serif italic text-2xl">Nothing pending.</p>
      <p className="text-sm mt-2">Use Inspire to auto-generate suggestions.</p>
    </div>
  );

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {works.map((p) => (
        <div key={p.id} className="border border-border bg-card overflow-hidden">
          <img src={p.image_url} alt={p.title} className="w-full h-auto" />
          <div className="p-4 space-y-3">
            <div className="font-serif text-lg">{p.title}</div>
            <p className="text-xs text-muted-foreground line-clamp-3">{p.prompt}</p>
            <select value={p.category_id ?? ""} onChange={(e) => updateCat(p, e.target.value)}
              className="w-full bg-transparent border border-border p-2 text-xs focus:outline-none focus:border-ink">
              <option value="">Uncategorized</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => approve(p, false)} className="border border-ink eyebrow text-xs py-2 hover:bg-ink hover:text-paper transition-colors">Approve</button>
              <button onClick={() => approve(p, true)} className="bg-gold-deep text-paper eyebrow text-xs py-2 hover:opacity-90">Approve+Publish</button>
              <button onClick={() => reject(p)} className="border border-destructive text-destructive eyebrow text-xs py-2 hover:bg-destructive hover:text-destructive-foreground transition-colors">Reject</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- LIBRARY ---------------- */
function LibraryTab({ works, cats, onChange, onCatsChange }: {
  works: Painting[]; cats: Category[]; onChange: () => void; onCatsChange: () => void;
}) {
  const [filter, setFilter] = useState<string>("all");
  const [newCat, setNewCat] = useState("");

  const grouped = useMemo(() => {
    const filtered = filter === "all" ? works : filter === "uncategorized" ? works.filter((w) => !w.category_id) : works.filter((w) => w.category_id === filter);
    const groups = new Map<string, Painting[]>();
    for (const c of cats) groups.set(c.id, []);
    groups.set("__none", []);
    for (const w of filtered) groups.get(w.category_id ?? "__none")?.push(w);
    return groups;
  }, [works, cats, filter]);

  const togglePublish = async (p: Painting) => {
    await supabase.from("paintings").update({ is_published: !p.is_published }).eq("id", p.id);
    onChange();
  };
  const remove = async (p: Painting) => {
    if (!confirm(`Delete "${p.title}"?`)) return;
    await supabase.from("paintings").delete().eq("id", p.id);
    onChange();
  };
  const moveCat = async (p: Painting, cid: string) => {
    await supabase.from("paintings").update({ category_id: cid || null }).eq("id", p.id);
    onChange();
  };
  const addCategory = async () => {
    if (!newCat.trim()) return;
    const slug = newCat.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const { error } = await supabase.from("categories").insert({ name: newCat.trim(), slug, sort_order: 999 });
    if (error) toast.error(error.message); else { setNewCat(""); onCatsChange(); }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3 items-center justify-between border border-border bg-card p-4">
        <div className="flex flex-wrap gap-2">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>All ({works.length})</FilterChip>
          {cats.map((c) => {
            const n = works.filter((w) => w.category_id === c.id).length;
            return <FilterChip key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)}>{c.name} ({n})</FilterChip>;
          })}
          <FilterChip active={filter === "uncategorized"} onClick={() => setFilter("uncategorized")}>
            Uncategorized ({works.filter((w) => !w.category_id).length})
          </FilterChip>
        </div>
        <div className="flex gap-2">
          <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New category…"
            className="bg-transparent border border-border px-3 py-1.5 text-sm focus:outline-none focus:border-ink" />
          <button onClick={addCategory} className="eyebrow border border-ink px-3 py-1.5 text-xs hover:bg-ink hover:text-paper transition-colors">Add</button>
        </div>
      </div>

      {[...cats, { id: "__none", slug: "__none", name: "Uncategorized", sort_order: 9999 }].map((c) => {
        const items = grouped.get(c.id) ?? [];
        if (items.length === 0) return null;
        return (
          <section key={c.id}>
            <h3 className="font-serif text-2xl mb-4 flex items-baseline gap-3">
              {c.name} <span className="eyebrow text-muted-foreground text-xs">{items.length}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((p) => (
                <div key={p.id} className="border border-border bg-card overflow-hidden">
                  <div className="relative">
                    <img src={p.image_url} alt={p.title} className="w-full h-auto" />
                    {!p.is_published && <span className="absolute top-3 left-3 eyebrow bg-ink text-paper px-2 py-1 text-[0.6rem]">Private</span>}
                    {p.auto_suggested && <span className="absolute top-3 right-3 eyebrow bg-gold-deep text-paper px-2 py-1 text-[0.6rem]">Suggested</span>}
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="font-serif text-lg truncate">{p.title}</div>
                    <select value={p.category_id ?? ""} onChange={(e) => moveCat(p, e.target.value)}
                      className="w-full bg-transparent border border-border p-1.5 text-xs focus:outline-none focus:border-ink">
                      <option value="">Uncategorized</option>
                      {cats.map((cc) => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <button onClick={() => togglePublish(p)} className="flex-1 text-xs eyebrow border border-ink py-1.5 hover:bg-ink hover:text-paper transition-colors">
                        {p.is_published ? "Unpublish" : "Publish"}
                      </button>
                      <button onClick={() => remove(p)} className="text-xs eyebrow text-destructive px-2 hover:underline">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/* ---------------- MARKETPLACE ---------------- */
function MarketplaceTab({ works, onChange }: { works: Painting[]; onChange: () => void; }) {
  const published = works.filter((w) => w.is_published);

  const exportEtsy = (p: Painting) => {
    const url = `https://www.etsy.com/your/shops/me/tools/listings/create?title=${encodeURIComponent(p.title)}&description=${encodeURIComponent(p.prompt)}`;
    window.open(url, "_blank");
    const id = prompt("Paste the new Etsy listing ID (optional):");
    if (id) supabase.from("paintings").update({ etsy_listing_id: id }).eq("id", p.id).then(onChange);
  };
  const pinPinterest = (p: Painting) => {
    const url = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(window.location.origin + "/piece/" + p.id)}&media=${encodeURIComponent(p.image_url)}&description=${encodeURIComponent(p.title + " — Velour Walls")}`;
    window.open(url, "_blank");
    const id = prompt("Paste the new Pinterest pin ID (optional):");
    if (id) supabase.from("paintings").update({ pinterest_pin_id: id }).eq("id", p.id).then(onChange);
  };

  return (
    <div className="space-y-6">
      <div className="border border-border bg-card p-6">
        <div className="eyebrow text-muted-foreground mb-2">Storefronts</div>
        <p className="text-sm">Push approved & published works to Etsy and Pinterest. Each button opens the platform pre-filled — paste back the listing/pin ID to track it here.</p>
      </div>
      {published.length === 0 ? (
        <div className="border border-dashed border-border p-16 text-center text-muted-foreground">
          <p className="font-serif italic text-2xl">No published works yet.</p>
          <p className="text-sm mt-2">Publish from Library first.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {published.map((p) => (
            <div key={p.id} className="border border-border bg-card overflow-hidden">
              <img src={p.image_url} alt={p.title} className="w-full h-auto" />
              <div className="p-4 space-y-3">
                <div className="font-serif text-lg truncate">{p.title}</div>
                <div className="flex gap-2 text-[0.6rem]">
                  <span className={`eyebrow px-2 py-1 ${p.etsy_listing_id ? "bg-ink text-paper" : "border border-border text-muted-foreground"}`}>
                    Etsy {p.etsy_listing_id ? "✓" : ""}
                  </span>
                  <span className={`eyebrow px-2 py-1 ${p.pinterest_pin_id ? "bg-gold-deep text-paper" : "border border-border text-muted-foreground"}`}>
                    Pinterest {p.pinterest_pin_id ? "✓" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => exportEtsy(p)} className="border border-ink eyebrow text-xs py-2 hover:bg-ink hover:text-paper transition-colors">Push to Etsy</button>
                  <button onClick={() => pinPinterest(p)} className="border border-gold-deep text-gold-deep eyebrow text-xs py-2 hover:bg-gold-deep hover:text-paper transition-colors">Pin to Pinterest</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- MASS PRODUCE ---------------- */
function MassProduceTab({ cats, onDone }: { cats: Category[]; onDone: () => void; }) {
  const [categorySlug, setCategorySlug] = useState<string>(cats[0]?.slug ?? "");
  const [count, setCount] = useState<number>(10);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; created: number }>({ done: 0, total: 0, created: 0 });

  useEffect(() => {
    if (!categorySlug && cats[0]?.slug) setCategorySlug(cats[0].slug);
  }, [cats, categorySlug]);

  const run = async () => {
    if (!categorySlug) return toast.error("Pick a category.");
    const total = Math.min(Math.max(count, 1), 50);
    const chunkSize = 5;
    setRunning(true);
    setProgress({ done: 0, total, created: 0 });
    let createdTotal = 0;
    try {
      let remaining = total;
      while (remaining > 0) {
        const c = Math.min(chunkSize, remaining);
        const { data, error } = await supabase.functions.invoke("suggest-art", {
          body: { count: c, category_slug: categorySlug },
        });
        if (error || (data as any)?.error) {
          const msg = getFunctionErrorMessage(error, data);
          toast.error(msg);
          break;
        }
        const created = (data as any)?.created ?? 0;
        createdTotal += created;
        remaining -= c;
        setProgress({ done: total - remaining, total, created: createdTotal });
        onDone();
      }
      toast.success(`Mass produce complete — ${createdTotal} new pieces awaiting approval.`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setRunning(false);
    }
  };

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="border border-border bg-card p-6 space-y-4">
        <div>
          <div className="eyebrow text-muted-foreground mb-1">Mass produce a themed batch</div>
          <p className="text-sm text-muted-foreground">
            Paint many pieces in a single category in one go — sports stays with sports, abstract with abstract.
            Every piece lands in <span className="text-ink">Pending</span> for your approval.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <Select label="Category / Theme" value={categorySlug} onChange={setCategorySlug}>
            {cats.length === 0 && <option value="">No categories</option>}
            {cats.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </Select>
          <div>
            <label className="eyebrow text-muted-foreground text-[0.6rem]">How many</label>
            <input type="number" min={1} max={50} value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              className="w-full bg-transparent border border-border p-2.5 mt-1 focus:outline-none focus:border-ink text-sm" />
          </div>
          <div className="flex items-end">
            <button onClick={run} disabled={running || cats.length === 0}
              className="w-full bg-ink text-paper eyebrow py-3 hover:bg-gold-deep transition-colors disabled:opacity-60">
              {running ? `Painting ${progress.done}/${progress.total}…` : `Paint ${count} pieces`}
            </button>
          </div>
        </div>
        {running && (
          <div className="space-y-2">
            <div className="h-2 bg-secondary border border-border overflow-hidden">
              <div className="h-full bg-gold-deep transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="text-xs text-muted-foreground flex justify-between">
              <span>{progress.done} of {progress.total} processed</span>
              <span>{progress.created} created so far</span>
            </div>
          </div>
        )}
        <p className="text-xs text-muted-foreground border-t border-border pt-3">
          Tip: large batches run in chunks of 5 behind the scenes. Heavy batches may take a few minutes — keep this tab open.
        </p>
      </div>
    </div>
  );
}

/* ---------------- helpers ---------------- */
function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode; }) {
  return (
    <div>
      <label className="eyebrow text-muted-foreground text-[0.6rem]">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent border border-border p-2.5 mt-1 focus:outline-none focus:border-ink text-sm">
        {children}
      </select>
    </div>
  );
}
function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode; }) {
  return (
    <button onClick={onClick}
      className={`eyebrow text-xs px-3 py-1.5 transition-colors ${active ? "bg-ink text-paper" : "border border-border hover:border-ink"}`}>
      {children}
    </button>
  );
}
