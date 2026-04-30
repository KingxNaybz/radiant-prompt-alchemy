import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { FINISHES, formatPrice, startingPriceCents } from "@/lib/pricing";

interface RoomMockup {
  key: string;
  label: string;
  url: string;
}

interface GalleryView {
  key: string;
  label: string;
  url: string;
  isOriginal?: boolean;
}

export default function Piece() {
  const { id } = useParams();
  const [p, setP] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mockups, setMockups] = useState<RoomMockup[]>([]);
  const [generatingMockups, setGeneratingMockups] = useState(false);
  const [activeKey, setActiveKey] = useState<string>("original");

  useEffect(() => {
    if (!id) return;
    supabase
      .from("paintings")
      .select("*")
      .eq("id", id)
      .eq("is_published", true)
      .maybeSingle()
      .then(({ data }) => {
        setP(data);
        setLoading(false);
        if (data) {
          document.title = `${data.title} — Velour Walls`;
          const existing = Array.isArray((data as any).room_mockups)
            ? ((data as any).room_mockups as RoomMockup[])
            : [];
          setMockups(existing);
        }
      });
  }, [id]);

  // Trigger mockup generation in the background once we have the painting
  // and the cached set is incomplete (we expect 3: living room / bedroom / office).
  useEffect(() => {
    if (!p?.id) return;
    if (mockups.length >= 3) return;
    if (generatingMockups) return;

    let cancelled = false;
    setGeneratingMockups(true);
    supabase.functions
      .invoke("generate-room-mockups", { body: { painting_id: p.id } })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data?.mockups) {
          setMockups(data.mockups as RoomMockup[]);
        }
      })
      .finally(() => {
        if (!cancelled) setGeneratingMockups(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p?.id]);

  const views: GalleryView[] = useMemo(() => {
    if (!p) return [];
    return [
      { key: "original", label: "The Actual Print", url: p.image_url, isOriginal: true },
      ...mockups.map((m) => ({ key: m.key, label: m.label, url: m.url })),
    ];
  }, [p, mockups]);

  const activeView = views.find((v) => v.key === activeKey) ?? views[0];

  if (loading) return <div className="min-h-screen bg-paper" />;
  if (!p)
    return (
      <div className="min-h-screen bg-paper">
        <SiteHeader />
        <div className="max-w-2xl mx-auto py-32 px-6 text-center">
          <h1 className="font-serif text-4xl mb-4">Piece not found</h1>
          <Link to="/" className="eyebrow text-gold-deep">← Back to gallery</Link>
        </div>
      </div>
    );

  // Slots for thumbnails: original + up to 3 room mockups.
  // Show skeleton placeholders for any rooms still being generated.
  const expectedRoomKeys = ["living_room", "bedroom", "office"];
  const pendingRoomKeys = expectedRoomKeys.filter(
    (k) => !mockups.some((m) => m.key === k),
  );

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader />
      <article className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 grid md:grid-cols-12 gap-12">
        <div className="md:col-span-8">
          <div className="relative">
            <img
              src={activeView?.url}
              alt={activeView?.isOriginal ? p.title : `${p.title} shown in ${activeView?.label.toLowerCase()}`}
              className="w-full shadow-press transition-opacity duration-300"
            />
            {!activeView?.isOriginal && (
              <div className="absolute top-3 left-3 eyebrow text-[0.6rem] bg-paper/90 text-ink px-2 py-1">
                In situ — {activeView?.label}
              </div>
            )}
          </div>

          {/* Thumbnail gallery */}
          <div className="mt-4 grid grid-cols-4 gap-2">
            {views.map((v) => {
              const isActive = v.key === activeKey;
              return (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => setActiveKey(v.key)}
                  className={`group relative aspect-square overflow-hidden border transition-all ${
                    isActive
                      ? "border-gold-deep ring-1 ring-gold-deep"
                      : "border-border hover:border-ink"
                  }`}
                  aria-label={`Show ${v.label}`}
                >
                  <img
                    src={v.url}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <span className="absolute bottom-0 left-0 right-0 eyebrow text-[0.55rem] text-paper bg-ink/70 px-1.5 py-1 text-center">
                    {v.label}
                  </span>
                </button>
              );
            })}
            {pendingRoomKeys.map((k) => (
              <div
                key={`pending-${k}`}
                className="relative aspect-square border border-border bg-muted/30 animate-pulse flex items-center justify-center"
              >
                <span className="eyebrow text-[0.55rem] text-muted-foreground text-center px-2">
                  {generatingMockups ? "Rendering room view…" : "Coming up…"}
                </span>
              </div>
            ))}
          </div>

          <p className="eyebrow text-muted-foreground text-[0.65rem] mt-3">
            See it in your space — every piece is shown in three real-room settings.{" "}
            <span className="text-gold-deep">Hand-signed by Naybz</span> available at checkout.
          </p>
        </div>
        <aside className="md:col-span-4 md:sticky md:top-28 self-start">
          <div className="eyebrow text-muted-foreground mb-3">Original Work</div>
          <h1 className="font-serif text-4xl md:text-5xl leading-tight">{p.title}</h1>
          {p.style && <div className="eyebrow text-gold-deep mt-4">{p.style}</div>}
          {p.description && (
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
              {p.description}
            </p>
          )}
          <div className="hairline my-8" />
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Format</dt><dd>{p.aspect_ratio}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Resolution</dt><dd>8K Ultra-Real</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Edition</dt><dd>Limited / Signed</dd></div>
          </dl>
          <div className="mt-8">
            <div className="eyebrow text-muted-foreground mb-1">Starting at</div>
            <div className="font-serif text-3xl text-gold-deep">
              {formatPrice(startingPriceCents)}
            </div>
          </div>

          <div className="mt-6 border border-border bg-card p-4">
            <div className="eyebrow text-muted-foreground mb-3 text-[0.65rem]">Pricing by finish & size</div>
            <div className="space-y-4 text-sm">
              {FINISHES.map((f) => (
                <div key={f.name}>
                  <div className="flex justify-between items-baseline">
                    <div className="font-serif">{f.name}</div>
                    <div className="eyebrow text-[0.6rem] text-gold-deep">{f.badge}</div>
                  </div>
                  <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                    {f.sizes.map((s) => {
                      const price = Math.round(s.basePriceCents * f.multiplier);
                      return (
                        <li key={s.label} className="flex justify-between">
                          <span>{s.label}</span>
                          <span className="text-ink">{formatPrice(price)}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <Link
            to="/buy"
            className="mt-8 inline-block w-full text-center px-6 py-3.5 bg-ink text-paper eyebrow hover:bg-gold-deep transition-colors"
          >
            Order on canvas / glass / acrylic
          </Link>
          <Link
            to="/commission"
            className="mt-3 inline-block w-full text-center px-6 py-3.5 border border-ink eyebrow hover:bg-ink hover:text-paper transition-colors"
          >
            Commission a custom piece
          </Link>
        </aside>
      </article>
      <SiteFooter />
    </div>
  );
}
