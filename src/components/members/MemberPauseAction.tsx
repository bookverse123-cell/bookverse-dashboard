"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PauseCircle, PlayCircle } from "lucide-react";
import type { SeatStatus } from "@/lib/types";
import { pauseMembership } from "@/app/dashboard/members/actions";
import { ResumeMembershipModal } from "@/components/members/ResumeMembershipModal";

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
  const [showResume, setShowResume] = useState(false);

  if (membership.status !== "active" && membership.status !== "paused") return null;

  async function handlePause() {
    setLoading(true);
    setError(null);
    const result = await pauseMembership({
      membershipId: membership.membership_id,
      memberId: membership.member_id,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  if (membership.status === "paused") {
    const pausedDate = membership.paused_at ? new Date(membership.paused_at) : null;
    const daysPaused = pausedDate
      ? Math.round((Date.now() - pausedDate.getTime()) / 86400000)
      : 0;

    return (
      <>
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brass/15 px-3 py-1.5 text-xs font-medium text-brass-soft">
            <PauseCircle size={13} />
            Paused · {daysPaused}d elapsed
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
        onClick={handlePause}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg bg-brass px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-50"
      >
        <PauseCircle size={13} />
        {loading ? "Pausing…" : "Pause Membership"}
      </button>
      {error && <p className="mt-1 text-xs text-terracotta">{error}</p>}
    </>
  );
}
