import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const unreadOnly = req.nextUrl.searchParams.get("unread") === "1";
  let query = db().from("pings").select("*").order("created_at", { ascending: false }).limit(50);
  if (user.role === "owner" || user.is_admin) {
    query = query.eq("to_role", "owner");
  } else {
    query = query.eq("from_user_id", user.id);
  }
  if (unreadOnly) query = query.is("read_at", null);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pings: data });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { job_id, kind, message } = await req.json();
  if (!kind || !message) {
    return NextResponse.json({ error: "Kind and message required" }, { status: 400 });
  }

  const { data, error } = await db()
    .from("pings")
    .insert({
      job_id: job_id ?? null,
      from_user_id: user.id,
      from_name: user.full_name,
      to_role: "owner",
      kind,
      message,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Best-effort WhatsApp if configured
  try {
    await fetch(new URL("/api/notify", req.url).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: req.headers.get("cookie") ?? "" },
      body: JSON.stringify({
        type: "team_ping",
        message: `${user.full_name}: ${message}`,
      }),
    });
  } catch {
    // ignore
  }

  return NextResponse.json({ ping: data });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "owner" && !user.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, mark_all } = await req.json();
  if (mark_all) {
    await db().from("pings").update({ read_at: new Date().toISOString() }).eq("to_role", "owner").is("read_at", null);
    return NextResponse.json({ ok: true });
  }
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db().from("pings").update({ read_at: new Date().toISOString() }).eq("id", id);
  return NextResponse.json({ ok: true });
}
