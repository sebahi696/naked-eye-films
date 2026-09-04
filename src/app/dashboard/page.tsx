"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { api } from "@/lib/client-api";
import type { Job, Lead, Meeting, Ping } from "@/lib/database.types";
import NavBar from "@/components/NavBar";
import StageBadge from "@/components/StageBadge";
import Link from "next/link";

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [pings, setPings] = useState<Ping[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    Promise.all([
      api<{ jobs: Job[] }>("/api/jobs?exclude=sent"),
      api<{ leads: Lead[] }>("/api/leads"),
      api<{ meetings: Meeting[] }>(`/api/meetings?from=${today}`),
      api<{ pings: Ping[] }>("/api/pings?unread=1").catch(() => ({ pings: [] })),
    ]).then(([j, l, m, p]) => {
      setJobs(j.jobs);
      setLeads(l.leads);
      setMeetings(m.meetings);
      setPings(p.pings);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen text-[#666]">Loading…</div>;

  const today = new Date().toISOString().split("T")[0];
  const pending = jobs;
  const inReview = jobs.filter((j) => j.stage === "review");
  const needScript = jobs.filter((j) => j.stage === "waiting_script");
  const overdue = pending.filter((j) => j.due_date && j.due_date < today);
  const followUps = leads.filter((l) => l.follow_up_date && l.follow_up_date <= today);
  const thisWeekShoots = meetings.filter((m) => m.type === "shoot");

  const stats = [
    { label: "Need you", value: pings.length + needScript.length + inReview.length, color: "text-[#e8903a]", href: "/" },
    { label: "Pending", value: pending.length, color: "text-[#e8c84a]", href: "/" },
    { label: "Shoots / week", value: thisWeekShoots.length, color: "text-[#5bbf6b]", href: "/meetings" },
    { label: "Follow-ups", value: followUps.length, color: followUps.length ? "text-[#e8903a]" : "text-[#aaa]", href: "/leads" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24 md:pb-8 pt-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold">Today</h1>
          <p className="text-[#666] text-xs mt-0.5">
            {new Date().toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
          </p>
        </div>
        <Link href="/jobs/new" className="bg-[#e8c84a] text-black text-sm font-semibold px-4 py-2.5 rounded-xl">
          + Task
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-6">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}
            className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 active:border-[#444]">
            <p className={`text-3xl font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-[#888] text-xs mt-1">{s.label}</p>
          </Link>
        ))}
      </div>

      {overdue.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs uppercase tracking-widest text-red-500 mb-2">Overdue</h2>
          <div className="space-y-2">
            {overdue.map((j) => (
              <Link key={j.id} href={`/jobs/${j.id}`}
                className="flex items-center justify-between bg-[#1a0a0a] border border-[#3a1a1a] rounded-xl p-3">
                <div>
                  <p className="text-sm font-medium">{j.client_name}</p>
                  <p className="text-[#666] text-xs">{j.reels_count ? `${j.reels_count} reels` : j.deliverable}</p>
                </div>
                <StageBadge stage={j.stage} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {meetings.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs uppercase tracking-widest text-[#666] mb-2">Coming up</h2>
          <div className="space-y-2">
            {meetings.slice(0, 5).map((m) => (
              <div key={m.id} className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-3 flex items-center gap-3">
                <div className="text-center w-10 shrink-0">
                  <p className="text-[#e8c84a] font-semibold text-lg leading-none">
                    {new Date(m.date + "T00:00:00").getDate()}
                  </p>
                  <p className="text-[#666] text-xs">
                    {new Date(m.date + "T00:00:00").toLocaleString("en", { month: "short" })}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{m.title}</p>
                  <p className="text-[#666] text-xs">{m.time}{m.client_or_lead ? ` · ${m.client_or_lead}` : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xs uppercase tracking-widest text-[#666] mb-2">Open tasks</h2>
        {pending.length === 0 && <p className="text-[#555] text-sm">Nothing pending.</p>}
        <div className="space-y-2">
          {pending.map((j) => (
            <Link key={j.id} href={`/jobs/${j.id}`}
              className="flex items-center justify-between bg-[#141414] border border-[#2a2a2a] rounded-xl p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{j.client_name}</p>
                <p className="text-[#666] text-xs capitalize">
                  {j.assignee_role ?? "editor"}
                  {j.reels_count ? ` · ${j.reels_count} reels` : ""}
                  {j.due_date ? ` · due ${j.due_date}` : ""}
                </p>
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
