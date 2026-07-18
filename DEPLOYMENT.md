# Deploying Lumen

Step-by-step from a local folder to a live URL on Vercel + Supabase, pinned to Singapore. Total time: about 30 minutes, most of it waiting for the seed.

Everything past Part 2 is optional — the app is live and fully functional after Part 2 using the bundled library.

---

## Part 1 — Push to GitHub

1. Create an empty repository on GitHub (private is fine), e.g. `lumen`.
2. From the project folder:

```bash
git init
git add .
git commit -m "Lumen — initial"
git branch -M main
git remote add origin git@github.com:<you>/lumen.git
git push -u origin main
```

`.gitignore` already excludes `node_modules`, `.next`, and `.env`.

## Part 2 — Deploy on Vercel (zero-config)

1. Go to vercel.com → **Add New… → Project** → import the `lumen` repo.
2. Framework preset auto-detects **Next.js**. Leave build settings alone — `vercel.json` already sets the build command (`prisma generate && next build`) and pins the serverless region to `sin1` (Singapore).
3. Add no environment variables yet.
4. Click **Deploy**.

You now have a working deployment at `https://lumen-<hash>.vercel.app` — search, reader, graph, timeline, and the locally-grounded assistant all run off the bundled public-domain library.

## Part 3 — Supabase database (full Bible text)

1. Go to supabase.com → **New project**. Choose the **Southeast Asia (Singapore)** region to sit next to `sin1`.
2. Once provisioned, open **SQL Editor** and run:

```sql
create extension if not exists vector;
```

3. Get the connection string: **Project Settings → Database → Connection string → URI**. Use the **pooled** connection (port 6543) for the app and note the **direct** one (port 5432) for migrations. It looks like:

```
postgresql://postgres.<ref>:<password>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

4. Locally, create `.env` from `.env.example` and set `DATABASE_URL` to the **direct** (5432) string, then:

```bash
npx prisma db push        # creates all tables
npm run db:seed           # fetches complete KJV + WEB and loads everything (~10–15 min)
```

5. In Vercel: **Project → Settings → Environment Variables** → add `DATABASE_URL` set to the **pooled** (6543) string, for Production. Redeploy (**Deployments → ⋯ → Redeploy**).

## Part 4 — AI assistant (Anthropic)

1. Create a key at console.anthropic.com → **API Keys**.
2. Add `ANTHROPIC_API_KEY` in Vercel env vars → redeploy.

The assistant switches from the local grounded composer to Claude automatically. No code change.

## Part 5 — Semantic search (OpenAI embeddings + pgvector)

1. Create a key at platform.openai.com.
2. Locally, add to `.env`:

```
OPENAI_API_KEY=sk-…
EMBEDDINGS_PROVIDER=openai
```

3. Run the one-time batch (idempotent, resumable — safe to re-run):

```bash
npm run db:embed          # ~31k verses; costs roughly US$0.05–0.10 at text-embedding-3-small rates
```

4. Add both variables in Vercel env vars → redeploy. Natural-language queries now merge pgvector nearest-neighbour results beneath the keyword/topic engine.

## Part 6 — Licensed translations (NIV / NLT / NKJV / MSG)

These require your own license agreements; text is fetched at runtime and never stored.

**API.Bible (NIV, NLT):**
1. Register at scripture.api.bible, request access to the translations you're licensed for.
2. Note the `bibleId` for each translation in their console.
3. Add in Vercel: `APIBIBLE_KEY`, `APIBIBLE_NIV_ID`, `APIBIBLE_NLT_ID`.

**Biblia (NKJV, MSG):**
1. Register at bibliaapi.com and create a key.
2. Add in Vercel: `BIBLIA_KEY`.

Redeploy — the translation switcher lights up the configured translations.

## Part 7 — Sign-in (Google OAuth)

1. In Google Cloud Console → **APIs & Services → Credentials → Create OAuth client ID** (Web application).
2. Authorized redirect URI: `https://<your-domain>/api/auth/callback/google`.
3. Add in Vercel:

```
GOOGLE_CLIENT_ID=…
GOOGLE_CLIENT_SECRET=…
NEXTAUTH_URL=https://<your-domain>
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
```

## Part 8 — Custom domain

1. Vercel → **Project → Settings → Domains** → add e.g. `lumen.bryan.sg`.
2. At your DNS provider, add the CNAME Vercel shows (`cname.vercel-dns.com`).
3. TLS is provisioned automatically. Update `NEXTAUTH_URL` if you set up sign-in.

## Verifying a deployment

- `/` — daily verse renders with the drop cap.
- `/search?q=anxiety` — topic-interpreted results in a few ms.
- `/read/psalms/23` — switch to **Original** mode, hover *shepherd*.
- `/graph` — drag David, click Goliath.
- `/timeline` — creation through the early church.
- `/assistant` — ask "What does the Bible say about anxiety?"; the reply cites Philippians 4:6 and labels its sections.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Build fails on `prisma generate` | Ensure `DATABASE_URL` isn't malformed; generate doesn't need a reachable DB, only a valid schema. |
| `db:seed` times out | Re-run it — every step is an upsert, so it resumes where it stopped. Use the direct (5432) connection, not the pooler. |
| Licensed translations show as unavailable | Check the provider key and (for API.Bible) that the `bibleId` env vars match translations your key is actually granted. |
| Assistant answers but never uses Claude | `ANTHROPIC_API_KEY` must be set in the same Vercel environment (Production vs Preview) you're testing. |
| Semantic results never appear | Confirm the `Embedding` table has rows (`select count(*) from "Embedding"`) and both OpenAI vars are set in Vercel. |
