/**
 * Prisma client (lazy, optional). Every read path degrades gracefully to the
 * bundled public-domain dataset when DATABASE_URL is absent, so `npm run dev`
 * works with zero setup — and the app builds even before `prisma generate`
 * has ever run (the client is resolved dynamically at request time).
 */
type AnyPrisma = { $disconnect: () => Promise<void> } & Record<string, unknown>;

const g = globalThis as unknown as { prisma?: AnyPrisma | null };

export async function getDb(): Promise<AnyPrisma | null> {
  if (!process.env.DATABASE_URL) return null;
  if (g.prisma !== undefined) return g.prisma;
  try {
    const mod = await import("@prisma/client");
    const PrismaClient = (mod as unknown as { PrismaClient: new () => AnyPrisma }).PrismaClient;
    g.prisma = new PrismaClient();
  } catch {
    g.prisma = null; // client not generated — run `npm run db:generate`
  }
  return g.prisma;
}
