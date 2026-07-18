import { NextRequest, NextResponse } from "next/server";
import { search, autocomplete } from "@/lib/search";
import { getEmbeddingsProvider } from "@/lib/embeddings";
import { getDb } from "@/lib/db";
import { getVerse, refToDisplay } from "@/lib/bible";
import type { SearchResult } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Optional semantic pass: when pgvector + an embeddings key are configured,
 * nearest-neighbour verses are merged beneath the local engine's results.
 * Zero-config deployments skip this transparently.
 */
async function semanticResults(q: string, translation: string, exclude: Set<string>): Promise<SearchResult[]> {
  const provider = getEmbeddingsProvider();
  const db = await getDb();
  if (!provider || !db) return [];
  try {
    const [vector] = await provider.embed([q]);
    const vec = `[${vector.join(",")}]`;
    const rows = (await (db as unknown as { $queryRawUnsafe: (s: string, ...a: unknown[]) => Promise<unknown> }).$queryRawUnsafe(
      `SELECT v.ref, vt.text, 1 - (e.vector <=> $1::vector) AS similarity
       FROM "Embedding" e
       JOIN "Verse" v ON v.id = e."verseId"
       JOIN "VerseText" vt ON vt."verseId" = v.id AND vt."translationId" = $2
       ORDER BY e.vector <=> $1::vector
       LIMIT 10`,
      vec,
      translation
    )) as { ref: string; text: string; similarity: number }[];
    return rows
      .filter((r) => !exclude.has(r.ref) && r.similarity > 0.3)
      .map((r) => {
        const local = getVerse(r.ref);
        return {
          verse: local ?? {
            ref: r.ref,
            book: r.ref.split("-").slice(0, -2).join("-"),
            chapter: Number(r.ref.split("-").at(-2)),
            verse: Number(r.ref.split("-").at(-1)),
            themes: [], people: [], places: [], text: { [translation]: r.text },
          },
          displayRef: refToDisplay(r.ref),
          translation,
          text: r.text,
          score: Math.min(0.9, r.similarity),
          matchType: "semantic" as const,
          matchedTerms: [],
          crossRefs: [],
        };
      });
  } catch {
    return []; // embeddings table absent or db unreachable — degrade silently
  }
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const mode = req.nextUrl.searchParams.get("mode") ?? "search";
  const translation = req.nextUrl.searchParams.get("t") ?? "kjv";
  if (mode === "suggest") {
    return NextResponse.json({ suggestions: autocomplete(q) });
  }
  const started = performance.now();
  const { results, interpretedAs } = search(q, translation);
  const semantic = await semanticResults(q, translation, new Set(results.map((r) => r.verse.ref)));
  return NextResponse.json({
    query: q,
    interpretedAs,
    tookMs: Math.round(performance.now() - started),
    results: [...results, ...semantic].slice(0, 20),
  });
}
