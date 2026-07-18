# Lumen — Bible Study

A modern, connected Bible study app: hybrid search that understands phrases, themes, and natural-language questions; multi-translation reading with side-by-side comparison; Hebrew/Greek word study; an interactive knowledge graph; and a Scripture-grounded study assistant that cites everything it says.

Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, Prisma, and NextAuth.

---

## Quick start — zero configuration

The app runs fully featured with no database, no API keys, and no environment variables. A curated public-domain library (KJV, plus a WEB sample), Strong's entries, cross-references, and the knowledge graph are bundled as JSON.

```bash
npm install
npm run dev
```

Open http://localhost:3000. Search, reading modes, word study, the graph, and the assistant all work out of the box.

## Full setup (optional, additive)

Each capability below is independently optional. The app detects what is configured and upgrades itself.

### 1. Database — full Bible text

Provision Postgres (Supabase recommended) and enable pgvector:

```sql
create extension if not exists vector;
```

Then:

```bash
cp .env.example .env          # set DATABASE_URL
npx prisma db push
npm run db:seed               # fetches complete KJV + WEB (public domain) and loads everything
```

The seed pulls from [scrollmapper/bible_databases](https://github.com/scrollmapper/bible_databases) — public-domain text, no license required.

### 2. AI assistant — Anthropic

Set `ANTHROPIC_API_KEY` to power the study assistant with Claude. Without it, the assistant falls back to a deterministic, retrieval-grounded composer that answers from the bundled library — still cited, still labeled, just less fluent.

Either way, answers are grounded in retrieved verses and always separate **Biblical text**, **Original language**, **Historical context / Traditional interpretation**, and **AI explanation**.

### 3. Semantic search — embeddings

Set `OPENAI_API_KEY` (and `DATABASE_URL` with pgvector) to enable true semantic search over verse embeddings. Without it, natural-language queries are handled by a curated intent map covering common topics (anxiety, forgiveness, hope, guidance, …) — fast and surprisingly effective.

### 4. Licensed translations — NIV, NLT, NKJV, MSG

Modern translations are **not** public domain and cannot be bundled. Lumen ships a provider abstraction (`src/lib/bible/provider.ts`) with ready stubs:

| Translation | Provider | Env var |
|---|---|---|
| NIV, NLT | [API.Bible](https://scripture.api.bible) | `APIBIBLE_KEY` |
| NKJV, MSG | [Biblia](https://bibliaapi.com) | `BIBLIA_KEY` |

With a key set, those translations light up in the translation switcher and parallel view; without one they show as unavailable with a tooltip explaining why. KJV and WEB (public domain) are always available.

### 5. Sign-in — Google OAuth

Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`. Until then, bookmarks, recent searches, and reading history persist per-device in localStorage — no account needed.

## Deploying

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full step-by-step: GitHub → Vercel (`sin1`) → Supabase (Singapore) → seed → optional AI, embeddings, licensed translations, OAuth, and custom domain.

## Architecture

```
src/
  data/            Bundled public-domain library (verses, Strong's, cross-refs, graph, topics, daily)
  lib/
    bible/         Provider abstraction: local (bundled/DB) + licensed API stubs
    search.ts      Hybrid engine: phrase → entity → keyword → topic-intent, confidence-ranked
    assistant.ts   Retrieval-grounded answers (Anthropic or local fallback), provenance-labeled
    embeddings.ts  Optional OpenAI embeddings for pgvector semantic search
    graph.ts       Knowledge-graph subgraph queries (BFS by depth)
    db.ts          Lazy optional Prisma client — null when DATABASE_URL is unset
  app/
    api/           search, verses, graph, daily, assistant, auth — all force-dynamic
    read/[book]/[chapter]   Reader: read / study / original / parallel / focus modes
    search, graph, assistant, page.tsx (home)
  components/      Reader, knowledge graph (d3-force SVG), assistant chat, cards, UI kit
prisma/
  schema.prisma    Full model: text, Strong's, entities, graph, users, notes, streaks (pgvector)
  seed.ts          Fetch + load complete public-domain texts and curated data
```

Design system: "illuminated dawn" — deep navy ink, gilt gold accents, lapis links, a scripture serif for biblical text, drop-cap daily verse, and full light/dark themes. All colors are CSS variables in `globals.css`.

## What's implemented vs. the spec

**Implemented:** hybrid search (phrase/keyword/entity/topic-intent with confidence scores, interpreted-as, sub-200 ms on bundled data), autocomplete, cross-references, daily encouragement (meaning/application/prayer/reflection/read time), continue-learning, five reading modes including parallel comparison and original-language word study with hover/tap Strong's popovers, interactive zoom/pan/drag knowledge graph with a detail side panel, a chronological timeline from creation to the early church, a library browse page with previous/next chapter navigation, grounded assistant with provenance labels and citations, bookmarks and history (localStorage), light/dark themes, an installable PWA with a service worker (visited chapters and read-only APIs work offline), accessibility (keyboard combobox, ARIA roles, reduced-motion), provider abstraction for licensed translations, full Prisma schema, and the seed pipeline.

**Stubbed or roadmap:**

- **Licensed translation fetchers** — the OSIS book map and verse/chapter endpoints for API.Bible and Biblia are implemented; they activate with real keys but are untested against live quotas until you add your licensed credentials.
- **Semantic embeddings** — fully wired: run `npm run db:embed` once (see DEPLOYMENT.md Part 5) and the search API merges pgvector results automatically.
- **Maps** — the data model (`Place`) supports them; UI not yet built. (Timelines are done — see `/timeline`.)
- **Server-persisted notes, highlights, collections, streaks** — schema is complete; API routes and UI to be added once auth is configured.
- **Redis caching** — worthwhile once the licensed APIs are live (cache normalized verse text per translation).

## Licensing notes

- KJV and WEB are public domain and bundled/seeded freely.
- NIV, NLT, NKJV, and MSG are copyrighted; they must be served at runtime from a licensed API under your own agreement and are never stored or redistributed by this app.
- Curated study notes, topic maps, graph summaries, and daily reflections in `src/data/` are original to this project.
