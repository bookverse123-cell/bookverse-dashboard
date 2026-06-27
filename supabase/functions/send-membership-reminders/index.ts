// Supabase Edge Function: send-membership-reminders
//
// Two modes:
//  1. Cron (no body, or { mode: "cron" }): finds all memberships expiring
//     within 3 days that haven't had a reminder sent today, messages each
//     member on WhatsApp, and sends a summary to the admin's WhatsApp number.
//  2. Manual ({ membershipId }): sends a reminder for one specific membership
//     immediately (used by the "Send WhatsApp reminder now" button).
//
// Deploy:  supabase functions deploy send-membership-reminders
// Schedule (daily at 9am IST = 3:30am UTC):
//   supabase functions schedule send-membership-reminders --cron "30 3 * * *"
//
// Required secrets (supabase secrets set ...):
//   TWILIO_ACCOUNT_SID
//   TWILIO_AUTH_TOKEN
//   TWILIO_WHATSAPP_FROM      e.g. whatsapp:+14155238886 (Twilio sandbox number)
//   ADMIN_WHATSAPP_NUMBER     e.g. whatsapp:+9198xxxxxxxx (your number)
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.

import { createClient } from "jsr:@supabase/supabase-js@2";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN")!;
const TWILIO_WHATSAPP_FROM = Deno.env.get("TWILIO_WHATSAPP_FROM")!;
const ADMIN_WHATSAPP_NUMBER = Deno.env.get("ADMIN_WHATSAPP_NUMBER")!;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function sendWhatsApp(to: string, body: string) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

  const form = new URLSearchParams({
    From: TWILIO_WHATSAPP_FROM,
    To: to.startsWith("whatsapp:") ? to : `whatsapp:${to}`,
    Body: body,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message ?? `Twilio error ${res.status}`);
  }
  return data;
}

function memberMessage(name: string, seatCode: string, endDate: string, daysLeft: number) {
  const when =
    daysLeft < 0
      ? `expired ${Math.abs(daysLeft)} day(s) ago`
      : daysLeft === 0
      ? "ends today"
      : `ends in ${daysLeft} day(s) (on ${endDate})`;

  return `Hi ${name}! 👋 This is a reminder from BOOKVERSE — your membership for seat ${seatCode} ${when}. Please renew soon to keep your seat reserved. Reply to this message or visit the front desk to renew. Thank you!`;
}

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));

    // ---- MANUAL MODE: single membership ----
    if (body?.membershipId) {
      const { data: row } = await supabase
        .from("expiring_memberships")
        .select("*")
        .eq("membership_id", body.membershipId)
        .maybeSingle();

      // fall back to a direct lookup if it's not "expiring soon" (still allow manual send)
      let target = row;
      if (!target) {
        const { data: m } = await supabase
          .from("memberships")
          .select("id, end_date, members(full_name, phone), seats(seat_code)")
          .eq("id", body.membershipId)
          .single();

        if (!m) return json({ error: "Membership not found" }, 404);

        const days = Math.round(
          (new Date(m.end_date).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000
        );

        target = {
          membership_id: m.id,
          full_name: (m.members as unknown as { full_name: string }).full_name,
          phone: (m.members as unknown as { phone: string }).phone,
          seat_code: (m.seats as unknown as { seat_code: string }).seat_code,
          end_date: m.end_date,
          days_left: days,
          reminder_sent_at: null,
          member_id: null,
        };
      }

      const msg = memberMessage(target.full_name, target.seat_code, target.end_date, target.days_left);
      await sendWhatsApp(target.phone, msg);

      await supabase.from("notifications_log").insert({
        membership_id: target.membership_id,
        channel: "whatsapp",
        message: msg,
        status: "sent",
      });

      await supabase
        .from("memberships")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", target.membership_id);

      return json({ success: true, sentTo: target.full_name });
    }

    // ---- CRON MODE: all memberships expiring within 3 days ----
    const { data: expiring, error } = await supabase
      .from("expiring_memberships")
      .select("*");

    if (error) return json({ error: error.message }, 500);

    const results: { name: string; status: string }[] = [];

    for (const m of expiring ?? []) {
      // skip if a reminder was already sent today
      if (m.reminder_sent_at) {
        const sentToday =
          new Date(m.reminder_sent_at).toDateString() === new Date().toDateString();
        if (sentToday) continue;
      }

      try {
        const msg = memberMessage(m.full_name, m.seat_code, m.end_date, m.days_left);
        await sendWhatsApp(m.phone, msg);

        await supabase.from("notifications_log").insert({
          membership_id: m.membership_id,
          member_id: m.member_id,
          channel: "whatsapp",
          message: msg,
          status: "sent",
        });

        await supabase
          .from("memberships")
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq("id", m.membership_id);

        results.push({ name: m.full_name, status: "sent" });
      } catch (err) {
        await supabase.from("notifications_log").insert({
          membership_id: m.membership_id,
          member_id: m.member_id,
          channel: "whatsapp",
          message: "Reminder failed",
          status: "failed",
          error: String(err),
        });
        results.push({ name: m.full_name, status: "failed" });
      }
    }

    // ---- Summary to admin ----
    if ((expiring?.length ?? 0) > 0 && ADMIN_WHATSAPP_NUMBER) {
      const lines = (expiring ?? [])
        .map((m) => `• ${m.full_name} (${m.seat_code}) — ${m.days_left}d left`)
        .join("\n");
      const summary = `📚 BOOKVERSE — ${expiring?.length} membership(s) need renewal soon:\n\n${lines}`;

      try {
        await sendWhatsApp(ADMIN_WHATSAPP_NUMBER, summary);
        await supabase.from("notifications_log").insert({
          channel: "admin_whatsapp",
          message: summary,
          status: "sent",
        });
      } catch (err) {
        await supabase.from("notifications_log").insert({
          channel: "admin_whatsapp",
          message: summary,
          status: "failed",
          error: String(err),
        });
      }
    }

    return json({ success: true, processed: results });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
