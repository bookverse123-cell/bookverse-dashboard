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

function normalizePayment(input: {
  amount: number;
  paymentMethod?: "cash" | "upi" | "cash_upi";
  cashAmount?: number;
  upiAmount?: number;
}) {
  const paymentMethod = input.paymentMethod ?? "upi";
  if (!["cash", "upi", "cash_upi"].includes(paymentMethod)) {
    return { error: "Invalid payment method" };
  }

  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount < 0) {
    return { error: "Amount must be zero or greater" };
  }

  if (paymentMethod !== "cash_upi") {
    return {
      payment: {
        payment_method: paymentMethod,
        cash_amount: null as number | null,
        upi_amount: null as number | null,
      },
    };
  }

  const cashAmount = Number(input.cashAmount ?? 0);
  const upiAmount = Number(input.upiAmount ?? 0);

  if (!Number.isFinite(cashAmount) || !Number.isFinite(upiAmount)) {
    return { error: "Enter valid split amounts for cash and UPI" };
  }
  if (cashAmount <= 0 || upiAmount <= 0) {
    return { error: "Cash + UPI split requires both cash and UPI amounts" };
  }
  if (Number((cashAmount + upiAmount).toFixed(2)) !== Number(amount.toFixed(2))) {
    return { error: "Cash + UPI split must match the total amount" };
  }

  return {
    payment: {
      payment_method: paymentMethod,
      cash_amount: cashAmount,
      upi_amount: upiAmount,
    },
  };
}

export async function addCafeteriaExpense(input: LedgerInput) {
  if (!isSupabaseConfigured()) return { error: DEMO_ERROR };

  const paymentDetails = normalizePayment({
    amount: input.amount,
    paymentMethod: input.paymentMethod,
    cashAmount: input.cashAmount,
    upiAmount: input.upiAmount,
  });
  if (paymentDetails.error) return { error: paymentDetails.error };
  const payment = paymentDetails.payment;
  if (!payment) return { error: "Failed to normalize payment details" };

  const supabase = await createClient();
  const { error } = await supabase.from("cafeteria_expenses").insert({
    description: input.description,
    category: input.category,
    amount: input.amount,
    expense_date: input.date,
    payment_method: payment.payment_method,
    cash_amount: payment.cash_amount,
    upi_amount: payment.upi_amount,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/finance");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function addCafeteriaSale(input: LedgerInput) {
  if (!isSupabaseConfigured()) return { error: DEMO_ERROR };

  const paymentDetails = normalizePayment({
    amount: input.amount,
    paymentMethod: input.paymentMethod,
    cashAmount: input.cashAmount,
    upiAmount: input.upiAmount,
  });
  if (paymentDetails.error) return { error: paymentDetails.error };
  const payment = paymentDetails.payment;
  if (!payment) return { error: "Failed to normalize payment details" };

  const supabase = await createClient();
  const { error } = await supabase.from("cafeteria_sales").insert({
    description: input.description,
    amount: input.amount,
    sale_date: input.date,
    payment_method: payment.payment_method,
    cash_amount: payment.cash_amount,
    upi_amount: payment.upi_amount,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/finance");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function addExpenditure(input: LedgerInput) {
  if (!isSupabaseConfigured()) return { error: DEMO_ERROR };

  const paymentDetails = normalizePayment({
    amount: input.amount,
    paymentMethod: input.paymentMethod ?? "cash",
    cashAmount: input.cashAmount,
    upiAmount: input.upiAmount,
  });
  if (paymentDetails.error) return { error: paymentDetails.error };
  const payment = paymentDetails.payment;
  if (!payment) return { error: "Failed to normalize payment details" };

  const supabase = await createClient();
  const { error } = await supabase.from("investments").insert({
    title: input.description,
    category: input.category,
    amount: input.amount,
    investment_date: input.date,
    payment_method: payment.payment_method,
    cash_amount: payment.cash_amount,
    upi_amount: payment.upi_amount,
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

export async function updateCafeteriaExpense(id: string, input: LedgerInput) {
  if (!isSupabaseConfigured()) return { error: DEMO_ERROR };

  const paymentDetails = normalizePayment({
    amount: input.amount,
    paymentMethod: input.paymentMethod,
    cashAmount: input.cashAmount,
    upiAmount: input.upiAmount,
  });
  if (paymentDetails.error) return { error: paymentDetails.error };
  const payment = paymentDetails.payment;
  if (!payment) return { error: "Failed to normalize payment details" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("cafeteria_expenses")
    .update({
      description: input.description,
      category: input.category,
      amount: input.amount,
      expense_date: input.date,
      payment_method: payment.payment_method,
      cash_amount: payment.cash_amount,
      upi_amount: payment.upi_amount,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/finance");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateCafeteriaSale(id: string, input: LedgerInput) {
  if (!isSupabaseConfigured()) return { error: DEMO_ERROR };

  const paymentDetails = normalizePayment({
    amount: input.amount,
    paymentMethod: input.paymentMethod,
    cashAmount: input.cashAmount,
    upiAmount: input.upiAmount,
  });
  if (paymentDetails.error) return { error: paymentDetails.error };
  const payment = paymentDetails.payment;
  if (!payment) return { error: "Failed to normalize payment details" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("cafeteria_sales")
    .update({
      description: input.description,
      amount: input.amount,
      sale_date: input.date,
      payment_method: payment.payment_method,
      cash_amount: payment.cash_amount,
      upi_amount: payment.upi_amount,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/finance");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateExpenditure(id: string, input: LedgerInput) {
  if (!isSupabaseConfigured()) return { error: DEMO_ERROR };

  const paymentDetails = normalizePayment({
    amount: input.amount,
    paymentMethod: input.paymentMethod ?? "cash",
    cashAmount: input.cashAmount,
    upiAmount: input.upiAmount,
  });
  if (paymentDetails.error) return { error: paymentDetails.error };
  const payment = paymentDetails.payment;
  if (!payment) return { error: "Failed to normalize payment details" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("investments")
    .update({
      title: input.description,
      category: input.category,
      amount: input.amount,
      investment_date: input.date,
      payment_method: payment.payment_method,
      cash_amount: payment.cash_amount,
      upi_amount: payment.upi_amount,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/finance");
  revalidatePath("/dashboard");
  return { success: true };
}
