"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { changeSeat } from "@/app/dashboard/seats/actions";
import type { SeatStatus } from "@/lib/types";

export function ChangeSeatModal({
  membershipId,
  currentSeatCode,
  availableSeats,
  onClose,
  onChanged,
}: {
  membershipId: string;
  currentSeatCode: string;
  availableSeats: SeatStatus[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [targetSeatId, setTargetSeatId] = useState(availableSeats[0]?.seat_id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasSeats = availableSeats.length > 0;

  const selectedSeat = useMemo(
    () => availableSeats.find((seat) => seat.seat_id === targetSeatId) ?? null,
    [availableSeats, targetSeatId],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!targetSeatId) {
      setError("Please select an unassigned seat");
      return;
    }

    setLoading(true);
    setError(null);

    let res;
    try {
      res = await changeSeat({
        membershipId,
        targetSeatId,
      });
    } finally {
      setLoading(false);
    }

    if (res?.error) {
      setError(res.error);
      return;
    }

    onChanged();
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
              Change seat
            </span>
            <h2 className="font-display text-2xl text-ink-text mt-1">
              {currentSeatCode}
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
          <p className="rounded-xl border border-parchment-line bg-white/60 px-4 py-3 text-sm text-ink-text/70">
            Membership dates, payments, and history stay unchanged. Only the seat is updated.
          </p>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-ink-text/50 mb-1.5">
              Unassigned seat
            </label>
            <select
              value={targetSeatId}
              disabled={!hasSeats || loading}
              onChange={(e) => setTargetSeatId(e.target.value)}
              className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30 disabled:opacity-60"
            >
              {hasSeats ? (
                availableSeats.map((seat) => (
                  <option key={seat.seat_id} value={seat.seat_id}>
                    {seat.seat_code} · {seat.zone === "library" ? "Reading Hall" : "Premium Lounge"}
                  </option>
                ))
              ) : (
                <option value="">No unassigned seats available</option>
              )}
            </select>
          </div>

          {selectedSeat && (
            <p className="text-sm text-ink-text/70">
              New seat: <span className="font-medium text-ink-text">{selectedSeat.seat_code}</span>
            </p>
          )}

          {error && (
            <p className="rounded-lg border border-terracotta/20 bg-terracotta/10 px-3 py-2 text-sm text-terracotta">
              {error}
            </p>
          )}

          <motion.button
            type="submit"
            disabled={loading || !hasSeats}
            whileTap={{ scale: 0.98 }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink-text px-4 py-3 text-sm font-medium text-parchment transition hover:bg-ink disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Changing seat…" : "Confirm seat change"}
          </motion.button>
        </form>
      </motion.div>
    </>
  );
}
