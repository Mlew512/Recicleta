import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { firstName, email, firstTime, reason } = req.body

      if (!firstName || !reason) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      const payload = {
        first_name: firstName,
        email: email || null,
        first_time: !!firstTime,
        reason: reason,
        created_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from('visits').insert([payload])
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Server error'
      return res.status(500).json({ error: message })
    }
  }

  res.status(405).json({ error: 'Method not allowed' })
}
