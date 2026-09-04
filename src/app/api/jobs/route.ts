import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { initialStageForAssignee } from "@/lib/stages";
import type { AssigneeRole } from "@/lib/database.types";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const exclude = req.nextUrl.searchParams.get("exclude");
  const assignee = req.nextUrl.searchParams.get("assignee");
  let query = db().from("jobs").select("*").order("due_date", { ascending: true });
  if (exclude) query = query.neq("stage", exclude);
  if (assignee) query = query.eq("assignee_role", assignee);

  // Editors/designers only see their queue by default (owners see all)
  if (user.role === "editor") query = query.eq("assignee_role", "editor");
  if (user.role === "designer") query = query.eq("assignee_role", "designer");

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ jobs: data });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const assignee = (body.assignee_role ?? "editor") as AssigneeRole;
  const hasScript = Boolean(body.script_provided || body.script_notes);
  const stage = body.stage ?? initialStageForAssignee(assignee, hasScript);

  const reels = body.reels_count != null ? Number(body.reels_count) : null;
  const deliverable =
    body.deliverable ||
    (reels ? `${reels} reel${reels === 1 ? "" : "s"}` : "Edit task");

  const { data, error } = await db()
    .from("jobs")
    .insert({
      client_name: body.client_name,
      job_type: body.job_type ?? "video",
      deliverable,
      shoot_date: null,
      script_notes: body.script_notes || null,
      script_provided: Boolean(body.script_provided || body.script_notes),
      route: body.route ?? "hussein",
      agency_name: body.agency_name || null,
      due_date: body.due_date || null,
      stage,
      assignee_role: assignee,
      reels_count: reels,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ job: data });
}
