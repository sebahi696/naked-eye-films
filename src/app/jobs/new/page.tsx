"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";
import NavBar from "@/components/NavBar";
import QuickDate from "@/components/QuickDate";

export default function NewTaskPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    client_name: "",
    assignee_role: "editor" as "editor" | "designer",
    reels_count: "3",
    script_notes: "",
    due_date: "",
    route: "hussein",
    agency_name: "",
  });

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.due_date) { setError("Pick a due date"); return; }
    setLoading(true);
    setError("");
    try {
      const reels = form.assignee_role === "editor" ? Number(form.reels_count) || null : null;
      const { job } = await api<{ job: { id: string } }>("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: form.client_name.trim(),
          assignee_role: form.assignee_role,
          reels_count: reels,
          script_notes: form.script_notes.trim() || null,
          script_provided: Boolean(form.script_notes.trim()),
          due_date: form.due_date,
          route: form.route,
          agency_name: form.agency_name || null,
          job_type: "video",
        }),
      });
      router.push(`/jobs/${job.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create task");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24 md:pb-8 pt-6">
      <div className="flex items-center gap-3 mb-5">
        <button type="button" onClick={() => router.back()} className="text-[#666] text-sm">←</button>
        <h1 className="text-xl font-semibold">New task</h1>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {/* Assign — big tap targets */}
        <div>
          <p className="text-xs text-[#888] uppercase tracking-wide mb-2">Assign to</p>
          <div className="grid grid-cols-2 gap-2">
            {(["editor", "designer"] as const).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => set("assignee_role", role)}
                className={`py-3.5 rounded-xl text-sm font-semibold border capitalize ${
                  form.assignee_role === role
                    ? "bg-[#e8c84a] text-black border-[#e8c84a]"
                    : "bg-[#141414] text-[#aaa] border-[#2a2a2a]"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-[#888] uppercase tracking-wide mb-1.5">Brand *</label>
          <input
            required
            autoFocus
            value={form.client_name}
            onChange={(e) => set("client_name", e.target.value)}
            placeholder="Brand / client name"
            className="w-full bg-[#141414] border border-[#2a2a2a] rounded-xl px-4 py-3.5 text-white text-base focus:outline-none focus:border-[#e8c84a]"
          />
        </div>

        {form.assignee_role === "editor" && (
          <div>
            <p className="text-xs text-[#888] uppercase tracking-wide mb-2">How many reels?</p>
            <div className="flex gap-2">
              {["1", "2", "3", "4", "5", "6"].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => set("reels_count", n)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold border ${
                    form.reels_count === n
                      ? "bg-[#e8c84a] text-black border-[#e8c84a]"
                      : "bg-[#141414] text-[#aaa] border-[#2a2a2a]"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs text-[#888] uppercase tracking-wide mb-1.5">
            Script {form.assignee_role === "editor" ? "(paste now or later)" : "(optional)"}
          </label>
          <textarea
            value={form.script_notes}
            onChange={(e) => set("script_notes", e.target.value)}
            rows={4}
            placeholder="Paste script / talking points here"
            className="w-full bg-[#141414] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm resize-none focus:outline-none focus:border-[#e8c84a]"
          />
        </div>

        <QuickDate value={form.due_date} onChange={(v) => set("due_date", v)} label="Due date *" />

        <div>
          <p className="text-xs text-[#888] uppercase tracking-wide mb-2">Send final to</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => set("route", "hussein")}
              className={`py-3 rounded-xl text-sm font-medium border ${form.route === "hussein" ? "bg-[#e8c84a] text-black border-[#e8c84a]" : "bg-[#141414] text-[#aaa] border-[#2a2a2a]"}`}>
              Hussein
            </button>
            <button type="button" onClick={() => set("route", "agency")}
              className={`py-3 rounded-xl text-sm font-medium border ${form.route === "agency" ? "bg-[#e8c84a] text-black border-[#e8c84a]" : "bg-[#141414] text-[#aaa] border-[#2a2a2a]"}`}>
              Agency
            </button>
          </div>
          {form.route === "agency" && (
            <input
              value={form.agency_name}
              onChange={(e) => set("agency_name", e.target.value)}
              placeholder="Agency name"
              className="mt-2 w-full bg-[#141414] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#e8c84a]"
            />
          )}
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#e8c84a] text-black font-semibold py-4 rounded-xl text-base disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create task"}
        </button>
      </form>

      <NavBar />
    </div>
  );
}
