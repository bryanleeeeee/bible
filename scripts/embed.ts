/**
 * One-time batch job: generate embeddings for every verse in the database
 * and store them in the pgvector-backed Embedding table.
 *
 * Requires: DATABASE_URL, OPENAI_API_KEY, EMBEDDINGS_PROVIDER=openai
 * Run after `npm run db:seed`:
 *
 *   npx tsx scripts/embed.ts
 *
 * ~31k verses ≈ 310 batches of 100. Idempotent — verses that already
 * have an embedding are skipped, so it can resume after interruption.
 */
import { PrismaClient } from "@prisma/client";
import { getEmbeddingsProvider } from "../src/lib/embeddings";

const prisma = new PrismaClient();
const BATCH = 100;

async function main() {
  const provider = getEmbeddingsProvider();
  if (!provider) {
    console.error("Set OPENAI_API_KEY and EMBEDDINGS_PROVIDER=openai first.");
    process.exit(1);
  }

  // Embed the KJV text of every verse that doesn't have a vector yet.
  for (;;) {
    const verses: { id: number; ref: string; text: string }[] = await prisma.$queryRaw`
      SELECT v.id, v.ref, vt.text
      FROM "Verse" v
      JOIN "VerseText" vt ON vt."verseId" = v.id AND vt."translationId" = 'kjv'
      LEFT JOIN "Embedding" e ON e."verseId" = v.id
      WHERE e."verseId" IS NULL
      ORDER BY v.id
      LIMIT ${BATCH}`;
    if (verses.length === 0) break;

    const vectors = await provider.embed(verses.map((v) => `${v.ref.replace(/-/g, " ")}: ${v.text}`));
    for (let i = 0; i < verses.length; i++) {
      const vec = `[${vectors[i].join(",")}]`;
      await prisma.$executeRawUnsafe(
        `INSERT INTO "Embedding" ("verseId", vector) VALUES ($1, $2::vector)
         ON CONFLICT ("verseId") DO UPDATE SET vector = $2::vector`,
        verses[i].id,
        vec
      );
    }
    console.log(`Embedded through verse id ${verses[verses.length - 1].id} (${verses.length} this batch)`);
  }
  console.log("All verses embedded.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
