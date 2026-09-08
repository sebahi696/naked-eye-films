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

export default function HomePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pings, setPings] = useState<Ping[]>([]);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showSync, setShowSync] = useState(false);

  async function load() {
    const [me, data, p] = await Promise.all([
      api<{ user: SessionUser }>("/api/auth/me"),
      api<{ jobs: Job[] }>("/api/jobs?exclude=sent"),
      api<{ pings: Ping[] }>("/api/pings?mode=open").catch(() => ({ pings: [] as Ping[] })),
    ]);
    setUser(me.user);
    setJobs(data.jobs);
    setPings(p.pings.filter((x) => !x.replied_at && x.kind !== "done"));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen text-[#666]">Loading…</div>;

  const isOwner = user?.role === "owner" || user?.is_admin;
  const isEditor = user?.role === "editor";
  const isDesigner = user?.role === "designer";

  if (isOwner) {
    const needDecision = jobs.filter(
      (j) => j.stage === "review" || j.stage === "waiting_script"
    );
    const openCount = pings.length + needDecision.length;

    return (
      <div className="max-w-2xl mx-auto px-4 pb-24 md:pb-8 pt-6">
        <div className="mb-6">
          <p className="text-[#e8c84a] text-xs uppercase tracking-widest mb-1">Assistant</p>
          <h1 className="text-2xl font-semibold">Inbox</h1>
          <p className="text-[#666] text-sm mt-1">
            {openCount === 0
              ? "Nothing waiting on you. Keep shooting."
              : `${openCount} thing${openCount === 1 ? "" : "s"} need a decision — answer and move on.`}
          </p>
        </div>

        {/* Questions from team — answer here, don't open WhatsApp archaeology */}
        <section className="mb-6">
          <h2 className="text-xs uppercase tracking-widest text-[#666] mb-3">Questions</h2>
          {pings.filter((p) => p.kind === "question" || p.kind === "need_script" || p.kind === "reminder").length === 0 && (
            <p className="text-[#555] text-sm bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
              No open questions. Designer / editor will land them here when WhatsApp isn&apos;t enough.
            </p>
          )}
          <div className="space-y-3">
            {pings
              .filter((p) => p.kind === "question" || p.kind === "need_script" || p.kind === "reminder")
              .map((p) => (
                <div key={p.id} className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-xs text-[#e8903a]">
                        {p.from_name}
                        {p.brand ? ` · ${p.brand}` : ""}
                      </p>
                      <p className="text-sm text-white mt-1">{p.message}</p>
                    </div>
                    <span className="text-[10px] uppercase text-[#555] shrink-0">
                      {p.kind.replace("_", " ")}
                    </span>
                  </div>
                  <input
                    value={replyDraft[p.id] ?? ""}
                    onChange={(e) => setReplyDraft((d) => ({ ...d, [p.id]: e.target.value }))}
                    placeholder="Short answer…"
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#e8c84a] mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busyId === p.id || !(replyDraft[p.id] ?? "").trim()}
                      onClick={async () => {
                        setBusyId(p.id);
                        await api("/api/pings", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: p.id, reply: replyDraft[p.id] }),
                        });
                        setPings((list) => list.filter((x) => x.id !== p.id));
                        setBusyId(null);
                      }}
                      className="flex-1 bg-[#e8c84a] text-black text-sm font-semibold py-2.5 rounded-lg disabled:opacity-40"
                    >
                      Reply
                    </button>
                    <button
                      type="button"
                      disabled={busyId === p.id}
                      onClick={async () => {
                        setBusyId(p.id);
                        await api("/api/pings", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: p.id, action: "ack" }),
                        });
                        setPings((list) => list.filter((x) => x.id !== p.id));
                        setBusyId(null);
                      }}
                      className="px-4 py-2.5 rounded-lg border border-[#2a2a2a] text-[#aaa] text-sm"
                    >
                      Got it
                    </button>
                  </div>
                  {p.job_id && (
                    <Link href={`/jobs/${p.job_id}`} className="block text-xs text-[#555] mt-2">
                      Open related task →
                    </Link>
                  )}
                </div>
              ))}
          </div>
        </section>

        {/* Approvals / scripts only */}
        <section className="mb-6">
          <h2 className="text-xs uppercase tracking-widest text-[#666] mb-3">Needs your action</h2>
          {needDecision.length === 0 && (
            <p className="text-[#555] text-sm">No approvals or missing scripts.</p>
          )}
          <div className="space-y-2">
            {needDecision.map((j) => (
              <Link
                key={j.id}
                href={`/jobs/${j.id}`}
                className="flex items-center justify-between bg-[#141414] border border-[#2a2a2a] rounded-xl p-4"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{j.client_name}</p>
                  <p className="text-[#666] text-xs mt-0.5">
                    {j.stage === "waiting_script" ? "Script missing" : "Ready for your review"}
                    {j.assignee_role ? ` · ${j.assignee_role}` : ""}
                  </p>
                </div>
                <StageBadge stage={j.stage} />
              </Link>
            ))}
          </div>
        </section>

        {/* Optional sync — not the default load */}
        <button
          type="button"
          onClick={() => setShowSync((v) => !v)}
          className="text-xs text-[#555] mb-3"
        >
          {showSync ? "Hide sync list" : "Show what’s moving (optional)"}
        </button>
        {showSync && (
          <div className="space-y-2 mb-4 opacity-80">
            {jobs.length === 0 && <p className="text-[#555] text-sm">No open tasks.</p>}
            {jobs.map((j) => (
              <Link key={j.id} href={`/jobs/${j.id}`} className="flex justify-between bg-[#0f0f0f] border border-[#222] rounded-xl p-3">
                <span className="text-sm truncate">{j.client_name}</span>
                <StageBadge stage={j.stage} />
              </Link>
            ))}
          </div>
        )}

        <NavBar />
      </div>
    );
  }

  // Editor / designer — work + ask, not CRM
  const mine = isEditor
    ? jobs.filter(isWaitingOnEditor)
    : isDesigner
      ? jobs.filter(isWaitingOnDesigner)
      : jobs;
  const waitingHim = jobs.filter(isWaitingOnHussein);

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24 md:pb-8 pt-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold">{isDesigner ? "Design" : "Editing"}</h1>
          <p className="text-[#666] text-xs mt-0.5">WhatsApp for chat · here for blockers</p>
        </div>
        <Link
          href="/ask"
          className="bg-[#e8c84a] text-black text-sm font-semibold px-4 py-2.5 rounded-xl"
        >
          Ask Hussein
        </Link>
      </div>

      <section className="mb-6">
        <h2 className="text-xs uppercase tracking-widest text-[#666] mb-3">Waiting on me</h2>
        <div className="space-y-2">
          {mine.length === 0 && <p className="text-[#555] text-sm">Clear.</p>}
          {mine.map((j) => (
            <JobRow key={j.id} job={j} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-[#666] mb-3">Waiting on Hussein</h2>
        <div className="space-y-2">
          {waitingHim.filter((j) =>
            isEditor ? (j.assignee_role ?? "editor") === "editor" : (j.assignee_role ?? "editor") === "designer"
          ).length === 0 && <p className="text-[#555] text-sm">None.</p>}
          {waitingHim
            .filter((j) =>
              isEditor ? (j.assignee_role ?? "editor") === "editor" : (j.assignee_role ?? "editor") === "designer"
            )
            .map((j) => (
              <JobRow key={j.id} job={j} />
            ))}
        </div>
      </section>

      <NavBar />
    </div>
  );
}

function JobRow({ job }: { job: Job }) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="block bg-[#141414] border border-[#2a2a2a] rounded-xl p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{job.client_name}</p>
          <p className="text-[#666] text-xs mt-0.5">
            {job.reels_count ? `${job.reels_count} reels` : job.deliverable}
          </p>
        </div>
        <StageBadge stage={job.stage} />
      </div>
    </Link>
  );
}
