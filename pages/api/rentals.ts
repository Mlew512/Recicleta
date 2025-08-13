import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { nextRentalCode } from '@/lib/codes'
import { calculateFee } from '@/lib/fees'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const rentals = await prisma.rental.findMany({
        orderBy: { createdAt: 'desc' },
        include: { bike: true, user: true }
      })
      return res.json(rentals)
    }
    if (req.method === 'POST') {
      const { bikeId, userId, startDate, plannedEnd, deposit, notes } = req.body || {}
      if (!bikeId || !userId) return res.status(400).json({ error: 'bikeId and userId are required' })
      const bike = await prisma.bike.findUnique({ where: { id: bikeId } })
      if (!bike) return res.status(404).json({ error: 'Bike not found' })
      if (bike.status !== 'Disponible') return res.status(400).json({ error: 'Bike not available' })
      const code = await nextRentalCode()
      const rental = await prisma.$transaction(async (tx) => {
        const r = await tx.rental.create({
          data: {
            code, bikeId, userId,
            startDate: startDate ? new Date(startDate) : new Date(),
            plannedEnd: plannedEnd ? new Date(plannedEnd) : null,
            deposit: deposit != null ? Number(deposit) : null,
            notes, status: 'Activo'
          }
        })
        await tx.bike.update({ where: { id: bikeId }, data: { status: 'Alquilada', assignedUserId: userId } })
        return r
      })
      return res.status(201).json(rental)
    }
    if (req.method === 'PUT') {
      const { rentalId } = req.body || {}
      if (!rentalId) return res.status(400).json({ error: 'rentalId required' })
      const rental = await prisma.rental.findUnique({ where: { id: rentalId }, include: { bike: true } })
      if (!rental) return res.status(404).json({ error: 'Rental not found' })
      if (rental.status !== 'Activo') return res.status(400).json({ error: 'Rental already completed' })
      const endDate = new Date()
      const days = Math.max(1, Math.ceil((endDate.getTime() - rental.startDate.getTime()) / 86400000))
      const fee = calculateFee(days)
      const deposit = rental.deposit ?? 0
      const refund = Math.max(0, deposit - fee)
      const updated = await prisma.$transaction(async (tx) => {
        const r = await tx.rental.update({
          where: { id: rentalId },
          data: { endDate, fee, refund, status: 'Completado' }
        })
        await tx.bike.update({ where: { id: rental.bikeId }, data: { status: 'Disponible', assignedUserId: null } })
        return r
      })
      return res.json(updated)
    }
    res.status(405).end()
  } catch (e:any) { res.status(500).json({ error: e.message }) }
}
