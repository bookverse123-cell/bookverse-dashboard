"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/data";
import { revalidatePath } from "next/cache";

const DEMO_ERROR = "Connect Supabase first (see README) — demo data is read-only.";

export type LedgerInput = {
  description: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod?: "cash" | "upi" | "cash_upi";
  cashAmount?: number;
  upiAmount?: number;
};

export async function addCafeteriaExpense(input: LedgerInput) {
  if (!isSupabaseConfigured()) return { error: DEMO_ERROR };

  const supabase = await createClient();
  const { error } = await supabase.from("cafeteria_expenses").insert({
    description: input.description,
    category: input.category,
    amount: input.amount,
    expense_date: input.date,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/finance");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function addCafeteriaSale(input: Omit<LedgerInput, "category">) {
  if (!isSupabaseConfigured()) return { error: DEMO_ERROR };

  const supabase = await createClient();
  const { error } = await supabase.from("cafeteria_sales").insert({
    description: input.description,
    amount: input.amount,
    sale_date: input.date,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/finance");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function addExpenditure(input: LedgerInput) {
  if (!isSupabaseConfigured()) return { error: DEMO_ERROR };

  const paymentMethod = input.paymentMethod ?? "cash";
  if (!["cash", "upi", "cash_upi"].includes(paymentMethod)) {
    return { error: "Invalid payment method" };
  }
  const cashAmount = Number(input.cashAmount ?? 0);
  const upiAmount = Number(input.upiAmount ?? 0);

  if (paymentMethod === "cash_upi") {
    if (!Number.isFinite(cashAmount) || !Number.isFinite(upiAmount)) {
      return { error: "Enter valid split amounts for cash and UPI" };
    }
    if (cashAmount <= 0 || upiAmount <= 0) {
      return { error: "Cash + UPI split requires both cash and UPI amounts" };
    }
    if (Number((cashAmount + upiAmount).toFixed(2)) !== Number(input.amount)) {
      return { error: "Cash + UPI split must match the total amount" };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.from("investments").insert({
    title: input.description,
    category: input.category,
    amount: input.amount,
    investment_date: input.date,
    payment_method: paymentMethod,
    cash_amount: paymentMethod === "cash_upi" ? cashAmount : null,
    upi_amount: paymentMethod === "cash_upi" ? upiAmount : null,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/finance");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteLedgerRow(
  table: "cafeteria_expenses" | "cafeteria_sales" | "investments",
  id: string
) {
  if (!isSupabaseConfigured()) return { error: DEMO_ERROR };

  const supabase = await createClient();
  const { error } = await supabase.from(table).delete().eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/finance");
  revalidatePath("/dashboard");
  return { success: true };
}
