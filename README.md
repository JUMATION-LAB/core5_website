# CORE5 Biomedical Engineering

Public website, admin dashboard and Supabase backend for the CORE5 student team.

| Part | Language | Where |
| --- | --- | --- |
| Public website | TypeScript, HTML, CSS (Vite, no UI framework) | `index.html`, `src/site/` |
| Admin dashboard (`/admin/`) | TypeScript, HTML, CSS | `admin/index.html`, `src/admin/` |
| Database, security rules, storage | SQL (PostgreSQL) | `supabase/migrations/` |
| Only runtime dependency | `@supabase/supabase-js` | `package.json` |

## 1. Set up Supabase (about 10 minutes)

1. **Database.** In your Supabase project open **SQL Editor**, paste all of `supabase/setup_all.sql` and press **Run**. It creates the tables, security rules, two storage buckets and starter content. (With the Supabase CLI you can run `supabase db push` instead, using the files in `supabase/migrations/`.)
2. **Lock down sign-ups.** Go to **Authentication > Sign In / Providers** and turn **off** "Allow new users to sign up". Only people you create yourself can then sign in.
3. **Create admin accounts.** Go to **Authentication > Users > Add user**, enter an email and a strong password, and tick auto-confirm. Do this for each team member who should edit content.
4. **Grant admin rights.** Being signed in is not enough. In the SQL Editor run:
   ```sql
   insert into public.team_admins (user_id)
   select id from auth.users where email in ('first@example.org', 'second@example.org');
   ```
5. **Redirect URLs.** Under **Authentication > URL Configuration** add your site URL and `https://YOUR-DOMAIN/admin/` (and `http://localhost:5173/admin/` for local work). This makes "Forgot password" links work.

## 2. Run the project

```bash
npm install
npm run dev        # site at http://localhost:5173  admin at http://localhost:5173/admin/
npm run build      # type-checks, then builds to dist/
```

`.env` already holds your project URL and publishable key. To use another project, copy `.env.example` to `.env`.

## 3. Deploy

Any static host works (Netlify, Vercel, Cloudflare Pages, GitHub Pages). Build command `npm run build`, output folder `dist`. Add the two `VITE_` variables in the host's settings. The public site uses `#hash` routes, so no rewrite rules are needed.

## How content works

* **Site content** (homepage text, problem statement, selected need, innovation, contact details) is stored as JSON documents in `site_settings` and edited from the dashboard menu under *Site content*.
* **Project data** (needs, stages, research, team, gallery, lessons, evidence, gaps) lives in its own table, edited under *Project data*.
* **Needs:** paste your real list as CSV under *Healthcare needs > Bulk import*, then use *Remove all sample needs*. Tick **Shortlisted** on the ten finalists.
* **Selected need:** stays hidden until you tick **Confirmed**.
* **Stages:** statuses are never set automatically. Update them as real progress is made.
* **Files:** images go to the `public-media` bucket (5 MB, JPG/PNG/WebP/AVIF), PDFs to `research-docs` (20 MB).
* **Contact form:** messages land in *Contact messages* in the dashboard. Nothing is emailed automatically (see below).

No sample data is presented as fact: sample needs are flagged "Sample data", and empty fields show a visible placeholder.

## Security model

* The **publishable key** is meant to be in browser code. What it can do is decided by Row Level Security in `002_security.sql`.
* The public can **read** content and **insert** contact messages (validated, max 3 per email and 60 overall per hour). They cannot read messages or change anything else.
* Only users listed in `team_admins` can write content, upload files or read messages. Admin status is checked by the database, not by the front end.
* **Never** put a `secret` key or `service_role` key in this project or in any `VITE_` variable. If one has ever been pasted into a chat, repo or ticket, rotate it in Project Settings > API Keys.
* Recommended: enable multi-factor authentication for admin accounts and keep sign-ups disabled.
* All database text is HTML-escaped before display, and links must start with `http(s)://`.

## Not included (needs extra setup)

* **Email notification** of new messages: add a Database Webhook or Edge Function that calls an email service (for example Resend).
* **Strong spam protection** beyond the honeypot field and rate limit: add Cloudflare Turnstile verified in an Edge Function.
* **Photographs:** the hero shows an abstract illustration until you upload a real photo under *Homepage*. No stock or invented images are used.

## Verification done

The SQL was run on PostgreSQL 16 with stand-ins for Supabase's `auth` and `storage` schemas, and the access rules were tested as anonymous, signed-in non-admin and admin users. The site and dashboard were exercised in a simulated browser (jsdom) against a stubbed API, and the project type-checks and builds. It has **not** been run against the live Supabase project or checked visually in a real browser, so test the first sign-in, an image upload and a contact message after setup.
