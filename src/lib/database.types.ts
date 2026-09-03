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
export type UserRole = "owner" | "editor" | "admin";
export type LeadStatus = "new" | "contacted" | "proposal" | "won" | "lost";
export type MeetingType = "shoot" | "meeting";

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

export interface Database {
  public: {
    Tables: {
      jobs: { Row: Job; Insert: Omit<Job, "id" | "created_at" | "updated_at">; Update: Partial<Job> };
      job_events: { Row: JobEvent; Insert: Omit<JobEvent, "id" | "created_at">; Update: Partial<JobEvent> };
      leads: { Row: Lead; Insert: Omit<Lead, "id" | "created_at">; Update: Partial<Lead> };
      meetings: { Row: Meeting; Insert: Omit<Meeting, "id" | "created_at">; Update: Partial<Meeting> };
      whatsapp_reminders: { Row: WhatsappReminder; Insert: Omit<WhatsappReminder, "id">; Update: Partial<WhatsappReminder> };
      profiles: { Row: Profile; Insert: Omit<Profile, "created_at">; Update: Partial<Profile> };
    };
  };
}
