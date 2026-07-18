/**
 * Seed the database with the complete public-domain Bible text (KJV + WEB),
 * plus the curated Strong's, cross-reference, and knowledge-graph data
 * bundled with the app.
 *
 * Full text source: scrollmapper/bible_databases (public domain), fetched
 * from raw.githubusercontent.com. Requires DATABASE_URL.
 *
 *   npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bible from "../src/data/bible.json";
import strongsData from "../src/data/strongs.json";
import crossrefs from "../src/data/crossrefs.json";
import graph from "../src/data/graph.json";

const prisma = new PrismaClient();

const SOURCES: Record<string, string> = {
  kjv: "https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json/KJV.json",
  web: "https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json/WEB.json",
};

interface SourceBook {
  name: string;
  chapters: { chapter: number; verses: { verse: number; text: string }[] }[];
}

const slugify = (name: string) =>
  name.toLowerCase().replace(/^([123]) /, "$1-").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

async function fetchTranslation(id: string): Promise<SourceBook[]> {
  const res = await fetch(SOURCES[id]);
  if (!res.ok) throw new Error(`Failed to fetch ${id}: ${res.status} — check network access to raw.githubusercontent.com`);
  const data = (await res.json()) as { books: SourceBook[] };
  return data.books;
}

async function main() {
  console.log("Seeding translations…");
  for (const t of bible.translations) {
    await prisma.translation.upsert({
      where: { id: t.id },
      create: {
        id: t.id,
        name: t.name,
        publicDomain: Boolean((t as { publicDomain?: boolean }).publicDomain),
        provider: (t as { provider?: string }).provider ?? "local",
      },
      update: { name: t.name },
    });
  }

  console.log("Seeding curated book metadata…");
  const bookIds = new Map<string, number>();
  let order = 1;
  for (const b of bible.books) {
    const created = await prisma.book.upsert({
      where: { slug: b.slug },
      create: {
        id: order,
        slug: b.slug,
        name: b.name,
        testament: b.testament as "OLD" | "NEW",
        genre: b.genre as never,
        order: b.order ?? order,
        authorName: (b as { author?: string }).author ?? null,
        dateNote: (b as { date?: string }).date ?? null,
      },
      update: { name: b.name },
    });
    bookIds.set(b.slug, created.id);
    order++;
  }

  let nextBookId = 100;
  for (const id of Object.keys(SOURCES)) {
    console.log(`Fetching full ${id.toUpperCase()} text…`);
    let books: SourceBook[];
    try {
      books = await fetchTranslation(id);
    } catch (e) {
      console.warn(`⚠️  Skipping ${id.toUpperCase()}: ${(e as Error).message}`);
      continue;
    }
    for (const book of books) {
      const slug = slugify(book.name);
      let bookId: number | undefined = bookIds.get(slug);
      if (bookId === undefined) {
        const created = await prisma.book.upsert({
          where: { slug },
          create: {
            id: nextBookId++,
            slug,
            name: book.name,
            testament: "OLD", // refined later; ordering data lives in curated metadata
            genre: "HISTORY" as never,
            order: nextBookId,
          },
          update: {},
        });
        bookId = created.id;
        bookIds.set(slug, bookId);
      }
      for (const ch of book.chapters) {
        const chapter = await prisma.chapter.upsert({
          where: { bookId_number: { bookId, number: ch.chapter } },
          create: { bookId, number: ch.chapter },
          update: {},
        });
        for (const v of ch.verses) {
          const ref = `${slug}-${ch.chapter}-${v.verse}`;
          const verse = await prisma.verse.upsert({
            where: { ref },
            create: { ref, chapterId: chapter.id, number: v.verse },
            update: {},
          });
          await prisma.verseText.upsert({
            where: { verseId_translationId: { verseId: verse.id, translationId: id } },
            create: { verseId: verse.id, translationId: id, text: v.text.trim() },
            update: { text: v.text.trim() },
          });
        }
      }
      process.stdout.write(`  ${book.name}\n`);
    }
  }

  console.log("Seeding Strong's entries…");
  const strongs = strongsData as unknown as {
    entries: {
      id: string; language: string; lemma: string; transliteration: string;
      pronunciation: string; literal: string; definition: string; usage: string;
    }[];
  };
  for (const e of strongs.entries) {
    await prisma.strongsEntry.upsert({
      where: { id: e.id },
      create: {
        id: e.id,
        language: e.language as "HEBREW" | "GREEK" | "ARAMAIC",
        lemma: e.lemma,
        transliteration: e.transliteration,
        pronunciation: e.pronunciation,
        literal: e.literal,
        definition: e.definition,
        usageNote: e.usage,
      },
      update: { definition: e.definition, usageNote: e.usage },
    });
  }

  console.log("Seeding cross references…");
  for (const c of crossrefs as unknown as { from: string; to: string; kind: string; note: string }[]) {
    const [from, to] = await Promise.all([
      prisma.verse.findUnique({ where: { ref: c.from } }),
      prisma.verse.findUnique({ where: { ref: c.to } }),
    ]);
    if (from && to) {
      await prisma.crossRef.upsert({
        where: { fromId_toId: { fromId: from.id, toId: to.id } },
        create: { fromId: from.id, toId: to.id, kind: c.kind as never },
        update: { kind: c.kind as never },
      });
    }
  }

  console.log("Seeding knowledge graph…");
  for (const n of graph.nodes) {
    await prisma.graphNode.upsert({
      where: { id: n.id },
      create: { id: n.id, kind: n.kind as never, label: n.label, refId: n.id.split(":")[1] ?? null },
      update: { label: n.label },
    });
  }
  for (const e of graph.edges) {
    await prisma.graphEdge.upsert({
      where: { srcId_dstId_relation: { srcId: e.src, dstId: e.dst, relation: e.relation } },
      create: { srcId: e.src, dstId: e.dst, relation: e.relation },
      update: {},
    });
  }

  console.log("Done. Reload the app with DATABASE_URL set to serve the full library.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
