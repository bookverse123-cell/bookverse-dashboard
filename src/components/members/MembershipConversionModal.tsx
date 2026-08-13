"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import type { SeatStatus } from "@/lib/types";
import { convertMembershipTo24x7 } from "@/app/dashboard/members/actions";
import { DatePopover } from "@/components/ui/DatePopover";

type PaymentMethod = "cash" | "upi" | "card" | "bank_transfer" | "other" | "upi_cash";
type ConversionMode = "current_cycle" | "next_month";
type TenureMode = "duration" | "custom";

const todayStr = () => new Date().toISOString().slice(0, 10);

function addDaysToIsoDate(start: string, days: number) {
  const [year, month, day] = start.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function MembershipConversionModal({
  membership,
  availableSeats,
  onClose,
  onSaved,
}: {
  membership: { membership_id: string; member_id: string; start_date: string; end_date: string; batch: string | null };
  availableSeats: SeatStatus[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [mode, setMode] = useState<ConversionMode>("current_cycle");
  const [tenureMode, setTenureMode] = useState<TenureMode>("duration");
  const [startDate, setStartDate] = useState(todayStr());
  const [duration, setDuration] = useState<1 | 2 | 3 | 4 | 6>(1);
  const [endDate, setEndDate] = useState(addDaysToIsoDate(todayStr(), 30));
  const [seatId, setSeatId] = useState(availableSeats[0]?.seat_id ?? "");
  const [amount, setAmount] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashAmount, setCashAmount] = useState<number | "">("");
  const [upiAmount, setUpiAmount] = useState<number | "">("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentCycleEnd = membership.end_date;
  const canShowNextMonthFields = mode === "next_month";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!seatId) {
      setError("Select a seat");
      return;
    }
    if (amount === "" || Number(amount) <= 0) {
      setError("Enter a balance amount greater than zero");
      return;
    }
    if (paymentMethod === "upi_cash") {
      const cash = Number(cashAmount ?? 0);
      const upi = Number(upiAmount ?? 0);
      if (!Number.isFinite(cash) || !Number.isFinite(upi) || cash <= 0 || upi <= 0) {
        setError("Enter both cash and UPI amounts");
        return;
      }
      if (Number((cash + upi).toFixed(2)) !== Number(amount)) {
        setError("Cash + UPI must match the balance amount");
        return;
      }
    }
    if (mode === "current_cycle" && startDate > currentCycleEnd) {
      setError("Start date must be on or before the current batch end date");
      return;
    }
    if (mode === "next_month") {
      if (tenureMode === "custom" && endDate <= startDate) {
        setError("End date must be after start date");
        return;
      }
      if (startDate < currentCycleEnd) {
        setError("Next month conversion must start on or after the current batch end date");
        return;
      }
    }

    setLoading(true);
    setError(null);

    const res = await convertMembershipTo24x7({
      membershipId: membership.membership_id,
      memberId: membership.member_id,
      seatId,
      mode,
      startDate,
      duration: mode === "next_month" && tenureMode === "duration" ? duration : undefined,
      endDate: mode === "next_month" && tenureMode === "custom" ? endDate : undefined,
      amountPaid: Number(amount),
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
              Convert to 24x7
            </span>
            <h2 className="mt-1 font-display text-2xl text-ink-text">Batch conversion</h2>
            <p className="mt-1 text-sm text-ink-text/55">
              Current batch ends on {new Date(currentCycleEnd).toLocaleDateString("en-IN")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-ink-text/40 transition hover:bg-ink-text/5 hover:text-ink-text"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2 rounded-lg border border-parchment-line/80 bg-white/50 p-3">
            <label className="block text-xs font-mono uppercase tracking-wider text-ink-text/50">
              Conversion timing
            </label>
            <div className="flex flex-wrap gap-3">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="conversionMode"
                  checked={mode === "current_cycle"}
                  onChange={() => {
                    setMode("current_cycle");
                    setStartDate(todayStr());
                  }}
                  className="accent-brass"
                />
                <span className="text-sm text-ink-text">This cycle</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="conversionMode"
                  checked={mode === "next_month"}
                  onChange={() => {
                    setMode("next_month");
                    setStartDate(currentCycleEnd);
                    setEndDate(addDaysToIsoDate(currentCycleEnd, 30));
                  }}
                  className="accent-brass"
                />
                <span className="text-sm text-ink-text">Next month</span>
              </label>
            </div>
            <p className="text-xs text-ink-text/50">
              {mode === "current_cycle"
                ? "The current batch ends today, the 24x7 batch starts immediately, and it keeps the existing expiry date."
                : "The current membership stays unchanged and a new 24x7 membership record is created from the selected start date."}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-ink-text/50">
                Start date
              </label>
              <DatePopover
                value={startDate}
                onChange={setStartDate}
                min={mode === "current_cycle" ? membership.start_date : currentCycleEnd}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-ink-text/50">
                Seat
              </label>
              <select
                value={seatId}
                onChange={(event) => setSeatId(event.target.value)}
                className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
              >
                {availableSeats.length === 0 ? (
                  <option value="">No seats available</option>
                ) : (
                  availableSeats.map((seat) => (
                    <option key={seat.seat_id} value={seat.seat_id}>
                      {seat.seat_code} · {seat.zone === "library" ? "Reading Hall" : "Premium Lounge"}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {canShowNextMonthFields && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-ink-text/50">
                  Duration
                </label>
                <select
                  value={duration}
                  onChange={(event) => setDuration(Number(event.target.value) as 1 | 2 | 3 | 4 | 6)}
                  className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
                >
                  <option value={1}>1 Month</option>
                  <option value={2}>2 Months</option>
                  <option value={3}>3 Months</option>
                  <option value={4}>4 Months</option>
                  <option value={6}>6 Months</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-ink-text/50">
                  End date mode
                </label>
                <select
                  value={tenureMode}
                  onChange={(event) => setTenureMode(event.target.value as TenureMode)}
                  className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
                >
                  <option value="duration">By duration</option>
                  <option value="custom">Custom dates</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-ink-text/50">
                  End date
                </label>
                {tenureMode === "custom" ? (
                  <DatePopover value={endDate} onChange={setEndDate} min={startDate} />
                ) : (
                  <div className="rounded-lg border border-parchment-line bg-white/60 px-3 py-2.5 text-sm text-ink-text/70">
                    {new Date(addDaysToIsoDate(startDate, duration * 30)).toLocaleDateString("en-IN")}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-ink-text/50">
                Balance amount (₹)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value === "" ? "" : Number(event.target.value))}
                className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
              />
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
            disabled={loading || availableSeats.length === 0}
            whileTap={{ scale: 0.98 }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink-text px-4 py-3 text-sm font-medium text-parchment transition hover:bg-ink disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Saving…" : "Save conversion"}
          </motion.button>
        </form>
      </motion.div>
    </>
  );
}
