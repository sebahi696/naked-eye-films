# Naked Eye Films CRM — prototype (PWA)

Single-file app used for the feedback round before the full build.

- **Shared database:** Supabase project `necromancer-breakout` (tables prefixed `crm_`, row-level security: signed-in team only; owner writes everything, editor/social can only update clients they work on and create notifications).
- **Logins:** Supabase email + password; the role comes from `crm_profiles`.
- **Live sync:** realtime subscription on `crm_clients`, `crm_expenses`, `crm_notifs` + 30 s poll.
- Hosted with GitHub Pages from this `docs/` folder.

Owner menu (top right) → *Load demo clients* / *Delete all data*.
