import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { name, dni, email, phone, address } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Missing required fields' });

  const { error } = await supabase
    .from('pending_users')
    .insert([{ name, dni, email, phone, address }]);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json({ success: true });
}

const handleApprove = async (pendingUser) => {
  // Insert into users table
  await supabase.from('users').insert([{
    name: pendingUser.name,
    dni: pendingUser.dni,
    email: pendingUser.email
  }])
  // Remove from pending_users
  await supabase.from('pending_users').delete().eq('id', pendingUser.id);
  // Do NOT call fetchPendingUsers() here
  // The frontend should refetch after the API call
}