import Link from "next/link";
import { Clock } from "lucide-react";
import { getDaily } from "@/lib/daily";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";

export function DailyVerse() {
  const d = getDaily();
  const text = d.verse.text["kjv"];
  return (
    <section aria-labelledby="daily-heading" className="mx-auto max-w-3xl px-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="daily-heading" className="eyebrow">Daily encouragement</h2>
        <span className="inline-flex items-center gap-1 text-xs text-muted">
          <Clock className="h-3.5 w-3.5" aria-hidden /> {d.readMinutes} min read
        </span>
      </div>
      <Card className="p-8 sm:p-10">
        <p className="dropcap font-scripture text-2xl leading-relaxed sm:text-[1.7rem]">{text}</p>
        <div className="mt-4 flex items-center gap-3">
          <Link
            href={`/read/${d.verse.book}/${d.verse.chapter}?focus=${d.verse.ref}`}
            className="font-medium text-lapis hover:underline"
          >
            {d.displayRef}
          </Link>
          <Badge tone="muted">KJV</Badge>
        </div>
        <div className="gilt-rule my-6" />
        <dl className="grid gap-5 sm:grid-cols-2">
          <Section label="Meaning" body={d.meaning} />
          <Section label="Practical application" body={d.application} />
          <Section label="Prayer" body={d.prayer} italic />
          <Section label="Reflection" body={d.reflection} />
        </dl>
      </Card>
    </section>
  );
}

function Section({ label, body, italic }: { label: string; body: string; italic?: boolean }) {
  return (
    <div>
      <dt className="eyebrow mb-1.5">{label}</dt>
      <dd className={`text-[0.95rem] leading-relaxed text-ink/90 ${italic ? "font-scripture italic" : ""}`}>{body}</dd>
    </div>
  );
}
