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

export async function addInvestment(input: LedgerInput) {
  if (!isSupabaseConfigured()) return { error: DEMO_ERROR };

  const supabase = await createClient();
  const { error } = await supabase.from("investments").insert({
    title: input.description,
    category: input.category,
    amount: input.amount,
    investment_date: input.date,
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
