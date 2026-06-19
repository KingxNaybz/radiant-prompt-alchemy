import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SignedImage from "@/components/SignedImage";
import SEO from "@/components/SEO";
import { toast } from "sonner";
import { FINISHES, priceFor, formatPrice, startingPriceCents, SIGNATURE_SURCHARGE_CENTS } from "@/lib/pricing";
import { StripeEmbeddedCheckoutForm } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

interface Painting {
  id: string;
  title: string;
  image_url: string;
  aspect_ratio: string;
  style: string | null;
  price_cents: number | null;
}

export default function Buy() {
  const finishesRef = useRef<HTMLElement | null>(null);
  const orderRef = useRef<HTMLElement | null>(null);
  const [paintings, setPaintings] = useState<Painting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Painting | null>(null);
  const [finish, setFinish] = useState(FINISHES[0].name);
  const [size, setSize] = useState(FINISHES[0].sizes[0].label);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [question, setQuestion] = useState("");
  const [signed, setSigned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const basePriceCents = priceFor(finish, size);
  const currentPriceCents = basePriceCents + (signed ? SIGNATURE_SURCHARGE_CENTS : 0);
  const shippingAddress = [
    addressLine1.trim(),
    addressLine2.trim(),
    `${city.trim()}, ${stateRegion.trim()} ${postalCode.trim()}`.trim(),
    country.trim(),
  ].filter(Boolean).join("\n");
  const orderNotes = [
    signed ? "Add-on: Hand-signed by the artist (+$45)" : null,
    question.trim() ? `Customer question/notes: ${question.trim()}` : null,
  ].filter(Boolean).join("\n");

  const jumpToSection = (section: HTMLElement | null) => {
    if (!section) return;

    window.requestAnimationFrame(() => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const targetTop = section.getBoundingClientRect().top + window.scrollY - 96;

      if (prefersReducedMotion) {
        window.scrollTo({ top: targetTop });
        return;
      }

      const startTop = window.scrollY;
      const distance = targetTop - startTop;
      const duration = 1000;
      const startTime = performance.now();
      const easeInOutCubic = (progress: number) =>
        progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const glide = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        window.scrollTo({ top: startTop + distance * easeInOutCubic(progress) });

        if (progress < 1) {
          window.requestAnimationFrame(glide);
        }
      };

      window.requestAnimationFrame(glide);
    });
  };

  useEffect(() => {
    // Title set via SEO component
    supabase
      .from("paintings")
      .select("id,title,image_url,aspect_ratio,price_cents")
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
    // Open Embedded Checkout — the form mounts and creates the session itself.
    setShowCheckout(true);
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SEO
        title="Buy Now"
        description="Original fine art printed on gallery-grade canvas, tempered glass, or acrylic. Pick a piece, choose your finish. Ships in 5–7 days."
        url="https://velourwalls.art/buy"
      />
      <PaymentTestModeBanner />
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
                  onClick={() => {
                    setSelected(p);
                    jumpToSection(finishesRef.current);
                  }}
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
      <section ref={finishesRef} className="bg-secondary/40 py-16 scroll-mt-24">
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
                  className={`text-left p-6 border-2 bg-card transition-all flex flex-col ${
                    active ? "border-gold-deep shadow-frame" : "border-border hover:border-ink"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-serif text-2xl">{f.name}</div>
                    <span className="eyebrow text-gold-deep text-[0.6rem]">{f.badge}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{f.desc}</p>
                  <div className="mt-auto">
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
                  </div>
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
                    onClick={() => {
                      setSize(s.label);
                      jumpToSection(orderRef.current);
                    }}
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
      <section ref={orderRef} className="max-w-3xl mx-auto px-6 md:px-10 py-20 scroll-mt-24">
        <div className="eyebrow text-muted-foreground mb-4">04 · Place your order</div>
        <h2 className="font-serif text-3xl mb-6">Ship it to me.</h2>

        {selected && (
          <div className="flex gap-4 items-center border border-border p-4 mb-6 bg-card">
            {signed ? (
              <SignedImage
                src={selected.image_url}
                alt={selected.title}
                wrapperClassName="w-20 h-20 shrink-0"
                className="w-20 h-20 object-cover"
                signatureClassName="bottom-1 right-1 text-[6px]"
              />
            ) : (
              <img src={selected.image_url} alt={selected.title} className="w-20 h-20 object-cover" />
            )}
            <div className="flex-1">
              <div className="font-serif text-lg">{selected.title}</div>
              <div className="eyebrow text-muted-foreground text-[0.65rem] mt-1">
                {finish} · {size}
                {signed && <span className="text-gold-deep"> · Hand-signed</span>}
              </div>
            </div>
            <div className="text-right">
              <div className="font-serif text-2xl text-gold-deep">
                {formatPrice(currentPriceCents)}
              </div>
              {signed && (
                <div className="text-[0.65rem] text-muted-foreground mt-0.5">
                  incl. +{formatPrice(SIGNATURE_SURCHARGE_CENTS)} signature
                </div>
              )}
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
          <input
            required
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
            placeholder="Street address"
            className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-ink"
          />
          <input
            value={addressLine2}
            onChange={(e) => setAddressLine2(e.target.value)}
            placeholder="Apartment, suite, unit, etc."
            className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-ink"
          />
          <div className="grid md:grid-cols-3 gap-4">
            <input
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-ink"
            />
            <input
              required
              value={stateRegion}
              onChange={(e) => setStateRegion(e.target.value)}
              placeholder="State"
              className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-ink"
            />
            <input
              required
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="ZIP code"
              className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-ink"
            />
          </div>
          <input
            required
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Country"
            className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-ink"
          />
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={4}
            placeholder="Question or special instructions"
            className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-ink resize-none"
          />

          {/* SIGNATURE ADD-ON — exclusive, opt-in mark of authenticity */}
          <div className="pt-2">
            <div className="eyebrow text-muted-foreground mb-3 text-xs">Artist's mark · optional</div>
            <button
              type="button"
              onClick={() => setSigned((s) => !s)}
              aria-pressed={signed}
              className={`w-full text-left p-5 border-2 transition-all flex items-start gap-4 ${
                signed
                  ? "border-gold-deep bg-card shadow-frame"
                  : "border-border hover:border-ink"
              }`}
            >
              <div
                className={`mt-1 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
                  signed ? "border-gold-deep bg-gold-deep" : "border-border"
                }`}
              >
                {signed && <span className="block h-2 w-2 rounded-full bg-paper" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-serif text-lg">
                    Hand-signed by <span className="italic">the artist</span>
                  </div>
                  <span className="eyebrow text-gold-deep text-[0.6rem] whitespace-nowrap">
                    +{formatPrice(SIGNATURE_SURCHARGE_CENTS)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  A deliberate, personal mark of authenticity — signed by hand in
                  archival ink on the lower right of the finished piece. Reserved for
                  collectors who want the real thing. Off by default, because scarcity is the point.
                </p>
              </div>
            </button>
          </div>

          <button
            disabled={!selected || submitting}
            className="w-full bg-ink text-paper eyebrow py-4 hover:bg-gold-deep transition-colors disabled:opacity-50"
          >
            {!selected
              ? "Choose a piece first"
              : submitting
                ? "Processing…"
                : `Continue to secure checkout · ${formatPrice(currentPriceCents)}`}
          </button>
          <p className="text-xs text-muted-foreground text-center">
            Secure card authorization via Stripe. The studio reviews and matches the best print partner before your card is charged.
          </p>
        </form>

        {/* EMBEDDED STRIPE CHECKOUT */}
        {showCheckout && selected && (
          <div className="mt-8 border border-border bg-card p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="eyebrow text-muted-foreground text-xs">Secure checkout</div>
              <button
                type="button"
                onClick={() => setShowCheckout(false)}
                className="text-xs underline text-muted-foreground hover:text-ink"
              >
                Cancel
              </button>
            </div>
            <StripeEmbeddedCheckoutForm
              paintingId={selected.id}
              paintingTitle={signed ? `${selected.title} (Hand-signed by the artist)` : selected.title}
              finish={finish}
              size={size}
              signed={signed}
              customerName={name}
              customerEmail={email}
              shippingAddress={shippingAddress}
              notes={orderNotes || undefined}
              returnUrl={`${window.location.origin}/order-success`}
            />
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
