export default function SiteFooter() {
  return (
    <footer className="border-t border-border mt-32">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 grid md:grid-cols-3 gap-10">
        <div>
          <div className="font-serif text-3xl text-ink">Michael <span className="italic text-gold-deep">Naybz</span></div>
          <p className="eyebrow text-muted-foreground mt-2">Art That Moves The Soul</p>
        </div>
        <div className="text-sm text-muted-foreground leading-relaxed">
          Original 8K hyper-real fine art. Each piece painted on commission, signed,
          and delivered as gallery-grade prints or high-resolution digital originals.
        </div>
        <div className="text-sm text-muted-foreground">
          <div className="eyebrow text-ink mb-3">Atelier</div>
          <div>By appointment only.</div>
          <div className="mt-1">commissions@naybz.art</div>
        </div>
      </div>
      <div className="hairline">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-6 flex justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Michael Naybz. All works protected.</span>
          <span className="eyebrow">Vol. I</span>
        </div>
      </div>
    </footer>
  );
}
