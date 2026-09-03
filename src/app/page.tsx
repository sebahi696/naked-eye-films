"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { isWaitingOnHussein, isWaitingOnEditor } from "@/lib/stages";
import type { Job } from "@/lib/database.types";
import type { SessionUser } from "@/lib/auth";
import NavBar from "@/components/NavBar";
import StageBadge from "@/components/StageBadge";
import Link from "next/link";
import { api } from "@/lib/client-api";

export default function QueuePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api<{ user: SessionUser }>("/api/auth/me"),
      api<{ jobs: Job[] }>("/api/jobs?exclude=sent"),
    ]).then(([me, data]) => {
      setUser(me.user);
      setJobs(data.jobs);
      setLoading(false);
    });
  }, []);

  const husseinJobs = jobs.filter(isWaitingOnHussein);
  const editorJobs = jobs.filter(isWaitingOnEditor);

  if (loading) return <div className="flex items-center justify-center h-screen text-[#666]">Loading…</div>;

  const isOwner = user?.role === "owner";

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24 md:pb-8 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Production Queue</h1>
        <Link href="/jobs/new" className="bg-[#e8c84a] text-black text-sm font-semibold px-4 py-2 rounded-lg">
          + New Job
        </Link>
      </div>

      {isOwner ? (
        <div className="space-y-3">
          {jobs.length === 0 && <p className="text-[#666] text-sm">No active jobs.</p>}
          {jobs.map((j) => <JobRow key={j.id} job={j} />)}
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="text-xs uppercase tracking-widest text-[#666] mb-3">Waiting on me</h2>
            <div className="space-y-3">
              {editorJobs.length === 0 && <p className="text-[#555] text-sm">Nothing in your queue.</p>}
              {editorJobs.map((j) => <JobRow key={j.id} job={j} />)}
            </div>
          </section>
          <section>
            <h2 className="text-xs uppercase tracking-widest text-[#666] mb-3">Waiting on Hussein</h2>
            <div className="space-y-3">
              {husseinJobs.length === 0 && <p className="text-[#555] text-sm">None blocked on Hussein.</p>}
              {husseinJobs.map((j) => <JobRow key={j.id} job={j} />)}
            </div>
          </section>
        </div>
      )}
      <NavBar />
    </div>
  );
}

function JobRow({ job }: { job: Job }) {
  const overdue = job.due_date && new Date(job.due_date) < new Date();
  return (
    <Link href={`/jobs/${job.id}`}
      className="block bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 hover:border-[#444] transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-sm">{job.client_name}</p>
          <p className="text-[#666] text-xs mt-0.5 capitalize">{job.job_type} · {job.deliverable}</p>
        </div>
        <StageBadge stage={job.stage} />
      </div>
      {job.due_date && (
        <p className={`text-xs mt-2 ${overdue ? "text-red-400" : "text-[#666]"}`}>
          Due {new Date(job.due_date).toLocaleDateString([], { month: "short", day: "numeric" })}
          {overdue && " — overdue"}
        </p>
      )}
    </Link>
  );
}
