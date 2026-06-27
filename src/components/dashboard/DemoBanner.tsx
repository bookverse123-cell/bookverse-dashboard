import { Info } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl border border-brass/30 bg-brass/10 px-4 py-3 text-sm text-brass-soft">
      <Info size={16} className="shrink-0" />
      <p>
        Showing demo data — connect Supabase (see <code className="font-mono">README.md</code>) to
        see and manage your real seats, members, and finances.
      </p>
    </div>
  );
}
