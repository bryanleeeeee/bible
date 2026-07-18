"use client";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { useState } from "react";
import type { SearchResult } from "@/lib/types";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";

function highlight(text: string, terms: string[]) {
  if (terms.length === 0) return text;
  const escaped = terms.filter(Boolean).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${escaped.join("|")})`, "gi");
  return text.split(re).map((part, i) =>
    re.test(part) ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>
  );
}

export function VerseCard({ r }: { r: SearchResult }) {
  const [saved, setSaved] = useState(false);
  const readerHref = `/read/${r.verse.book}/${r.verse.chapter}?focus=${r.verse.ref}`;

  function toggleBookmark() {
    try {
      const list: { ref: string; displayRef: string }[] = JSON.parse(localStorage.getItem("lumen:bookmarks") ?? "[]");
      const next = saved ? list.filter((b) => b.ref !== r.verse.ref) : [{ ref: r.verse.ref, displayRef: r.displayRef }, ...list].slice(0, 30);
      localStorage.setItem("lumen:bookmarks", JSON.stringify(next));
      setSaved(!saved);
    } catch {}
  }

  return (
    <Card className="p-5 transition-shadow hover:shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <Link href={readerHref} className="font-medium text-lapis hover:underline">{r.displayRef}</Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted" title="Match confidence">{Math.round(r.score * 100)}%</span>
          <Badge tone="muted">{r.translation.toUpperCase()}</Badge>
          <button aria-label={saved ? "Remove bookmark" : "Bookmark verse"} aria-pressed={saved} onClick={toggleBookmark} className="text-muted hover:text-gilt">
            <Bookmark className={`h-4 w-4 ${saved ? "fill-gilt text-gilt" : ""}`} />
          </button>
        </div>
      </div>
      <p className="mt-2 font-scripture text-lg leading-relaxed">{highlight(r.text, r.matchedTerms)}</p>
      {r.contextSummary && <p className="mt-2 text-sm text-muted">{r.contextSummary}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {r.verse.themes.slice(0, 4).map((t) => (
          <Link key={t} href={`/search?q=${encodeURIComponent(t)}`}><Badge tone="sage" className="capitalize hover:opacity-80">{t.replace(/-/g, " ")}</Badge></Link>
        ))}
        {r.verse.people.map((p) => (
          <Link key={p} href={`/search?q=${encodeURIComponent(p)}`}><Badge tone="lapis" className="capitalize hover:opacity-80">{p}</Badge></Link>
        ))}
      </div>
      {r.crossRefs.length > 0 && (
        <div className="mt-3 border-t border-line pt-3 text-sm">
          <span className="eyebrow mr-2">Cross references</span>
          <span className="text-muted">
            {r.crossRefs.map((c, i) => {
              const [book, ch] = [c.ref.split("-").slice(0, -2).join("-"), c.ref.split("-").at(-2)];
              return (
                <span key={c.ref}>
                  {i > 0 && " · "}
                  <Link href={`/read/${book}/${ch}?focus=${c.ref}`} className="text-lapis hover:underline" title={c.note}>{c.displayRef}</Link>
                </span>
              );
            })}
          </span>
        </div>
      )}
    </Card>
  );
}
