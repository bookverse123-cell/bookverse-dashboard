"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, X, Loader2 } from "lucide-react";
import type { LedgerRow } from "@/lib/types";
import {
  addCafeteriaExpense,
  addCafeteriaSale,
  addExpenditure,
  deleteLedgerRow,
  type LedgerInput,
} from "@/app/dashboard/finance/actions";

type Kind = "expense" | "sale" | "expenditure";
type ExpenditurePaymentMethod = "cash" | "upi" | "cash_upi";

const todayStr = () => new Date().toISOString().slice(0, 10);

const ACTIONS: Record<Kind, (input: LedgerInput) => Promise<{ error?: string; success?: boolean }>> = {
  expense: addCafeteriaExpense,
  sale: (input) => addCafeteriaSale(input),
  expenditure: addExpenditure,
};

const TABLES: Record<Kind, "cafeteria_expenses" | "cafeteria_sales" | "investments"> = {
  expense: "cafeteria_expenses",
  sale: "cafeteria_sales",
  expenditure: "investments",
};

export function LedgerTable({
  title,
  description,
  rows,
  kind,
  categories,
  amountClassName = "text-ink-text",
  amountPrefix = "₹",
}: {
  title: string;
  description?: string;
  rows: LedgerRow[];
  kind: Kind;
  categories?: string[];
  amountClassName?: string;
  amountPrefix?: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState(categories?.[0] ?? "");
  const [customCategory, setCustomCategory] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [date, setDate] = useState(todayStr());
  const [paymentMethod, setPaymentMethod] = useState<ExpenditurePaymentMethod>("cash");
  const [cashAmount, setCashAmount] = useState<number | "">("");
  const [upiAmount, setUpiAmount] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const total = rows.reduce((sum, r) => sum + r.amount, 0);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (amount === "" || !desc.trim()) return;

    const isCustomCategory = kind === "expenditure" && category === "__custom__";
    const finalCategory = categories
      ? (isCustomCategory ? customCategory.trim() : category)
      : "General";

    if (categories && !finalCategory) {
      setError("Enter a category name");
      return;
    }

    if (kind === "expenditure" && paymentMethod === "cash_upi") {
      const cash = Number(cashAmount ?? 0);
      const upi = Number(upiAmount ?? 0);

      if (!Number.isFinite(cash) || !Number.isFinite(upi) || cash <= 0 || upi <= 0) {
        setError("Enter valid split amounts for cash and UPI");
        return;
      }

      const total = Number((cash + upi).toFixed(2));
      if (total !== Number(amount)) {
        setError("Cash + UPI split must match the total amount");
        return;
      }
    }

    setLoading(true);
    setError(null);

    const res = await ACTIONS[kind]({
      description: desc,
      category: finalCategory || "General",
      amount: Number(amount),
      date,
      paymentMethod: kind === "expenditure" ? paymentMethod : undefined,
      cashAmount: kind === "expenditure" && paymentMethod === "cash_upi" ? Number(cashAmount) : undefined,
      upiAmount: kind === "expenditure" && paymentMethod === "cash_upi" ? Number(upiAmount) : undefined,
    });

    setLoading(false);

    if (res?.error) {
      setError(res.error);
      return;
    }

    setDesc("");
    setAmount("");
    setCustomCategory("");
    setPaymentMethod("cash");
    setCashAmount("");
    setUpiAmount("");
    setShowForm(false);
  }

  function paymentMethodLabel(row: LedgerRow) {
    if (!row.payment_method) return "";
    if (row.payment_method === "cash_upi") {
      const cash = row.cash_amount ?? 0;
      const upi = row.upi_amount ?? 0;
      return `Cash + UPI (₹${cash.toLocaleString("en-IN")} + ₹${upi.toLocaleString("en-IN")})`;
    }
    return row.payment_method === "upi" ? "UPI" : "Cash";
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteLedgerRow(TABLES[kind], id);
    setDeletingId(null);
  }

  return (
    <div className="rounded-2xl border border-ink-line/10 bg-white/60 p-5 sm:p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-display text-lg text-ink-text">{title}</h3>
          {description && <p className="text-sm text-ink-text/50">{description}</p>}
        </div>
        <div className="text-right">
          <p className={`font-display text-xl ${amountClassName}`}>
            {amountPrefix}{total.toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-ink-text/40">total shown</p>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAdd}
            className="mb-4 overflow-hidden"
          >
            <div className="grid grid-cols-1 gap-3 rounded-xl border border-parchment-line bg-white/70 p-4 sm:grid-cols-2">
              <input
                required
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Description"
                className="rounded-lg border border-parchment-line bg-white px-3 py-2 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30 sm:col-span-2"
              />
              {categories && (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="rounded-lg border border-parchment-line bg-white px-3 py-2 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  {kind === "expenditure" && <option value="__custom__">Custom</option>}
                </select>
              )}
              {kind === "expenditure" && category === "__custom__" && (
                <input
                  required
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Custom category (e.g. Printer Repair)"
                  className="rounded-lg border border-parchment-line bg-white px-3 py-2 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
                />
              )}
              <input
                type="number"
                required
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Amount (₹)"
                className={`rounded-lg border border-parchment-line bg-white px-3 py-2 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30 ${!categories ? "sm:col-span-1" : ""}`}
              />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-lg border border-parchment-line bg-white px-3 py-2 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
              />
              {kind === "expenditure" && (
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as ExpenditurePaymentMethod)}
                  className="rounded-lg border border-parchment-line bg-white px-3 py-2 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="cash_upi">Cash + UPI (split)</option>
                </select>
              )}
              {kind === "expenditure" && paymentMethod === "cash_upi" && (
                <>
                  <input
                    type="number"
                    required
                    min={0}
                    step="0.01"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Cash amount (₹)"
                    className="rounded-lg border border-parchment-line bg-white px-3 py-2 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
                  />
                  <input
                    type="number"
                    required
                    min={0}
                    step="0.01"
                    value={upiAmount}
                    onChange={(e) => setUpiAmount(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="UPI amount (₹)"
                    className="rounded-lg border border-parchment-line bg-white px-3 py-2 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
                  />
                </>
              )}
              {error && (
                <p className="sm:col-span-2 rounded-lg border border-terracotta/20 bg-terracotta/10 px-3 py-2 text-sm text-terracotta">
                  {error}
                </p>
              )}
              <div className="flex gap-2 sm:col-span-2">
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-ink-text px-4 py-2 text-sm font-medium text-parchment transition hover:bg-ink disabled:opacity-50"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  Save
                </motion.button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg px-4 py-2 text-sm text-ink-text/50 transition hover:text-ink-text"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mb-4 flex items-center gap-2 rounded-lg border border-dashed border-ink-line/20 px-3 py-2 text-sm text-ink-text/50 transition hover:border-brass hover:text-brass-soft"
        >
          <Plus size={15} />
          Add entry
        </button>
      )}

      <div className="max-h-72 overflow-y-auto">
        <table className="w-full text-left text-sm">
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-parchment-line/60 last:border-0 group">
                <td className="py-2.5 pr-2">
                  <p className="text-ink-text">{row.description}</p>
                  <p className="text-xs text-ink-text/40">
                    {row.category}
                    {kind === "expenditure" && row.payment_method && ` · ${paymentMethodLabel(row)}`}
                    {" · "}
                    {new Date(row.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                  </p>
                </td>
                <td className={`py-2.5 text-right font-mono ${amountClassName}`}>
                  {amountPrefix}{row.amount.toLocaleString("en-IN")}
                </td>
                <td className="w-8 py-2.5 text-right">
                  <button
                    onClick={() => handleDelete(row.id)}
                    disabled={deletingId === row.id}
                    className="text-ink-text/20 transition hover:text-terracotta disabled:opacity-50"
                  >
                    {deletingId === row.id ? <X size={14} /> : <Trash2 size={14} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="py-6 text-center text-sm text-ink-text/40">No entries yet.</p>
        )}
      </div>
    </div>
  );
}
