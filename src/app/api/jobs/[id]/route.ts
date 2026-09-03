import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkGate, getNextStage } from "@/lib/stages";
import type { Job, Stage } from "@/lib/database.types";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: job, error: jobErr }, { data: events }] = await Promise.all([
    db().from("jobs").select("*").eq("id", params.id).single(),
    db().from("job_events").select("*").eq("job_id", params.id).order("created_at", { ascending: false }),
  ]);

  if (jobErr || !job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ job, events: events ?? [] });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { data: job, error: fetchErr } = await db().from("jobs").select("*").eq("id", params.id).single();
  if (fetchErr || !job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Stage advance
  if (body.action === "advance") {
    const gate = checkGate(job as Job, job.stage as Stage);
    if (gate.blocked) return NextResponse.json({ error: gate.reason }, { status: 400 });
    const next = getNextStage(job.stage as Stage);
    if (!next) return NextResponse.json({ error: "Already at final stage" }, { status: 400 });

    const updates: Record<string, unknown> = { stage: next };
    if (body.studio_folder) updates.studio_folder = body.studio_folder;

    const { data: updated, error } = await db().from("jobs").update(updates).eq("id", params.id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await db().from("job_events").insert({
      job_id: params.id,
      actor_role: user.role,
      actor_name: user.full_name,
      stage_from: job.stage,
      stage_to: next,
      note: body.note ?? null,
    });

    return NextResponse.json({ job: updated });
  }

  // General field update
  const { data: updated, error } = await db().from("jobs").update(body).eq("id", params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ job: updated });
}
