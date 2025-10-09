import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('rentals').select('*').order('fecha_inicio', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const { id_bicicleta, id_usuario, fecha_inicio, fecha_fin, estado } = req.body
    const { data, error } = await supabase.from('rentals').insert([{ id_bicicleta, id_usuario, fecha_inicio, fecha_fin, estado }])
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'PATCH') {
    const { id_transaccion, fecha_fin, estado } = req.body
    const { data, error } = await supabase
      .from('rentals')
      .update({ fecha_fin, estado })
      .eq('id_transaccion', id_transaccion)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  res.status(405).json({ error: 'Method not allowed' })
}
