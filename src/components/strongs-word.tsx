"use client";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { StrongsEntry } from "@/lib/types";
import { Badge } from "./ui/badge";

export interface WordInfo {
  surface: string;
  strongs: string;
  entry: StrongsEntry;
  alsoUsedIn: { ref: string; displayRef: string }[];
}

/** A word in the text that carries original-language data; hover or tap to open. */
export function StrongsWord({ word }: { word: WordInfo }) {
  const [open, setOpen] = useState(false);
  const e = word.entry;
  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className="strongs-word font-scripture"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {word.surface}
      </button>
      <AnimatePresence>
        {open && (
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-1/2 top-full z-30 mt-2 block w-80 max-w-[85vw] -translate-x-1/2 rounded-2xl border border-line bg-surface p-4 text-left shadow-lift"
            role="dialog"
            aria-label={`Original language: ${e.transliteration}`}
          >
            <span className="flex items-baseline justify-between">
              <span className="font-scripture text-2xl">{e.lemma}</span>
              <Badge tone="gilt">{e.id}</Badge>
            </span>
            <span className="mt-0.5 block text-sm text-muted">
              {e.transliteration} · {e.pronunciation} · {e.language.toLowerCase()}
            </span>
            <span className="mt-2 block text-sm"><strong className="font-medium">Literal:</strong> {e.literal}</span>
            <span className="mt-1 block text-sm text-ink/90">{e.definition}</span>
            <span className="mt-1 block text-sm text-muted">{e.usage}</span>
            {word.alsoUsedIn.length > 0 && (
              <span className="mt-2 block border-t border-line pt-2 text-sm">
                <span className="eyebrow mr-2">Same word in</span>
                {word.alsoUsedIn.slice(0, 3).map((v, i) => {
                  const [book, ch] = [v.ref.split("-").slice(0, -2).join("-"), v.ref.split("-").at(-2)];
                  return (
                    <span key={v.ref}>
                      {i > 0 && " · "}
                      <Link href={`/read/${book}/${ch}?focus=${v.ref}`} className="text-lapis hover:underline">{v.displayRef}</Link>
                    </span>
                  );
                })}
              </span>
            )}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
