import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Link } from "react-router-dom";

interface Painting {
  id: string;
  title: string;
  image_url: string;
  aspect_ratio: string;
  style: string | null;
  price_cents: number | null;
  category_id: string | null;
  created_at: string;
}
interface Category { id: string; slug: string; name: string; sort_order: number; }

export default function Index() {
  const [paintings, setPaintings] = useState<Painting[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [activeCat, setActiveCat] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Velour Walls — Art That Moves The Soul";
    Promise.all([
      supabase.from("paintings")
        .select("id,title,image_url,aspect_ratio,style,price_cents,category_id,created_at")
        .eq("is_published", true).eq("status", "approved")
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("sort_order"),
    ]).then(([p, c]) => {
      setPaintings((p.data ?? []) as Painting[]);
      setCats((c.data ?? []) as Category[]);
      setLoading(false);
    });
  }, []);

  const visible = activeCat === "all" ? paintings : paintings.filter((p) => p.category_id === activeCat);

  const featured = visible[0];
  const rest = visible.slice(1);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader />

      {/* HERO — editorial cover */}
      <section className="max-w-[1400px] mx-auto px-6 md:px-10 pt-16 md:pt-24 pb-20">
        <div className="grid md:grid-cols-12 gap-10 items-end">
          <div className="md:col-span-5">
            <div className="eyebrow text-muted-foreground mb-6">Vol. I — The Atelier</div>
            <h1 className="font-serif text-5xl md:text-7xl leading-[0.95] text-balance">
              Painted by hand.<br />
              <span className="italic text-gold-deep">Rendered in 8K.</span>
            </h1>
            <p className="mt-8 text-base md:text-lg text-muted-foreground max-w-md leading-relaxed">
              Velour Walls — hyper-real fine art on canvas, glass, and acrylic.
              Each piece directed in the private atelier by Naybz, signed, and limited.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/buy"
                className="inline-block px-7 py-3.5 bg-ink text-paper eyebrow hover:bg-gold-deep transition-colors"
              >
                Buy Now
              </Link>
              <Link
                to="/commission"
                className="inline-block px-7 py-3.5 border border-ink eyebrow hover:bg-ink hover:text-paper transition-colors"
              >
                Commission a piece
              </Link>
            </div>
          </div>

          <div className="md:col-span-7">
            {featured ? (
              <Link to={`/piece/${featured.id}`} className="group block relative overflow-hidden shadow-press">
                <img
                  src={featured.image_url}
                  alt={featured.title}
                  className="w-full h-[60vh] md:h-[75vh] object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-ink/80 to-transparent text-paper">
                  <div className="eyebrow opacity-70">Featured Work</div>
                  <div className="font-serif text-2xl md:text-3xl mt-1">{featured.title}</div>
                </div>
              </Link>
            ) : (
              <div className="w-full h-[60vh] md:h-[75vh] bg-gradient-ink flex items-center justify-center text-paper/60 font-serif italic text-2xl shadow-press">
                Awaiting first work.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* MANIFESTO STRIP */}
      <section className="bg-ink text-paper py-20">
        <div className="max-w-[1100px] mx-auto px-6 md:px-10 text-center">
          <div className="eyebrow text-gold mb-6">Manifesto</div>
          <p className="font-serif text-3xl md:text-5xl leading-tight text-balance italic">
            "Art is not made to decorate walls.<br />
            It is made to move the soul."
          </p>
          <div className="eyebrow text-paper/60 mt-8">— Naybz, Velour Walls</div>
        </div>
      </section>

      {/* GALLERY GRID */}
      <section id="gallery" className="max-w-[1400px] mx-auto px-6 md:px-10 py-24">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="eyebrow text-muted-foreground mb-3">The Collection</div>
            <h2 className="font-serif text-4xl md:text-5xl">Selected Works</h2>
          </div>
          <div className="text-sm text-muted-foreground hidden md:block">
            {paintings.length} {paintings.length === 1 ? "piece" : "pieces"}
          </div>
        </div>

        {cats.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-10">
            <button onClick={() => setActiveCat("all")}
              className={`eyebrow text-xs px-4 py-2 transition-colors ${activeCat === "all" ? "bg-ink text-paper" : "border border-border hover:border-ink"}`}>
              All
            </button>
            {cats.map((c) => {
              const n = paintings.filter((p) => p.category_id === c.id).length;
              if (n === 0) return null;
              return (
                <button key={c.id} onClick={() => setActiveCat(c.id)}
                  className={`eyebrow text-xs px-4 py-2 transition-colors ${activeCat === c.id ? "bg-ink text-paper" : "border border-border hover:border-ink"}`}>
                  {c.name} <span className="opacity-60 ml-1">{n}</span>
                </button>
              );
            })}
          </div>
        )}

        {loading ? (
          <div className="text-muted-foreground">Loading collection…</div>
        ) : rest.length === 0 && !featured ? (
          <div className="border border-dashed border-border p-16 text-center text-muted-foreground">
            <p className="font-serif text-2xl italic mb-2">The atelier is preparing.</p>
            <p>Pieces will be released here as they are completed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {rest.map((p, i) => (
              <Link
                to={`/piece/${p.id}`}
                key={p.id}
                className={`group block ${i % 5 === 0 ? "lg:col-span-2" : ""}`}
              >
                <div className="overflow-hidden shadow-frame mb-5 bg-secondary">
                  <img
                    src={p.image_url}
                    alt={p.title}
                    className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                </div>
                <div className="flex justify-between items-baseline">
                  <div>
                    <div className="font-serif text-xl">{p.title}</div>
                    {p.style && (
                      <div className="eyebrow text-muted-foreground mt-1">{p.style}</div>
                    )}
                  </div>
                  {p.price_cents != null && (
                    <div className="font-serif text-lg text-gold-deep">
                      ${(p.price_cents / 100).toLocaleString()}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
