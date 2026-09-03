import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppMessage, messages } from "@/lib/whatsapp";
import { createClient } from "@supabase/supabase-js";

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const HUSSEIN_WA = process.env.HUSSEIN_WA_NUMBER ?? "";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, jobId, meetingId, leadId } = body;
  const db = createServiceClient();

  let sent = false;
  let messageBody = "";

  try {
    if (type === "script_needed" && jobId) {
      const { data: job } = await db.from("jobs").select("*").eq("id", jobId).single();
      if (!job) return NextResponse.json({ ok: false, error: "Job not found" }, { status: 404 });
      messageBody = messages.scriptNeeded(job.client_name, job.shoot_date);
      sent = await sendWhatsAppMessage({ to: HUSSEIN_WA, body: messageBody });

    } else if (type === "order_created" && jobId) {
      const { data: job } = await db.from("jobs").select("*").eq("id", jobId).single();
      if (!job) return NextResponse.json({ ok: false, error: "Job not found" }, { status: 404 });
      messageBody = messages.orderMissing(job.client_name);
      sent = await sendWhatsAppMessage({ to: HUSSEIN_WA, body: messageBody });

    } else if (type === "shoot_created" && meetingId) {
      const { data: meeting } = await db.from("meetings").select("*").eq("id", meetingId).single();
      if (!meeting) return NextResponse.json({ ok: false, error: "Meeting not found" }, { status: 404 });
      messageBody = messages.shootTomorrow(meeting.title, meeting.time, (meeting as any).location ?? "");
      sent = await sendWhatsAppMessage({ to: HUSSEIN_WA, body: messageBody });

    } else if (type === "follow_up" && leadId) {
      const { data: lead } = await db.from("leads").select("*").eq("id", leadId).single();
      if (!lead) return NextResponse.json({ ok: false, error: "Lead not found" }, { status: 404 });
      messageBody = messages.followUp(lead.contact_name);
      sent = await sendWhatsAppMessage({ to: HUSSEIN_WA, body: messageBody });
    }

    // Log the reminder
    if (messageBody) {
      await db.from("whatsapp_reminders").insert({
        job_id: jobId ?? null,
        lead_id: leadId ?? null,
        type,
        wa_number: HUSSEIN_WA,
        message_body: messageBody,
        sent_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ ok: true, sent });
  } catch (err: any) {
    console.error("/api/notify error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
