import dailyData from "@/data/daily.json";
import { getVerse, refToDisplay, getBook } from "@/lib/bible/local";
import type { DailyEntry } from "@/lib/types";

const entries = dailyData as DailyEntry[];

/** Deterministic verse of the day (UTC date-seeded), stable across requests. */
export function getDaily(date = new Date()) {
  const dayNumber = Math.floor(date.getTime() / 86_400_000);
  const entry = entries[dayNumber % entries.length];
  const verse = getVerse(entry.ref)!;
  const book = getBook(verse.book)!;
  return {
    ...entry,
    displayRef: refToDisplay(entry.ref),
    verse,
    book,
  };
}
