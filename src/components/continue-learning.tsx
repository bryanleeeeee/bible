"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Bookmark, History, Search } from "lucide-react";
import { Card } from "./ui/card";

export function ContinueLearning() {
  const [recents, setRecents] = useState<string[]>([]);
  const [bookmarks, setBookmarks] = useState<{ ref: string; displayRef: string }[]>([]);
  const [passages, setPassages] = useState<{ href: string; label: string }[]>([]);

  useEffect(() => {
    try {
      setRecents(JSON.parse(localStorage.getItem("lumen:recent-searches") ?? "[]"));
      setBookmarks(JSON.parse(localStorage.getItem("lumen:bookmarks") ?? "[]"));
      setPassages(JSON.parse(localStorage.getItem("lumen:recent-passages") ?? "[]"));
    } catch {}
  }, []);

  if (recents.length + bookmarks.length + passages.length === 0) return null;

  return (
    <section aria-labelledby="continue-heading" className="mx-auto max-w-6xl px-6">
      <h2 id="continue-heading" className="eyebrow mb-3">Continue learning</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {recents.length > 0 && (
          <Card className="p-5">
            <h3 className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium"><Search className="h-4 w-4 text-lapis" aria-hidden /> Recent searches</h3>
            <ul className="space-y-1.5">
              {recents.slice(0, 5).map((r) => (
                <li key={r}><Link className="text-sm text-muted hover:text-ink hover:underline" href={`/search?q=${encodeURIComponent(r)}`}>{r}</Link></li>
              ))}
            </ul>
          </Card>
        )}
        {passages.length > 0 && (
          <Card className="p-5">
            <h3 className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium"><History className="h-4 w-4 text-sage" aria-hidden /> Recently viewed</h3>
            <ul className="space-y-1.5">
              {passages.slice(0, 5).map((p) => (
                <li key={p.href}><Link className="text-sm text-muted hover:text-ink hover:underline" href={p.href}>{p.label}</Link></li>
              ))}
            </ul>
          </Card>
        )}
        {bookmarks.length > 0 && (
          <Card className="p-5">
            <h3 className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium"><Bookmark className="h-4 w-4 text-gilt" aria-hidden /> Bookmarks</h3>
            <ul className="space-y-1.5">
              {bookmarks.slice(0, 5).map((b) => {
                const [book, ch] = [b.ref.split("-").slice(0, -2).join("-"), b.ref.split("-").at(-2)];
                return (
                  <li key={b.ref}><Link className="text-sm text-muted hover:text-ink hover:underline" href={`/read/${book}/${ch}?focus=${b.ref}`}>{b.displayRef}</Link></li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>
    </section>
  );
}
