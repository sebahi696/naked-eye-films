"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { api } from "@/lib/client-api";
import type { Job, Lead, Meeting } from "@/lib/database.types";
import NavBar from "@/components/NavBar";
import StageBadge from "@/components/StageBadge";
import Link from "next/link";

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    Promise.all([
      api<{ jobs: Job[] }>("/api/jobs"),
      api<{ leads: Lead[] }>("/api/leads"),
      api<{ meetings: Meeting[] }>(`/api/meetings?from=${today}`),
    ]).then(([j, l, m]) => {
      setJobs(j.jobs);
      setLeads(l.leads);
      setMeetings(m.meetings);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen text-[#666]">Loading…</div>;

  const today = new Date().toISOString().split("T")[0];
  const pending = jobs.filter((j) => !["sent"].includes(j.stage));
  const approved = jobs.filter((j) => j.stage === "review");
  const sent = jobs.filter((j) => j.stage === "sent");
  const overdue = pending.filter((j) => j.due_date && j.due_date < today);
  const followUps = leads.filter((l) => l.follow_up_date && l.follow_up_date <= today);
  const thisWeekShoots = meetings.filter((m) => m.type === "shoot");

  const stats = [
    { label: "Shoots this week", value: thisWeekShoots.length, color: "text-[#5bbf6b]", href: "/meetings" },
    { label: "Active leads", value: leads.filter((l) => !["won","lost"].includes(l.status)).length, color: "text-[#7b8ec8]", href: "/leads" },
    { label: "Follow-ups due", value: followUps.length, color: followUps.length > 0 ? "text-[#e8903a]" : "text-[#aaa]", href: "/leads" },
    { label: "Pending videos", value: pending.length, color: "text-[#e8c84a]", href: "/" },
    { label: "In review", value: approved.length, color: "text-[#cc7bb2]", href: "/" },
    { label: "Sent", value: sent.length, color: "text-[#5bbf6b]", href: "/" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24 md:pb-8 pt-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Hussein's Dashboard</h1>
          <p className="text-[#666] text-xs mt-0.5">{new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
        <Link href="/jobs/new" className="bg-[#e8c84a] text-black text-sm font-semibold px-4 py-2 rounded-lg">
          + Job
        </Link>
      </div>

      {/* Six stat cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}
            className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 hover:border-[#444] transition-colors">
            <p className={`text-3xl font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-[#888] text-xs mt-1">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* This week's shoots */}
      {meetings.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs uppercase tracking-widest text-[#666] mb-3">This week</h2>
          <div className="space-y-2">
            {meetings.map((m) => (
              <div key={m.id} className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-3 flex items-center gap-3">
                <div className="text-center w-10 shrink-0">
                  <p className="text-[#e8c84a] font-semibold text-lg leading-none">
                    {new Date(m.date + "T00:00:00").getDate()}
                  </p>
                  <p className="text-[#666] text-xs">
                    {new Date(m.date + "T00:00:00").toLocaleString("en", { month: "short" })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">{m.title}</p>
                  <p className="text-[#666] text-xs">{m.time}{m.client_or_lead ? ` · ${m.client_or_lead}` : ""}</p>
                </div>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${m.type === "shoot" ? "bg-[#1a2e1e] text-[#5bbf6b]" : "bg-[#1a1a2e] text-[#7b8ec8]"}`}>
                  {m.type}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Overdue / stuck jobs */}
      {overdue.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs uppercase tracking-widest text-red-500 mb-3">Overdue</h2>
          <div className="space-y-2">
            {overdue.map((j) => (
              <Link key={j.id} href={`/jobs/${j.id}`}
                className="flex items-center justify-between bg-[#1a0a0a] border border-[#3a1a1a] rounded-xl p-3 hover:border-red-800 transition-colors">
                <div>
                  <p className="text-sm font-medium">{j.client_name}</p>
                  <p className="text-[#666] text-xs">{j.deliverable}</p>
                </div>
                <StageBadge stage={j.stage} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Follow-ups due */}
      {followUps.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs uppercase tracking-widest text-[#e8903a] mb-3">Follow-ups due today</h2>
          <div className="space-y-2">
            {followUps.map((l) => (
              <Link key={l.id} href="/leads"
                className="flex items-center justify-between bg-[#141414] border border-[#2a2a2a] rounded-xl p-3 hover:border-[#444] transition-colors">
                <div>
                  <p className="text-sm font-medium">{l.contact_name}</p>
                  <p className="text-[#666] text-xs">{l.company ?? l.source}</p>
                </div>
                <span className="text-xs bg-[#2e1a0a] text-[#e8903a] px-2 py-0.5 rounded-full capitalize">{l.status}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* All pending jobs */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-[#666] mb-3">All pending jobs</h2>
        {pending.length === 0 && <p className="text-[#555] text-sm">No pending jobs.</p>}
        <div className="space-y-2">
          {pending.map((j) => (
            <Link key={j.id} href={`/jobs/${j.id}`}
              className="flex items-center justify-between bg-[#141414] border border-[#2a2a2a] rounded-xl p-3 hover:border-[#444] transition-colors">
              <div>
                <p className="text-sm font-medium">{j.client_name}</p>
                <p className="text-[#666] text-xs capitalize">{j.job_type} · {j.deliverable}</p>
                {j.due_date && <p className={`text-xs mt-0.5 ${j.due_date < today ? "text-red-400" : "text-[#555]"}`}>Due {j.due_date}</p>}
              </div>
              <StageBadge stage={j.stage} />
            </Link>
          ))}
        </div>
      </section>

      <NavBar />
    </div>
  );
}

