"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SearchHero } from "@/components/search-hero";
import { VerseCard } from "@/components/verse-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SearchResult } from "@/lib/types";

function SearchInner() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const [t, setT] = useState("kjv");
  const [state, setState] = useState<{
    loading: boolean;
    results: SearchResult[];
    interpretedAs?: string;
    tookMs?: number;
  }>({ loading: false, results: [] });

  useEffect(() => {
    if (!q) return;
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    fetch(`/api/search?q=${encodeURIComponent(q)}&t=${t}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled)
          setState({ loading: false, results: data.results ?? [], interpretedAs: data.interpretedAs, tookMs: data.tookMs });
      })
      .catch(() => !cancelled && setState({ loading: false, results: [] }));
    return () => { cancelled = true; };
  }, [q, t]);

  return (
    <div className="mx-auto max-w-3xl px-6 pb-16 pt-8">
      <SearchHero initialQuery={q} compact />
      {q && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
          <p aria-live="polite">
            {state.loading
              ? "Searching…"
              : state.interpretedAs
                ? <>Interpreted as <em className="text-ink">{state.interpretedAs}</em> · {state.results.length} result{state.results.length === 1 ? "" : "s"}{state.tookMs !== undefined && ` · ${state.tookMs} ms`}</>
                : `${state.results.length} result${state.results.length === 1 ? "" : "s"}${state.tookMs !== undefined ? ` · ${state.tookMs} ms` : ""}`}
          </p>
          <label className="inline-flex items-center gap-1.5">
            Translation
            <select value={t} onChange={(e) => setT(e.target.value)} className="rounded-lg border border-line bg-surface px-2 py-1 text-sm">
              <option value="kjv">KJV</option>
              <option value="web">WEB</option>
            </select>
          </label>
        </div>
      )}
      <div className="mt-4 space-y-4">
        {state.loading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
        {!state.loading && state.results.map((r) => <VerseCard key={r.verse.ref} r={r} />)}
        {!state.loading && q && state.results.length === 0 && (
          <p className="pt-8 text-center text-muted">
            No matches in the bundled library. Try a theme like <em>peace</em> or <em>courage</em>, or run the database seed for the full text.
          </p>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-6 pt-8"><Skeleton className="h-14 w-full" /></div>}>
      <SearchInner />
    </Suspense>
  );
}
