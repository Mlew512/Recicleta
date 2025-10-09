import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabaseClient'

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setname] = useState('')
  const [dni, setDni] = useState('')
  const [canSignUp, setCanSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkUsers = async () => {
      const { data, error } = await supabase.from('users').select('id').limit(1)
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      if (!data || data.length === 0) setCanSignUp(true)
      setLoading(false)
    }
    checkUsers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Sign up admin user
      const { data: authData, error: supError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, dni, role: 'admin' },
        },
      })
      if (supError) throw supError

      // Insert into users table
      const { error: dbError } = await supabase.from('users').insert([{ name, dni, email, role: 'admin' }])
      if (dbError) throw dbError

      router.push('/')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Layout><p>Loading...</p></Layout>

  if (!canSignUp)
    return (
      <Layout>
        <p className="text-center mt-16">Admin already exists. Please <a href="/" className="text-blue-500 underline">log in</a>.</p>
      </Layout>
    )

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-16 p-6 border rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Create First Admin</h1>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Name" value={name} onChange={e => setname(e.target.value)} required className="w-full border px-2 py-1 rounded" />
          <input type="text" placeholder="DNI" value={dni} onChange={e => setDni(e.target.value)} className="w-full border px-2 py-1 rounded" />
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full border px-2 py-1 rounded" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full border px-2 py-1 rounded" />
          <button type="submit" disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded w-full">
            {loading ? 'Creating...' : 'Create Admin'}
          </button>
        </form>
      </div>
    </Layout>
  )
}
