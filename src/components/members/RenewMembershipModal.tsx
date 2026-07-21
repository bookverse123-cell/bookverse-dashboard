"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { renewMembership } from "@/app/dashboard/seats/actions";
import { BATCH_OPTIONS, type BatchOption } from "@/lib/batches";

const DURATION_OPTIONS = [
  { value: 1, label: "1 Month" },
  { value: 2, label: "2 Months" },
  { value: 3, label: "3 Months" },
] as const;

type PaymentMethod = "cash" | "upi" | "card" | "bank_transfer" | "other" | "upi_cash";

export function RenewMembershipModal({
  membership,
  onClose,
  onRenewed,
}: {
  membership: { membership_id: string; full_name: string; end_date: string; batch: BatchOption | null };
  onClose: () => void;
  onRenewed: () => void;
}) {
  const [duration, setDuration] = useState<1 | 2 | 3>(1);
  const [amount, setAmount] = useState(0);
  const [batch, setBatch] = useState<BatchOption>(membership.batch ?? "24x7 Batch");
  const [startFrom, setStartFrom] = useState<"today" | "end_date">("today");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashAmount, setCashAmount] = useState(0);
  const [upiAmount, setUpiAmount] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endDateFormatted = new Date(membership.end_date).toLocaleDateString(
    "en-IN",
    { day: "2-digit", month: "short", year: "numeric" }
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (paymentMethod === "upi_cash") {
      if (cashAmount <= 0 || upiAmount <= 0) {
        setError("Enter both cash and UPI amounts");
        return;
      }
      if (cashAmount + upiAmount !== amount) {
        setError("Cash + UPI must match amount paid");
        return;
      }
    }

    setLoading(true);
    setError(null);

    let res;
    try {
      res = await renewMembership({
        membershipId: membership.membership_id,
        amount,
        duration,
        startFrom,
        batch,
        paymentMethod,
        cashAmount: paymentMethod === "upi_cash" ? cashAmount : undefined,
        upiAmount: paymentMethod === "upi_cash" ? upiAmount : undefined,
        remarks: remarks || undefined,
      });
    } finally {
      setLoading(false);
    }

    if (res?.error) {
      setError(res.error);
      return;
    }

    onRenewed();
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
        className="fixed left-1/2 top-1/2 z-[70] w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-parchment p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-ink-text/40">
              Renew membership
            </span>
            <h2 className="font-display text-2xl text-ink-text mt-1">
              {membership.full_name}
            </h2>
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
            <label className="block text-xs font-mono uppercase tracking-wider text-ink-text/50 mb-2">
              Start from
            </label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="startFrom"
                  value="today"
                  checked={startFrom === "today"}
                  onChange={() => setStartFrom("today")}
                  className="accent-brass"
                />
                <span className="text-sm text-ink-text">Today</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="startFrom"
                  value="end_date"
                  checked={startFrom === "end_date"}
                  onChange={() => setStartFrom("end_date")}
                  className="accent-brass"
                />
                <span className="text-sm text-ink-text">
                  Current end date ({endDateFormatted})
                </span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-ink-text/50 mb-1.5">
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value) as 1 | 2 | 3)}
                className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
              >
                {DURATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-ink-text/50 mb-1.5">
                Batch
              </label>
              <select
                value={batch}
                onChange={(e) => setBatch(e.target.value as BatchOption)}
                className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
              >
                {BATCH_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-ink-text/50 mb-1.5">
              Amount paid (₹)
            </label>
            <input
              type="text"
              inputMode="numeric"
              required
              value={amount === 0 ? "" : String(amount)}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "");
                setAmount(v ? Number(v) : 0);
              }}
              placeholder="0"
              className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-ink-text/50 mb-1.5">
              Payment method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="upi_cash">UPI + Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank transfer</option>
              <option value="other">Other</option>
            </select>
          </div>

          {paymentMethod === "upi_cash" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-ink-text/50 mb-1.5">
                  Cash amount (₹)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={cashAmount === 0 ? "" : String(cashAmount)}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "");
                    setCashAmount(v ? Number(v) : 0);
                  }}
                  placeholder="0"
                  className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-ink-text/50 mb-1.5">
                  UPI amount (₹)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={upiAmount === 0 ? "" : String(upiAmount)}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "");
                    setUpiAmount(v ? Number(v) : 0);
                  }}
                  placeholder="0"
                  className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-ink-text/50 mb-1.5">
              Remarks (optional)
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Any notes about this membership…"
              rows={2}
              className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30 resize-none"
            />
          </div>

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
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Renewing…" : "Confirm renewal"}
          </motion.button>
        </form>
      </motion.div>
    </>
  );
}
