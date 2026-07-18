"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlignLeft, Columns2, Eye, Languages, Sparkles } from "lucide-react";
import type { BookMeta, TranslationMeta, VerseRecord } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { StrongsWord, type WordInfo } from "./strongs-word";

type Mode = "read" | "study" | "original" | "parallel" | "focus";

const MODES: { id: Mode; label: string; icon: typeof AlignLeft }[] = [
  { id: "read", label: "Read", icon: AlignLeft },
  { id: "study", label: "Study", icon: Sparkles },
  { id: "original", label: "Original", icon: Languages },
  { id: "parallel", label: "Parallel", icon: Columns2 },
  { id: "focus", label: "Focus", icon: Eye },
];

export function Reader({
  book,
  chapter,
  verses,
  translations,
  words,
  crossRefs,
}: {
  book: BookMeta;
  chapter: number;
  verses: VerseRecord[];
  translations: TranslationMeta[];
  words: Record<string, WordInfo[]>;
  crossRefs: Record<string, { ref: string; displayRef: string; kind: string; note: string }[]>;
}) {
  const params = useSearchParams();
  const focusRef = params.get("focus");
  const [mode, setMode] = useState<Mode>("read");
  const [t, setT] = useState("kjv");
  const [parallel, setParallel] = useState<string[]>(["kjv", "web"]);

  const loaded = useMemo(
    () => translations.filter((x) => verses.some((v) => v.text[x.id])),
    [translations, verses]
  );

  useEffect(() => {
    try {
      const list: { href: string; label: string }[] = JSON.parse(localStorage.getItem("lumen:recent-passages") ?? "[]");
      const href = `/read/${book.slug}/${chapter}`;
      const label = `${book.name === "Psalms" ? "Psalm" : book.name} ${chapter}`;
      localStorage.setItem(
        "lumen:recent-passages",
        JSON.stringify([{ href, label }, ...list.filter((p) => p.href !== href)].slice(0, 8))
      );
    } catch {}
  }, [book, chapter]);

  useEffect(() => {
    if (focusRef) document.getElementById(focusRef)?.scrollIntoView({ block: "center" });
  }, [focusRef]);

  const heading = `${book.name === "Psalms" ? "Psalm" : book.name} ${chapter}`;

  return (
    <div className={cn("mx-auto px-6 pb-16", mode === "parallel" ? "max-w-6xl" : "max-w-3xl")}>
      <div className={cn("sticky top-[57px] z-20 -mx-6 mb-6 border-b border-line/70 bg-ground/85 px-6 py-3 backdrop-blur", mode === "focus" && "opacity-0 transition-opacity hover:opacity-100 focus-within:opacity-100")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="tablist" aria-label="Reading mode" className="flex rounded-full border border-line bg-surface p-1">
            {MODES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                role="tab"
                aria-selected={mode === id}
                onClick={() => setMode(id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm transition-colors",
                  mode === id ? "bg-ink text-ground" : "text-muted hover:text-ink"
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                <span className="hidden md:inline">{label}</span>
              </button>
            ))}
          </div>
          {mode !== "parallel" ? (
            <div className="flex gap-1" role="group" aria-label="Translation">
              {translations.map((x) => {
                const available = loaded.some((l) => l.id === x.id);
                return (
                  <button
                    key={x.id}
                    onClick={() => available && setT(x.id)}
                    disabled={!available}
                    title={available ? x.name : `${x.name} — connect a licensed provider or run db:seed`}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium uppercase transition-colors",
                      t === x.id ? "bg-gilt/15 text-gilt" : available ? "text-muted hover:text-ink" : "cursor-not-allowed text-muted/40"
                    )}
                  >
                    {x.id}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex gap-1" role="group" aria-label="Translations to compare">
              {loaded.map((x) => (
                <button
                  key={x.id}
                  aria-pressed={parallel.includes(x.id)}
                  onClick={() =>
                    setParallel((p) => (p.includes(x.id) ? p.filter((y) => y !== x.id) : [...p, x.id]))
                  }
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium uppercase",
                    parallel.includes(x.id) ? "bg-gilt/15 text-gilt" : "text-muted hover:text-ink"
                  )}
                >
                  {x.id}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <h1 className="mb-1 font-scripture text-4xl">{heading}</h1>
      <p className="mb-8 text-sm text-muted">
        {book.author} · {book.date} · {book.testament === "OLD" ? "Old Testament" : "New Testament"} · {book.genre.toLowerCase()}
      </p>

      {mode === "parallel" ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-separate border-spacing-0 text-left">
            <thead>
              <tr>
                <th className="w-10" aria-label="Verse" />
                {parallel.map((x) => (
                  <th key={x} className="border-b border-line pb-2 pr-6 text-sm font-medium uppercase text-muted">{x}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {verses.map((v) => (
                <tr key={v.ref} id={v.ref} className={cn(focusRef === v.ref && "bg-gilt/5")}>
                  <td className="border-b border-line/60 py-3 pr-2 align-top text-xs text-gilt">{v.verse}</td>
                  {parallel.map((x) => (
                    <td key={x} className="border-b border-line/60 py-3 pr-6 align-top font-scripture leading-relaxed">
                      {v.text[x] ?? <span className="text-sm text-muted/60">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={cn("space-y-1", mode === "focus" && "space-y-2")}>
          {verses.map((v) => (
            <VerseRow
              key={v.ref}
              v={v}
              t={t}
              mode={mode}
              words={words[v.ref] ?? []}
              crossRefs={crossRefs[v.ref] ?? []}
              focused={focusRef === v.ref}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function VerseRow({
  v, t, mode, words, crossRefs, focused,
}: {
  v: VerseRecord;
  t: string;
  mode: Mode;
  words: WordInfo[];
  crossRefs: { ref: string; displayRef: string; kind: string; note: string }[];
  focused: boolean;
}) {
  const text = v.text[t] ?? v.text["kjv"];

  const rendered = useMemo(() => {
    if (mode !== "original" || words.length === 0) return text;
    // Split the verse around tagged words so each becomes an interactive StrongsWord.
    const pattern = new RegExp(`\\b(${words.map((w) => w.surface.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`);
    const parts: (string | WordInfo)[] = [];
    let rest = text;
    while (rest.length) {
      const m = rest.match(pattern);
      if (!m || m.index === undefined) { parts.push(rest); break; }
      if (m.index > 0) parts.push(rest.slice(0, m.index));
      const info = words.find((w) => w.surface === m[1]);
      parts.push(info ?? m[1]);
      rest = rest.slice(m.index + m[1].length);
    }
    return parts;
  }, [mode, text, words]);

  return (
    <div id={v.ref} className={cn("group rounded-xl px-3 py-2 -mx-3", focused && "bg-gilt/5 ring-1 ring-gilt/25")}>
      <p className={cn("font-scripture leading-relaxed", mode === "focus" ? "text-xl" : "text-lg")}>
        {mode !== "focus" && <sup className="mr-1.5 select-none text-xs text-gilt">{v.verse}</sup>}
        {typeof rendered === "string"
          ? rendered
          : rendered.map((p, i) => (typeof p === "string" ? <span key={i}>{p}</span> : <StrongsWord key={i} word={p} />))}
      </p>
      {mode === "study" && (
        <Card className="mt-2 space-y-2 p-4 text-sm">
          <div className="flex flex-wrap gap-1.5">
            {v.themes.map((th) => (
              <Link key={th} href={`/search?q=${encodeURIComponent(th)}`}>
                <Badge tone="sage" className="capitalize hover:opacity-80">{th.replace(/-/g, " ")}</Badge>
              </Link>
            ))}
            {v.people.map((p) => (
              <Link key={p} href={`/search?q=${encodeURIComponent(p)}`}>
                <Badge tone="lapis" className="capitalize hover:opacity-80">{p}</Badge>
              </Link>
            ))}
            {v.places.map((p) => (
              <Badge key={p} tone="gilt" className="capitalize">{p.replace(/-/g, " ")}</Badge>
            ))}
          </div>
          {crossRefs.length > 0 && (
            <ul className="space-y-1 text-muted">
              {crossRefs.map((c) => {
                const [book, ch] = [c.ref.split("-").slice(0, -2).join("-"), c.ref.split("-").at(-2)];
                return (
                  <li key={c.ref}>
                    <Link href={`/read/${book}/${ch}?focus=${c.ref}`} className="text-lapis hover:underline">{c.displayRef}</Link>
                    <span className="ml-1.5">— {c.note}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
