import Link from "next/link";
import { BookOpenText, MessageCircleQuestion, Network } from "lucide-react";
import { Card } from "./ui/card";

const FEATURES = [
  {
    href: "/read/psalms/23",
    icon: BookOpenText,
    title: "Read & compare",
    body: "Five reading modes — including side-by-side translations and original-language word study with Hebrew and Greek.",
  },
  {
    href: "/graph",
    icon: Network,
    title: "Knowledge graph",
    body: "Explore how people, places, themes, and passages connect. Click any node to expand its story.",
  },
  {
    href: "/assistant",
    icon: MessageCircleQuestion,
    title: "Study assistant",
    body: "Ask questions in plain language. Every answer cites Scripture and labels what is biblical text versus interpretation.",
  },
] as const;

export function FeatureGrid() {
  return (
    <section aria-label="Features" className="mx-auto max-w-6xl px-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <Link key={f.href} href={f.href} className="group">
            <Card className="h-full p-6 transition-all group-hover:-translate-y-0.5 group-hover:shadow-lift">
              <f.icon className="mb-3 h-6 w-6 text-gilt" aria-hidden />
              <h3 className="mb-1.5 font-medium">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{f.body}</p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
