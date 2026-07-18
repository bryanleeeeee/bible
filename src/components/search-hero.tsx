"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { motion } from "framer-motion";

const EXAMPLES = ["love", "anxiety", "forgiveness", "David", "verses about hope", "what does the Bible say about fear?"];

export function SearchHero({ compact = false, initialQuery = "" }: { compact?: boolean; initialQuery?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!open) return;
      const res = await fetch(`/api/search?mode=suggest&q=${encodeURIComponent(q)}`);
      const json = await res.json();
      setSuggestions(json.suggestions ?? []);
    }, 120);
    return () => clearTimeout(t);
  }, [q, open]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function go(query: string) {
    const trimmed = query.trim();
    if (!trimmed) return;
    try {
      const recents: string[] = JSON.parse(localStorage.getItem("lumen:recent-searches") ?? "[]");
      localStorage.setItem(
        "lumen:recent-searches",
        JSON.stringify([trimmed, ...recents.filter((r) => r !== trimmed)].slice(0, 8))
      );
    } catch {}
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div ref={boxRef} className={compact ? "w-full" : "mx-auto w-full max-w-2xl"}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden />
        <input
          role="combobox"
          aria-expanded={open}
          aria-label="Search the Bible"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, suggestions.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, -1)); }
            else if (e.key === "Enter") go(active >= 0 ? suggestions[active] : q);
            else if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Search anything…"
          className={`w-full rounded-full border border-line bg-surface pl-12 pr-5 text-ink shadow-soft placeholder:text-muted focus:border-lapis ${compact ? "py-3 text-base" : "py-4 text-lg"}`}
        />
        {open && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            role="listbox"
            className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-line bg-surface py-2 shadow-lift"
          >
            {suggestions.map((s, i) => (
              <li key={s} role="option" aria-selected={i === active}>
                <button
                  className={`w-full px-5 py-2 text-left text-sm ${i === active ? "bg-line/50" : "hover:bg-line/40"}`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(s)}
                >
                  {s}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </div>
      {!compact && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((e) => (
            <button
              key={e}
              onClick={() => go(e)}
              className="rounded-full border border-line bg-surface px-3 py-1 text-sm text-muted transition-colors hover:border-gilt/50 hover:text-ink"
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
