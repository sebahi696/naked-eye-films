import { createServiceClient } from "./supabase";

export function db() {
  return createServiceClient();
}
