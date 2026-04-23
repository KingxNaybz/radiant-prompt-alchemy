import { useEffect, useMemo, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SiteHeader from "@/components/SiteHeader";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Order {
  id: string;
  painting_title: string;
  finish: string;
  size: string;
  amount_cents: number;
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  payment_method: string;
  payment_status: string;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_TONE: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  awaiting_authorization: "bg-muted text-muted-foreground",
  authorized: "bg-accent/20 text-accent-foreground border border-accent/40",
  paid: "bg-emerald-100 text-emerald-900 border border-emerald-300",
  awaiting_invoice: "bg-amber-100 text-amber-900 border border-amber-300",
  canceled: "bg-secondary text-secondary-foreground",
  failed: "bg-destructive/15 text-destructive border border-destructive/40",
};

function fmtUsd(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString();
}

export default function StudioOrders() {
  const { user, loading: authLoading } = useAuth();
  const [isOwner, setIsOwner] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "owner")
      .maybeSingle()
      .then(({ data }) => setIsOwner(!!data));
  }, [user]);

  const loadOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      return;
    }
    setOrders((data ?? []) as Order[]);
  };

  useEffect(() => {
    if (isOwner) loadOrders();
  }, [isOwner]);

  const filtered = useMemo(() => {
    if (!orders) return [];
    if (filter === "all") return orders;
    return orders.filter((o) => o.payment_status === filter);
  }, [orders, filter]);

  const totals = useMemo(() => {
    if (!orders) return { count: 0, gross: 0, authorized: 0, paid: 0 };
    return {
      count: orders.length,
      gross: orders.reduce((s, o) => s + o.amount_cents, 0),
      authorized: orders.filter((o) => o.payment_status === "authorized").length,
      paid: orders.filter((o) => o.payment_status === "paid").length,
    };
  }, [orders]);

  if (authLoading || isOwner === null) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="px-6 py-16 text-muted-foreground">Loading…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isOwner) return <Navigate to="/" replace />;

  const updateStatus = async (id: string, status: string) => {
    setBusyId(id);
    const { error } = await supabase
      .from("orders")
      .update({ payment_status: status })
      .eq("id", id);
    setBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Marked ${status.replace("_", " ")}`);
    loadOrders();
  };

  const STATUSES = [
    "all", "awaiting_authorization", "authorized", "paid",
    "awaiting_invoice", "canceled", "failed",
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs tracking-[0.3em] text-accent font-bold">VELOUR WALLS · BACK OFFICE</p>
            <h1 className="mt-2 text-3xl font-serif">Orders</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Every authorization, wire request, and capture lives here.
            </p>
          </div>
          <Link to="/studio">
            <Button variant="outline" size="sm">← Back to Studio</Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Stat label="Total orders" value={String(totals.count)} />
          <Stat label="Gross authorized" value={fmtUsd(totals.gross)} />
          <Stat label="Awaiting capture" value={String(totals.authorized)} />
          <Stat label="Captured / paid" value={String(totals.paid)} />
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-sm border transition ${
                filter === s
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.replace(/_/g, " ")}
            </button>
          ))}
          <button
            onClick={loadOrders}
            className="text-xs px-3 py-1.5 rounded-sm border border-border text-muted-foreground hover:text-foreground ml-auto"
          >
            ↻ Refresh
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="border border-border rounded-sm p-12 text-center text-muted-foreground bg-card">
            No orders {filter !== "all" ? `with status “${filter}”` : "yet"}.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((o) => (
              <article key={o.id} className="border border-border rounded-sm bg-card p-5 shadow-sm">
                <header className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <h2 className="font-serif text-xl">{o.painting_title}</h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      {fmtDate(o.created_at)} · ref {o.id.slice(0, 8)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={STATUS_TONE[o.payment_status] ?? "bg-muted"}>
                      {o.payment_status.replace(/_/g, " ")}
                    </Badge>
                    <Badge variant="outline">{o.payment_method}</Badge>
                    <span className="font-serif text-lg">{fmtUsd(o.amount_cents)}</span>
                  </div>
                </header>

                <div className="grid md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <Row k="Finish" v={o.finish} />
                  <Row k="Size" v={o.size} />
                  <Row k="Customer" v={o.customer_name} />
                  <Row k="Email" v={o.customer_email} />
                  <Row k="Ship to" v={o.shipping_address} className="md:col-span-2 whitespace-pre-wrap" />
                  {o.notes && <Row k="Notes" v={o.notes} className="md:col-span-2" />}
                  {o.stripe_payment_intent_id && (
                    <Row k="Payment intent" v={o.stripe_payment_intent_id} className="md:col-span-2 font-mono text-xs" />
                  )}
                </div>

                <footer className="mt-4 pt-4 border-t border-border flex flex-wrap gap-2">
                  {o.payment_status === "authorized" && (
                    <Button
                      size="sm"
                      disabled={busyId === o.id}
                      onClick={() => updateStatus(o.id, "paid")}
                    >
                      Mark captured / paid
                    </Button>
                  )}
                  {o.payment_status === "awaiting_invoice" && (
                    <Button
                      size="sm"
                      disabled={busyId === o.id}
                      onClick={() => updateStatus(o.id, "paid")}
                    >
                      Mark wire received
                    </Button>
                  )}
                  {o.payment_status !== "canceled" && o.payment_status !== "paid" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === o.id}
                      onClick={() => updateStatus(o.id, "canceled")}
                    >
                      Cancel
                    </Button>
                  )}
                  <a
                    href={`mailto:${o.customer_email}?subject=Your%20Velour%20Walls%20order`}
                    className="ml-auto text-xs text-muted-foreground hover:text-foreground underline self-center"
                  >
                    Email customer →
                  </a>
                </footer>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border rounded-sm p-4 bg-card">
      <p className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">{label}</p>
      <p className="mt-2 font-serif text-2xl">{value}</p>
    </div>
  );
}

function Row({ k, v, className = "" }: { k: string; v: string; className?: string }) {
  return (
    <div className={className}>
      <span className="text-muted-foreground">{k}: </span>
      <span>{v}</span>
    </div>
  );
}
