# Little Kicks

A responsive baby movement tracker built with React, Supabase, and Cloudflare Pages. It runs in current browsers on iPhone/iPad, macOS, and Windows from one codebase.

## What is included

- Email/password authentication with Supabase Auth
- Persistent cookie-based browser sessions through `@supabase/ssr`
- A large, touch-friendly movement counter and live timer
- Automatic stop at 10 movements, followed by a review step
- Count correction and optional notes before saving
- Resume protection for an in-progress session after an accidental refresh
- Dashboard statistics, pace trends, weekly activity, time-of-day distribution, and session history
- A private pregnancy profile with due-date-derived gestational age, baby name, and doctor contact details
- Owner-only Row Level Security policies so each account can access only its own records
- A sample-data mode when Supabase variables are not present
- Responsive layouts and safe-area handling for iOS

## 1. Create the Supabase backend

1. Create a Supabase project.
2. Open **SQL Editor** and run the SQL files in [`supabase/migrations`](supabase/migrations) in filename order.
3. In **Authentication → Providers**, enable Email.
4. In **Authentication → URL Configuration**, set the Site URL to the final Cloudflare Pages URL. Add `http://localhost:5173` as a redirect URL for local development.
5. In the project's **Connect** dialog, copy the Project URL and publishable key.

## 2. Configure locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

Fill in `.env.local`:

```dotenv
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

The publishable key is safe to expose in a frontend. Do not put a Supabase secret or service-role key in any `VITE_` variable. Database access is protected by the included Row Level Security policies.

## 3. Deploy to Cloudflare Pages

Connect this repository to Cloudflare Pages and use:

- **Framework preset:** Vite
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Node.js version:** 20 or newer

Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` under the Pages project's environment variables for both Preview and Production. After the first deploy, add the generated `*.pages.dev` URL to Supabase Auth's Site URL and allowed redirect URLs.

The included `public/_redirects` file makes client-side navigation work on direct visits.

## Scripts

```bash
npm run dev        # local development
npm run typecheck  # TypeScript validation
npm run build      # production build to dist/
npm run preview    # preview the production build
```

## Important note

Little Kicks is a personal record, not a diagnostic or medical device. If a movement pattern causes concern, contact the maternity care team.
