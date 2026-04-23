import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SignedImage from "@/components/SignedImage";
import { toast } from "sonner";
import { FINISHES, priceFor, formatPrice, startingPriceCents } from "@/lib/pricing";

interface Painting {
  id: string;
  title: string;
  image_url: string;
  aspect_ratio: string;
  style: string | null;
  price_cents: number | null;
}

export default function Buy() {
  const [paintings, setPaintings] = useState<Painting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Painting | null>(null);
  const [finish, setFinish] = useState(FINISHES[0].name);
  const [size, setSize] = useState(FINISHES[0].sizes[0].label);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "wire">("card");
  const [submitting, setSubmitting] = useState(false);

  const currentPriceCents = priceFor(finish, size);

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

  const order = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) {
      toast.error("Choose a piece first.");
      return;
    }
    setSubmitting(true);
    const payload = {
      paintingId: selected.id,
      paintingTitle: selected.title,
      finish,
      size,
      amountCents: currentPriceCents,
      customerName: name,
      customerEmail: email,
      shippingAddress: address,
    };

    try {
      if (paymentMethod === "card") {
        const { data, error } = await supabase.functions.invoke(
          "create-checkout-session",
          { body: { ...payload, origin: window.location.origin } },
        );
        if (error) throw error;
        if (!data?.url) throw new Error("No checkout URL returned");
        window.location.href = data.url;
      } else {
        const { error } = await supabase.functions.invoke(
          "submit-wire-order",
          { body: payload },
        );
        if (error) throw error;
        toast.success("Order received. The studio will email an invoice within 24 hours.");
        setName(""); setEmail(""); setAddress(""); setSelected(null);
      }
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
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
                    <SignedImage
                      src={p.image_url}
                      alt={p.title}
                      loading="lazy"
                      className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-3 bg-card">
                    <div className="font-serif text-base truncate">{p.title}</div>
                    <div className="flex items-center justify-between mt-1">
                      {p.style ? (
                        <div className="eyebrow text-muted-foreground truncate">{p.style}</div>
                      ) : <span />}
                      <div className="font-serif text-sm text-gold-deep whitespace-nowrap">
                        from {formatPrice(startingPriceCents)}
                      </div>
                    </div>
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
              const fromCents = Math.min(...f.sizes.map((s) => Math.round(s.basePriceCents * f.multiplier)));
              return (
                <button
                  key={f.name}
                  onClick={() => {
                    setFinish(f.name);
                    setSize(f.sizes[0].label);
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
                  <div className="eyebrow text-xs text-muted-foreground mb-2">
                    From <span className="text-gold-deep">{formatPrice(fromCents)}</span>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {f.sizes.map((s) => {
                      const p = Math.round(s.basePriceCents * f.multiplier);
                      const isActive = active && size === s.label;
                      return (
                        <li
                          key={s.label}
                          className={`hairline pt-2 flex justify-between ${
                            isActive ? "text-gold-deep font-medium" : ""
                          }`}
                        >
                          <span>{s.label}</span>
                          <span>{formatPrice(p)}</span>
                        </li>
                      );
                    })}
                  </ul>
                </button>
              );
            })}
          </div>

          {/* SIZE PICKER */}
          <div className="mt-8">
            <div className="eyebrow text-muted-foreground mb-2">03 · Size</div>
            <div className="flex flex-wrap gap-3">
              {FINISHES.find((f) => f.name === finish)?.sizes.map((s) => {
                const p = priceFor(finish, s.label);
                const isActive = size === s.label;
                return (
                  <button
                    key={s.label}
                    onClick={() => setSize(s.label)}
                    className={`px-4 py-2 border eyebrow text-xs transition-colors ${
                      isActive
                        ? "bg-ink text-paper border-ink"
                        : "border-border hover:border-ink"
                    }`}
                  >
                    {s.label} · {formatPrice(p)}
                  </button>
                );
              })}
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
            <div className="font-serif text-2xl text-gold-deep">
              {formatPrice(currentPriceCents)}
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
            {selected ? `Place order · ${formatPrice(currentPriceCents)}` : "Choose a piece first"}
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
