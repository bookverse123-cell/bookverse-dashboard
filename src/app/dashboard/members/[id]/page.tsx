import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Phone, Mail, IndianRupee, CalendarDays, Layers } from "lucide-react";
import { getMemberDetail } from "@/lib/data";
import { Topbar } from "@/components/dashboard/Topbar";
import { MemberTimeline } from "@/components/members/MemberTimeline";
import { MemberBatchEditor } from "@/components/members/MemberBatchEditor";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getMemberDetail(id);
  if (!detail) notFound();

  const totalPaid = detail.memberships.reduce((sum, m) => sum + m.amount_paid, 0);
  const latestMembership = detail.memberships[detail.memberships.length - 1];
  const firstMembership = detail.memberships[0];

  const joinedLabel = firstMembership
    ? new Date(firstMembership.start_date).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      })
    : "—";

  const currentStatusLabel = latestMembership
    ? latestMembership.status === "active"
      ? "Active"
      : latestMembership.status === "cancelled"
      ? "Cancelled"
      : "Expired"
    : "—";

  const currentStatusClass = latestMembership?.status === "active"
    ? "bg-sage/15 text-sage"
    : latestMembership?.status === "cancelled"
    ? "bg-terracotta/15 text-terracotta"
    : "bg-ink-text/10 text-ink-text/50";

  return (
    <>
      <Topbar title={detail.full_name} subtitle="Member journey" />
      <div className="space-y-6 px-6 py-6 lg:px-10">

        {/* Back link */}
        <Link
          href="/dashboard/members"
          className="inline-flex items-center gap-1.5 text-sm text-ink-text/50 transition hover:text-ink-text"
        >
          <ChevronLeft size={16} />
          Members
        </Link>

        {/* Member header */}
        <div className="rounded-2xl border border-parchment-line bg-white/60 p-6">
          <h1 className="font-display text-3xl text-ink-text">{detail.full_name}</h1>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-ink-text/60">
            <span className="flex items-center gap-1.5">
              <Phone size={14} />
              {detail.phone}
            </span>
            {detail.email && (
              <span className="flex items-center gap-1.5">
                <Mail size={14} />
                {detail.email}
              </span>
            )}
          </div>
          <p className="mt-2 text-xs font-mono uppercase tracking-wider text-ink-text/30">
            Member since {joinedLabel}
          </p>
        </div>

        {latestMembership && (
          <MemberBatchEditor
            membershipId={latestMembership.membership_id}
            memberId={detail.member_id}
            initialBatch={latestMembership.batch}
          />
        )}

        {/* KPI strip */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-parchment-line bg-white/60 p-4">
            <div className="flex items-center gap-2 text-ink-text/40">
              <Layers size={15} />
              <span className="text-xs font-mono uppercase tracking-wider">Total periods</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-ink-text">{detail.memberships.length}</p>
          </div>
          <div className="rounded-xl border border-parchment-line bg-white/60 p-4">
            <div className="flex items-center gap-2 text-ink-text/40">
              <IndianRupee size={15} />
              <span className="text-xs font-mono uppercase tracking-wider">Total paid</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-ink-text">
              ₹{totalPaid.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="rounded-xl border border-parchment-line bg-white/60 p-4">
            <div className="flex items-center gap-2 text-ink-text/40">
              <CalendarDays size={15} />
              <span className="text-xs font-mono uppercase tracking-wider">Current status</span>
            </div>
            <div className="mt-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${currentStatusClass}`}>
                {currentStatusLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-2xl border border-parchment-line bg-white/60 p-6">
          <h2 className="mb-6 font-mono text-xs uppercase tracking-wider text-ink-text/40">
            Membership history
          </h2>
          <MemberTimeline memberships={detail.memberships} />
        </div>

      </div>
    </>
  );
}
