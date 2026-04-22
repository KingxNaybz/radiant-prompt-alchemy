import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function Commission() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader />
      <section className="max-w-3xl mx-auto px-6 md:px-10 py-24">
        <div className="eyebrow text-muted-foreground mb-6">Private Commission</div>
        <h1 className="font-serif text-5xl md:text-6xl leading-[1] text-balance">
          A piece, made <span className="italic text-gold-deep">only for you</span>.
        </h1>
        <p className="mt-8 text-lg text-muted-foreground leading-relaxed">
          Each commission begins as a conversation. Tell Naybz the subject,
          the feeling, the room it will live in — he will respond personally
          with a concept and timeline.
        </p>
        <a
          href="mailto:commissions@naybz.art"
          className="mt-10 inline-block px-8 py-4 bg-ink text-paper eyebrow hover:bg-gold-deep transition-colors"
        >
          Begin a commission
        </a>
        <div className="hairline mt-16 pt-10 grid md:grid-cols-3 gap-8 text-sm">
          <div>
            <div className="eyebrow text-gold-deep mb-2">01 · Concept</div>
            <p className="text-muted-foreground">A private brief. Reference, mood, scale.</p>
          </div>
          <div>
            <div className="eyebrow text-gold-deep mb-2">02 · Painting</div>
            <p className="text-muted-foreground">Hand-directed in the atelier. 8K resolution.</p>
          </div>
          <div>
            <div className="eyebrow text-gold-deep mb-2">03 · Delivery</div>
            <p className="text-muted-foreground">Signed file or gallery-grade print.</p>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
