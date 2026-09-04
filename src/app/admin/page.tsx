"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { api } from "@/lib/client-api";
import NavBar from "@/components/NavBar";

interface TeamUser {
  id: string;
  username: string;
  full_name: string;
  role: string;
  is_admin: boolean;
  created_at: string;
}

export default function AdminPage() {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    username: "",
    password: "",
    full_name: "",
    role: "editor",
    is_admin: false,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ users: TeamUser[] }>("/api/admin/users")
      .then((d) => setUsers(d.users))
      .finally(() => setLoading(false));
  }, []);

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { user } = await api<{ user: TeamUser }>("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setUsers((u) => [...u, user]);
      setForm({ username: "", password: "", full_name: "", role: "editor", is_admin: false });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add user");
    }
    setSaving(false);
  }

  async function removeUser(id: string) {
    if (!confirm("Remove this team member?")) return;
    await api("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setUsers((u) => u.filter((x) => x.id !== id));
  }

  if (loading) return <div className="flex items-center justify-center h-screen text-[#666]">Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24 md:pb-8 pt-6">
      <h1 className="text-xl font-semibold mb-1">Team Admin</h1>
      <p className="text-[#666] text-sm mb-6">Add usernames and passwords for the team</p>

      <form onSubmit={addUser} className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 mb-6 space-y-3">
        <p className="text-sm font-medium text-[#e8c84a]">Add team member</p>
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Username" required value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e8c84a]" />
          <input placeholder="Full name" required value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e8c84a]" />
        </div>
        <input type="password" placeholder="Password" required value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e8c84a]" />
        <div className="flex gap-3 items-center">
          <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white">
            <option value="editor">Editor</option>
            <option value="designer">Designer</option>
            <option value="owner">Owner (Hussein)</option>
            <option value="admin">Admin</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-[#aaa]">
            <input type="checkbox" checked={form.is_admin}
              onChange={(e) => setForm((f) => ({ ...f, is_admin: e.target.checked }))}
              className="accent-[#e8c84a]" />
            Can manage team
          </label>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={saving}
          className="bg-[#e8c84a] text-black font-semibold text-sm px-5 py-2 rounded-lg disabled:opacity-50">
          {saving ? "Adding…" : "Add member"}
        </button>
      </form>

      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{u.full_name}</p>
              <p className="text-[#666] text-xs">@{u.username} · {u.role}{u.is_admin ? " · admin" : ""}</p>
            </div>
            {u.username !== "admin" && (
              <button onClick={() => removeUser(u.id)} className="text-red-400 text-xs">Remove</button>
            )}
          </div>
        ))}
      </div>

      <NavBar />
    </div>
  );
}
