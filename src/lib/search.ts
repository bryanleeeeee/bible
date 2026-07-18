/**
 * Hybrid search engine.
 *
 * Pipeline: query -> intent detection -> (entity | topic | keyword) scorers
 * -> merged, deduplicated, confidence-ranked results with cross-references.
 *
 * When DATABASE_URL + pgvector + an embeddings key are configured, a semantic
 * pass (see embeddings.ts) re-ranks results; the bundled topic map provides a
 * dependency-free semantic fallback so search works out of the box.
 */
import topicsData from "@/data/topics.json";
import crossrefsData from "@/data/crossrefs.json";
import { verses, books, refToDisplay } from "@/lib/bible/local";
import type { CrossRef, SearchResult, VerseRecord } from "@/lib/types";

const topics = (topicsData as any).topics as {
  id: string; label: string; triggers: string[]; refs: string[]; explanation: string;
}[];
export const suggestions: string[] = (topicsData as any).suggestions;
const crossrefs = crossrefsData as CrossRef[];

const STOP = new Set(["the","a","an","of","in","on","to","and","or","is","are","was","were","what","where","when","who","how","does","do","did","say","says","about","bible","verse","verses","show","me","all","for","that","with","which","i","feel","am","my"]);

function tokenize(q: string): string[] {
  return q.toLowerCase().replace(/[^a-z0-9\s'-]/g, " ").split(/\s+/).filter((t) => t && !STOP.has(t));
}

function stem(t: string): string {
  return t.replace(/(ing|ed|es|s)$/,"");
}

const PEOPLE = new Set(verses.flatMap((v) => v.people));
const THEMES = new Set(verses.flatMap((v) => v.themes));

function crossRefsFor(ref: string) {
  return crossrefs
    .filter((c) => c.from === ref || c.to === ref)
    .slice(0, 4)
    .map((c) => {
      const other = c.from === ref ? c.to : c.from;
      return { ref: other, displayRef: refToDisplay(other), kind: c.kind, note: c.note };
    });
}

function toResult(v: VerseRecord, translation: string, score: number, matched: string[], matchType: SearchResult["matchType"], contextSummary?: string): SearchResult {
  const text = v.text[translation] ?? v.text["kjv"];
  return {
    verse: v,
    displayRef: refToDisplay(v.ref),
    translation: v.text[translation] ? translation : "kjv",
    text,
    score: Math.min(1, Math.round(score * 100) / 100),
    matchedTerms: matched,
    matchType,
    contextSummary,
    crossRefs: crossRefsFor(v.ref),
  };
}

export function search(query: string, translation = "kjv", limit = 20): { results: SearchResult[]; interpretedAs: string } {
  const q = query.trim();
  const tokens = tokenize(q);
  const stems = tokens.map(stem);
  const merged = new Map<string, SearchResult>();
  let interpretedAs = "keyword search";

  // 1) Topic / intent pass ("I feel anxious", "verses about hope")
  const hitTopics = topics.filter((t) => t.triggers.some((tr) => stems.includes(stem(tr)) || q.toLowerCase().includes(tr)));
  for (const t of hitTopics) {
    interpretedAs = `topic: ${t.label}`;
    t.refs.forEach((ref, i) => {
      const v = verses.find((x) => x.ref === ref);
      if (!v) return;
      const r = toResult(v, translation, 0.95 - i * 0.04, t.triggers.filter((tr) => stems.includes(stem(tr))), "topic", t.explanation);
      const prev = merged.get(v.ref);
      if (!prev || prev.score < r.score) merged.set(v.ref, r);
    });
  }

  // 2) Entity pass (people, places, themes: "David", "Goliath")
  for (const tok of stems) {
    if (PEOPLE.has(tok) || THEMES.has(tok)) {
      if (hitTopics.length === 0) interpretedAs = `entity: ${tok}`;
      for (const v of verses) {
        if (v.people.includes(tok) || v.themes.includes(tok)) {
          const r = toResult(v, translation, 0.9, [tok], "entity", v.people.includes(tok) ? `Passage involving ${tok[0].toUpperCase()}${tok.slice(1)}` : `Tagged with theme “${tok}”`);
          const prev = merged.get(v.ref);
          if (!prev || prev.score < r.score) merged.set(v.ref, r);
        }
      }
    }
  }

  // 3) Keyword pass over verse text (phrase boost + per-term scoring)
  const phrase = q.toLowerCase();
  for (const v of verses) {
    const text = (v.text[translation] ?? v.text["kjv"]).toLowerCase();
    let hits = 0;
    const matched: string[] = [];
    for (let i = 0; i < stems.length; i++) {
      if (text.includes(stems[i]) || text.includes(tokens[i])) { hits++; matched.push(tokens[i]); }
    }
    if (hits === 0) continue;
    let score = 0.4 + 0.4 * (hits / Math.max(1, stems.length));
    if (stems.length > 1 && text.includes(phrase)) score = 0.98;
    const prev = merged.get(v.ref);
    if (!prev || prev.score < score) {
      merged.set(v.ref, toResult(v, translation, score, matched, "keyword"));
    } else if (prev) {
      prev.matchedTerms = Array.from(new Set([...prev.matchedTerms, ...matched]));
    }
  }

  const results = Array.from(merged.values()).sort((a, b) => b.score - a.score).slice(0, limit);
  return { results, interpretedAs };
}

export function autocomplete(prefix: string, limit = 8): string[] {
  const p = prefix.toLowerCase().trim();
  if (!p) return suggestions.slice(0, limit);
  const pool = [
    ...suggestions,
    ...topics.map((t) => t.label.toLowerCase()),
    ...books.map((b) => b.name),
    ...Array.from(PEOPLE).map((x) => x[0].toUpperCase() + x.slice(1)),
  ];
  return Array.from(new Set(pool.filter((s) => s.toLowerCase().includes(p)))).slice(0, limit);
}
