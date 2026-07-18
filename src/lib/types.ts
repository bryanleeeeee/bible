export type TranslationId = string;

export interface TranslationMeta {
  id: TranslationId;
  name: string;
  publicDomain: boolean;
  provider: "local" | "api.bible" | "biblia" | string;
}

export interface BookMeta {
  slug: string;
  name: string;
  testament: "OLD" | "NEW";
  genre: string;
  order: number;
  author: string;
  date: string;
}

export interface VerseRecord {
  ref: string; // "psalms-23-1"
  book: string;
  chapter: number;
  verse: number;
  themes: string[];
  people: string[];
  places: string[];
  text: Record<TranslationId, string>;
}

export interface StrongsEntry {
  id: string;
  language: "HEBREW" | "GREEK" | "ARAMAIC";
  lemma: string;
  transliteration: string;
  pronunciation: string;
  literal: string;
  definition: string;
  usage: string;
}

export interface CrossRef {
  from: string;
  to: string;
  kind: "QUOTATION" | "PROPHECY_FULFILLMENT" | "PARALLEL" | "THEMATIC" | "PHRASE";
  note: string;
}

export interface GraphNode {
  id: string;
  kind: string;
  label: string;
  summary?: string;
}

export interface GraphEdge {
  src: string;
  dst: string;
  relation: string;
}

export interface SearchResult {
  verse: VerseRecord;
  displayRef: string;
  translation: TranslationId;
  text: string;
  score: number; // 0..1 confidence
  matchedTerms: string[];
  matchType: "keyword" | "topic" | "entity" | "semantic";
  contextSummary?: string;
  crossRefs: { ref: string; displayRef: string; kind: string; note: string }[];
}

export interface DailyEntry {
  ref: string;
  meaning: string;
  application: string;
  prayer: string;
  reflection: string;
  readMinutes: number;
}
