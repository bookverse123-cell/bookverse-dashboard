"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function KPICard({
  icon,
  label,
  value,
  suffix,
  accent = "brass",
  delay = 0,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  suffix?: string;
  accent?: "brass" | "sage" | "terracotta" | "ink";
  delay?: number;
}) {
  const accentMap: Record<string, string> = {
    brass: "bg-brass/15 text-brass-soft",
    sage: "bg-sage/15 text-sage",
    terracotta: "bg-terracotta/15 text-terracotta",
    ink: "bg-ink-text/10 text-ink-text",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-ink-line/10 bg-white/60 p-5"
    >
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${accentMap[accent]}`}>
        {icon}
      </div>
      <p className="font-display text-3xl text-ink-text">
        {value}
        {suffix && <span className="ml-1 text-base text-ink-text/40">{suffix}</span>}
      </p>
      <p className="mt-1 text-sm text-ink-text/50">{label}</p>
    </motion.div>
  );
}
