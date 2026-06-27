"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-sm"
    >
      <div className="mb-8">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          Admin access
        </span>
        <h1 className="font-display text-3xl text-ink-text mt-2">
          Welcome back
        </h1>
        <p className="text-ink-text/60 text-sm mt-2">
          Sign in to manage seats, members, and the books.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-ink-text/50 mb-2">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@stacksandgrounds.com"
            className="w-full rounded-lg border border-parchment-line bg-white/60 px-4 py-3 text-ink-text placeholder:text-ink-text/30 outline-none transition focus:border-brass focus:ring-2 focus:ring-brass/30"
          />
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-ink-text/50 mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-parchment-line bg-white/60 px-4 py-3 pr-12 text-ink-text placeholder:text-ink-text/30 outline-none transition focus:border-brass focus:ring-2 focus:ring-brass/30"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-text/40 hover:text-ink-text/70 transition"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-sm text-terracotta bg-terracotta/10 border border-terracotta/20 rounded-lg px-3 py-2"
        >
          {error}
        </motion.p>
      )}

      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="mt-6 w-full flex items-center justify-center gap-2 rounded-lg bg-ink-text px-4 py-3 font-medium text-parchment transition hover:bg-ink disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in"}
        {!loading && <ArrowRight size={16} />}
      </motion.button>

      <p className="mt-6 text-center text-xs text-ink-text/40">
        Single admin account — set up via Supabase Auth.
      </p>
    </motion.form>
  );
}
