import type { Stage, UserRole, Job, AssigneeRole } from "./database.types";

export const STAGE_LABELS: Record<Stage, string> = {
  new_order: "New",
  shoot_booked: "Booked",
  shot: "Shot",
  sd_received: "SD received",
  on_drive: "On drive",
  waiting_script: "Need script",
  editing: "Editing",
  review: "Review",
  sent: "Sent",
};

export const STAGE_ORDER: Stage[] = [
  "new_order",
  "shoot_booked",
  "shot",
  "sd_received",
  "on_drive",
  "waiting_script",
  "editing",
  "review",
  "sent",
];

/** Short pipeline for editor-assigned edit tasks (no shoot/SD steps) */
export const EDITOR_TASK_STAGES: Stage[] = [
  "waiting_script",
  "editing",
  "review",
  "sent",
];

export const STAGE_OWNER: Record<Stage, UserRole[]> = {
  new_order: ["owner", "admin"],
  shoot_booked: ["owner", "admin"],
  shot: ["owner"],
  sd_received: ["editor"],
  on_drive: ["editor"],
  waiting_script: ["owner", "admin"],
  editing: ["editor", "designer"],
  review: ["owner", "admin"],
  sent: [],
};

export const NEXT_ACTION_LABEL: Record<Stage, string> = {
  new_order: "Book Shoot",
  shoot_booked: "Mark Shot Done",
  shot: "SD Handed to Editor",
  sd_received: "Files on Drive",
  on_drive: "Need script",
  waiting_script: "Script ready — start",
  editing: "Send for review",
  review: "Approve & mark sent",
  sent: "",
};

export function getNextStage(current: Stage, assignee?: AssigneeRole | null): Stage | null {
  // Editor/designer edit tasks use a short path
  if (assignee === "editor" || assignee === "designer") {
    if (current === "new_order") return "waiting_script";
    const path = EDITOR_TASK_STAGES;
    const idx = path.indexOf(current);
    if (idx === -1) {
      // Mid shoot-pipeline job assigned later — fall through to full path
      const fullIdx = STAGE_ORDER.indexOf(current);
      if (fullIdx === -1 || fullIdx === STAGE_ORDER.length - 1) return null;
      return STAGE_ORDER[fullIdx + 1];
    }
    if (idx === path.length - 1) return null;
    return path[idx + 1];
  }

  const idx = STAGE_ORDER.indexOf(current);
  if (idx === -1 || idx === STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}

export interface GateCheck {
  blocked: boolean;
  reason?: string;
}

export function checkGate(job: Job, from: Stage): GateCheck {
  if (from === "on_drive" && !job.script_provided && !job.script_notes) {
    return { blocked: true, reason: "Script needed before editing." };
  }
  if (from === "waiting_script" && !job.script_provided && !job.script_notes) {
    return { blocked: true, reason: "Add the script first (or mark it provided)." };
  }
  if (from === "sd_received" && !job.studio_folder) {
    return { blocked: true, reason: "Enter studio folder name first." };
  }
  return { blocked: false };
}

export function canAdvance(job: Job, userRole: UserRole): boolean {
  return STAGE_OWNER[job.stage]?.includes(userRole) ?? false;
}

export function isWaitingOnHussein(job: Job): boolean {
  return job.stage === "waiting_script" || job.stage === "new_order" || job.stage === "review";
}

export function isWaitingOnEditor(job: Job): boolean {
  const assignee = job.assignee_role ?? "editor";
  if (assignee !== "editor") return false;
  return (
    job.stage === "sd_received" ||
    job.stage === "on_drive" ||
    job.stage === "editing" ||
    (job.stage === "waiting_script" && Boolean(job.script_provided || job.script_notes))
  );
}

export function isWaitingOnDesigner(job: Job): boolean {
  return (job.assignee_role ?? "editor") === "designer" && job.stage === "editing";
}

export function initialStageForAssignee(assignee: AssigneeRole, hasScript: boolean): Stage {
  if (assignee === "editor" || assignee === "designer") {
    return hasScript ? "editing" : "waiting_script";
  }
  return "new_order";
}
