"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Meeting } from "@/lib/database.types";
import NavBar from "@/components/NavBar";
import { useRouter } from "next/navigation";

export default function MeetingsPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", client_or_lead: "", date: "", time: "", type: "meeting", location: "", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data } = await supabase.from("meetings").select("*").order("date").order("time");
      setMeetings(data ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  async function addMeeting(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data, error } = await supabase.from("meetings").insert({
      title: form.title,
      client_or_lead: form.client_or_lead || null,
      date: form.date,
      time: form.time,
      type: form.type as any,
      location: (form as any).location || null,
      notes: form.notes || null,
    }).select().single();
    setSaving(false);
    if (error || !data) return;
    setMeetings((m) => [...m, data].sort((a, b) => a.date.localeCompare(b.date)));
    setShowForm(false);
    setForm({ title: "", client_or_lead: "", date: "", time: "", type: "meeting", location: "", notes: "" });

    // Remind Hussein about shoot tomorrow
    if (data.type === "shoot") {
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "shoot_created", meetingId: data.id }),
      });
    }
  }

  async function deleteMeeting(id: string) {
    await supabase.from("meetings").delete().eq("id", id);
    setMeetings((m) => m.filter((x) => x.id !== id));
  }

  if (loading) return <div className="flex items-center justify-center h-screen text-[#666]">Loading…</div>;

  const today = new Date().toISOString().split("T")[0];
  const upcoming = meetings.filter((m) => m.date >= today);
  const past = meetings.filter((m) => m.date < today);

  // Group upcoming by date
  const byDate: Record<string, Meeting[]> = {};
  upcoming.forEach((m) => { byDate[m.date] = [...(byDate[m.date] ?? []), m]; });

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24 md:pb-8 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Meetings & Shoots</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-[#e8c84a] text-black text-sm font-semibold px-4 py-2 rounded-lg">
          + Add
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={addMeeting} className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 mb-5 space-y-3">
          <p className="text-sm font-medium text-[#e8c84a] mb-1">New meeting / shoot</p>
          <div>
            <label className="text-xs text-[#666] block mb-1">Type</label>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
              <option value="meeting">Meeting</option>
              <option value="shoot">Photoshoot / Video shoot</option>
            </select>
          </div>
          {[
            { key: "title", label: "Title *", required: true },
            { key: "client_or_lead", label: "Client or lead" },
            { key: "date", label: "Date *", type: "date", required: true },
            { key: "time", label: "Time *", type: "time", required: true },
            { key: "location", label: "Location" },
            { key: "notes", label: "Notes" },
          ].map(({ key, label, required, type }) => (
            <div key={key}>
              <label className="text-xs text-[#666] block mb-1">{label}</label>
              <input type={type ?? "text"} required={required} value={(form as any)[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e8c84a]" />
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

      {/* Upcoming grouped by date */}
      {Object.keys(byDate).length === 0 && <p className="text-[#555] text-sm mb-6">No upcoming events.</p>}
      {Object.entries(byDate).map(([date, items]) => (
        <div key={date} className="mb-5">
          <h2 className="text-xs uppercase tracking-widest text-[#666] mb-2">
            {new Date(date + "T00:00:00").toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
            {date === today && <span className="ml-2 text-[#e8c84a]">Today</span>}
          </h2>
          <div className="space-y-2">
            {items.map((m) => (
              <div key={m.id} className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-3 flex items-center gap-3">
                <div className="text-[#e8c84a] font-semibold text-sm w-12 shrink-0">{m.time}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{m.title}</p>
                  {m.client_or_lead && <p className="text-[#666] text-xs">{m.client_or_lead}</p>}
                  {(m as any).location && <p className="text-[#555] text-xs">{(m as any).location}</p>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${m.type === "shoot" ? "bg-[#1a2e1e] text-[#5bbf6b]" : "bg-[#1a1a2e] text-[#7b8ec8]"}`}>
                  {m.type}
                </span>
                <button onClick={() => deleteMeeting(m.id)} className="text-[#444] hover:text-red-400 text-xs ml-1">✕</button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Past (collapsed) */}
      {past.length > 0 && (
        <details className="mt-4">
          <summary className="text-xs uppercase tracking-widest text-[#444] cursor-pointer">
            Past ({past.length})
          </summary>
          <div className="mt-2 space-y-2 opacity-50">
            {past.slice(-10).reverse().map((m) => (
              <div key={m.id} className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-3 flex items-center gap-3">
                <p className="text-xs text-[#666] w-20 shrink-0">{m.date} {m.time}</p>
                <p className="text-sm">{m.title}</p>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${m.type === "shoot" ? "bg-[#1a2e1e] text-[#5bbf6b]" : "bg-[#1a1a2e] text-[#7b8ec8]"}`}>
                  {m.type}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}

      <NavBar />
    </div>
  );
}

