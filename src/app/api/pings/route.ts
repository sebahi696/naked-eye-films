import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const mode = req.nextUrl.searchParams.get("mode"); // open | mine | all
  let query = db().from("pings").select("*").order("created_at", { ascending: false }).limit(40);

  if (user.role === "owner" || user.is_admin) {
    query = query.eq("to_role", "owner");
    if (mode === "open") {
      query = query.is("replied_at", null).neq("kind", "done");
    }
  } else {
    query = query.eq("from_user_id", user.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pings: data });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { job_id, kind, message, brand } = await req.json();
  if (!kind || !message) {
    return NextResponse.json({ error: "Question text required" }, { status: 400 });
  }

  const { data, error } = await db()
    .from("pings")
    .insert({
      job_id: job_id ?? null,
      from_user_id: user.id,
      from_name: user.full_name,
      to_role: "owner",
      kind,
      message: String(message).trim(),
      brand: brand ? String(brand).trim() : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  try {
    await fetch(new URL("/api/notify", req.url).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: req.headers.get("cookie") ?? "" },
      body: JSON.stringify({
        type: "team_ping",
        message: brand
          ? `${user.full_name} (${brand}): ${message}`
          : `${user.full_name}: ${message}`,
      }),
    });
  } catch {
    // optional WhatsApp
  }

  return NextResponse.json({ ping: data });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "owner" && !user.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const now = new Date().toISOString();

  // Hussein answers a question in one tap / short reply
  if (body.id && (body.reply != null || body.action === "ack")) {
    const reply =
      body.action === "ack"
        ? body.reply || "Got it — noted."
        : String(body.reply).trim();
    if (!reply) return NextResponse.json({ error: "Reply required" }, { status: 400 });

    const { data, error } = await db()
      .from("pings")
      .update({ reply, replied_at: now, read_at: now })
      .eq("id", body.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ping: data });
  }

  if (body.mark_all) {
    await db()
      .from("pings")
      .update({ read_at: now, replied_at: now, reply: "Seen" })
      .eq("to_role", "owner")
      .is("replied_at", null);
    return NextResponse.json({ ok: true });
  }

  if (body.id) {
    await db().from("pings").update({ read_at: now }).eq("id", body.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
}
