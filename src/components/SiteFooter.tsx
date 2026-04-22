export default function SiteFooter() {
  return (
    <footer className="border-t border-border mt-32">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 grid md:grid-cols-3 gap-10">
        <div>
          <div className="font-serif text-3xl text-ink uppercase tracking-[0.18em]">
            Velour <span className="italic text-gold-deep tracking-normal normal-case">Walls</span>
          </div>
          <p className="eyebrow text-muted-foreground mt-2">Art That Moves The Soul</p>
        </div>
        <div className="text-sm text-muted-foreground leading-relaxed">
          Original 8K hyper-real fine art. Each piece painted in our private atelier
          and delivered as gallery-grade prints, canvas, glass, or acrylic finishes.
        </div>
        <div className="text-sm text-muted-foreground">
          <div className="eyebrow text-ink mb-3">Studio</div>
          <div>By appointment only.</div>
          <div className="mt-1">orders@velourwalls.art</div>
        </div>
      </div>
      <div className="hairline">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-6 flex justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Velour Walls. All works protected.</span>
          <span className="eyebrow">Vol. I</span>
        </div>
      </div>
    </footer>
  );
}
