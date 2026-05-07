import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Commission() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [vision, setVision] = useState("");
  const [room, setRoom] = useState("");
  const [size, setSize] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from("commissions").insert({
        name,
        email,
        vision,
        room_description: room,
        preferred_size: size,
        budget,
        timeline,
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success("Commission request received.");
    } catch {
      const subject = encodeURIComponent(`Commission request from ${name}`);
      const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\nVision: ${vision}\nRoom: ${room}\nSize: ${size}\nBudget: ${budget}\nTimeline: ${timeline}`
      );
      window.location.href = `mailto:commissions@velourwalls.art?subject=${subject}&body=${body}`;
      toast.info("Opening email — we'll be in touch.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SEO
        title="Commission"
        description="Commission a one-of-a-kind piece from Velour Walls. Tell us your vision and we'll bring it to life in 8K resolution."
        url="https://velourwalls.art/commission"
      />
      <SiteHeader />
      <section className="max-w-3xl mx-auto px-6 md:px-10 py-24">
        <div className="eyebrow text-muted-foreground mb-6">Private Commission</div>
        <h1 className="font-serif text-5xl md:text-6xl leading-[1] text-balance">
          A piece, made <span className="italic text-gold-deep">only for you</span>.
        </h1>
        <p className="mt-8 text-lg text-muted-foreground leading-relaxed">
          Every commission begins as a conversation. You bring the vision —
          a feeling, a memory, a room you want transformed — and our atelier
          brings it to life. No templates. No shortcuts. One piece, made only for you.
        </p>

        <div className="hairline mt-12 pt-10 grid md:grid-cols-3 gap-8 text-sm mb-16">
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

        {submitted ? (
          <div className="border border-gold-deep bg-card p-10 text-center">
            <div className="eyebrow text-gold-deep mb-3">Request received</div>
            <h2 className="font-serif text-3xl mb-4">We'll be in touch.</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your commission brief has been received. Expect a personal response
              within 48 hours with a concept direction and timeline.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="eyebrow text-muted-foreground mb-2">Tell us about your piece</div>
            <div className="grid md:grid-cols-2 gap-4">
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
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
            </div>
            <textarea
              required
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              rows={5}
              placeholder="Describe your vision — the subject, the feeling, colours, mood, references…"
              className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-ink resize-none"
            />
            <input
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Where will it hang? (e.g. living room, office, bedroom)"
              className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-ink"
            />
            <div className="grid md:grid-cols-3 gap-4">
              <input
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="Preferred size"
                className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-ink"
              />
              <input
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Budget range"
                className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-ink"
              />
              <input
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                placeholder="Timeline / deadline"
                className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-ink"
              />
            </div>
            <button
              disabled={submitting}
              className="w-full bg-ink text-paper eyebrow py-4 hover:bg-gold-deep transition-colors disabled:opacity-50 mt-4"
            >
              {submitting ? "Submitting…" : "Submit commission request"}
            </button>
            <p className="text-xs text-muted-foreground text-center">
              We respond to every request personally within 48 hours.
            </p>
          </form>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
