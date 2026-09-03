import type { Stage, UserRole, Job } from "./database.types";

export const STAGE_LABELS: Record<Stage, string> = {
  new_order: "New Order",
  shoot_booked: "Shoot Booked",
  shot: "Shot",
  sd_received: "SD with Editor",
  on_drive: "On Internal Drive",
  waiting_script: "Waiting on Script",
  editing: "Editing",
  review: "In Review",
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

// Who can advance the job from each stage
export const STAGE_OWNER: Record<Stage, UserRole[]> = {
  new_order: ["owner", "admin"],
  shoot_booked: ["owner", "admin"],
  shot: ["owner"],
  sd_received: ["editor"],
  on_drive: ["editor"],
  waiting_script: ["owner"], // only Hussein can unblock by providing script
  editing: ["editor"],
  review: ["owner", "admin"],
  sent: [],
};

// Label for the primary action button shown to the current user
export const NEXT_ACTION_LABEL: Record<Stage, string> = {
  new_order: "Book Shoot",
  shoot_booked: "Mark Shot Done",
  shot: "SD Handed to Editor",
  sd_received: "Files Copied to Drive",
  on_drive: "Script Provided",
  waiting_script: "Script Provided — Start Editing",
  editing: "Send for Review",
  review: "Mark Sent",
  sent: "",
};

export function getNextStage(current: Stage): Stage | null {
  const idx = STAGE_ORDER.indexOf(current);
  if (idx === -1 || idx === STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}

export interface GateCheck {
  blocked: boolean;
  reason?: string;
}

/**
 * Returns whether advancing FROM the given stage is blocked, and why.
 */
export function checkGate(job: Job, from: Stage): GateCheck {
  if (from === "on_drive" && !job.script_provided && !job.script_notes) {
    return {
      blocked: true,
      reason: "Script must be provided before editing can begin.",
    };
  }
  if (from === "waiting_script" && !job.script_provided) {
    return {
      blocked: true,
      reason: "Script not yet provided by Hussein.",
    };
  }
  if (from === "sd_received" && !job.studio_folder) {
    return {
      blocked: true,
      reason: "Enter the studio drive folder name before marking files copied.",
    };
  }
  return { blocked: false };
}

export function canAdvance(job: Job, userRole: UserRole): boolean {
  return STAGE_OWNER[job.stage]?.includes(userRole) ?? false;
}

/** Jobs waiting on Hussein (owner) */
export function isWaitingOnHussein(job: Job): boolean {
  return (
    job.stage === "waiting_script" ||
    job.stage === "new_order" ||
    job.stage === "review"
  );
}

/** Jobs waiting on editor */
export function isWaitingOnEditor(job: Job): boolean {
  return (
    job.stage === "sd_received" ||
    job.stage === "on_drive" ||
    job.stage === "editing"
  );
}
