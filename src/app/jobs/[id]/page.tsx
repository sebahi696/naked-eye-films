"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import {
  NEXT_ACTION_LABEL,
  getNextStage,
  checkGate,
  canAdvance,
  STAGE_ORDER,
  EDITOR_TASK_STAGES,
} from "@/lib/stages";
import type { Job, JobEvent, PingKind } from "@/lib/database.types";
import type { SessionUser } from "@/lib/auth";
import StageBadge from "@/components/StageBadge";
import EventLog from "@/components/EventLog";
import NavBar from "@/components/NavBar";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/client-api";

export default function JobCardPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [events, setEvents] = useState<JobEvent[]>([]);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [note, setNote] = useState("");
  const [folderEdit, setFolderEdit] = useState("");
  const [advancing, setAdvancing] = useState(false);
  const [pinging, setPinging] = useState(false);
  const [error, setError] = useState("");
  const [pingOk, setPingOk] = useState("");

  useEffect(() => {
    Promise.all([
      api<{ user: SessionUser }>("/api/auth/me"),
      api<{ job: Job; events: JobEvent[] }>(`/api/jobs/${id}`),
    ]).then(([me, data]) => {
      setUser(me.user);
      setJob(data.job);
      setFolderEdit(data.job.studio_folder ?? "");
      setEvents(data.events);
    });
  }, [id]);

  async function advance() {
    if (!job || !user) return;
    const gate = checkGate(job, job.stage);
    if (gate.blocked) { setError(gate.reason ?? "Blocked"); return; }

    setAdvancing(true);
    setError("");
    try {
      const { job: updated } = await api<{ job: Job }>(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "advance",
          note: note || null,
          studio_folder: folderEdit || job.studio_folder,
        }),
      });
      const evRes = await api<{ events: JobEvent[] }>(`/api/jobs/${job.id}`);
      setJob(updated);
      setEvents(evRes.events);
      setNote("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to advance");
    }
    setAdvancing(false);
  }

  async function saveFolder() {
    if (!job) return;
    const { job: updated } = await api<{ job: Job }>(`/api/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studio_folder: folderEdit }),
    });
    setJob(updated);
  }

  async function markScriptProvided() {
    if (!job) return;
    const { job: updated } = await api<{ job: Job }>(`/api/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ script_provided: true }),
    });
    setJob(updated);
  }

  async function sendPing(kind: PingKind, message?: string) {
    if (!job) return;
    setPinging(true);
    setPingOk("");
    try {
      await api("/api/pings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: job.id,
          kind,
          brand: job.client_name,
          message: message || defaultPing(kind, job.client_name),
        }),
      });
      setPingOk("Sent to his Inbox");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ping failed");
    }
    setPinging(false);
  }

  if (!job || !user) return <div className="flex items-center justify-center h-screen text-[#666]">Loading…</div>;

  const isEditTask = (job.assignee_role ?? "editor") === "editor" || job.assignee_role === "designer";
  const path = isEditTask ? EDITOR_TASK_STAGES : STAGE_ORDER;
  const nextStage = getNextStage(job.stage, job.assignee_role);
  const gate = checkGate(job, job.stage);
  const userCanAdvance = canAdvance(job, user.role);
  const stageIndex = Math.max(0, path.indexOf(job.stage));
  const showStudio = !isEditTask || ["sd_received", "on_drive", "shot"].includes(job.stage);
  const isTeam = user.role === "editor" || user.role === "designer";

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24 md:pb-8 pt-6">
      <button type="button" onClick={() => router.back()} className="text-[#666] text-sm mb-3">← Back</button>

      <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5 mb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold truncate">{job.client_name}</h1>
            <p className="text-[#666] text-sm mt-0.5 capitalize">
              {job.assignee_role ?? "editor"}
              {job.reels_count ? ` · ${job.reels_count} reels` : ` · ${job.deliverable}`}
            </p>
          </div>
          <StageBadge stage={job.stage} />
        </div>
        <div className="flex gap-1 mt-3">
          {path.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= stageIndex ? "bg-[#e8c84a]" : "bg-[#2a2a2a]"}`} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
          {job.due_date && (
            <div>
              <p className="text-[#666] text-xs">Due</p>
              <p className={new Date(job.due_date) < new Date() ? "text-red-400" : ""}>
                {new Date(job.due_date + "T00:00:00").toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
              </p>
            </div>
          )}
          <div>
            <p className="text-[#666] text-xs">Final goes to</p>
            <p>{job.route === "hussein" ? "Hussein" : job.agency_name ?? "Agency"}</p>
          </div>
        </div>
      </div>

      {showStudio && (
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 mb-3">
          <p className="text-xs text-[#666] uppercase tracking-wide mb-2">Studio folder</p>
          <div className="flex gap-2">
            <input value={folderEdit} onChange={(e) => setFolderEdit(e.target.value)}
              placeholder="NEF/2026/BrandName"
              className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#e8c84a]" />
            <button type="button" onClick={saveFolder} className="text-[#e8c84a] text-sm px-3">Save</button>
          </div>
        </div>
      )}

      <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 mb-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-[#666] uppercase tracking-wide">Script</p>
          <span className={`text-xs px-2 py-0.5 rounded-full ${job.script_provided || job.script_notes ? "bg-[#1a2e1a] text-[#5bbf6b]" : "bg-[#2e1a0a] text-[#e8903a]"}`}>
            {job.script_provided || job.script_notes ? "Ready" : "Missing"}
          </span>
        </div>
        {job.script_notes ? (
          <p className="text-sm text-[#aaa] whitespace-pre-wrap">{job.script_notes}</p>
        ) : (
          <p className="text-sm text-[#555]">No script yet</p>
        )}
        {!job.script_provided && (user.role === "owner" || user.is_admin) && (
          <button type="button" onClick={markScriptProvided}
            className="mt-3 text-sm bg-[#1a2e1a] text-[#5bbf6b] px-3 py-2 rounded-lg">
            Mark script ready
          </button>
        )}
      </div>

      {nextStage && userCanAdvance && (
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 mb-3">
          <p className="text-xs text-[#666] uppercase tracking-wide mb-2">Next</p>
          <textarea value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note" rows={2}
            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-[#e8c84a] mb-3" />
          {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
          {gate.blocked ? (
            <p className="text-[#e8903a] text-sm">{gate.reason}</p>
          ) : (
            <button type="button" onClick={advance} disabled={advancing}
              className="w-full bg-[#e8c84a] text-black font-semibold py-3.5 rounded-xl text-sm disabled:opacity-50">
              {advancing ? "Updating…" : NEXT_ACTION_LABEL[job.stage]}
            </button>
          )}
        </div>
      )}

          {/* Team → Hussein — prefer Ask for questions; keep done on task */}
          {isTeam && (
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 mb-3">
              <p className="text-xs text-[#666] uppercase tracking-wide mb-2">Blocked?</p>
              <Link
                href="/ask"
                className="block w-full text-center bg-[#e8c84a] text-black font-semibold py-3 rounded-xl text-sm mb-2"
              >
                Ask Hussein (Inbox)
              </Link>
              <button
                type="button"
                disabled={pinging}
                onClick={() => sendPing("done")}
                className="w-full py-3 rounded-xl text-xs font-medium border border-[#1a2e1a] text-[#5bbf6b]"
              >
                {pinging ? "…" : "Mark work done for him"}
              </button>
              {pingOk && <p className="text-[#5bbf6b] text-xs mt-2">{pingOk}</p>}
            </div>
          )}

      {job.stage === "sent" && (
        <div className="bg-[#1a2e1a] border border-[#2a4a2a] rounded-xl p-4 mb-3 text-center">
          <p className="text-[#5bbf6b] font-medium">Sent</p>
        </div>
      )}

      <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
        <p className="text-xs text-[#666] uppercase tracking-wide mb-3">Activity</p>
        <EventLog events={events} />
      </div>

      <NavBar />
    </div>
  );
}

function defaultPing(kind: PingKind, brand: string) {
  if (kind === "need_script") return `Need script for ${brand}`;
  if (kind === "done") return `Done — ${brand} ready for review`;
  if (kind === "reminder") return `Reminder: ${brand} still waiting on you`;
  return `Question about ${brand}`;
}
