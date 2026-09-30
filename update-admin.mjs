import { createClient } from "@supabase/supabase-js";

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  USER_ID = "a3d63ddc-e606-4881-8e69-e557f394bd18",
  NEW_EMAIL = "bookverse@bookverse.in",
  NEW_PASSWORD = "Submit@9904",
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const { data, error } = await supabase.auth.admin.updateUserById(USER_ID, {
  email: NEW_EMAIL,
  password: NEW_PASSWORD,
  email_confirm: true,
});

if (error) throw error;

console.log("Updated:", data.user.email, data.user.id);
