import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <SEO
        title="Privacy Policy & Terms"
        description="Privacy policy and terms of service for Velour Walls."
        url="https://velourwalls.art/privacy"
      />
      <SiteHeader />
      <article className="max-w-3xl mx-auto px-6 md:px-10 py-24">
        <div className="eyebrow text-muted-foreground mb-6">Legal</div>
        <h1 className="font-serif text-5xl md:text-6xl leading-[1] mb-12">
          Privacy <span className="italic text-gold-deep">&amp; Terms</span>
        </h1>

        <div className="space-y-10 text-sm leading-relaxed text-muted-foreground">
          {/* PRIVACY POLICY */}
          <section>
            <h2 className="font-serif text-2xl text-ink mb-4">Privacy Policy</h2>
            <p className="mb-4">
              Velour Walls ("we", "us", "our") respects your privacy. This policy explains
              what information we collect, how we use it, and your rights.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink mb-3">Information we collect</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong className="text-ink">Order information</strong> — name, email, shipping
                address, and payment details (processed securely by Stripe; we never see
                or store your full card number).
              </li>
              <li>
                <strong className="text-ink">Commission requests</strong> — name, email, and the
                creative brief you submit through the commission form.
              </li>
              <li>
                <strong className="text-ink">Usage data</strong> — anonymous analytics (pages
                visited, device type, referral source) collected via Plausible Analytics.
                No cookies, no personal tracking.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink mb-3">How we use your information</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>To fulfill and ship your orders.</li>
              <li>To respond to commission requests and customer inquiries.</li>
              <li>To improve the site experience based on anonymous analytics.</li>
              <li>To send order status updates and shipping notifications.</li>
            </ul>
            <p className="mt-3">
              We do <strong className="text-ink">not</strong> sell, rent, or share your personal
              information with third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink mb-3">Third-party services</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong className="text-ink">Stripe</strong> — payment processing. Subject to <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-gold-deep hover:underline">Stripe's Privacy Policy</a>.</li>
              <li><strong className="text-ink">Supabase</strong> — database and authentication infrastructure.</li>
              <li><strong className="text-ink">Plausible Analytics</strong> — privacy-friendly, cookie-free analytics.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink mb-3">Your rights</h2>
            <p>
              You may request access to, correction of, or deletion of your personal data
              at any time by emailing{" "}
              <a href="mailto:orders@velourwalls.art" className="text-gold-deep hover:underline">orders@velourwalls.art</a>.
              We will respond within 30 days.
            </p>
          </section>

          {/* TERMS OF SERVICE */}
          <div className="hairline my-12" />

          <section>
            <h2 className="font-serif text-2xl text-ink mb-4">Terms of Service</h2>
            <p className="mb-4">
              By using velourwalls.art and placing an order, you agree to these terms.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink mb-3">Products</h2>
            <p>
              All art pieces are produced to order. Colours may vary slightly between
              screens and printed output due to differences in monitor calibration and
              print materials. We use gallery-grade materials and professional print
              partners to ensure the highest possible fidelity.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink mb-3">Intellectual property</h2>
            <p>
              All artwork, images, text, and design on this site are the property of
              Velour Walls and are protected by copyright. Purchasing a print grants you
              the right to display the physical piece — it does not transfer copyright or
              reproduction rights.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink mb-3">Pricing &amp; availability</h2>
            <p>
              Prices are listed in USD and are subject to change without notice. We
              reserve the right to limit quantities or discontinue any piece at any time.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink mb-3">Limitation of liability</h2>
            <p>
              Velour Walls is not liable for any indirect, incidental, or consequential
              damages arising from the use of this site or the purchase of any product.
              Our total liability shall not exceed the amount paid for the specific
              product in question.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink mb-3">Contact</h2>
            <p>
              Questions about these terms? Email us at{" "}
              <a href="mailto:orders@velourwalls.art" className="text-gold-deep hover:underline">orders@velourwalls.art</a>.
            </p>
          </section>

          <section className="text-xs text-muted-foreground/60">
            <p>Last updated: {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}.</p>
          </section>
        </div>
      </article>
      <SiteFooter />
    </div>
  );
}
