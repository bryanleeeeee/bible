import strongsData from "@/data/strongs.json";
import type { StrongsEntry } from "@/lib/types";

const data = strongsData as unknown as {
  entries: StrongsEntry[];
  verseWords: Record<string, { surface: string; strongs: string }[]>;
};

const byId = new Map(data.entries.map((e) => [e.id, e]));

export function getStrongs(id: string): StrongsEntry | undefined {
  return byId.get(id);
}

export function wordsFor(ref: string) {
  return (data.verseWords[ref] ?? []).map((w) => ({ ...w, entry: byId.get(w.strongs)! }));
}

/** Other verses using the same original-language word. */
export function versesUsing(strongsId: string): string[] {
  return Object.entries(data.verseWords)
    .filter(([, ws]) => ws.some((w) => w.strongs === strongsId))
    .map(([ref]) => ref);
}
