import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { toast } from "sonner";

interface Painting {
  id: string;
  title: string;
  image_url: string;
  aspect_ratio: string;
  style: string | null;
  price_cents: number | null;
}

const FINISHES = [
  {
    name: "Gallery Canvas",
    desc: "Hand-stretched cotton canvas, museum-wrapped on a kiln-dried frame. Ready to hang.",
    sizes: ["18×24″ — $189", "24×36″ — $289", "40×60″ — $549"],
    badge: "Bestseller",
  },
  {
    name: "Tempered Glass",
    desc: "UV-printed onto 6mm tempered glass with float mounts. Mirror-finish depth.",
    sizes: ["20×30″ — $329", "30×45″ — $499", "48×72″ — $899"],
    badge: "Premium",
  },
  {
    name: "Acrylic Face-Mount",
    desc: "1/4″ acrylic face-mount with dibond backing. Gallery-grade clarity.",
    sizes: ["20×30″ — $349", "30×45″ — $529", "48×72″ — $949"],
    badge: "Editor's pick",
  },
];

export default function Buy() {
  const [paintings, setPaintings] = useState<Painting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Painting | null>(null);
  const [finish, setFinish] = useState(FINISHES[0].name);
  const [size, setSize] = useState(FINISHES[0].sizes[0]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    document.title = "Buy Now — Velour Walls";
    supabase
      .from("paintings")
      .select("id,title,image_url,aspect_ratio,style,price_cents")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setPaintings(data ?? []);
        setLoading(false);
      });
  }, []);

  const order = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) {
      toast.error("Choose a piece first.");
      return;
    }
    const subject = `Velour Walls Order — ${selected.title}`;
    const body =
      `Piece: ${selected.title} (${selected.id})\n` +
      `Finish: ${finish}\n` +
      `Size: ${size}\n\n` +
      `Name: ${name}\nEmail: ${email}\n\nShipping address:\n${address}`;
    window.location.href = `mailto:orders@velourwalls.art?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    toast.success("Order draft opened. Send the email to confirm.");
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader />

      {/* HERO */}
      <section className="max-w-[1400px] mx-auto px-6 md:px-10 pt-16 pb-12">
        <div className="eyebrow text-muted-foreground mb-4">Ready To Ship</div>
        <h1 className="font-serif text-5xl md:text-6xl leading-[1] text-balance max-w-3xl">
          Buy a Velour Walls original.{" "}
          <span className="italic text-gold-deep">Printed on canvas, glass, or acrylic.</span>
        </h1>
        <p className="mt-6 text-muted-foreground max-w-2xl">
          Pick a piece, choose a finish and size. Orders are produced by our gallery-grade
          print partner and ship within 5–7 business days.
        </p>
      </section>

      {/* PIECE PICKER */}
      <section className="max-w-[1400px] mx-auto px-6 md:px-10 pb-16">
        <div className="eyebrow text-muted-foreground mb-4">01 · Choose your piece</div>
        {loading ? (
          <div className="text-muted-foreground">Loading collection…</div>
        ) : paintings.length === 0 ? (
          <div className="border border-dashed border-border p-12 text-center text-muted-foreground">
            <p className="font-serif text-2xl italic mb-2">No pieces published yet.</p>
            <Link to="/commission" className="eyebrow text-gold-deep">
              Commission one →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {paintings.map((p) => {
              const active = selected?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className={`text-left group overflow-hidden border-2 transition-all ${
                    active ? "border-gold-deep shadow-press" : "border-transparent hover:border-ink"
                  }`}
                >
                  <div className="overflow-hidden bg-secondary">
                    <img
                      src={p.image_url}
                      alt={p.title}
                      loading="lazy"
                      className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-3 bg-card">
                    <div className="font-serif text-base truncate">{p.title}</div>
                    {p.style && (
                      <div className="eyebrow text-muted-foreground mt-1 truncate">{p.style}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* FINISHES */}
      <section className="bg-secondary/40 py-16">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="eyebrow text-muted-foreground mb-4">02 · Choose your finish</div>
          <div className="grid md:grid-cols-3 gap-6">
            {FINISHES.map((f) => {
              const active = finish === f.name;
              return (
                <button
                  key={f.name}
                  onClick={() => {
                    setFinish(f.name);
                    setSize(f.sizes[0]);
                  }}
                  className={`text-left p-6 border-2 bg-card transition-all ${
                    active ? "border-gold-deep shadow-frame" : "border-border hover:border-ink"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-serif text-2xl">{f.name}</div>
                    <span className="eyebrow text-gold-deep text-[0.6rem]">{f.badge}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{f.desc}</p>
                  <ul className="space-y-1 text-sm">
                    {f.sizes.map((s) => (
                      <li
                        key={s}
                        className={`hairline pt-2 ${
                          active && size === s ? "text-gold-deep font-medium" : ""
                        }`}
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          {/* SIZE PICKER */}
          <div className="mt-8">
            <div className="eyebrow text-muted-foreground mb-2">03 · Size</div>
            <div className="flex flex-wrap gap-3">
              {FINISHES.find((f) => f.name === finish)?.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`px-4 py-2 border eyebrow text-xs transition-colors ${
                    size === s
                      ? "bg-ink text-paper border-ink"
                      : "border-border hover:border-ink"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ORDER FORM */}
      <section className="max-w-3xl mx-auto px-6 md:px-10 py-20">
        <div className="eyebrow text-muted-foreground mb-4">04 · Place your order</div>
        <h2 className="font-serif text-3xl mb-6">Ship it to me.</h2>

        {selected && (
          <div className="flex gap-4 items-center border border-border p-4 mb-6 bg-card">
            <img src={selected.image_url} alt={selected.title} className="w-20 h-20 object-cover" />
            <div className="flex-1">
              <div className="font-serif text-lg">{selected.title}</div>
              <div className="eyebrow text-muted-foreground text-[0.65rem] mt-1">
                {finish} · {size}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={order} className="space-y-4">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-ink"
          />
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-ink"
          />
          <textarea
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={4}
            placeholder="Shipping address"
            className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-ink resize-none"
          />
          <button
            disabled={!selected}
            className="w-full bg-ink text-paper eyebrow py-4 hover:bg-gold-deep transition-colors disabled:opacity-50"
          >
            {selected ? "Place order" : "Choose a piece first"}
          </button>
          <p className="text-xs text-muted-foreground text-center">
            Orders are reviewed by the studio and an invoice is sent within 24 hours.
            Payment by card, bank transfer, or wire.
          </p>
        </form>
      </section>

      <SiteFooter />
    </div>
  );
}
