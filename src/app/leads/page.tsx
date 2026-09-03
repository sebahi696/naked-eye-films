"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { api } from "@/lib/client-api";
import type { Lead, LeadStatus } from "@/lib/database.types";
import NavBar from "@/components/NavBar";

const STATUS_COLORS: Record<LeadStatus, string> = {
  new: "bg-[#1a1a2e] text-[#7b8ec8]",
  contacted: "bg-[#1a2e2e] text-[#5bc4cc]",
  proposal: "bg-[#2e2a0a] text-[#e8c84a]",
  won: "bg-[#1a2e1a] text-[#5bbf6b]",
  lost: "bg-[#2a1a1a] text-[#888]",
};

const STATUSES: LeadStatus[] = ["new", "contacted", "proposal", "won", "lost"];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ contact_name: "", company: "", source: "", follow_up_date: "", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ leads: Lead[] }>("/api/leads")
      .then((d) => setLeads(d.leads))
      .finally(() => setLoading(false));
  }, []);

  async function addLead(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { lead } = await api<{ lead: Lead }>("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contact_name: form.contact_name,
        company: form.company || null,
        source: form.source || null,
        follow_up_date: form.follow_up_date || null,
        notes: form.notes || null,
        status: "new",
      }),
    });
    setLeads((l) => [lead, ...l]);
    setShowForm(false);
    setForm({ contact_name: "", company: "", source: "", follow_up_date: "", notes: "" });
    setSaving(false);
  }

  async function updateStatus(id: string, status: LeadStatus) {
    const { lead } = await api<{ lead: Lead }>(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLeads((l) => l.map((item) => (item.id === id ? lead : item)));
  }

  if (loading) return <div className="flex items-center justify-center h-screen text-[#666]">Loading…</div>;

  const today = new Date().toISOString().split("T")[0];
  const active = leads.filter((l) => !["won", "lost"].includes(l.status));
  const archived = leads.filter((l) => ["won", "lost"].includes(l.status));

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24 md:pb-8 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Leads</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-[#e8c84a] text-black text-sm font-semibold px-4 py-2 rounded-lg">
          + Lead
        </button>
      </div>

      {/* Add lead form */}
      {showForm && (
        <form onSubmit={addLead} className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 mb-5 space-y-3">
          <p className="text-sm font-medium text-[#e8c84a] mb-1">New lead</p>
          {[
            { key: "contact_name", label: "Name *", required: true },
            { key: "company", label: "Company" },
            { key: "source", label: "Source (referral, Instagram, etc.)" },
            { key: "follow_up_date", label: "Follow-up date", type: "date" },
          ].map(({ key, label, required, type }) => (
            <div key={key}>
              <label className="text-xs text-[#666] block mb-1">{label}</label>
              <input
                type={type ?? "text"}
                required={required}
                value={(form as any)[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e8c84a]"
              />
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving}
              className="bg-[#e8c84a] text-black font-semibold text-sm px-5 py-2 rounded-lg disabled:opacity-50">
              {saving ? "Saving…" : "Add"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-[#666] text-sm px-3">Cancel</button>
          </div>
        </form>
      )}

      {/* Active leads */}
      <div className="space-y-2 mb-6">
        {active.length === 0 && <p className="text-[#555] text-sm">No active leads.</p>}
        {active.map((l) => <LeadRow key={l.id} lead={l} today={today} onStatus={updateStatus} />)}
      </div>

      {archived.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-widest text-[#666] mb-3">Won / Lost</h2>
          <div className="space-y-2">
            {archived.map((l) => <LeadRow key={l.id} lead={l} today={today} onStatus={updateStatus} />)}
          </div>
        </section>
      )}

      <NavBar />
    </div>
  );
}

function LeadRow({ lead, today, onStatus }: { lead: Lead; today: string; onStatus: (id: string, s: LeadStatus) => void }) {
  const dueToday = lead.follow_up_date && lead.follow_up_date <= today;
  return (
    <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="font-medium text-sm">{lead.contact_name}</p>
          {lead.company && <p className="text-[#666] text-xs">{lead.company}</p>}
          {lead.source && <p className="text-[#555] text-xs">{lead.source}</p>}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[lead.status]}`}>
          {lead.status}
        </span>
      </div>
      {lead.follow_up_date && (
        <p className={`text-xs mb-2 ${dueToday ? "text-[#e8903a]" : "text-[#555]"}`}>
          Follow up: {lead.follow_up_date}{dueToday ? " — today!" : ""}
        </p>
      )}
      <select
        value={lead.status}
        onChange={(e) => onStatus(lead.id, e.target.value as LeadStatus)}
        className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
      >
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  );
}

