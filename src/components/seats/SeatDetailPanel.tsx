"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Phone, Calendar, UserPlus, LogOut } from "lucide-react";
import type { SeatStatus, MembershipPlan } from "@/lib/demo-data";
import { AssignSeatModal } from "./AssignSeatModal";
import { endMembership } from "@/app/dashboard/seats/actions";

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function SeatDetailPanel({
  seat,
  plans,
  onClose,
}: {
  seat: SeatStatus;
  plans: MembershipPlan[];
  onClose: () => void;
}) {
  const [showAssign, setShowAssign] = useState(false);
  const [busy, setBusy] = useState(false);

  const isOccupied = seat.occupancy_status !== "available";

  async function handleEndMembership() {
    if (!seat.membership_id) return;
    setBusy(true);
    await endMembership(seat.membership_id);
    setBusy(false);
    onClose();
  }

  return (
    <>
      {/* backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm"
      />

      {/* panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-parchment p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-ink-text/40">
              {seat.zone === "library" ? "Reading Hall" : "Premium Lounge"}
            </span>
            <h2 className="font-display text-3xl text-ink-text mt-1">
              {seat.seat_code}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-ink-text/40 transition hover:bg-ink-text/5 hover:text-ink-text"
          >
            <X size={20} />
          </button>
        </div>

        {isOccupied ? (
          <div className="mt-8 space-y-6">
            <div className="flex items-center gap-4 rounded-xl border border-parchment-line bg-white/60 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brass font-display text-lg font-semibold text-ink">
                {seat.full_name?.[0] ?? "?"}
              </div>
              <div>
                <p className="font-display text-lg text-ink-text">
                  {seat.full_name}
                </p>
                <p className="flex items-center gap-1.5 text-sm text-ink-text/50">
                  <Phone size={13} />
                  {seat.phone}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-parchment-line bg-white/60 p-4">
                <p className="font-mono text-[10px] uppercase tracking-wider text-ink-text/40">
                  Started
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-text">
                  <Calendar size={14} />
                  {formatDate(seat.start_date)}
                </p>
              </div>
              <div className="rounded-xl border border-parchment-line bg-white/60 p-4">
                <p className="font-mono text-[10px] uppercase tracking-wider text-ink-text/40">
                  Ends
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-text">
                  <Calendar size={14} />
                  {formatDate(seat.end_date)}
                </p>
              </div>
            </div>

            {seat.days_until_expiry !== null && (
              <div
                className={`rounded-xl border p-4 text-sm ${
                  seat.days_until_expiry < 0
                    ? "border-terracotta/30 bg-terracotta/10 text-terracotta"
                    : seat.days_until_expiry <= 3
                    ? "border-brass/30 bg-brass/10 text-brass-soft"
                    : "border-sage/30 bg-sage/10 text-sage"
                }`}
              >
                {seat.days_until_expiry < 0
                  ? `Membership expired ${Math.abs(seat.days_until_expiry)} day(s) ago — renewal overdue.`
                  : seat.days_until_expiry === 0
                  ? "Membership ends today."
                  : `${seat.days_until_expiry} day(s) left on this membership.`}
              </div>
            )}

            <div className="space-y-3">
              {/* WhatsApp reminder button — commented out, will enable after messaging setup */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                disabled={busy}
                onClick={handleEndMembership}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-terracotta/30 px-4 py-3 text-sm font-medium text-terracotta transition hover:bg-terracotta/5 disabled:opacity-50"
              >
                <LogOut size={16} />
                End membership &amp; free seat
              </motion.button>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <div className="rounded-xl border border-sage/30 bg-sage/10 p-4 text-sm text-sage">
              This seat is currently available.
            </div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAssign(true)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-ink-text px-4 py-3 text-sm font-medium text-parchment transition hover:bg-ink"
            >
              <UserPlus size={16} />
              Assign this seat
            </motion.button>
          </div>
        )}
      </motion.div>

      {showAssign && (
        <AssignSeatModal
          seat={seat}
          plans={plans}
          onClose={() => setShowAssign(false)}
          onAssigned={() => {
            setShowAssign(false);
            onClose();
          }}
        />
      )}
    </>
  );
}
