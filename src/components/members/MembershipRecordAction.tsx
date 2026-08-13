"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PencilLine } from "lucide-react";
import type { MemberHistoryEntry } from "@/lib/types";
import { MembershipRecordEditModal } from "@/components/members/MembershipRecordEditModal";

export function MembershipRecordAction({
  membership,
}: {
  membership: MemberHistoryEntry & { member_id: string };
}) {
  const [show, setShow] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setShow(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-ink-line/25 bg-white/70 px-3 py-2 text-sm font-medium text-ink-text/70 transition hover:bg-ink-text/5"
      >
        <PencilLine size={14} />
        Edit latest record
      </button>

      {show && (
        <MembershipRecordEditModal
          membership={membership}
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
