// pages/api/users.ts
import { supabase } from '@/lib/supabaseClient'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Optional search query: ?search=John
      const search = req.query.search as string | undefined
      let query = supabase.from('users').select('*')

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
      }

      const { data, error } = await query.order('id', { ascending: true })
      if (error) throw error

      return res.status(200).json(data)
    }

    if (req.method === 'POST') {
      const { name, dni, email } = req.body

      if (!name|| !email) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      const { data, error } = await supabase
        .from('users')
        .insert([{ name, dni, email }])
        .select()

      if (error) throw error

      return res.status(201).json(data[0])
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = req.body
      if (!id) return res.status(400).json({ error: 'User ID is required' })

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()

      if (error) throw error

      return res.status(200).json(data[0])
    }

    if (req.method === 'DELETE') {
      const { id } = req.body
      if (!id) return res.status(400).json({ error: 'User ID is required' })

      const { error } = await supabase.from('users').delete().eq('id', id)
      if (error) throw error

      return res.status(204).end()
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: unknown) {
    // Safely log with type checking
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: unknown }).message === 'string'
    ) {
      console.error(`Error in /api/users: ${(error as { message: string }).message}`);
    } else {
      console.error(`Error in /api/users: Unknown error`);
    }

    return res.status(500).json({ error: 'Server error' });
  }
}