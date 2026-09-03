"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  STAGE_LABELS, NEXT_ACTION_LABEL, getNextStage, checkGate, canAdvance, STAGE_ORDER
} from "@/lib/stages";
import type { Job, JobEvent, Profile } from "@/lib/database.types";
import StageBadge from "@/components/StageBadge";
import EventLog from "@/components/EventLog";
import NavBar from "@/components/NavBar";
import { useRouter, useParams } from "next/navigation";

export default function JobCardPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [events, setEvents] = useState<JobEvent[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [note, setNote] = useState("");
  const [folderEdit, setFolderEdit] = useState("");
  const [advancing, setAdvancing] = useState(false);
  const [reminding, setReminding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [{ data: prof }, { data: j }, { data: evts }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("jobs").select("*").eq("id", id).single(),
        supabase.from("job_events").select("*").eq("job_id", id).order("created_at", { ascending: false }),
      ]);
      setProfile(prof);
      setJob(j);
      setFolderEdit(j?.studio_folder ?? "");
      setEvents(evts ?? []);
    }
    load();
  }, [id, router]);

  async function advance() {
    if (!job || !profile) return;
    const gate = checkGate(job, job.stage);
    if (gate.blocked) { setError(gate.reason ?? "Blocked"); return; }
    const next = getNextStage(job.stage);
    if (!next) return;

    setAdvancing(true);
    const updates: Partial<Job> = { stage: next };
    if (next === "waiting_script" || next === "editing") updates.script_provided = job.script_provided;
    if (folderEdit && !job.studio_folder) updates.studio_folder = folderEdit;

    const { error: upErr } = await supabase.from("jobs").update(updates).eq("id", job.id);
    if (upErr) { setError(upErr.message); setAdvancing(false); return; }

    await supabase.from("job_events").insert({
      job_id: job.id,
      actor_role: profile.role,
      actor_name: profile.full_name,
      stage_from: job.stage,
      stage_to: next,
      note: note || null,
    });

    // Fire WhatsApp if moving to waiting_script (script still needed)
    if (next === "waiting_script" && !job.script_provided) {
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "script_needed", jobId: job.id }),
      });
    }

    setJob((j) => j ? { ...j, ...updates } : j);
    setEvents((ev) => [{
      id: Date.now().toString(),
      job_id: job.id,
      actor_role: profile.role,
      actor_name: profile.full_name,
      stage_from: job.stage,
      stage_to: next,
      note: note || null,
      created_at: new Date().toISOString(),
    }, ...ev]);
    setNote("");
    setAdvancing(false);
  }

  async function sendReminder() {
    if (!job) return;
    setReminding(true);
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "script_needed", jobId: job.id }),
    });
    setReminding(false);
  }

  async function saveFolder() {
    if (!job) return;
    await supabase.from("jobs").update({ studio_folder: folderEdit }).eq("id", job.id);
    setJob((j) => j ? { ...j, studio_folder: folderEdit } : j);
  }

  async function markScriptProvided() {
    if (!job) return;
    await supabase.from("jobs").update({ script_provided: true }).eq("id", job.id);
    setJob((j) => j ? { ...j, script_provided: true } : j);
  }

  if (!job || !profile) return <div className="flex items-center justify-center h-screen text-[#666]">Loading…</div>;

  const nextStage = getNextStage(job.stage);
  const gate = checkGate(job, job.stage);
  const userCanAdvance = canAdvance(job, profile.role);
  const stageIndex = STAGE_ORDER.indexOf(job.stage);

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24 md:pb-8 pt-6">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => router.back()} className="text-[#666] text-sm">← Back</button>
      </div>

      {/* Header */}
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5 mb-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h1 className="text-xl font-semibold">{job.client_name}</h1>
            <p className="text-[#666] text-sm capitalize mt-0.5">{job.job_type} · {job.deliverable}</p>
          </div>
          <StageBadge stage={job.stage} />
        </div>

        {/* Stage progress bar */}
        <div className="flex gap-1 mt-3">
          {STAGE_ORDER.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= stageIndex ? "bg-[#e8c84a]" : "bg-[#2a2a2a]"}`} />
          ))}
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
          {job.shoot_date && (
            <div>
              <p className="text-[#666] text-xs">Shoot date</p>
              <p>{new Date(job.shoot_date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</p>
            </div>
          )}
          {job.due_date && (
            <div>
              <p className="text-[#666] text-xs">Due date</p>
              <p className={new Date(job.due_date) < new Date() ? "text-red-400" : ""}>
                {new Date(job.due_date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
          )}
          <div>
            <p className="text-[#666] text-xs">Route</p>
            <p>{job.route === "hussein" ? "Hussein → Client" : `Agency: ${job.agency_name ?? "—"}`}</p>
          </div>
        </div>
      </div>

      {/* Studio folder */}
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 mb-4">
        <p className="text-xs text-[#666] uppercase tracking-wide mb-2">Studio Drive Folder</p>
        <div className="flex gap-2">
          <input
            value={folderEdit}
            onChange={(e) => setFolderEdit(e.target.value)}
            placeholder="e.g. NEF/2026/RamiWedding"
            className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e8c84a]"
          />
          <button onClick={saveFolder} className="text-[#e8c84a] text-sm px-3">Save</button>
        </div>
      </div>

      {/* Script */}
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-[#666] uppercase tracking-wide">Script</p>
          {!job.script_provided && (
            <span className="text-xs bg-[#2e1a0a] text-[#e8903a] px-2 py-0.5 rounded-full">Missing</span>
          )}
          {job.script_provided && (
            <span className="text-xs bg-[#1a2e1a] text-[#5bbf6b] px-2 py-0.5 rounded-full">Provided</span>
          )}
        </div>
        {job.script_notes && <p className="text-sm text-[#aaa] mb-3">{job.script_notes}</p>}
        {!job.script_provided && (
          <div className="flex gap-2">
            <button onClick={markScriptProvided}
              className="text-sm bg-[#1a2e1a] text-[#5bbf6b] px-3 py-1.5 rounded-lg">
              Mark script provided
            </button>
            <button onClick={sendReminder} disabled={reminding}
              className="text-sm text-[#e8903a] border border-[#2e1a0a] px-3 py-1.5 rounded-lg disabled:opacity-50">
              {reminding ? "Sending…" : "Remind Hussein"}
            </button>
          </div>
        )}
      </div>

      {/* Next action */}
      {nextStage && userCanAdvance && (
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 mb-4">
          <p className="text-xs text-[#666] uppercase tracking-wide mb-3">Next action</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note (optional)"
            rows={2}
            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-[#e8c84a] mb-3"
          />
          {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
          {gate.blocked ? (
            <p className="text-[#e8903a] text-sm">{gate.reason}</p>
          ) : (
            <button onClick={advance} disabled={advancing}
              className="w-full bg-[#e8c84a] text-black font-semibold py-3 rounded-xl text-sm disabled:opacity-50">
              {advancing ? "Updating…" : NEXT_ACTION_LABEL[job.stage]}
            </button>
          )}
        </div>
      )}

      {job.stage === "sent" && (
        <div className="bg-[#1a2e1a] border border-[#2a4a2a] rounded-xl p-4 mb-4 text-center">
          <p className="text-[#5bbf6b] font-medium">Job complete — Sent to client</p>
        </div>
      )}

      {/* Event log */}
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
        <p className="text-xs text-[#666] uppercase tracking-wide mb-3">Activity</p>
        <EventLog events={events} />
      </div>

      <NavBar />
    </div>
  );
}
