import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";

export default function Shipping() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <SEO
        title="Shipping"
        description="Shipping details for Velour Walls fine art prints. Free shipping on all orders. Delivered in 5–7 business days."
        url="https://velourwalls.art/shipping"
      />
      <SiteHeader />
      <article className="max-w-3xl mx-auto px-6 md:px-10 py-24">
        <div className="eyebrow text-muted-foreground mb-6">Delivery</div>
        <h1 className="font-serif text-5xl md:text-6xl leading-[1] mb-12">
          Shipping <span className="italic text-gold-deep">&amp; Delivery</span>
        </h1>

        <div className="space-y-10 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-serif text-xl text-ink mb-3">Production time</h2>
            <p>
              Every piece is printed to order by our gallery-grade print partner. Production
              typically takes <strong className="text-ink">2–3 business days</strong> after your
              order is confirmed. Hand-signed pieces may take an additional 1–2 days for the
              artist's mark.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink mb-3">Shipping within the US</h2>
            <div className="border border-border bg-card p-5 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="font-serif text-ink">Standard shipping</span>
                <span className="eyebrow text-gold-deep">Free</span>
              </div>
              <div className="hairline" />
              <div className="flex justify-between items-baseline">
                <span>Estimated delivery</span>
                <span className="text-ink">5–7 business days</span>
              </div>
              <div className="hairline" />
              <div className="flex justify-between items-baseline">
                <span>Carrier</span>
                <span className="text-ink">UPS / FedEx</span>
              </div>
            </div>
            <p className="mt-3">
              All orders ship with tracking. You'll receive a confirmation email with your
              tracking number once your piece has shipped.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink mb-3">International shipping</h2>
            <p>
              International shipping is available on a case-by-case basis. Contact us at{" "}
              <a href="mailto:orders@velourwalls.art" className="text-gold-deep hover:underline">orders@velourwalls.art</a>{" "}
              with your shipping address and the piece(s) you're interested in, and we'll
              provide a quote. International orders may be subject to customs duties and
              import taxes, which are the buyer's responsibility.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink mb-3">Packaging</h2>
            <p>
              Your print is carefully packaged to arrive in perfect condition:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li><strong className="text-ink">Canvas prints</strong> — corner-protected, shrink-wrapped, and boxed in double-wall corrugated cardboard.</li>
              <li><strong className="text-ink">Glass &amp; acrylic prints</strong> — foam-padded, face-protected, and crated for safe transit.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink mb-3">Delivery issues</h2>
            <p>
              If your order hasn't arrived within the estimated window, or if the package
              arrives damaged, please contact us within 14 days at{" "}
              <a href="mailto:orders@velourwalls.art" className="text-gold-deep hover:underline">orders@velourwalls.art</a>{" "}
              with your order number and photos (if applicable). We'll resolve it — see
              our <a href="/returns" className="text-gold-deep hover:underline">return &amp; refund policy</a> for
              full details.
            </p>
          </section>
        </div>
      </article>
      <SiteFooter />
    </div>
  );
}
