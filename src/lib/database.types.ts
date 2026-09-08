export type Stage =
  | "new_order"
  | "shoot_booked"
  | "shot"
  | "sd_received"
  | "on_drive"
  | "waiting_script"
  | "editing"
  | "review"
  | "sent";

export type JobType = "photoshoot" | "video" | "mixed";
export type RouteType = "hussein" | "agency";
export type UserRole = "owner" | "editor" | "admin" | "designer";
export type AssigneeRole = "editor" | "designer";
export type LeadStatus = "new" | "contacted" | "proposal" | "won" | "lost";
export type MeetingType = "shoot" | "meeting";
export type PingKind = "question" | "done" | "reminder" | "need_script";

export interface Job {
  id: string;
  client_name: string;
  job_type: JobType;
  deliverable: string;
  shoot_date: string | null;
  script_notes: string | null;
  script_provided: boolean;
  route: RouteType;
  agency_name: string | null;
  due_date: string | null;
  stage: Stage;
  studio_folder: string | null;
  assignee_role: AssigneeRole;
  reels_count: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface JobEvent {
  id: string;
  job_id: string;
  actor_role: UserRole;
  actor_name: string;
  stage_from: Stage | null;
  stage_to: Stage;
  note: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  contact_name: string;
  company: string | null;
  source: string | null;
  status: LeadStatus;
  follow_up_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface Meeting {
  id: string;
  title: string;
  client_or_lead: string | null;
  date: string;
  time: string;
  type: MeetingType;
  notes: string | null;
  created_at: string;
}

export interface Ping {
  id: string;
  job_id: string | null;
  from_user_id: string | null;
  from_name: string;
  to_role: string;
  kind: PingKind;
  message: string;
  brand: string | null;
  reply: string | null;
  replied_at: string | null;
  read_at: string | null;
  created_at: string;
}

export interface WhatsappReminder {
  id: string;
  job_id: string | null;
  lead_id: string | null;
  type: string;
  sent_at: string;
  wa_number: string;
  message_body: string;
}

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  created_at: string;
}
