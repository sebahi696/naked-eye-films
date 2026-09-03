import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: "Username and password required" }, { status: 400 });
  }

  const { data: user, error } = await db()
    .from("team_users")
    .select("*")
    .eq("username", username.trim().toLowerCase())
    .single();

  if (error || !user) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const token = await createSessionToken({
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    role: user.role,
    is_admin: user.is_admin,
  });

  const res = NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      is_admin: user.is_admin,
    },
  });
  res.cookies.set(sessionCookieOptions(token));
  return res;
}
