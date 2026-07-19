/** Local provider: bundled public-domain sample + (when configured) Postgres. */
import bible from "@/data/bible.json";
import { getDb } from "@/lib/db";
import type { BibleTextProvider } from "./provider";
import type { BookMeta, TranslationMeta, VerseRecord } from "@/lib/types";

const data = bible as unknown as {
  translations: TranslationMeta[];
  books: BookMeta[];
  verses: VerseRecord[];
};

export const translations: TranslationMeta[] = data.translations;
export const books: BookMeta[] = data.books;
export const verses: VerseRecord[] = data.verses;

const byRef = new Map(verses.map((v) => [v.ref, v]));
const bookBySlug = new Map(books.map((b) => [b.slug, b]));

export function getVerse(ref: string): VerseRecord | undefined {
  return byRef.get(ref);
}

export function getBook(slug: string): BookMeta | undefined {
  return bookBySlug.get(slug);
}

export function getChapterVerses(book: string, chapter: number): VerseRecord[] {
  return verses
    .filter((v) => v.book === book && v.chapter === chapter)
    .sort((a, b) => a.verse - b.verse);
}

/**
 * Full chapter text from Postgres, when DATABASE_URL is configured and seeded.
 * Curated per-verse themes/people/places and any bundled translation text
 * (e.g. the WEB sample) are layered on top of the DB rows for matching refs,
 * since the DB only carries the full-text translations fetched by db:seed.
 */
export async function getVerseFromDb(ref: string): Promise<VerseRecord | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const rows = (await (
      db as unknown as { $queryRawUnsafe: (s: string, ...a: unknown[]) => Promise<unknown> }
    ).$queryRawUnsafe(
      `SELECT v.ref AS ref, v.number AS verse, c.number AS chapter, b.slug AS book,
              vt."translationId" AS "translationId", vt.text AS text
       FROM "Verse" v
       JOIN "Chapter" c ON c.id = v."chapterId"
       JOIN "Book" b ON b.id = c."bookId"
       JOIN "VerseText" vt ON vt."verseId" = v.id
       WHERE v.ref = $1`,
      ref
    )) as { ref: string; verse: number; chapter: number; book: string; translationId: string; text: string }[];
    if (rows.length === 0) return null;
    const rec: VerseRecord = {
      ref: rows[0].ref, book: rows[0].book, chapter: rows[0].chapter, verse: rows[0].verse,
      themes: [], people: [], places: [], text: {},
    };
    for (const row of rows) rec.text[row.translationId] = row.text;
    const curated = byRef.get(ref);
    return curated
      ? { ...rec, themes: curated.themes, people: curated.people, places: curated.places, text: { ...rec.text, ...curated.text } }
      : rec;
  } catch {
    return null;
  }
}

export async function getChapterVersesFromDb(book: string, chapter: number): Promise<VerseRecord[] | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const rows = (await (
      db as unknown as { $queryRawUnsafe: (s: string, ...a: unknown[]) => Promise<unknown> }
    ).$queryRawUnsafe(
      `SELECT v.ref AS ref, v.number AS verse, vt."translationId" AS "translationId", vt.text AS text
       FROM "Verse" v
       JOIN "Chapter" c ON c.id = v."chapterId"
       JOIN "Book" b ON b.id = c."bookId"
       JOIN "VerseText" vt ON vt."verseId" = v.id
       WHERE b.slug = $1 AND c.number = $2
       ORDER BY v.number ASC`,
      book,
      chapter
    )) as { ref: string; verse: number; translationId: string; text: string }[];
    if (rows.length === 0) return null;

    const byRefLocal = new Map<string, VerseRecord>();
    for (const row of rows) {
      let rec = byRefLocal.get(row.ref);
      if (!rec) {
        rec = { ref: row.ref, book, chapter, verse: row.verse, themes: [], people: [], places: [], text: {} };
        byRefLocal.set(row.ref, rec);
      }
      rec.text[row.translationId] = row.text;
    }
    return Array.from(byRefLocal.values())
      .map((rec) => {
        const curated = byRef.get(rec.ref);
        return curated
          ? { ...rec, themes: curated.themes, people: curated.people, places: curated.places, text: { ...rec.text, ...curated.text } }
          : rec;
      })
      .sort((a, b) => a.verse - b.verse);
  } catch {
    return null;
  }
}

export function refToDisplay(ref: string): string {
  const v = byRef.get(ref);
  if (!v) return ref;
  const b = bookBySlug.get(v.book);
  const name = b ? (b.name === "Psalms" ? "Psalm" : b.name) : v.book;
  return `${name} ${v.chapter}:${v.verse}`;
}

export const localProvider: BibleTextProvider = {
  id: "local",
  supports: (t) => translations.some((x) => x.id === t && x.provider === "local"),
  async getVerseText(ref, t) {
    return byRef.get(ref)?.text[t] ?? null;
  },
  async getChapter(book, chapter, t) {
    const out: Record<string, string> = {};
    for (const v of getChapterVerses(book, chapter)) {
      if (v.text[t]) out[v.ref] = v.text[t];
    }
    return out;
  },
};
