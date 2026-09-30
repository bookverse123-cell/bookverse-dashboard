"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2, Ticket } from "lucide-react";
import { addDailyPass } from "@/app/dashboard/members/actions";

const todayStr = () => new Date().toISOString().slice(0, 10);

export function AddDailyPassModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: () => void;
}) {
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi" | "cash_upi">("upi");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+91");
  const [date, setDate] = useState(todayStr());
  const [amount, setAmount] = useState<number | "">("");
  const [cashAmount, setCashAmount] = useState<number | "">("");
  const [upiAmount, setUpiAmount] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const total = amount === "" ? 0 : Number(amount);

    if (paymentMethod === "cash_upi") {
      const cash = cashAmount === "" ? 0 : Number(cashAmount);
      const upi = upiAmount === "" ? 0 : Number(upiAmount);
      if (cash <= 0 || upi <= 0) {
        setError("Enter both cash and UPI amounts");
        return;
      }
      if (Number((cash + upi).toFixed(2)) !== Number(total.toFixed(2))) {
        setError("Cash + UPI must match amount charged");
        return;
      }
    }

    setLoading(true);
    setError(null);

    let res;
    try {
      res = await addDailyPass({
        full_name: fullName,
        phone,
        date,
        amount: total,
        paymentMethod,
        cashAmount: paymentMethod === "cash_upi" ? Number(cashAmount) : undefined,
        upiAmount: paymentMethod === "cash_upi" ? Number(upiAmount) : undefined,
      });
    } finally {
      setLoading(false);
    }

    if (res?.error) {
      setError(res.error);
      return;
    }

    onAdded();
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-ink/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="fixed left-1/2 top-1/2 z-[70] w-[92%] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-parchment p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-ink-text/40">
              Daily Pass
            </span>
            <h2 className="font-display text-2xl text-ink-text mt-1">Add day visitor</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-ink-text/40 transition hover:bg-ink-text/5 hover:text-ink-text"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-ink-text/50 mb-1.5">
              Full name
            </label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Visitor name"
              className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-ink-text/50 mb-1.5">
              Phone
            </label>
            <input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+9198xxxxxxx"
              className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-ink-text/50 mb-1.5">
              Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-ink-text/50 mb-1.5">
              Amount charged (₹)
            </label>
            <input
              required
              type="number"
              min={1}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="e.g. 200"
              className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
            />
          </div>

          <div className="space-y-2 rounded-lg border border-parchment-line/80 bg-white/50 p-3">
            <label className="block text-xs font-mono uppercase tracking-wider text-ink-text/50">
              Payment method
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                { value: "upi", label: "UPI" },
                { value: "cash", label: "Cash" },
                { value: "cash_upi", label: "Cash + UPI" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPaymentMethod(option.value as typeof paymentMethod)}
                  className={`rounded-lg border px-3 py-2 text-sm transition ${
                    paymentMethod === option.value
                      ? "border-brass bg-brass/10 text-brass-soft"
                      : "border-parchment-line/80 bg-white/70 text-ink-text hover:border-brass/50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {paymentMethod === "cash_upi" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-ink-text/50 mb-1.5">
                  Cash amount (₹)
                </label>
                <input
                  required
                  type="number"
                  min={1}
                  step="0.01"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="e.g. 100"
                  className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-ink-text/50 mb-1.5">
                  UPI amount (₹)
                </label>
                <input
                  required
                  type="number"
                  min={1}
                  step="0.01"
                  value={upiAmount}
                  onChange={(e) => setUpiAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="e.g. 100"
                  className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
                />
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-lg border border-terracotta/20 bg-terracotta/10 px-3 py-2 text-sm text-terracotta">
              {error}
            </p>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.98 }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink-text px-4 py-3 text-sm font-medium text-parchment transition hover:bg-ink disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Ticket size={16} />}
            {loading ? "Adding…" : "Add daily pass"}
          </motion.button>
        </form>
      </motion.div>
    </>
  );
}
