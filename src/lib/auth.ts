import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { UserRole } from "./database.types";

export const SESSION_COOKIE = "nef_session";
const SESSION_DAYS = 365;

export interface SessionUser {
  id: string;
  username: string;
  full_name: string;
  role: UserRole;
  is_admin: boolean;
}

function secret() {
  const key = process.env.AUTH_SECRET ?? process.env.SUPABASE_JWT_SECRET;
  if (!key) throw new Error("AUTH_SECRET or SUPABASE_JWT_SECRET must be set");
  return new TextEncoder().encode(key);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    username: user.username,
    full_name: user.full_name,
    role: user.role,
    is_admin: user.is_admin,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      username: payload.username as string,
      full_name: payload.full_name as string,
      role: payload.role as UserRole,
      is_admin: Boolean(payload.is_admin),
    };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function sessionCookieOptions(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  };
}
