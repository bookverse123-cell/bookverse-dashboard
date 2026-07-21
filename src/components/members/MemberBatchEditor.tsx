"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { BATCH_OPTIONS, type BatchOption } from "@/lib/batches";
import { updateMembershipBatch } from "@/app/dashboard/members/actions";

export function MemberBatchEditor({
  membershipId,
  memberId,
  initialBatch,
}: {
  membershipId: string;
  memberId: string;
  initialBatch: BatchOption | null;
}) {
  const [batch, setBatch] = useState<BatchOption>(initialBatch ?? "24x7 Batch");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const res = await updateMembershipBatch({ membershipId, memberId, batch });
      if (res?.error) {
        setError(res.error);
        return;
      }
      setSuccess("Batch updated");
    });
  }

  return (
    <div className="rounded-2xl border border-parchment-line bg-white/60 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="w-full sm:max-w-xs">
          <label className="block text-xs font-mono uppercase tracking-wider text-ink-text/40 mb-1.5">
            Batch
          </label>
          <select
            value={batch}
            onChange={(e) => setBatch(e.target.value as BatchOption)}
            className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
          >
            {BATCH_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex h-[42px] items-center justify-center gap-2 rounded-lg bg-ink-text px-4 text-sm font-medium text-parchment transition hover:bg-ink disabled:opacity-50"
        >
          {isPending && <Loader2 size={15} className="animate-spin" />}
          {isPending ? "Saving…" : "Save batch"}
        </button>
      </div>

      {error && (
        <p className="mt-2 rounded-lg border border-terracotta/20 bg-terracotta/10 px-3 py-2 text-sm text-terracotta">
          {error}
        </p>
      )}
      {success && <p className="mt-2 text-sm text-sage">{success}</p>}
    </div>
  );
}
