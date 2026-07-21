"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { EditMemberModal } from "@/components/members/EditMemberModal";

export function MemberDetailActions({
  member,
}: {
  member: { member_id: string; full_name: string; phone: string; email: string | null };
}) {
  const [showEdit, setShowEdit] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowEdit(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-ink-line/25 bg-white/70 px-3 py-2 text-sm font-medium text-ink-text/70 transition hover:bg-ink-text/5"
      >
        <Pencil size={14} />
        Edit member details
      </button>

      {showEdit && (
        <EditMemberModal
          member={member}
          onClose={() => setShowEdit(false)}
          onSaved={() => setShowEdit(false)}
        />
      )}
    </>
  );
}
