import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('bikes').select('*').order('id_bicicleta')
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const { id_bicicleta, tipo, marca_modelo, status } = req.body
    const { data, error } = await supabase
      .from('bikes')
      .insert([{ id_bicicleta, tipo, marca_modelo, status }])
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'PATCH') {
    const { id_bicicleta, status } = req.body
    const { data, error } = await supabase
      .from('bikes')
      .update({ status })
      .eq('id_bicicleta', id_bicicleta)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  res.status(405).json({ error: 'Method not allowed' })
}
