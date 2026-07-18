import Link from "next/link";
import timelineData from "@/data/timeline.json";
import { getVerse, refToDisplay } from "@/lib/bible";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Timeline · Lumen" };

interface TimelineEvent {
  id: string; title: string; date: string; ref: string; people: string[]; summary: string;
}
interface Era { id: string; label: string; range: string; events: TimelineEvent[] }

const eras = (timelineData as { eras: Era[] }).eras;

export default function TimelinePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-20 pt-10">
      <p className="eyebrow mb-1">Story connections</p>
      <h1 className="font-scripture text-3xl">Timeline</h1>
      <p className="mt-1 max-w-xl text-sm text-muted">
        The bundled passages in the sweep of the biblical story — from creation to the early church.
        Every event links to the Scripture behind it.
      </p>

      <ol className="relative mt-10 space-y-12 border-l border-line pl-8">
        {eras.map((era) => (
          <li key={era.id}>
            <span className="absolute -left-[5px] mt-2 h-2.5 w-2.5 rounded-full border border-gilt bg-ground" aria-hidden />
            <h2 className="font-scripture text-2xl">{era.label}</h2>
            <p className="mb-4 text-xs uppercase tracking-wide text-muted">{era.range}</p>
            <div className="space-y-4">
              {era.events.map((ev) => {
                const verse = getVerse(ev.ref);
                const [book, ch] = [ev.ref.split("-").slice(0, -2).join("-"), ev.ref.split("-").at(-2)];
                return (
                  <Card key={ev.id} className="p-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-medium">{ev.title}</h3>
                      <span className="text-xs text-muted">{ev.date}</span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{ev.summary}</p>
                    {verse && (
                      <blockquote className="mt-3 border-l-2 border-gilt/40 pl-3 font-scripture text-[0.95rem] leading-relaxed">
                        “{verse.text["kjv"]}”
                      </blockquote>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Link href={`/read/${book}/${ch}?focus=${ev.ref}`} className="text-sm font-medium text-lapis hover:underline">
                        {refToDisplay(ev.ref)} →
                      </Link>
                      {ev.people.map((p) => (
                        <Link key={p} href={`/search?q=${encodeURIComponent(p)}`}>
                          <Badge tone="lapis" className="capitalize hover:opacity-80">{p}</Badge>
                        </Link>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
