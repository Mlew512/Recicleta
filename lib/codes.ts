import { prisma } from './prisma'
async function nextSequential(prefix: string, table: 'bike'|'rental'|'sale') {
  let max = 0
  const list = table === 'bike'
    ? await prisma.bike.findMany({ select: { code: true } })
    : table === 'rental'
    ? await prisma.rental.findMany({ select: { code: true } })
    : await prisma.sale.findMany({ select: { code: true } })
  for (const r of list) {
    const m = r.code?.match(/\d+$/)
    if (m) max = Math.max(max, parseInt(m[0], 10))
  }
  return `${prefix}${String(max + 1).padStart(3,'0')}`
}
export const nextBikeCode   = () => nextSequential('B','bike')
export const nextRentalCode = () => nextSequential('T','rental')
export const nextSaleCode   = () => nextSequential('S','sale')
