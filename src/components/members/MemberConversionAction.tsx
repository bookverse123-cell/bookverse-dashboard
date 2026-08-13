"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightLeft } from "lucide-react";
import type { SeatStatus } from "@/lib/types";
import { MembershipConversionModal } from "@/components/members/MembershipConversionModal";

export function MemberConversionAction({
  membership,
  availableSeats,
}: {
  membership: { membership_id: string; member_id: string; start_date: string; end_date: string; batch: string | null };
  availableSeats: SeatStatus[];
}) {
  const [show, setShow] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setShow(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-ink-line/25 bg-white/70 px-3 py-2 text-sm font-medium text-ink-text/70 transition hover:bg-ink-text/5"
      >
        <ArrowRightLeft size={14} />
        Convert to 24x7
      </button>

      {show && (
        <MembershipConversionModal
          membership={membership}
          availableSeats={availableSeats}
          onClose={() => setShow(false)}
          onSaved={() => {
            setShow(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
