import { PrismaClient } from '@prisma/client'

declare global {
  var globalForPrisma: { prisma?: PrismaClient } | undefined
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient | undefined }

// cast constructor using `unknown` (avoids `any` and satisfies TS even if global types are noisy)
const PrismaCtor = PrismaClient as unknown as { new (...args: unknown[]): PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaCtor({ log: ['error', 'warn'] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
