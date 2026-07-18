/**
 * Licensed-content providers. Text is never bundled; it is fetched on demand
 * from APIs the deployer has agreements with, then cached (Redis) per license
 * terms. Add a provider by implementing BibleTextProvider and registering it.
 */
import type { BibleTextProvider } from "./provider";

/** scripture.api.bible — serves NIV, NLT and others under license. */
export function createApiBibleProvider(apiKey: string): BibleTextProvider {
  const BASE = "https://api.scripture.api.bible/v1";
  const BIBLE_IDS: Record<string, string> = {
    // Map translation ids to api.bible bibleIds granted to your key.
    niv: process.env.APIBIBLE_NIV_ID ?? "",
    nlt: process.env.APIBIBLE_NLT_ID ?? "",
  };
  return {
    id: "api.bible",
    supports: (t) => Boolean(BIBLE_IDS[t]),
    async getVerseText(ref, t) {
      const bibleId = BIBLE_IDS[t];
      if (!bibleId) return null;
      const res = await fetch(`${BASE}/bibles/${bibleId}/verses/${toApiBibleRef(ref)}?content-type=text`, {
        headers: { "api-key": apiKey },
        next: { revalidate: 60 * 60 * 24 },
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json?.data?.content?.trim() ?? null;
    },
    async getChapter(book, chapter, t) {
      const bibleId = BIBLE_IDS[t];
      const osisBook = OSIS[book];
      if (!bibleId || !osisBook) return {};
      const res = await fetch(
        `${BASE}/bibles/${bibleId}/chapters/${osisBook}.${chapter}?content-type=text&include-verse-numbers=false`,
        { headers: { "api-key": apiKey }, next: { revalidate: 60 * 60 * 24 } }
      );
      if (!res.ok) return {};
      const json = await res.json();
      // api.bible returns the chapter as one block; per-verse fetches use getVerseText.
      return typeof json?.data?.content === "string" ? { [`${book}-${chapter}`]: json.data.content.trim() } : {};
    },
  };
}

/** Biblia (Faithlife) — serves NKJV, MSG and others under license. */
export function createBibliaProvider(apiKey: string): BibleTextProvider {
  const BASE = "https://api.biblia.com/v1/bible/content";
  return {
    id: "biblia",
    supports: (t) => ["nkjv", "msg"].includes(t),
    async getVerseText(ref, t) {
      const res = await fetch(
        `${BASE}/${t.toUpperCase()}.txt?passage=${encodeURIComponent(toHumanRef(ref))}&key=${apiKey}`,
        { next: { revalidate: 60 * 60 * 24 } }
      );
      if (!res.ok) return null;
      const text = await res.text();
      return text.trim() || null;
    },
    async getChapter(book, chapter, t) {
      const human = `${humanBook(book)} ${chapter}`;
      const res = await fetch(
        `${BASE}/${t.toUpperCase()}.txt?passage=${encodeURIComponent(human)}&style=oneVersePerLine&key=${apiKey}`,
        { next: { revalidate: 60 * 60 * 24 } }
      );
      if (!res.ok) return {};
      const text = await res.text();
      const out: Record<string, string> = {};
      text.split("\n").forEach((line, i) => {
        const clean = line.replace(/^\s*\d+\s*/, "").trim();
        if (clean) out[`${book}-${chapter}-${i + 1}`] = clean;
      });
      return out;
    },
  };
}

function humanBook(slug: string) {
  return slug
    .split("-")
    .map((w) => (/^\d+$/.test(w) ? w : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

function toHumanRef(ref: string) {
  const parts = ref.split("-");
  const verse = parts.pop();
  const chapter = parts.pop();
  return `${humanBook(parts.join("-"))} ${chapter}:${verse}`;
}

/** Book-slug → OSIS id used by api.bible (e.g. JHN.3.16). */
const OSIS: Record<string, string> = {
  genesis: "GEN", exodus: "EXO", leviticus: "LEV", numbers: "NUM", deuteronomy: "DEU",
  joshua: "JOS", judges: "JDG", ruth: "RUT",
  "1-samuel": "1SA", "2-samuel": "2SA", "1-kings": "1KI", "2-kings": "2KI",
  "1-chronicles": "1CH", "2-chronicles": "2CH", ezra: "EZR", nehemiah: "NEH", esther: "EST",
  job: "JOB", psalms: "PSA", proverbs: "PRO", ecclesiastes: "ECC", "song-of-solomon": "SNG",
  isaiah: "ISA", jeremiah: "JER", lamentations: "LAM", ezekiel: "EZK", daniel: "DAN",
  hosea: "HOS", joel: "JOL", amos: "AMO", obadiah: "OBA", jonah: "JON", micah: "MIC",
  nahum: "NAM", habakkuk: "HAB", zephaniah: "ZEP", haggai: "HAG", zechariah: "ZEC", malachi: "MAL",
  matthew: "MAT", mark: "MRK", luke: "LUK", john: "JHN", acts: "ACT",
  romans: "ROM", "1-corinthians": "1CO", "2-corinthians": "2CO", galatians: "GAL",
  ephesians: "EPH", philippians: "PHP", colossians: "COL",
  "1-thessalonians": "1TH", "2-thessalonians": "2TH", "1-timothy": "1TI", "2-timothy": "2TI",
  titus: "TIT", philemon: "PHM", hebrews: "HEB", james: "JAS",
  "1-peter": "1PE", "2-peter": "2PE", "1-john": "1JN", "2-john": "2JN", "3-john": "3JN",
  jude: "JUD", revelation: "REV",
};

function toApiBibleRef(ref: string) {
  const parts = ref.split("-");
  const verse = parts.pop();
  const chapter = parts.pop();
  const osis = OSIS[parts.join("-")];
  return osis ? `${osis}.${chapter}.${verse}` : ref;
}
