import { PrismaClient } from "@prisma/client";

/** Bump when Prisma schema changes — prevents stale client in Next.js dev HMR. */
const PRISMA_CACHE_KEY = "multi-club-v1";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaCacheKey?: string;
};

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function getPrismaClient(): PrismaClient {
  if (
    globalForPrisma.prisma &&
    globalForPrisma.prismaCacheKey === PRISMA_CACHE_KEY
  ) {
    return globalForPrisma.prisma;
  }

  if (globalForPrisma.prisma) {
    void globalForPrisma.prisma.$disconnect();
  }

  const client = createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaCacheKey = PRISMA_CACHE_KEY;
  }

  return client;
}

export const db = getPrismaClient();
