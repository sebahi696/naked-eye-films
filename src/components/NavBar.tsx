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

  useEffect(() => {
    api<{ user: SessionUser }>("/api/auth/me")
      .then((d) => setUser(d.user))
      .catch(() => {});
  }, []);

  const isOwner = user?.role === "owner" || user?.is_admin;

  const links = isOwner
    ? [
        { href: "/", label: "Queue" },
        { href: "/dashboard", label: "Today" },
        { href: "/jobs/new", label: "+ Task" },
        { href: "/meetings", label: "Calendar" },
        { href: "/leads", label: "Leads" },
      ]
    : [
        { href: "/", label: "My queue" },
        { href: "/meetings", label: "Calendar" },
      ];

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#141414]/95 backdrop-blur border-t border-[#2a2a2a] z-50 safe-pb">
      <div className="max-w-2xl mx-auto flex items-center justify-around px-1">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`py-3.5 px-2 text-[11px] font-medium ${
              pathname === l.href ? "text-[#e8c84a]" : "text-[#777]"
            }`}
          >
            {l.label}
          </Link>
        ))}
        {isOwner && (
          <Link href="/admin" className={`py-3.5 px-2 text-[11px] font-medium ${pathname === "/admin" ? "text-[#e8c84a]" : "text-[#777]"}`}>
            Admin
          </Link>
        )}
        <button onClick={signOut} className="text-[#555] text-[11px] py-3.5 px-2">
          Out
        </button>
      </div>
    </nav>
  );
}
