# Naked Eye Films CRM — prototype (PWA)

Single-file app used for the feedback round before the full build.

- **Shared database:** Supabase project `necromancer-breakout` (tables prefixed `crm_`, row-level security: signed-in team only; owner writes everything, editor/social can only update clients they work on and create notifications).
- **Logins:** Supabase email + password; the role comes from `crm_profiles`.
- **Live sync:** realtime subscription on `crm_clients`, `crm_expenses`, `crm_notifs` + 30 s poll.
- Hosted with GitHub Pages from this `docs/` folder.

Owner menu (top right) → *Load demo clients* / *Delete all data*.

## Push notifications, passwords, read state
- **Push:** `crm_push_subs` holds each phone's Web Push subscription (VAPID keys in `crm_secrets`, service-role only). A trigger on `crm_notifs` calls the Edge Function `crm-push` through pg_net; it sends to everyone with the target role except the person who caused it, and prunes dead subscriptions. iPhone needs the app added to the Home Screen first.
- **Passwords:** users change their own under their name; the owner resets a teammate's through Edge Function `crm-admin` (owner-checked).
- **Read state:** `crm_notif_reads` per user, so the bell is in sync across devices.
