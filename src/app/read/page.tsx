import Link from "next/link";
import { books, verses } from "@/lib/bible";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Library · Lumen" };

export default function LibraryPage() {
  // Chapters available in the bundled library, per book.
  const byBook = new Map<string, number[]>();
  for (const v of verses) {
    const list = byBook.get(v.book) ?? [];
    if (!list.includes(v.chapter)) list.push(v.chapter);
    byBook.set(v.book, list);
  }
  const testaments: { label: string; key: "OLD" | "NEW" }[] = [
    { label: "Old Testament", key: "OLD" },
    { label: "New Testament", key: "NEW" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 pb-16 pt-10">
      <p className="eyebrow mb-1">Library</p>
      <h1 className="font-scripture text-3xl">Books &amp; chapters</h1>
      <p className="mt-1 max-w-xl text-sm text-muted">
        The bundled sample library. Connect a database and run the seed to unlock every chapter of every book.
      </p>
      {testaments.map((t) => (
        <section key={t.key} aria-labelledby={`ts-${t.key}`} className="mt-8">
          <h2 id={`ts-${t.key}`} className="eyebrow mb-3">{t.label}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {books.filter((b) => b.testament === t.key).map((b) => {
              const chapters = (byBook.get(b.slug) ?? []).sort((a, z) => a - z);
              return (
                <Card key={b.slug} className="p-5">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-medium">{b.name}</h3>
                    <Badge tone="muted" className="capitalize">{b.genre.toLowerCase()}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">{b.author} · {b.date}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {chapters.map((c) => (
                      <Link
                        key={c}
                        href={`/read/${b.slug}/${c}`}
                        className="rounded-lg border border-line bg-ground px-2.5 py-1 text-sm text-lapis transition-colors hover:border-gilt/40 hover:text-gilt"
                      >
                        {c}
                      </Link>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
