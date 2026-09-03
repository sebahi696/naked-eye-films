"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ full_name: "", role: "editor" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { error: err } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: form.full_name,
      role: form.role as any,
      phone: user.phone ?? null,
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    router.push("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-1">Set up your profile</h1>
        <p className="text-[#666] text-sm mb-8">First-time setup</p>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="text-xs text-[#666] uppercase tracking-wide block mb-1">Your name</label>
            <input required value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              placeholder="e.g. Sara"
              className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#e8c84a]" />
          </div>
          <div>
            <label className="text-xs text-[#666] uppercase tracking-wide block mb-1">Role</label>
            <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#e8c84a]">
              <option value="editor">Editor / Designer</option>
              <option value="owner">Owner (Hussein)</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-[#e8c84a] text-black font-semibold py-3 rounded-lg text-sm disabled:opacity-50">
            {loading ? "Saving…" : "Enter app"}
          </button>
        </form>
      </div>
    </div>
  );
}

