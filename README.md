# SpendSense — Track Smart. Spend Better. Save More.

Status: backend + React app with auth, demo mode, dashboard, AI smart entry, expenses, budgets, goals, insights, analytics (CSV/print PDF), notifications and settings. Not built: light theme, income entry, subscriptions/calendar extras, set-new-password page.

Local run: `npm install`, copy `.env.example` to `.env`, then `npm run dev`. Without `.env`, only demo mode works.

## Setup
1. Create a project at supabase.com (free tier is fine for a hackathon).
2. Authentication → Providers: enable Email; keep "Confirm email" on. Add your GitHub Pages URL under URL Configuration.
3. SQL Editor → run `supabase/migrations/001_init.sql` (creates tables, indexes, RLS, signup trigger).
4. Set AI secrets (server-side only):
   `supabase secrets set AI_PROVIDER=anthropic AI_API_KEY=... AI_MODEL=...`
   For any OpenAI-compatible provider use `AI_PROVIDER=openai` and optionally `AI_BASE_URL`.
5. Deploy: `supabase functions deploy categorize-expense` and `supabase functions deploy delete-account`
6. GitHub repo → Settings → Secrets → add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
7. Settings → Pages → Source: GitHub Actions. Push to `main`.
8. Open the deployed URL and test signup, then an AI entry like "₹80 bus fare".

## Costs
Supabase free tier has project, storage and Edge Function invocation limits. AI calls are billed by your provider; if the call fails, the function falls back to keyword categorisation and reports `source: "fallback"`.
