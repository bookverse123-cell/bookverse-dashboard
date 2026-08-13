"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import type { BatchOption } from "@/lib/batches";
import type { MemberHistoryEntry } from "@/lib/types";
import { updateMembershipRecord } from "@/app/dashboard/members/actions";
import { DatePopover } from "@/components/ui/DatePopover";

type PaymentMethod = "cash" | "upi" | "card" | "bank_transfer" | "other" | "upi_cash";

export function MembershipRecordEditModal({
  membership,
  onClose,
  onSaved,
}: {
  membership: MemberHistoryEntry & { member_id: string };
  onClose: () => void;
  onSaved: () => void;
}) {
  const primaryPayment = membership.payments[0] ?? null;
  const [startDate, setStartDate] = useState(membership.start_date);
  const [endDate, setEndDate] = useState(membership.end_date);
  const [amountPaid, setAmountPaid] = useState<number | "">(membership.amount_paid);
  const [batch, setBatch] = useState<BatchOption>(membership.batch ?? "24x7 Batch");
  const [paymentDate, setPaymentDate] = useState(primaryPayment?.payment_date ?? membership.start_date);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    (primaryPayment?.method as PaymentMethod) ?? "cash"
  );
  const [cashAmount, setCashAmount] = useState<number | "">(primaryPayment?.cash_amount ?? "");
  const [upiAmount, setUpiAmount] = useState<number | "">(primaryPayment?.upi_amount ?? "");
  const [remarks, setRemarks] = useState(membership.remarks ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (amountPaid === "" || Number(amountPaid) <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (paymentMethod === "upi_cash") {
      const cash = Number(cashAmount ?? 0);
      const upi = Number(upiAmount ?? 0);
      if (!Number.isFinite(cash) || !Number.isFinite(upi) || cash <= 0 || upi <= 0) {
        setError("Enter both cash and UPI amounts");
        return;
      }
      if (Number((cash + upi).toFixed(2)) !== Number(amountPaid)) {
        setError("Cash + UPI must match amount paid");
        return;
      }
    }
    if (endDate <= startDate) {
      setError("End date must be after start date");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await updateMembershipRecord({
      membershipId: membership.membership_id,
      memberId: membership.member_id,
      startDate,
      endDate,
      amountPaid: Number(amountPaid),
      batch,
      paymentDate,
      paymentMethod,
      cashAmount: paymentMethod === "upi_cash" ? Number(cashAmount) : undefined,
      upiAmount: paymentMethod === "upi_cash" ? Number(upiAmount) : undefined,
      remarks: remarks || undefined,
    });

    setLoading(false);

    if (res?.error) {
      setError(res.error);
      return;
    }

    onSaved();
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
        className="fixed left-1/2 top-1/2 z-[70] w-[92%] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-parchment p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-ink-text/40">
              Edit membership record
            </span>
            <h2 className="mt-1 font-display text-2xl text-ink-text">Correct dates and amount</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-ink-text/40 transition hover:bg-ink-text/5 hover:text-ink-text"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-ink-text/50">
                Start date
              </label>
              <DatePopover value={startDate} onChange={setStartDate} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-ink-text/50">
                End date
              </label>
              <DatePopover value={endDate} onChange={setEndDate} min={startDate} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-ink-text/50">
                Amount paid (₹)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={amountPaid}
                onChange={(event) => setAmountPaid(event.target.value === "" ? "" : Number(event.target.value))}
                className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-ink-text/50">
                Batch
              </label>
              <select
                value={batch}
                onChange={(event) => setBatch(event.target.value as BatchOption)}
                className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
              >
                <option value="24x7 Batch">24x7 Batch</option>
                <option value="Morning Batch">Morning Batch</option>
                <option value="Evening Batch">Evening Batch</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-ink-text/50">
                Payment date
              </label>
              <DatePopover value={paymentDate} onChange={setPaymentDate} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-ink-text/50">
                Payment method
              </label>
              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
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
          </div>

          {paymentMethod === "upi_cash" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-ink-text/50">
                  Cash amount (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={cashAmount}
                  onChange={(event) => setCashAmount(event.target.value === "" ? "" : Number(event.target.value))}
                  className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-ink-text/50">
                  UPI amount (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={upiAmount}
                  onChange={(event) => setUpiAmount(event.target.value === "" ? "" : Number(event.target.value))}
                  className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-ink-text/50">
              Remarks (optional)
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              className="w-full resize-none rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
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
            {loading ? "Saving…" : "Save changes"}
          </motion.button>
        </form>
      </motion.div>
    </>
  );
}
