/**
 * Translation provider abstraction.
 *
 * Public-domain texts (KJV, WEB, ASV) ship locally and seed the database.
 * Licensed translations (NIV, NLT, NKJV, MSG) cannot be bundled; they are
 * retrieved at runtime through approved APIs behind this interface, so new
 * providers can be added without touching application code.
 */
import type { TranslationId, VerseRecord } from "@/lib/types";

export interface BibleTextProvider {
  id: string;
  /** Translations this provider can serve. */
  supports(translation: TranslationId): boolean;
  /** Fetch text for a verse ref ("john-3-16"); null when unavailable. */
  getVerseText(ref: string, translation: TranslationId): Promise<string | null>;
  /** Fetch a whole chapter's texts keyed by verse ref. */
  getChapter(book: string, chapter: number, translation: TranslationId): Promise<Record<string, string>>;
}

const registry: BibleTextProvider[] = [];

export function registerProvider(p: BibleTextProvider) {
  if (!registry.find((r) => r.id === p.id)) registry.push(p);
}

export function providerFor(translation: TranslationId): BibleTextProvider | undefined {
  return registry.find((p) => p.supports(translation));
}

export type { VerseRecord };
