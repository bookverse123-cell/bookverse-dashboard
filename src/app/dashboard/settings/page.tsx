import { MessageCircle, Database, ShieldCheck } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { isSupabaseConfigured } from "@/lib/data";

export default async function SettingsPage() {
  const supabaseReady = isSupabaseConfigured();

  return (
    <>
      <Topbar title="Settings" subtitle="Integrations and account" />
      <div className="space-y-6 px-6 py-6 lg:px-10">
        <div className="rounded-2xl border border-ink-line/10 bg-white/60 p-5 sm:p-6">
          <h3 className="font-display text-lg text-ink-text">Integrations</h3>
          <p className="mb-4 text-sm text-ink-text/50">
            Status of the services this dashboard connects to.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-start gap-3 rounded-xl border border-parchment-line bg-white/70 p-4">
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${supabaseReady ? "bg-sage/15 text-sage" : "bg-brass/15 text-brass-soft"}`}>
                <Database size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-ink-text">Supabase</p>
                <p className="text-xs text-ink-text/50">
                  {supabaseReady ? "Connected — live data" : "Not connected"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-parchment-line bg-white/70 p-4">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brass/15 text-brass-soft">
                <MessageCircle size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-ink-text">Twilio WhatsApp</p>
                <p className="text-xs text-ink-text/50">
                  Configured via Supabase Edge Function secrets — see setup steps below
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-parchment-line bg-white/70 p-4">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-text/10 text-ink-text">
                <ShieldCheck size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-ink-text">Admin access</p>
                <p className="text-xs text-ink-text/50">
                  Single admin account via Supabase Auth (email + password)
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-ink-line/10 bg-white/60 p-5 sm:p-6">
          <h3 className="font-display text-lg text-ink-text">Automated reminders</h3>
          <p className="mt-2 text-sm text-ink-text/60">
            A scheduled Supabase Edge Function checks daily for memberships
            expiring within 3 days and sends a WhatsApp reminder to the
            member and a summary to your number. Deploy with{" "}
            <code className="font-mono text-xs">supabase functions deploy send-membership-reminders</code>{" "}
            then set your Twilio secrets in the Supabase dashboard.
          </p>
        </div>
      </div>
    </>
  );
}
