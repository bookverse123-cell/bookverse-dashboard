"use client";

import { Bell } from "lucide-react";
import { motion } from "framer-motion";

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <header className="flex items-center justify-between border-b border-ink-line/10 px-6 py-5 lg:px-10">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="font-display text-2xl text-ink-text"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <p className="mt-1 text-sm text-ink-text/50">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <span className="hidden font-mono text-xs uppercase tracking-wider text-ink-text/40 sm:block">
          {today}
        </span>
        <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-ink-line/15 text-ink-text/60 transition hover:bg-ink-text/5">
          <Bell size={18} />
          <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-terracotta" />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brass font-display text-sm font-semibold text-ink">
          A
        </div>
      </div>
    </header>
  );
}
