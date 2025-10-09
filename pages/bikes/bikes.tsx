// pages/bikes.tsx
import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabaseClient'

interface Bike {
  id: number
  bike_id: string
  type: string
  brand_model?: string
  size?: string
  condition?: string
  status?: string
  assigned_user_id?: number
  last_maintenance?: string
  notes?: string
}

export default function BikesPage() {
  const [bikes, setBikes] = useState<Bike[]>([])
  const [search, setSearch] = useState('')
  const [filterAvailable, setFilterAvailable] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBikes = async () => {
      setLoading(true)
      const { data, error } = await supabase.from('bikes').select('*')
      if (error) {
        console.error(error)
      } else {
        setBikes(data)
      }
      setLoading(false)
    }
    fetchBikes()
  }, [])

  // Filter and search
  const filteredBikes = bikes.filter(bike => {
    // Filter by availability
    if (filterAvailable && bike.status !== 'Disponible') return false
    // Search across all fields
    const searchLower = search.toLowerCase()
    return Object.values(bike)
      .filter(v => v !== null && v !== undefined)
      .some(v => v.toString().toLowerCase().includes(searchLower))
  })

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Bikes</h1>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border px-2 py-1 rounded flex-1"
        />
        <button
          onClick={() => setFilterAvailable(prev => !prev)}
          className={`px-4 py-1 rounded ${filterAvailable ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          {filterAvailable ? 'Showing Available' : 'Show Available Only'}
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table-auto border-collapse border border-gray-300 w-full">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">Bike ID</th>
                <th className="border p-2">Type</th>
                <th className="border p-2">Brand/Model</th>
                <th className="border p-2">Size</th>
                <th className="border p-2">Condition</th>
                <th className="border p-2">Status</th>
                <th className="border p-2">Last Maintenance</th>
                <th className="border p-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredBikes.map(bike => (
                <tr key={bike.id} className="hover:bg-gray-100">
                  <td className="border p-2">{bike.bike_id}</td>
                  <td className="border p-2">{bike.type}</td>
                  <td className="border p-2">{bike.brand_model || '-'}</td>
                  <td className="border p-2">{bike.size || '-'}</td>
                  <td className="border p-2">{bike.condition || '-'}</td>
                  <td className="border p-2">{bike.status}</td>
                  <td className="border p-2">{bike.last_maintenance || '-'}</td>
                  <td className="border p-2">{bike.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredBikes.length === 0 && <p className="mt-2">No bikes found.</p>}
        </div>
      )}
    </Layout>
  )
}
