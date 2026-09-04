"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { isWaitingOnHussein, isWaitingOnEditor, isWaitingOnDesigner } from "@/lib/stages";
import type { Job, Ping } from "@/lib/database.types";
import type { SessionUser } from "@/lib/auth";
import NavBar from "@/components/NavBar";
import StageBadge from "@/components/StageBadge";
import Link from "next/link";
import { api } from "@/lib/client-api";

export default function QueuePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pings, setPings] = useState<Ping[]>([]);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api<{ user: SessionUser }>("/api/auth/me"),
      api<{ jobs: Job[] }>("/api/jobs?exclude=sent"),
      api<{ pings: Ping[] }>("/api/pings?unread=1").catch(() => ({ pings: [] })),
    ]).then(([me, data, p]) => {
      setUser(me.user);
      setJobs(data.jobs);
      setPings(p.pings);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen text-[#666]">Loading…</div>;

  const isOwner = user?.role === "owner" || user?.is_admin;
  const isEditor = user?.role === "editor";
  const isDesigner = user?.role === "designer";

  const mine = isEditor
    ? jobs.filter(isWaitingOnEditor)
    : isDesigner
      ? jobs.filter(isWaitingOnDesigner)
      : jobs;
  const blockedOnHussein = jobs.filter(isWaitingOnHussein);

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24 md:pb-8 pt-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold">
            {isOwner ? "Queue" : isDesigner ? "Design queue" : "My queue"}
          </h1>
          {user && <p className="text-[#666] text-xs mt-0.5">{user.full_name}</p>}
        </div>
        {isOwner && (
          <Link href="/jobs/new" className="bg-[#e8c84a] text-black text-sm font-semibold px-4 py-2.5 rounded-xl">
            + Task
          </Link>
        )}
      </div>

      {/* Hussein: unread pings from team */}
      {isOwner && pings.length > 0 && (
        <section className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs uppercase tracking-widest text-[#e8903a]">Needs you ({pings.length})</h2>
            <button
              type="button"
              className="text-xs text-[#666]"
              onClick={async () => {
                await api("/api/pings", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ mark_all: true }),
                });
                setPings([]);
              }}
            >
              Mark all read
            </button>
          </div>
          <div className="space-y-2">
            {pings.slice(0, 5).map((p) => (
              <Link
                key={p.id}
                href={p.job_id ? `/jobs/${p.job_id}` : "/"}
                className="block bg-[#1a1208] border border-[#3a2a10] rounded-xl p-3"
              >
                <p className="text-xs text-[#e8903a] uppercase mb-0.5">{p.kind.replace("_", " ")} · {p.from_name}</p>
                <p className="text-sm text-white">{p.message}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {isOwner ? (
        <div className="space-y-6">
          <section>
            <h2 className="text-xs uppercase tracking-widest text-[#666] mb-3">Waiting on you</h2>
            <div className="space-y-2">
              {blockedOnHussein.length === 0 && <p className="text-[#555] text-sm">Nothing blocked on you.</p>}
              {blockedOnHussein.map((j) => <JobRow key={j.id} job={j} showAssignee />)}
            </div>
          </section>
          <section>
            <h2 className="text-xs uppercase tracking-widest text-[#666] mb-3">In progress</h2>
            <div className="space-y-2">
              {jobs.filter((j) => !isWaitingOnHussein(j)).length === 0 && (
                <p className="text-[#555] text-sm">No active tasks.</p>
              )}
              {jobs.filter((j) => !isWaitingOnHussein(j)).map((j) => (
                <JobRow key={j.id} job={j} showAssignee />
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="space-y-6">
          <section>
            <h2 className="text-xs uppercase tracking-widest text-[#666] mb-3">Waiting on me</h2>
            <div className="space-y-2">
              {mine.length === 0 && <p className="text-[#555] text-sm">Queue clear.</p>}
              {mine.map((j) => <JobRow key={j.id} job={j} />)}
            </div>
          </section>
          <section>
            <h2 className="text-xs uppercase tracking-widest text-[#666] mb-3">Waiting on Hussein</h2>
            <div className="space-y-2">
              {blockedOnHussein.filter((j) =>
                isEditor ? (j.assignee_role ?? "editor") === "editor" : (j.assignee_role ?? "editor") === "designer"
              ).length === 0 && <p className="text-[#555] text-sm">None.</p>}
              {blockedOnHussein
                .filter((j) =>
                  isEditor ? (j.assignee_role ?? "editor") === "editor" : (j.assignee_role ?? "editor") === "designer"
                )
                .map((j) => <JobRow key={j.id} job={j} />)}
            </div>
          </section>
        </div>
      )}

      <NavBar />
    </div>
  );
}

function JobRow({ job, showAssignee }: { job: Job; showAssignee?: boolean }) {
  const overdue = job.due_date && new Date(job.due_date) < new Date();
  return (
    <Link href={`/jobs/${job.id}`}
      className="block bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 active:border-[#e8c84a] transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{job.client_name}</p>
          <p className="text-[#666] text-xs mt-0.5">
            {job.reels_count ? `${job.reels_count} reels` : job.deliverable}
            {showAssignee ? ` · ${job.assignee_role ?? "editor"}` : ""}
          </p>
        </div>
        <StageBadge stage={job.stage} />
      </div>
      {job.due_date && (
        <p className={`text-xs mt-2 ${overdue ? "text-red-400" : "text-[#666]"}`}>
          Due {new Date(job.due_date + "T00:00:00").toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
          {overdue ? " · overdue" : ""}
        </p>
      )}
    </Link>
  );
}
