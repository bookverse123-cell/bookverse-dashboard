"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { updateMemberProfile } from "@/app/dashboard/members/actions";

export function EditMemberModal({
  member,
  onClose,
  onSaved,
}: {
  member: { member_id: string; full_name: string; phone: string; email: string | null };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [fullName, setFullName] = useState(member.full_name);
  const [phone, setPhone] = useState(member.phone);
  const [email, setEmail] = useState(member.email ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setLoading(true);
    setError(null);

    const res = await updateMemberProfile({
      memberId: member.member_id,
      fullName,
      phone,
      email: email || undefined,
    });

    setLoading(false);

    if (res?.error) {
      setError(res.error);
      return;
    }

    onSaved();
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
              Edit member
            </span>
            <h2 className="mt-1 font-display text-2xl text-ink-text">{member.full_name}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-ink-text/40 transition hover:bg-ink-text/5 hover:text-ink-text"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-ink-text/50">
              Full name
            </label>
            <input
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-ink-text/50">
              Phone
            </label>
            <input
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-ink-text/50">
              Email (optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-terracotta/20 bg-terracotta/10 px-3 py-2 text-sm text-terracotta">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink-text px-4 py-3 text-sm font-medium text-parchment transition hover:bg-ink disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Saving…" : "Save details"}
          </button>
        </form>
      </motion.div>
    </>
  );
}
