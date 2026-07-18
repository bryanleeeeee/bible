/** Local provider: bundled public-domain sample + (when configured) Postgres. */
import bible from "@/data/bible.json";
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
