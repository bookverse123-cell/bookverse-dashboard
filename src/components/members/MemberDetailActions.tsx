"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { EditMemberModal } from "@/components/members/EditMemberModal";
import { deleteMemberProfile } from "@/app/dashboard/members/actions";

export function MemberDetailActions({
  member,
}: {
  member: { member_id: string; full_name: string; phone: string; email: string | null };
}) {
  const [showEdit, setShowEdit] = useState(false);
  const [isDeleting, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm(`Delete ${member.full_name}? This will remove the member and all membership history.`)) {
      return;
    }

    startTransition(async () => {
      const res = await deleteMemberProfile({ memberId: member.member_id });
      if (res?.error) {
        alert(res.error);
        return;
      }
      router.push("/dashboard/members");
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShowEdit(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-ink-line/25 bg-white/70 px-3 py-2 text-sm font-medium text-ink-text/70 transition hover:bg-ink-text/5"
        >
          <Pencil size={14} />
          Edit member details
        </button>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="inline-flex items-center gap-1.5 rounded-lg border border-terracotta/30 bg-white/70 px-3 py-2 text-sm font-medium text-terracotta transition hover:bg-terracotta/10 disabled:opacity-50"
        >
          <Trash2 size={14} />
          {isDeleting ? "Deleting..." : "Delete member"}
        </button>
      </div>

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
