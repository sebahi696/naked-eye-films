// Supabase Edge Function — runs on cron schedule (every hour)
// Checks for: stuck scripts, overdue follow-ups, tomorrow's shoots
// Deploy with: supabase functions deploy reminders --schedule "0 * * * *"

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_URL")!; // e.g. https://nakedeyefilms.vercel.app
const HUSSEIN_WA = Deno.env.get("HUSSEIN_WA_NUMBER")!;

const db = createClient(SUPABASE_URL, SERVICE_KEY);

Deno.serve(async () => {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const tomorrow = new Date(now.getTime() + 86400000).toISOString().split("T")[0];
  const fourHoursAgo = new Date(now.getTime() - 4 * 3600000).toISOString();

  const notified: string[] = [];

  // 1. Jobs stuck on waiting_script for > 4 hours
  const { data: stuckJobs } = await db
    .from("jobs")
    .select("*")
    .eq("stage", "waiting_script")
    .eq("script_provided", false)
    .lt("updated_at", fourHoursAgo);

  for (const job of stuckJobs ?? []) {
    // Check not already reminded in last 4h
    const { data: recent } = await db
      .from("whatsapp_reminders")
      .select("id")
      .eq("job_id", job.id)
      .eq("type", "script_needed")
      .gt("sent_at", fourHoursAgo)
      .limit(1);

    if (!recent?.length) {
      await callNotify("script_needed", { jobId: job.id });
      notified.push(`script:${job.client_name}`);
    }
  }

  // 2. Follow-ups due today
  const { data: followUps } = await db
    .from("leads")
    .select("*")
    .eq("follow_up_date", today)
    .not("status", "in", '("won","lost")');

  for (const lead of followUps ?? []) {
    const { data: recent } = await db
      .from("whatsapp_reminders")
      .select("id")
      .eq("lead_id", lead.id)
      .eq("type", "follow_up")
      .gt("sent_at", new Date(now.setHours(0, 0, 0, 0)).toISOString())
      .limit(1);

    if (!recent?.length) {
      await callNotify("follow_up", { leadId: lead.id });
      notified.push(`followup:${lead.contact_name}`);
    }
  }

  // 3. Shoots tomorrow (notify once per shoot)
  const { data: tomorrowShoots } = await db
    .from("meetings")
    .select("*")
    .eq("date", tomorrow)
    .eq("type", "shoot");

  for (const shoot of tomorrowShoots ?? []) {
    const { data: recent } = await db
      .from("whatsapp_reminders")
      .select("id")
      .eq("type", "shoot_tomorrow")
      .gt("sent_at", new Date(now.setHours(0, 0, 0, 0)).toISOString())
      .like("message_body", `%${shoot.title}%`)
      .limit(1);

    if (!recent?.length) {
      await callNotify("shoot_created", { meetingId: shoot.id });
      notified.push(`shoot:${shoot.title}`);
    }
  }

  return new Response(JSON.stringify({ ok: true, notified }), {
    headers: { "Content-Type": "application/json" },
  });
});

async function callNotify(type: string, body: Record<string, string>) {
  await fetch(`${APP_URL}/api/notify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, ...body }),
  });
}
