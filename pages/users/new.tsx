// pages/users/new.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabaseClient'

interface UserForm {
  name: string
  dni: string
  email: string
}

export default function NewUserPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [form, setForm] = useState<UserForm>({
    name: '',
    dni: '',
    email: '',
  })
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error || !session) {
        router.replace('/login')
        return
      }

      const token = session.access_token

      const res = await fetch('/api/me', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        router.replace('/login')
        return
      }

      const user = await res.json()
      setCurrentUser(user)
      setLoadingUser(false)

      if (user.role !== 'admin') {
        router.replace('/')
      }
    }

    fetchUser()
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingSubmit(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not signed in')

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create user')
      }

      router.push('/users')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingSubmit(false)
    }
  }

  if (loadingUser) return <Layout><p>Loading...</p></Layout>
  if (!currentUser) return null

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Add New User</h1>
      {error && <p className="text-red-500 mb-2">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block font-semibold">Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full border px-2 py-1 rounded"
          />
        </div>

        <div>
          <label className="block font-semibold">DNI</label>
          <input
            type="text"
            name="dni"
            value={form.dni}
            onChange={handleChange}
            className="w-full border px-2 py-1 rounded"
          />
        </div>

        <div>
          <label className="block font-semibold">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full border px-2 py-1 rounded"
          />
        </div>

        <button
          type="submit"
          disabled={loadingSubmit}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {loadingSubmit ? 'Saving...' : 'Add User'}
        </button>
      </form>
    </Layout>
  )
}
