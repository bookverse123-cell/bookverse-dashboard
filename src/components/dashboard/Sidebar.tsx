"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Armchair,
  Users,
  Wallet,
  Settings,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/seats", label: "Seat Map", icon: Armchair },
  { href: "/dashboard/members", label: "Members", icon: Users },
  { href: "/dashboard/finance", label: "Finance", icon: Wallet },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden lg:flex h-screen w-64 flex-col justify-between bg-ink px-5 py-6 text-parchment sticky top-0">
      <div>
        <div className="flex items-center gap-3 px-2 mb-10">
          <img
            src="https://res.cloudinary.com/dm8jtnzdi/image/upload/v1782547833/WhatsApp_Image_2026-06-14_at_11.35.04_1_nm8msy.jpg"
            alt="BOOKVERSE"
            className="h-9 w-9 rounded-lg object-cover"
          />
          <div>
            <p className="font-display text-base leading-tight">
              BOOKVERSE
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-parchment/40">
              Operations
            </p>
          </div>
        </div>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link key={item.href} href={item.href} className="relative block">
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-lg bg-parchment/10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <div
                  className={`relative z-10 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "text-brass-soft"
                      : "text-parchment/55 hover:text-parchment"
                  }`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-parchment/50 transition-colors hover:text-terracotta"
      >
        <LogOut size={18} />
        Sign out
      </button>
    </aside>
  );
}
