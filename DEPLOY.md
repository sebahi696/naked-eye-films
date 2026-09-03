# Naked Eye Films PWA — Deployment Guide

## Step 1: Create Supabase project (5 min)

1. Go to https://supabase.com → New project → name it `naked-eye-films`
2. Copy these from Project Settings → API:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
3. Go to SQL Editor → paste the entire contents of `supabase/migrations/001_initial_schema.sql` → Run
4. Enable Phone auth: Authentication → Providers → Phone → Enable (uses Twilio or Vonage — free for testing)

## Step 2: WhatsApp Cloud API (10 min)

1. Go to https://developers.facebook.com → Create App → Business → WhatsApp
2. Under WhatsApp → Getting Started:
   - Copy the **Temporary access token** → `WHATSAPP_TOKEN`
   - Copy the **Phone number ID** → `WHATSAPP_PHONE_NUMBER_ID`
3. Add Hussein's number as a test recipient in the sandbox
4. His number format: country code + number, no `+` (e.g. `9647801234567`)

## Step 3: Deploy to Vercel (3 min)

```bash
npm install -g vercel
cd C:\Users\toshi\.cursor\NakedEyefilmsApp
vercel
```

Or push to GitHub and import at https://vercel.com/new

Set these environment variables in Vercel → Project → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
HUSSEIN_WA_NUMBER=
```

After deploying, copy the Vercel URL (e.g. `https://naked-eye-films.vercel.app`).

## Step 4: Deploy Edge Function cron

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set APP_URL=https://your-app.vercel.app
supabase secrets set HUSSEIN_WA_NUMBER=9647xxxxxxxx
supabase functions deploy reminders --schedule "0 * * * *"
```

## Step 5: Install on phones

### iPhone (Safari required)
1. Open `https://your-app.vercel.app` in **Safari**
2. Tap the Share button → **Add to Home Screen**
3. Tap **Add** — done. App icon appears on home screen.

### Android (Chrome)
1. Open the URL in **Chrome**
2. Tap the menu (⋮) → **Install app** or **Add to Home Screen**

## Step 6: First-time setup for the team

Each team member opens the app:
1. Enter their phone number → receive OTP → verify
2. `/setup` page → enter name → choose role
   - Hussein → Owner
   - Editor/designer → Editor
   - Booking person → Admin

## Adding users
No invite system in v1. Each person logs in with their phone number and sets their own role on first login.

## Local development

```bash
cp .env.local.example .env.local
# fill in your Supabase + WhatsApp values
npm run dev
# opens at http://localhost:3000
```

## PWA icons

Generate 192×192 and 512×512 PNG icons and save them as:
- `public/icon-192.png`
- `public/icon-512.png`

Use any image (e.g. the Naked Eye Films logo). Until then the app works without icons.
