import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import crossrefsData from "@/data/crossrefs.json";
import { Reader } from "@/components/reader";
import type { WordInfo } from "@/components/strongs-word";
import { books, getBook, getChapterVerses, refToDisplay, translations, verses as allVerses } from "@/lib/bible";
import { versesUsing, wordsFor } from "@/lib/strongs";
import type { CrossRef } from "@/lib/types";

const crossrefs = crossrefsData as unknown as CrossRef[];

export function generateStaticParams() {
  // Prerender only chapters that have bundled verses; others render on demand.
  const seen = new Set<string>();
  const params: { book: string; chapter: string }[] = [];
  for (const v of allVerses) {
    const key = `${v.book}/${v.chapter}`;
    if (!seen.has(key)) {
      seen.add(key);
      params.push({ book: v.book, chapter: String(v.chapter) });
    }
  }
  return params;
}

export function generateMetadata({ params }: { params: { book: string; chapter: string } }) {
  const b = getBook(params.book);
  return { title: b ? `${b.name} ${params.chapter} · Lumen` : "Lumen" };
}

function availableChapters(): { book: string; chapter: number; label: string }[] {
  const seen = new Set<string>();
  const list: { book: string; chapter: number; label: string }[] = [];
  for (const v of allVerses) {
    const key = `${v.book}/${v.chapter}`;
    if (!seen.has(key)) {
      seen.add(key);
      const b = getBook(v.book);
      const name = b?.name === "Psalms" ? "Psalm" : b?.name ?? v.book;
      list.push({ book: v.book, chapter: v.chapter, label: `${name} ${v.chapter}` });
    }
  }
  const order = new Map(books.map((b) => [b.slug, b.order]));
  return list.sort((a, z) => (order.get(a.book)! - order.get(z.book)!) || (a.chapter - z.chapter));
}

export default function ReadPage({ params }: { params: { book: string; chapter: string } }) {
  const book = getBook(params.book);
  const chapter = Number(params.chapter);
  if (!book || !Number.isInteger(chapter) || chapter < 1) notFound();

  const verses = getChapterVerses(book.slug, chapter);

  if (verses.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 pt-16 text-center">
        <h1 className="font-scripture text-3xl">{book.name} {chapter}</h1>
        <p className="mx-auto mt-3 max-w-md text-muted">
          This chapter isn&apos;t in the bundled sample library. Connect a database and run{" "}
          <code className="rounded bg-surface px-1.5 py-0.5 text-sm">npm run db:seed</code> to load the
          complete public-domain text.
        </p>
      </div>
    );
  }

  const words: Record<string, WordInfo[]> = {};
  const crossRefsByVerse: Record<string, { ref: string; displayRef: string; kind: string; note: string }[]> = {};
  for (const v of verses) {
    const ws = wordsFor(v.ref);
    if (ws.length) {
      words[v.ref] = ws.map((w) => ({
        surface: w.surface,
        strongs: w.strongs,
        entry: w.entry,
        alsoUsedIn: versesUsing(w.strongs)
          .filter((r) => r !== v.ref)
          .slice(0, 3)
          .map((r) => ({ ref: r, displayRef: refToDisplay(r) })),
      }));
    }
    const crs = crossrefs
      .filter((c) => c.from === v.ref || c.to === v.ref)
      .map((c) => {
        const other = c.from === v.ref ? c.to : c.from;
        return { ref: other, displayRef: refToDisplay(other), kind: c.kind, note: c.note };
      });
    if (crs.length) crossRefsByVerse[v.ref] = crs;
  }

  const chapters = availableChapters();
  const idx = chapters.findIndex((c) => c.book === book.slug && c.chapter === chapter);
  const prev = idx > 0 ? chapters[idx - 1] : null;
  const next = idx >= 0 && idx < chapters.length - 1 ? chapters[idx + 1] : null;

  return (
    <>
      <Suspense>
        <Reader
          book={book}
          chapter={chapter}
          verses={verses}
          translations={translations}
          words={words}
          crossRefs={crossRefsByVerse}
        />
      </Suspense>
      <nav aria-label="Chapter navigation" className="mx-auto -mt-8 mb-14 flex max-w-3xl items-center justify-between px-6 text-sm">
        {prev ? (
          <Link href={`/read/${prev.book}/${prev.chapter}`} className="text-lapis hover:underline">← {prev.label}</Link>
        ) : <span />}
        <Link href="/read" className="text-muted hover:text-ink">Library</Link>
        {next ? (
          <Link href={`/read/${next.book}/${next.chapter}`} className="text-lapis hover:underline">{next.label} →</Link>
        ) : <span />}
      </nav>
    </>
  );
}
