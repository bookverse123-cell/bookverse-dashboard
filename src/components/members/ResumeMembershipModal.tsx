"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, MapPin } from "lucide-react";
import type { SeatStatus } from "@/lib/types";
import { resumeMembership } from "@/app/dashboard/members/actions";

export function ResumeMembershipModal({
  membershipId,
  memberId,
  availableSeats,
  onClose,
}: {
  membershipId: string;
  memberId: string;
  availableSeats: SeatStatus[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [selectedSeatId, setSelectedSeatId] = useState<string>("__unassigned__");
  const [resumeDate, setResumeDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResume() {
    setLoading(true);
    setError(null);
    const seatId = selectedSeatId === "__unassigned__" ? null : selectedSeatId;
    const result = await resumeMembership({ membershipId, memberId, seatId, resumeDate });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-parchment-line bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-parchment-line px-5 py-4">
          <h2 className="text-sm font-semibold text-ink-text">Resume Membership</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-ink-text/40 hover:bg-ink-text/5 hover:text-ink-text">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <p className="text-xs text-ink-text/60">
            Select a seat and the date from which membership resumes. The end date will be extended by the number of days paused.
          </p>

          <div>
            <label className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-ink-text/50">
              Resume from date
            </label>
            <input
              type="date"
              value={resumeDate}
              onChange={(e) => setResumeDate(e.target.value)}
              className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
            />
          </div>

          <div>
            <label className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-ink-text/50">
              Assign Seat
            </label>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-parchment-line">
              <button
                type="button"
                onClick={() => setSelectedSeatId("__unassigned__")}
                className={`flex w-full items-center gap-2 border-b border-parchment-line/60 px-3 py-2 text-left text-xs transition ${
                  selectedSeatId === "__unassigned__"
                    ? "bg-brass/10 text-brass-soft"
                    : "text-ink-text/70 hover:bg-ink-text/5"
                }`}
              >
                <span className="font-mono">Unassigned</span>
                <span className="text-ink-text/40">· no seat</span>
              </button>
              {availableSeats.map((seat) => (
                <button
                  key={seat.seat_id}
                  type="button"
                  onClick={() => setSelectedSeatId(seat.seat_id)}
                  className={`flex w-full items-center gap-2 border-b border-parchment-line/60 px-3 py-2 text-left text-xs last:border-0 transition ${
                    selectedSeatId === seat.seat_id
                      ? "bg-brass/10 text-brass-soft"
                      : "text-ink-text/70 hover:bg-ink-text/5"
                  }`}
                >
                  <MapPin size={12} className="shrink-0" />
                  <span className="font-mono">{seat.seat_code}</span>
                  <span className="text-ink-text/40">· {seat.zone}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-terracotta/10 px-3 py-2 text-xs text-terracotta">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-parchment-line px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-ink-line/20 px-4 py-2 text-xs font-medium text-ink-text/60 transition hover:bg-ink-text/5"
          >
            Cancel
          </button>
          <button
            onClick={handleResume}
            disabled={loading}
            className="rounded-lg bg-sage px-4 py-2 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Resuming…" : "Resume Membership"}
          </button>
        </div>
      </div>
    </div>
  );
}
