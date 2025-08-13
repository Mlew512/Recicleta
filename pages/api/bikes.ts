import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { nextBikeCode } from '@/lib/codes'
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { status } = req.query
      const bikes = await prisma.bike.findMany({
        where: status ? { status: status as any } : undefined,
        orderBy: { code: 'asc' },
        include: { assignedUser: true }
      })
      return res.json(bikes)
    }
    if (req.method === 'POST') {
      const { type, model, sizeCm, sizeLabel, condition, notes } = req.body || {}
      const code = await nextBikeCode()
      const bike = await prisma.bike.create({
        data: { code, type, model, sizeCm: sizeCm?Number(sizeCm):null, sizeLabel, condition, notes }
      })
      return res.status(201).json(bike)
    }
    if (req.method === 'PUT') {
      const { id, ...data } = req.body || {}
      if (!id) return res.status(400).json({ error: 'id required' })
      const bike = await prisma.bike.update({ where: { id }, data })
      return res.json(bike)
    }
    if (req.method === 'DELETE') {
      const { id } = req.body || {}
      if (!id) return res.status(400).json({ error: 'id required' })
      await prisma.bike.delete({ where: { id } })
      return res.json({ ok: true })
    }
    res.status(405).end()
  } catch (e:any) { res.status(500).json({ error: e.message }) }
}
