import { Link } from "react-router-dom";

export default function SiteFooter() {
  return (
    <footer className="border-t border-border mt-32">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 grid md:grid-cols-4 gap-10">
        <div>
          <div className="font-serif text-3xl text-ink uppercase tracking-[0.18em]">
            Velour <span className="italic text-gold-deep tracking-normal normal-case">Walls</span>
          </div>
          <p className="eyebrow text-muted-foreground mt-2">Art That Moves The Soul</p>
          {/* Social links */}
          <div className="flex gap-4 mt-5">
            <a
              href="https://instagram.com/velourwalls"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-gold-deep transition-colors"
              aria-label="Instagram"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>
            <a
              href="https://tiktok.com/@velourwalls"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-gold-deep transition-colors"
              aria-label="TikTok"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
              </svg>
            </a>
            <a
              href="https://x.com/velourwalls"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-gold-deep transition-colors"
              aria-label="X / Twitter"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
        <div className="text-sm text-muted-foreground leading-relaxed">
          Each piece in the Velour Walls collection is directed frame by frame in our
          private atelier — not generated, not mass-produced. 8K resolution, delivered as
          gallery-grade canvas, glass, or acrylic finishes.
        </div>
        <div className="text-sm">
          <div className="eyebrow text-ink mb-3">Shop</div>
          <nav className="space-y-2 text-muted-foreground">
            <Link to="/" className="block hover:text-gold-deep transition-colors">Gallery</Link>
            <Link to="/buy" className="block hover:text-gold-deep transition-colors">Buy Now</Link>
            <Link to="/commission" className="block hover:text-gold-deep transition-colors">Commission</Link>
            <Link to="/shipping" className="block hover:text-gold-deep transition-colors">Shipping</Link>
          </nav>
        </div>
        <div className="text-sm">
          <div className="eyebrow text-ink mb-3">Info</div>
          <nav className="space-y-2 text-muted-foreground">
            <Link to="/returns" className="block hover:text-gold-deep transition-colors">Returns &amp; Refunds</Link>
            <Link to="/privacy" className="block hover:text-gold-deep transition-colors">Privacy &amp; Terms</Link>
            <a href="mailto:orders@velourwalls.art" className="block hover:text-gold-deep transition-colors">orders@velourwalls.art</a>
          </nav>
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
