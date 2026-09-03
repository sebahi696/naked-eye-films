import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user?.is_admin) return null;
  return user;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await db()
    .from("team_users")
    .select("id, username, full_name, role, is_admin, created_at")
    .order("created_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { username, password, full_name, role, is_admin } = await req.json();
  if (!username || !password || !full_name) {
    return NextResponse.json({ error: "Username, password, and name required" }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 10);
  const { data, error } = await db()
    .from("team_users")
    .insert({
      username: username.trim().toLowerCase(),
      password_hash: hash,
      full_name,
      role: role ?? "editor",
      is_admin: Boolean(is_admin),
    })
    .select("id, username, full_name, role, is_admin, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ user: data });
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "User id required" }, { status: 400 });
  if (id === admin.id) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });

  const { error } = await db().from("team_users").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
