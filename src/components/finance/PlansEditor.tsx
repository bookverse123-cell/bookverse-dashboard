"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import type { MembershipPlan } from "@/lib/types";
import { updatePlanPrice } from "@/app/dashboard/settings/actions";

export function PlansEditor({ plans }: { plans: MembershipPlan[] }) {
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(plans.map((p) => [p.id, p.price]))
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(planId: string) {
    setSavingId(planId);
    setError(null);
    const res = await updatePlanPrice(planId, values[planId]);
    setSavingId(null);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setSavedId(planId);
    setTimeout(() => setSavedId(null), 1500);
  }

  const library = plans.filter((p) => p.zone === "library");
  const lounge = plans.filter((p) => p.zone === "lounge");

  return (
    <div className="rounded-2xl border border-ink-line/10 bg-white/60 p-5 sm:p-6">
      <h3 className="font-display text-lg text-ink-text">Membership pricing</h3>
      <p className="mb-4 text-sm text-ink-text/50">
        Update prices any time — new memberships will use the new rate immediately.
      </p>

      {error && (
        <p className="mb-4 rounded-lg border border-terracotta/20 bg-terracotta/10 px-3 py-2 text-sm text-terracotta">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {[{ title: "Reading Hall", rows: library }, { title: "Premium Lounge", rows: lounge }].map((group) => (
          <div key={group.title}>
            <p className="mb-2 font-mono text-xs uppercase tracking-wider text-ink-text/40">{group.title}</p>
            <div className="space-y-2">
              {group.rows.map((plan) => (
                <div key={plan.id} className="flex items-center gap-3 rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5">
                  <span className="flex-1 text-sm text-ink-text">{plan.duration_months} Month{plan.duration_months > 1 ? "s" : ""}</span>
                  <span className="text-ink-text/40">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={values[plan.id]}
                    onChange={(e) => setValues((v) => ({ ...v, [plan.id]: Number(e.target.value) }))}
                    className="w-24 rounded-md border border-parchment-line bg-white px-2 py-1 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSave(plan.id)}
                    disabled={savingId === plan.id}
                    className="flex h-8 w-8 items-center justify-center rounded-md bg-ink-text/5 text-ink-text/60 transition hover:bg-ink-text/10 disabled:opacity-50"
                  >
                    {savingId === plan.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : savedId === plan.id ? (
                      <Check size={14} className="text-sage" />
                    ) : (
                      "Save"
                    )}
                  </motion.button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
