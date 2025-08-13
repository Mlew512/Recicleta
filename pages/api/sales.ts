import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { nextSaleCode } from '@/lib/codes'
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const sales = await prisma.sale.findMany({ orderBy: { date: 'desc' } })
      return res.json(sales)
    }
    if (req.method === 'POST') {
      const { item, quantity, unitPrice, notes } = req.body || {}
      if (!item) return res.status(400).json({ error: 'item is required' })
      const code = await nextSaleCode()
      const qty = quantity ? Number(quantity) : 1
      const price = unitPrice ? Number(unitPrice) : 0
      const total = qty * price
      const sale = await prisma.sale.create({ data: { code, item, quantity: qty, unitPrice: price, total, notes } })
      return res.status(201).json(sale)
    }
    res.status(405).end()
  } catch (e:any) { res.status(500).json({ error: e.message }) }
}
