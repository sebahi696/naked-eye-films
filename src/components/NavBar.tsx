"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/client-api";
import type { SessionUser } from "@/lib/auth";

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [more, setMore] = useState(false);

  useEffect(() => {
    api<{ user: SessionUser }>("/api/auth/me")
      .then((d) => setUser(d.user))
      .catch(() => {});
  }, []);

  const isOwner = user?.role === "owner" || user?.is_admin;

  const primary = isOwner
    ? [
        { href: "/", label: "Inbox" },
        { href: "/jobs/new", label: "+ Task" },
      ]
    : [
        { href: "/", label: "Work" },
        { href: "/ask", label: "Ask" },
      ];

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
  }

  return (
    <>
      {more && (
        <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setMore(false)}>
          <div
            className="absolute bottom-16 left-0 right-0 mx-auto max-w-2xl bg-[#141414] border-t border-[#2a2a2a] rounded-t-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs text-[#666] uppercase tracking-widest mb-3">More (rarely needed)</p>
            <div className="grid grid-cols-2 gap-2">
              {isOwner && (
                <>
                  <Link href="/dashboard" onClick={() => setMore(false)} className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-3 text-sm text-center">
                    Sync overview
                  </Link>
                  <Link href="/meetings" onClick={() => setMore(false)} className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-3 text-sm text-center">
                    Calendar
                  </Link>
                  <Link href="/leads" onClick={() => setMore(false)} className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-3 text-sm text-center">
                    Leads
                  </Link>
                  <Link href="/admin" onClick={() => setMore(false)} className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-3 text-sm text-center">
                    Team admin
                  </Link>
                </>
              )}
              {!isOwner && (
                <Link href="/meetings" onClick={() => setMore(false)} className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-3 text-sm text-center">
                  Calendar
                </Link>
              )}
              <button type="button" onClick={signOut} className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-3 text-sm text-[#888]">
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-[#141414]/95 backdrop-blur border-t border-[#2a2a2a] z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-around px-2">
          {primary.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`py-3.5 px-4 text-xs font-medium ${
                pathname === l.href ? "text-[#e8c84a]" : "text-[#777]"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setMore(true)}
            className="py-3.5 px-4 text-xs font-medium text-[#777]"
          >
            More
          </button>
        </div>
      </nav>
    </>
  );
}
