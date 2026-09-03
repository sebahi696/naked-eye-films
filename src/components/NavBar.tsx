"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/client-api";

const links = [
  { href: "/", label: "Queue" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/jobs/new", label: "+ Job" },
  { href: "/leads", label: "Leads" },
  { href: "/meetings", label: "Meetings" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    api<{ user: { is_admin: boolean } }>("/api/auth/me")
      .then((d) => setIsAdmin(d.user.is_admin))
      .catch(() => {});
  }, []);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#141414] border-t border-[#2a2a2a] z-50 md:static md:border-t-0 md:border-b">
      <div className="max-w-2xl mx-auto flex items-center justify-around md:justify-start md:gap-6 md:px-6 md:py-3 overflow-x-auto">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`flex flex-col md:flex-row items-center gap-0.5 md:gap-1 py-3 md:py-0 px-2 text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
              pathname === l.href ? "text-[#e8c84a]" : "text-[#888] hover:text-white"
            }`}
          >
            {l.label}
          </Link>
        ))}
        {isAdmin && (
          <Link href="/admin" className={`py-3 md:py-0 px-2 text-xs md:text-sm font-medium whitespace-nowrap ${pathname === "/admin" ? "text-[#e8c84a]" : "text-[#888]"}`}>
            Admin
          </Link>
        )}
        <button onClick={signOut} className="text-[#666] text-xs md:text-sm py-3 md:py-0 px-2 ml-auto whitespace-nowrap">
          Sign out
        </button>
      </div>
    </nav>
  );
}
