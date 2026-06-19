import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function SiteHeader() {
  const { user, isOwner } = useAuth();
  const loc = useLocation();
  const onStudio = loc.pathname.startsWith("/studio");

  return (
    <header className="border-b border-border bg-paper/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-5 flex items-center justify-between">
        <Link to="/" className="flex flex-col leading-none">
          <span className="font-serif text-2xl md:text-3xl tracking-[0.18em] uppercase text-ink">
            Velour <span className="italic text-gold-deep tracking-normal normal-case">Walls</span>
          </span>
          <span className="eyebrow text-muted-foreground mt-1">Art That Moves The Soul</span>
        </Link>
        <nav className="flex items-center gap-6 md:gap-8 text-sm">
          <Link to="/" className="hover:text-gold-deep transition-colors">Gallery</Link>
          <Link to="/buy" className="hover:text-gold-deep transition-colors">Buy Now</Link>
          {isOwner && (
            <>
              <Link
                to="/studio"
                className={`px-3 py-1.5 border border-ink text-ink hover:bg-ink hover:text-paper transition-colors eyebrow ${
                  onStudio && loc.pathname === "/studio" ? "bg-ink text-paper" : ""
                }`}
              >
                Atelier
              </Link>
              <Link
                to="/studio/orders"
                className={`px-3 py-1.5 border border-ink text-ink hover:bg-ink hover:text-paper transition-colors eyebrow ${
                  loc.pathname === "/studio/orders" ? "bg-ink text-paper" : ""
                }`}
              >
                Orders
              </Link>
              <Link
                to="/studio/payments"
                className={`px-3 py-1.5 border border-ink text-ink hover:bg-ink hover:text-paper transition-colors eyebrow ${
                  loc.pathname === "/studio/payments" ? "bg-ink text-paper" : ""
                }`}
              >
                Payments
              </Link>
            </>
          )}
          {!user ? (
            <Link to="/auth" className="eyebrow text-muted-foreground hover:text-ink">Sign in</Link>
          ) : (
            <button
              onClick={() => supabase.auth.signOut()}
              className="eyebrow text-muted-foreground hover:text-ink"
            >
              Sign out
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
