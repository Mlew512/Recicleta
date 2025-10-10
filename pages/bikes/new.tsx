// pages/bikes/new.tsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabaseClient'
import dayjs from "dayjs";

interface BikeForm {
  bike_id: string
  type: string
  brand_model: string
  size: string
  condition: string
  status: string
  assigned_user_id?: number | null
  last_maintenance?: string | null
  notes?: string | null
}

export default function NewBikePage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<Record<string, unknown>>(null)
  const [form, setForm] = useState<BikeForm>({
    bike_id: '',
    type: '',
    brand_model: '',
    size: '',
    condition: '',
    status: 'Disponible',
    assigned_user_id: null,
    last_maintenance: null,
    notes: null,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<Array<Record<string, unknown>>>([])
  const [bikes, setBikes] = useState<Array<Record<string, unknown>>>([]);

  // Fetch current user session
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login') // redirect if not logged in
        return
      }
      setCurrentUser(session.user)
    }
    getUser()
  }, [router])

  // Fetch all users for assigning bikes
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('users').select('id, name')
      if (error) console.error(error)
      else setUsers(data)
    }
    fetchUsers()
  }, [])

  // Fetch all bikes to determine next available ID
  useEffect(() => {
    const fetchBikes = async () => {
      const { data, error } = await supabase.from('bikes').select('bike_id');
      if (error) console.error(error);
      else setBikes(data || []);
    };
    fetchBikes();
  }, []);

  // Auto-populate bike_id with next available (yy000 format)
  useEffect(() => {
    if (bikes.length === 0) {
      // If no bikes, start with current year + '001'
      const year = dayjs().format("YY");
      setForm(prev => ({ ...prev, bike_id: `${year}001` }));
      return;
    }
    // Find max bike_id for current year
    const year = dayjs().format("YY");
    const yearBikes = bikes
      .map(b => String(b.bike_id))
      .filter(id => id.startsWith(year));
    let nextNumber = 1;
    if (yearBikes.length > 0) {
      const maxNum = Math.max(
        ...yearBikes.map(id => parseInt(id.slice(2), 10)).filter(n => !isNaN(n))
      );
      nextNumber = maxNum + 1;
    }
    const nextId = `${year}${String(nextNumber).padStart(3, "0")}`;
    setForm(prev => ({ ...prev, bike_id: nextId }));
  }, [bikes]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error: dbError } = await supabase.from('bikes').insert([{ ...form }])
      if (dbError) throw dbError

      router.push('/') // redirect after adding
    } catch (err: Record<string, unknown>) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!currentUser) return <Layout><p>Loading...</p></Layout>

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Add a New Bike</h1>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <div>
          <label className="block font-semibold">Bike ID</label>
          <input
            type="text"
            name="bike_id"
            value={form.bike_id}
            onChange={handleChange}
            required
            className="w-full border px-2 py-1 rounded"
          />
        </div>

        <div>
          <label className="block font-semibold">Type</label>
          <input
            type="text"
            name="type"
            value={form.type}
            onChange={handleChange}
            required
            className="w-full border px-2 py-1 rounded"
          />
        </div>

        <div>
          <label className="block font-semibold">Brand / Model</label>
          <input
            type="text"
            name="brand_model"
            value={form.brand_model}
            onChange={handleChange}
            className="w-full border px-2 py-1 rounded"
          />
        </div>

        <div>
          <label className="block font-semibold">Size</label>
          <input
            type="text"
            name="size"
            value={form.size}
            onChange={handleChange}
            className="w-full border px-2 py-1 rounded"
          />
        </div>

        <div>
          <label className="block font-semibold">Condition</label>
          <input
            type="text"
            name="condition"
            value={form.condition}
            onChange={handleChange}
            className="w-full border px-2 py-1 rounded"
          />
        </div>

        <div>
          <label className="block font-semibold">Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full border px-2 py-1 rounded"
          >
            <option value="Disponible">Disponible</option>
            <option value="En uso">En uso</option>
            <option value="Mantenimiento">Mantenimiento</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold">Assign to User</label>
          <select
            name="assigned_user_id"
            value={form.assigned_user_id || ''}
            onChange={handleChange}
            className="w-full border px-2 py-1 rounded"
          >
            <option value="">Unassigned</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold">Last Maintenance</label>
          <input
            type="date"
            name="last_maintenance"
            value={form.last_maintenance || ''}
            onChange={handleChange}
            className="w-full border px-2 py-1 rounded"
          />
        </div>

        <div>
          <label className="block font-semibold">Notes</label>
          <textarea
            name="notes"
            value={form.notes || ''}
            onChange={handleChange}
            className="w-full border px-2 py-1 rounded"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {loading ? 'Saving...' : 'Add Bike'}
        </button>
      </form>
    </Layout>
  )
}
