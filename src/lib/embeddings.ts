/**
 * Semantic search: embeddings abstraction.
 *
 * embedQuery() returns a vector via the configured provider; verse vectors
 * live in Postgres (pgvector, Embedding model). similaritySearch() runs
 * `ORDER BY vector <=> $1` via prisma.$queryRaw when the database is
 * configured. Without keys, the topic map in search.ts covers the same
 * intents so the product works with zero configuration.
 */
export interface EmbeddingsProvider {
  embed(texts: string[]): Promise<number[][]>;
  dimensions: number;
}

export function getEmbeddingsProvider(): EmbeddingsProvider | null {
  if (process.env.EMBEDDINGS_PROVIDER === "openai" && process.env.OPENAI_API_KEY) {
    return {
      dimensions: 1536,
      async embed(texts) {
        const res = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({ model: "text-embedding-3-small", input: texts }),
        });
        if (!res.ok) throw new Error(`Embeddings request failed: ${res.status}`);
        const json = await res.json();
        return json.data.map((d: { embedding: number[] }) => d.embedding);
      },
    };
  }
  return null;
}
