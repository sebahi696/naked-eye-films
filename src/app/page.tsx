"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { isWaitingOnHussein, isWaitingOnEditor, STAGE_LABELS } from "@/lib/stages";
import type { Job, Profile } from "@/lib/database.types";
import NavBar from "@/components/NavBar";
import StageBadge from "@/components/StageBadge";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function QueuePage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(prof);

      const { data: jobData } = await supabase
        .from("jobs")
        .select("*")
        .neq("stage", "sent")
        .order("due_date", { ascending: true });
      setJobs(jobData ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  const myJobs = jobs.filter((j) => {
    if (!profile) return false;
    if (profile.role === "owner") return isWaitingOnHussein(j);
    if (profile.role === "editor") return isWaitingOnEditor(j);
    return true;
  });

  const husseinJobs = jobs.filter(isWaitingOnHussein);
  const editorJobs = jobs.filter(isWaitingOnEditor);

  if (loading) return <div className="flex items-center justify-center h-screen text-[#666]">Loading…</div>;

  const isOwner = profile?.role === "owner";

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24 md:pb-8 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Production Queue</h1>
        <Link href="/jobs/new" className="bg-[#e8c84a] text-black text-sm font-semibold px-4 py-2 rounded-lg">
          + New Job
        </Link>
      </div>

      {isOwner ? (
        // Hussein sees all jobs grouped by stage
        <div className="space-y-3">
          {jobs.length === 0 && <p className="text-[#666] text-sm">No active jobs.</p>}
          {jobs.map((j) => <JobRow key={j.id} job={j} />)}
        </div>
      ) : (
        // Editor sees two columns
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
    <Link
      href={`/jobs/${job.id}`}
      className="block bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 hover:border-[#444] transition-colors"
    >
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

