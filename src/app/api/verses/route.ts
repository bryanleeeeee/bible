import { NextRequest, NextResponse } from "next/server";
import { getChapterVerses, getChapterVersesFromDb, getVerse, getVerseFromDb, getBook, translations, providerFor, refToDisplay } from "@/lib/bible";
import { wordsFor, versesUsing } from "@/lib/strongs";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const ref = p.get("ref");
  const t = p.get("t") ?? "kjv";

  if (ref) {
    const verse = getVerse(ref) ?? (await getVerseFromDb(ref));
    if (!verse) return NextResponse.json({ error: "Verse not found" }, { status: 404 });
    let text: string | null = verse.text[t] ?? null;
    if (!text) {
      const provider = providerFor(t);
      text = provider ? await provider.getVerseText(ref, t) : null;
    }
    const words = wordsFor(ref).map((w) => ({
      ...w,
      alsoUsedIn: versesUsing(w.strongs).filter((r) => r !== ref).map((r) => ({ ref: r, displayRef: refToDisplay(r) })),
    }));
    return NextResponse.json({ verse, displayRef: refToDisplay(ref), text, translation: t, words, book: getBook(verse.book) });
  }

  const book = p.get("book");
  const chapter = Number(p.get("chapter"));
  if (book && chapter) {
    const verses = (await getChapterVersesFromDb(book, chapter)) ?? getChapterVerses(book, chapter);
    return NextResponse.json({ book: getBook(book), verses, translations });
  }
  return NextResponse.json({ translations });
}
