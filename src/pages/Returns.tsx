import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";

export default function Returns() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <SEO
        title="Returns & Refunds"
        description="Return and refund policy for Velour Walls fine art prints."
        url="https://velourwalls.art/returns"
      />
      <SiteHeader />
      <article className="max-w-3xl mx-auto px-6 md:px-10 py-24">
        <div className="eyebrow text-muted-foreground mb-6">Policy</div>
        <h1 className="font-serif text-5xl md:text-6xl leading-[1] mb-12">
          Returns <span className="italic text-gold-deep">&amp; Refunds</span>
        </h1>

        <div className="space-y-10 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-serif text-xl text-ink mb-3">Our commitment</h2>
            <p>
              Every Velour Walls piece is produced to order using gallery-grade materials.
              We stand behind the quality of every print — if something isn't right,
              we'll make it right.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink mb-3">Damaged or defective prints</h2>
            <p>
              If your print arrives damaged, defective, or materially different from what
              was shown on the site, contact us within <strong className="text-ink">14 days</strong> of
              delivery with photos of the issue. We will either reprint and reship the
              piece at no cost, or issue a full refund — your choice.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink mb-3">Change of mind</h2>
            <p>
              Because each piece is printed to order and custom-produced, we are unable to
              accept returns for change of mind. We encourage you to review the finish
              options, sizes, and room mockups on each piece page before ordering.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink mb-3">Cancellations</h2>
            <p>
              Orders can be cancelled within <strong className="text-ink">24 hours</strong> of
              placement, provided production has not yet begun. After that window, the
              order is in production and cannot be cancelled.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink mb-3">Refund process</h2>
            <p>
              Approved refunds are processed back to the original payment method within
              5–10 business days. You will receive an email confirmation once the refund
              has been issued.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink mb-3">How to reach us</h2>
            <p>
              Email <a href="mailto:orders@velourwalls.art" className="text-gold-deep hover:underline">orders@velourwalls.art</a> with
              your order number, photos (if applicable), and a brief description of the
              issue. We respond to every request within 48 hours.
            </p>
          </section>
        </div>
      </article>
      <SiteFooter />
    </div>
  );
}
