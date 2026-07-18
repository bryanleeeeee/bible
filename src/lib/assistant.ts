/**
 * AI study assistant, grounded-by-construction.
 *
 * 1) Retrieval: the user's question runs through the same hybrid search engine,
 *    producing candidate verses + Strong's entries + cross-references.
 * 2) Generation: with ANTHROPIC_API_KEY set, retrieved context is passed to the
 *    model with instructions to cite Scripture and to label every paragraph as
 *    biblical text / historical evidence / traditional interpretation / AI
 *    explanation. Without a key, a deterministic grounded response is composed
 *    directly from retrieved data — zero hallucination surface.
 */
import { search } from "@/lib/search";
import { wordsFor } from "@/lib/strongs";

export interface AssistantReply {
  answer: string;
  citations: { displayRef: string; ref: string; text: string }[];
  provenance: "model" | "local";
}

const SYSTEM = `You are a careful Bible study assistant. Ground every claim in the provided passages and cite references inline like (John 3:16). Distinguish clearly, with labels, between: Biblical text, Historical evidence, Traditional interpretation, and AI explanation. If the provided passages do not answer the question, say so rather than inventing sources.`;

export async function askAssistant(question: string): Promise<AssistantReply> {
  const { results } = search(question, "kjv", 6);
  const citations = results.map((r) => ({ displayRef: r.displayRef, ref: r.verse.ref, text: r.text }));
  const context = results
    .map((r) => {
      const words = wordsFor(r.verse.ref)
        .map((w) => `${w.surface} = ${w.entry.transliteration} (${w.entry.id}): ${w.entry.literal}`)
        .join("; ");
      return `${r.displayRef} — "${r.text}"${words ? ` [Original language: ${words}]` : ""}`;
    })
    .join("\n");

  if (process.env.ANTHROPIC_API_KEY) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1024,
        system: SYSTEM,
        messages: [{ role: "user", content: `Passages:\n${context}\n\nQuestion: ${question}` }],
      }),
    });
    if (res.ok) {
      const json = await res.json();
      const answer = json.content?.map((c: { text?: string }) => c.text ?? "").join("") ?? "";
      if (answer) return { answer, citations, provenance: "model" };
    }
  }

  // Grounded local fallback — composed only from retrieved data.
  if (citations.length === 0) {
    return {
      answer:
        "I couldn't find passages in the loaded dataset that address this directly. Try rephrasing, or run the full seed (`npm run db:seed`) to load the complete text.",
      citations: [],
      provenance: "local",
    };
  }
  const lead = citations[0];
  const rest = citations.slice(1, 4);
  const originalNotes = results
    .flatMap((r) => wordsFor(r.verse.ref).map((w) => `In ${r.displayRef}, “${w.surface}” translates ${w.entry.lemma} (${w.entry.transliteration}, ${w.entry.id}) — ${w.entry.literal}.`))
    .slice(0, 2);
  const answer = [
    `**Biblical text.** ${lead.displayRef} says: “${lead.text}”`,
    rest.length
      ? `**Related passages.** See also ${rest.map((c) => c.displayRef).join("; ")} — each is connected to your question in the passage list below.`
      : "",
    originalNotes.length ? `**Original language.** ${originalNotes.join(" ")}` : "",
    `**AI explanation.** ${results[0].contextSummary ?? "These passages were retrieved because their themes match your question."} Read each passage in its chapter for full context — this summary is an aid, not a substitute for the text.`,
  ]
    .filter(Boolean)
    .join("\n\n");
  return { answer, citations, provenance: "local" };
}
