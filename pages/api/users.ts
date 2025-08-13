import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const q = (req.query.search as string || '').trim()
      const users = await prisma.user.findMany({
        where: q ? {
          OR: [
            { fullName: { contains: q, mode: 'insensitive' } },
            { dni: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ]
        } : undefined,
        orderBy: { fullName: 'asc' }
      })
      return res.json(users)
    }
    if (req.method === 'POST') {
      const { fullName, dni, phone, email, address, notes } = req.body || {}
      if (!fullName || !dni) return res.status(400).json({ error: 'fullName and dni are required' })
      const user = await prisma.user.create({ data: { fullName, dni, phone, email, address, notes } })
      return res.status(201).json(user)
    }
    if (req.method === 'PUT') {
      const { id, ...data } = req.body || {}
      if (!id) return res.status(400).json({ error: 'id required' })
      const user = await prisma.user.update({ where: { id }, data })
      return res.json(user)
    }
    if (req.method === 'DELETE') {
      const { id } = req.body || {}
      if (!id) return res.status(400).json({ error: 'id required' })
      await prisma.user.delete({ where: { id } })
      return res.json({ ok: true })
    }
    res.status(405).end()
  } catch (e:any) { res.status(500).json({ error: e.message }) }
}
