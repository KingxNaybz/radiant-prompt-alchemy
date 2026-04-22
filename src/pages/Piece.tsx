import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function Piece() {
  const { id } = useParams();
  const [p, setP] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
        if (data) document.title = `${data.title} — Michael Naybz`;
      });
  }, [id]);

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

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader />
      <article className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 grid md:grid-cols-12 gap-12">
        <div className="md:col-span-8">
          <img src={p.image_url} alt={p.title} className="w-full shadow-press" />
        </div>
        <aside className="md:col-span-4 md:sticky md:top-28 self-start">
          <div className="eyebrow text-muted-foreground mb-3">Original Work</div>
          <h1 className="font-serif text-4xl md:text-5xl leading-tight">{p.title}</h1>
          {p.style && <div className="eyebrow text-gold-deep mt-4">{p.style}</div>}
          <div className="hairline my-8" />
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Format</dt><dd>{p.aspect_ratio}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Resolution</dt><dd>8K Ultra-Real</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Edition</dt><dd>Limited / Signed</dd></div>
          </dl>
          {p.price_cents != null && (
            <div className="mt-8 font-serif text-3xl text-gold-deep">
              ${(p.price_cents / 100).toLocaleString()}
            </div>
          )}
          <Link
            to="/commission"
            className="mt-8 inline-block w-full text-center px-6 py-3.5 bg-ink text-paper eyebrow hover:bg-gold-deep transition-colors"
          >
            Inquire about this piece
          </Link>
        </aside>
      </article>
      <SiteFooter />
    </div>
  );
}
