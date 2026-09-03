"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";
import NavBar from "@/components/NavBar";

export default function NewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    client_name: "",
    job_type: "video",
    deliverable: "",
    shoot_date: "",
    script_notes: "",
    script_provided: false,
    route: "hussein",
    agency_name: "",
    due_date: "",
    notes: "",
  });

  function set(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { job } = await api<{ job: { id: string } }>("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: form.client_name,
          job_type: form.job_type,
          deliverable: form.deliverable,
          shoot_date: form.shoot_date || null,
          script_notes: form.script_notes || null,
          script_provided: form.script_provided,
          route: form.route,
          agency_name: form.agency_name || null,
          due_date: form.due_date || null,
        }),
      });

      if (!form.script_provided) {
        await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ type: "order_created", jobId: job.id }),
        });
      }

      router.push(`/jobs/${job.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create job");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24 md:pb-8 pt-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-[#666] text-sm">← Back</button>
        <h1 className="text-xl font-semibold">New Job</h1>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <Field label="Client / Brand name *">
          <input required value={form.client_name} onChange={(e) => set("client_name", e.target.value)}
            placeholder="e.g. Rami Wedding, Pepsi Iraq"
            className="input-field" />
        </Field>

        <Field label="Job type *">
          <select value={form.job_type} onChange={(e) => set("job_type", e.target.value)} className="input-field">
            <option value="video">Video</option>
            <option value="photoshoot">Photoshoot</option>
            <option value="mixed">Mixed (photo + video)</option>
          </select>
        </Field>

        <Field label="Deliverable — what does the editor produce? *">
          <input required value={form.deliverable} onChange={(e) => set("deliverable", e.target.value)}
            placeholder="e.g. 3 Reels + 10 photos"
            className="input-field" />
        </Field>

        <Field label="Shoot date">
          <input type="date" value={form.shoot_date} onChange={(e) => set("shoot_date", e.target.value)}
            className="input-field" />
        </Field>

        <Field label="Due date">
          <input type="date" value={form.due_date} onChange={(e) => set("due_date", e.target.value)}
            className="input-field" />
        </Field>

        <Field label="Script / talking points">
          <textarea value={form.script_notes} onChange={(e) => set("script_notes", e.target.value)}
            rows={3} placeholder="Paste script here, or leave blank and provide later"
            className="input-field resize-none" />
          <label className="flex items-center gap-2 mt-2 text-sm text-[#aaa] cursor-pointer">
            <input type="checkbox" checked={form.script_provided}
              onChange={(e) => set("script_provided", e.target.checked)}
              className="w-4 h-4 accent-[#e8c84a]" />
            Script is complete and provided
          </label>
        </Field>

        <Field label="Send final to *">
          <select value={form.route} onChange={(e) => set("route", e.target.value)} className="input-field">
            <option value="hussein">Hussein (direct client)</option>
            <option value="agency">Partner agency</option>
          </select>
        </Field>

        {form.route === "agency" && (
          <Field label="Agency name">
            <input value={form.agency_name} onChange={(e) => set("agency_name", e.target.value)}
              placeholder="Agency name"
              className="input-field" />
          </Field>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full bg-[#e8c84a] text-black font-semibold py-3.5 rounded-xl text-sm disabled:opacity-50">
          {loading ? "Creating…" : "Create Job"}
        </button>
      </form>

      <NavBar />

      <style jsx global>{`
        .input-field {
          width: 100%;
          background: #141414;
          border: 1px solid #2a2a2a;
          border-radius: 10px;
          padding: 12px 14px;
          color: white;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s;
        }
        .input-field:focus { border-color: #e8c84a; }
        .input-field option { background: #141414; }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-[#888] uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}

