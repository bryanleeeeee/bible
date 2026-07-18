"use client";
import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { SendHorizonal, Sparkles } from "lucide-react";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Button } from "./ui/button";

interface Citation { ref: string; displayRef: string; text: string }
interface Turn {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  provenance?: string;
}

const STARTERS = [
  "What does the Bible say about anxiety?",
  "Explain the story of David and Goliath",
  "What does 'agape' love mean?",
  "How can I find peace?",
];

/** Renders **Label.** section markers as styled provenance labels. */
function AnswerBody({ content }: { content: string }) {
  const parts = content.split(/\*\*(Biblical text|Related passages|Original language|Historical context|Traditional interpretation|AI explanation)\.\*\*/g);
  if (parts.length === 1) return <p className="whitespace-pre-wrap text-[0.95rem] leading-relaxed">{content}</p>;
  const out: React.ReactNode[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) {
      const label = parts[i];
      const tone = label === "Biblical text" ? "gilt" : label === "AI explanation" ? "muted" : label === "Original language" ? "lapis" : "sage";
      out.push(
        <div key={i} className="mt-3 first:mt-0">
          <Badge tone={tone as "gilt" | "muted" | "lapis" | "sage"}>{label}</Badge>
          <p className="mt-1.5 whitespace-pre-wrap text-[0.95rem] leading-relaxed">{(parts[i + 1] ?? "").trim()}</p>
        </div>
      );
      i++;
    } else if (parts[i].trim()) {
      out.push(<p key={i} className="whitespace-pre-wrap text-[0.95rem] leading-relaxed">{parts[i].trim()}</p>);
    }
  }
  return <div>{out}</div>;
}

export function AssistantChat() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function ask(question: string) {
    if (!question.trim() || busy) return;
    setTurns((t) => [...t, { role: "user", content: question }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setTurns((t) => [...t, { role: "assistant", content: data.answer, citations: data.citations, provenance: data.provenance }]);
    } catch {
      setTurns((t) => [...t, { role: "assistant", content: "Something went wrong reaching the assistant. Please try again." }]);
    } finally {
      setBusy(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  function onSubmit(e: FormEvent) { e.preventDefault(); ask(input); }

  return (
    <div className="mx-auto flex max-w-3xl flex-col px-6 pb-10">
      {turns.length === 0 && (
        <Card className="mb-6 p-6 text-center">
          <Sparkles className="mx-auto mb-2 h-6 w-6 text-gilt" aria-hidden />
          <p className="text-sm text-muted">
            Ask anything about Scripture. Answers always cite the passages they draw on, and label
            biblical text separately from historical context and interpretation.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {STARTERS.map((s) => (
              <button key={s} onClick={() => ask(s)} className="rounded-full border border-line bg-ground px-3 py-1.5 text-sm text-muted transition-colors hover:border-gilt/40 hover:text-ink">
                {s}
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className="space-y-4" aria-live="polite">
        {turns.map((turn, i) =>
          turn.role === "user" ? (
            <p key={i} className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-lapis/10 px-4 py-2.5 text-[0.95rem]">
              {turn.content}
            </p>
          ) : (
            <Card key={i} className="max-w-[95%] p-5">
              <AnswerBody content={turn.content} />
              {turn.citations && turn.citations.length > 0 && (
                <div className="mt-4 border-t border-line pt-3">
                  <span className="eyebrow">Cited passages</span>
                  <ul className="mt-2 space-y-1.5">
                    {turn.citations.map((c) => (
                      <li key={c.ref} className="text-sm">
                        <Link href={`/read/${c.ref.split("-").slice(0, -2).join("-")}/${c.ref.split("-").at(-2)}?focus=${c.ref}`} className="font-medium text-lapis hover:underline">
                          {c.displayRef}
                        </Link>
                        <span className="ml-1.5 font-scripture text-muted">— “{c.text.length > 110 ? c.text.slice(0, 110) + "…" : c.text}”</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {turn.provenance && (
                <p className="mt-3 text-xs text-muted/80">{turn.provenance}</p>
              )}
            </Card>
          )
        )}
        {busy && (
          <Card className="max-w-[95%] p-5">
            <div className="flex gap-1.5" aria-label="Assistant is thinking">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-gilt/60" style={{ animationDelay: `${i * 120}ms` }} />
              ))}
            </div>
          </Card>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={onSubmit} className="sticky bottom-4 mt-6 flex gap-2 rounded-2xl border border-line bg-surface p-2 shadow-lift">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about Scripture…"
          aria-label="Ask the study assistant"
          className="min-w-0 flex-1 bg-transparent px-3 text-[0.95rem] outline-none placeholder:text-muted/70"
        />
        <Button type="submit" disabled={busy || !input.trim()} aria-label="Send question">
          <SendHorizonal className="h-4 w-4" />
        </Button>
      </form>
      <p className="mt-2 text-center text-xs text-muted/70">
        The assistant is grounded in retrieved Scripture. It is a study aid, not a doctrinal authority.
      </p>
    </div>
  );
}
