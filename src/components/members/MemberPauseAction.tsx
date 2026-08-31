"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PauseCircle, PlayCircle, X } from "lucide-react";
import type { SeatStatus } from "@/lib/types";
import { pauseMembership } from "@/app/dashboard/members/actions";
import { ResumeMembershipModal } from "@/components/members/ResumeMembershipModal";

const todayStr = () => new Date().toISOString().slice(0, 10);

export function MemberPauseAction({
  membership,
  availableSeats,
}: {
  membership: {
    membership_id: string;
    member_id: string;
    status: "active" | "expired" | "cancelled" | "paused";
    paused_at: string | null;
  };
  availableSeats: SeatStatus[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPause, setShowPause] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const [pausedAt, setPausedAt] = useState(todayStr());

  if (membership.status !== "active" && membership.status !== "paused") return null;

  async function handlePause() {
    setLoading(true);
    setError(null);
    const result = await pauseMembership({
      membershipId: membership.membership_id,
      memberId: membership.member_id,
      pausedAt,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setShowPause(false);
    router.refresh();
  }

  if (membership.status === "paused") {
    const pausedDate = membership.paused_at ? new Date(membership.paused_at) : null;
    const today = new Date(todayStr());
    const daysPaused = pausedDate
      ? Math.max(0, Math.round((today.getTime() - pausedDate.getTime()) / 86400000))
      : 0;

    return (
      <>
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brass/15 px-3 py-1.5 text-xs font-medium text-brass-soft">
            <PauseCircle size={13} />
            Paused since {membership.paused_at ? new Date(membership.paused_at).toLocaleDateString("en-IN") : "—"} · {daysPaused}d elapsed
          </span>
          <button
            onClick={() => setShowResume(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sage px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90"
          >
            <PlayCircle size={13} />
            Resume Membership
          </button>
        </div>
        {error && <p className="mt-1 text-xs text-terracotta">{error}</p>}
        {showResume && (
          <ResumeMembershipModal
            membershipId={membership.membership_id}
            memberId={membership.member_id}
            availableSeats={availableSeats}
            onClose={() => setShowResume(false)}
          />
        )}
      </>
    );
  }

  return (
      <>
        <button
          onClick={() => {
            setPausedAt(todayStr());
            setShowPause(true);
            setError(null);
          }}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brass px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          <PauseCircle size={13} />
          Pause Membership
        </button>
        {error && <p className="mt-1 text-xs text-terracotta">{error}</p>}
        {showPause && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl border border-parchment-line bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-parchment-line px-5 py-4">
                <h2 className="text-sm font-semibold text-ink-text">Pause Membership</h2>
                <button onClick={() => setShowPause(false)} className="rounded-lg p-1 text-ink-text/40 hover:bg-ink-text/5 hover:text-ink-text">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4 p-5">
                <p className="text-xs text-ink-text/60">
                  Choose the date from which this membership should be paused.
                </p>

                <div>
                  <label className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-ink-text/50">
                    Pause from date
                  </label>
                  <input
                    type="date"
                    value={pausedAt}
                    onChange={(event) => setPausedAt(event.target.value)}
                    className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-parchment-line px-5 py-4">
                <button
                  onClick={() => setShowPause(false)}
                  className="rounded-lg border border-ink-line/20 px-4 py-2 text-xs font-medium text-ink-text/60 transition hover:bg-ink-text/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePause}
                  disabled={loading || !pausedAt}
                  className="rounded-lg bg-brass px-4 py-2 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? "Pausing…" : "Pause Membership"}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
