"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LockKeyhole, Unlock, X, Loader2, Pencil } from "lucide-react";
import type { LockerStatus } from "@/lib/types";
import { allocateLocker, releaseLocker, updateLockerAllocation } from "@/app/dashboard/lockers/actions";

type MemberOption = {
  member_id: string;
  full_name: string;
  phone: string;
  seat_code: string;
};
type LockerPaymentMethod = "cash" | "upi" | "cash_upi";
type LockerDuration = 1 | 3;

const todayStr = () => new Date().toISOString().slice(0, 10);

export function LockersBoard({ lockers, members }: { lockers: LockerStatus[]; members: MemberOption[] }) {
  const [selected, setSelected] = useState<LockerStatus | null>(null);
  const [memberId, setMemberId] = useState(members[0]?.member_id ?? "");
  const [memberQuery, setMemberQuery] = useState("");
  const [showMemberOptions, setShowMemberOptions] = useState(false);
  const [assignedAt, setAssignedAt] = useState(todayStr());
  const [durationMonths, setDurationMonths] = useState<LockerDuration>(1);
  const [price, setPrice] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState<LockerPaymentMethod>("cash");
  const [cashAmount, setCashAmount] = useState<number | "">("");
  const [upiAmount, setUpiAmount] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const occupiedCount = useMemo(
    () => lockers.filter((locker) => locker.allocation_status === "active").length,
    [lockers],
  );

  const availableCount = lockers.length - occupiedCount;

  const selectedMember = members.find((member) => member.member_id === memberId) ?? null;

  const filteredMembers = useMemo(() => {
    const query = memberQuery.trim().toLowerCase();
    if (!query) return members;
    return members.filter((member) => {
      const searchable = `${member.full_name} ${member.phone} ${member.seat_code}`.toLowerCase();
      return searchable.includes(query);
    });
  }, [members, memberQuery]);

  async function handleAllocate() {
    if (!selected || selected.allocation_status === "active") return;
    if (!memberId) {
      setError("Select a member first");
      return;
    }

    setSaving(true);
    setError(null);
    const res = await allocateLocker({
      lockerId: selected.locker_id,
      memberId,
      assignedAt,
      durationMonths,
      price: price === "" ? 0 : Number(price),
      paymentMethod,
      cashAmount: paymentMethod === "cash_upi" ? Number(cashAmount) : undefined,
      upiAmount: paymentMethod === "cash_upi" ? Number(upiAmount) : undefined,
      notes: notes.trim() || undefined,
    });
    setSaving(false);

    if (res?.error) {
      setError(res.error);
      return;
    }

    setSelected(null);
    setNotes("");
    setCashAmount("");
    setUpiAmount("");
  }

  async function handleUpdate() {
    if (!selected?.allocation_id) return;
    if (!memberId) {
      setError("Select a member first");
      return;
    }

    setSaving(true);
    setError(null);
    const res = await updateLockerAllocation({
      allocationId: selected.allocation_id,
      memberId,
      assignedAt,
      durationMonths,
      price: price === "" ? 0 : Number(price),
      paymentMethod,
      cashAmount: paymentMethod === "cash_upi" ? Number(cashAmount) : undefined,
      upiAmount: paymentMethod === "cash_upi" ? Number(upiAmount) : undefined,
      notes: notes.trim() || undefined,
    });
    setSaving(false);

    if (res?.error) {
      setError(res.error);
      return;
    }

    setSelected(null);
    setIsEditing(false);
    setNotes("");
    setPrice("");
    setCashAmount("");
    setUpiAmount("");
  }

  function paymentMethodLabel(locker: LockerStatus) {
    if (!locker.payment_method) return "Cash";
    if (locker.payment_method === "cash_upi") {
      return `Cash + UPI (₹${Number(locker.cash_amount ?? 0).toLocaleString("en-IN")} + ₹${Number(locker.upi_amount ?? 0).toLocaleString("en-IN")})`;
    }
    return locker.payment_method === "upi" ? "UPI" : "Cash";
  }

  async function handleRelease() {
    if (!selected?.allocation_id) return;

    setReleasing(true);
    setError(null);
    const res = await releaseLocker({ allocationId: selected.allocation_id });
    setReleasing(false);

    if (res?.error) {
      setError(res.error);
      return;
    }

    setSelected(null);
  }

  return (
    <>
      <div className="rounded-2xl border border-ink-line/10 bg-white/60 p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg text-ink-text">Locker allocation</h3>
            <p className="text-sm text-ink-text/50">Click any locker to allocate or release</p>
          </div>
          <div className="text-right text-sm">
            <p className="text-sage">Available: {availableCount}</p>
            <p className="text-terracotta">Allocated: {occupiedCount}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9">
          {lockers.map((locker) => {
            const isAllocated = locker.allocation_status === "active";
            return (
              <button
                key={locker.locker_id}
                onClick={() => {
                  setSelected(locker);
                  setError(null);
                  setIsEditing(false);
                  setAssignedAt(locker.assigned_at ?? todayStr());
                  setDurationMonths(locker.duration_months ?? 1);
                  setPrice(locker.price ?? "");
                  setPaymentMethod(locker.payment_method ?? "cash");
                  setCashAmount(locker.cash_amount ?? "");
                  setUpiAmount(locker.upi_amount ?? "");
                  setNotes(locker.notes ?? "");
                  if (locker.member_id) setMemberId(locker.member_id);
                  if (!isAllocated && members.length) {
                    setMemberId(members[0].member_id);
                    setMemberQuery("");
                    setPrice("");
                    setDurationMonths(1);
                    setPaymentMethod("cash");
                    setCashAmount("");
                    setUpiAmount("");
                    setNotes("");
                    setAssignedAt(todayStr());
                  }
                }}
                className={`rounded-xl border px-3 py-3 text-left transition ${
                  isAllocated
                    ? "border-terracotta/30 bg-terracotta/10 hover:bg-terracotta/15"
                    : "border-sage/25 bg-sage/10 hover:bg-sage/15"
                }`}
              >
                <p className="font-mono text-xs uppercase tracking-wider text-ink-text/50">{locker.locker_code}</p>
                <p className={`mt-1 text-sm font-medium ${isAllocated ? "text-terracotta" : "text-sage"}`}>
                  {isAllocated ? "Allocated" : "Available"}
                </p>
                <p className="mt-1 truncate text-xs text-ink-text/55">{locker.full_name ?? "No member"}</p>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              className="fixed left-1/2 top-1/2 z-50 w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-ink-line/10 bg-parchment p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-text/40">Locker</p>
                  <h3 className="mt-1 font-display text-2xl text-ink-text">{selected.locker_code}</h3>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="rounded-full p-2 text-ink-text/45 transition hover:bg-ink-text/5 hover:text-ink-text"
                >
                  <X size={18} />
                </button>
              </div>

              {selected.allocation_status === "active" && !isEditing ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-parchment-line bg-white/70 p-4">
                    <p className="text-sm font-medium text-ink-text">{selected.full_name}</p>
                    <p className="text-xs text-ink-text/55">{selected.phone}</p>
                    <p className="mt-2 text-xs text-ink-text/45">
                      Allocated on {selected.assigned_at ? new Date(selected.assigned_at).toLocaleDateString("en-IN") : "—"}
                    </p>
                    <p className="mt-1 text-xs text-ink-text/45">
                      Validity: {selected.duration_months ?? 1} month{(selected.duration_months ?? 1) > 1 ? "s" : ""}
                      {selected.valid_till ? ` · till ${new Date(selected.valid_till).toLocaleDateString("en-IN")}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-ink-text/45">
                      Price: ₹{Number(selected.price ?? 0).toLocaleString("en-IN")}
                    </p>
                    <p className="mt-1 text-xs text-ink-text/45">
                      Payment: {paymentMethodLabel(selected)}
                    </p>
                    {selected.notes && (
                      <p className="mt-1 text-xs text-ink-text/45">Note: {selected.notes}</p>
                    )}
                  </div>

                  {error && (
                    <p className="rounded-lg border border-terracotta/20 bg-terracotta/10 px-3 py-2 text-sm text-terracotta">
                      {error}
                    </p>
                  )}

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-ink-line/20 bg-white px-4 py-2.5 text-sm font-medium text-ink-text transition hover:bg-ink-text/5"
                    >
                      <Pencil size={15} />
                      Edit allocation
                    </button>
                    <button
                      onClick={handleRelease}
                      disabled={releasing}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-terracotta px-4 py-2.5 text-sm font-medium text-parchment transition hover:opacity-90 disabled:opacity-50"
                    >
                      {releasing ? <Loader2 size={14} className="animate-spin" /> : <Unlock size={15} />}
                      {releasing ? "Releasing…" : "Release locker"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-ink-text/50">Member</label>
                    <div className="relative">
                      <input
                        value={memberQuery}
                        onChange={(event) => {
                          setMemberQuery(event.target.value);
                          setShowMemberOptions(true);
                        }}
                        onFocus={() => setShowMemberOptions(true)}
                        placeholder={
                          selectedMember
                            ? `${selectedMember.full_name} · ${selectedMember.phone}`
                            : "Search member by name, phone, or seat"
                        }
                        className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
                      />

                      {showMemberOptions && members.length > 0 && (
                        <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-parchment-line bg-white shadow-xl">
                          {filteredMembers.length === 0 ? (
                            <p className="px-3 py-2 text-xs text-ink-text/45">No member found.</p>
                          ) : (
                            filteredMembers.map((member) => (
                              <button
                                key={member.member_id}
                                type="button"
                                onClick={() => {
                                  setMemberId(member.member_id);
                                  setMemberQuery("");
                                  setShowMemberOptions(false);
                                }}
                                className={`w-full border-b border-parchment-line/60 px-3 py-2 text-left text-xs transition last:border-b-0 hover:bg-ink-text/5 ${
                                  member.member_id === memberId ? "bg-brass/10" : ""
                                }`}
                              >
                                <p className="font-medium text-ink-text">{member.full_name}</p>
                                <p className="text-ink-text/50">{member.phone} · {member.seat_code}</p>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    {selectedMember && (
                      <p className="mt-1 text-xs text-ink-text/50">
                        Selected: {selectedMember.full_name} · {selectedMember.phone} · {selectedMember.seat_code}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-ink-text/50">Assigned date</label>
                    <input
                      type="date"
                      value={assignedAt}
                      onChange={(event) => setAssignedAt(event.target.value)}
                      className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-ink-text/50">Validity</label>
                    <select
                      value={durationMonths}
                      onChange={(event) => setDurationMonths(Number(event.target.value) as LockerDuration)}
                      className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
                    >
                      <option value={1}>1 Month</option>
                      <option value={3}>3 Months</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-ink-text/50">Price (₹)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={price}
                      onChange={(event) => setPrice(event.target.value === "" ? "" : Number(event.target.value))}
                      className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-ink-text/50">Payment method</label>
                    <select
                      value={paymentMethod}
                      onChange={(event) => setPaymentMethod(event.target.value as LockerPaymentMethod)}
                      className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="cash_upi">Cash + UPI</option>
                    </select>
                  </div>

                  {paymentMethod === "cash_upi" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-ink-text/50">Cash amount (₹)</label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={cashAmount}
                          onChange={(event) => setCashAmount(event.target.value === "" ? "" : Number(event.target.value))}
                          className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-ink-text/50">UPI amount (₹)</label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={upiAmount}
                          onChange={(event) => setUpiAmount(event.target.value === "" ? "" : Number(event.target.value))}
                          className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-ink-text/50">Notes (optional)</label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      className="w-full resize-none rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
                    />
                  </div>

                  {error && (
                    <p className="rounded-lg border border-terracotta/20 bg-terracotta/10 px-3 py-2 text-sm text-terracotta">
                      {error}
                    </p>
                  )}

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {selected.allocation_status === "active" && isEditing && (
                      <button
                        onClick={() => setIsEditing(false)}
                        className="w-full rounded-lg border border-ink-line/20 bg-white px-4 py-2.5 text-sm font-medium text-ink-text transition hover:bg-ink-text/5"
                      >
                        Cancel edit
                      </button>
                    )}
                    <button
                      onClick={selected.allocation_status === "active" ? handleUpdate : handleAllocate}
                      disabled={saving || members.length === 0}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink-text px-4 py-2.5 text-sm font-medium text-parchment transition hover:bg-ink disabled:opacity-50"
                    >
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <LockKeyhole size={15} />}
                      {saving
                        ? (selected.allocation_status === "active" ? "Saving…" : "Allocating…")
                        : (selected.allocation_status === "active" ? "Save changes" : "Allocate locker")}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
