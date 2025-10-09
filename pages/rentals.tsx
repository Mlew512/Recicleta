import Layout from '@/components/Layout'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useLanguage } from "@/context/LanguageContext";
import { mutate } from "swr";
import { useRouter } from "next/router";

export default function RentalsPage() {
  const router = useRouter();
  const selectedBikeFromQuery = router.query.bike as string;
  const { lang, toggleLang } = useLanguage();
  const [rentals, setRentals] = useState<any[]>([])
  const [bikes, setBikes] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBike, setSelectedBike] = useState(selectedBikeFromQuery || "")
  const [selectedUser, setSelectedUser] = useState('')
  const [rentalType, setRentalType] = useState<'adult' | 'child' | 'charity' | ''>('')
  const [search, setSearch] = useState('')
  const [bikeSearch, setBikeSearch] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const rentalsPerPage = 10

  useEffect(() => {
    const loadData = async () => {
      const { data: bikesData } = await supabase.from('bikes').select('id, bike_id, status')
      const { data: usersData } = await supabase.from('users').select('id, name, dni, email')
      const { data: rentalsData } = await supabase
        .from('rentals')
        .select('*, bikes(bike_id), users(name, dni, email)')
        .order('id', { ascending: false })

      setBikes(bikesData || [])
      setUsers(usersData || [])
      setRentals(rentalsData || [])
      setLoading(false)
    }
    loadData()
  }, [])

  const startRental = async () => {
    if (!selectedBike || !selectedUser || !rentalType) {
      setMessage('Please select a bike, user, and rental type.')
      return
    }

    // compute total_cost (rental_fee + deposit) so revenue can include it immediately
    const rentalFee = rentalType === "adult" ? 50 : rentalType === "child" ? 30 : 0; // adjust if you have different logic
    const deposit = rentalType === "adult" ? 50 : rentalType === "child" ? 30 : 0; // adjust if needed
    const totalCost = (Number(rentalFee) || 0) + (Number(deposit) || 0);

    const { data, error } = await supabase.from("rentals").insert([
      {
        transaction_id: `T${Date.now()}`, // ...existing payload...
        bike_id: selectedBike,
        user_id: selectedUser || null,
        start_date: new Date().toISOString().split("T")[0],
        status: "Activo",
        rental_fee: rentalFee,
        deposit: deposit,
        total_cost: totalCost,
        user_type: rentalType || "adult",
        // ...other fields...
      },
    ]);

    if (error) {
      setMessage('Error starting rental: ' + error.message)
      return
    }

    // Mark bike as "In use"
    await supabase.from('bikes').update({ status: 'En uso' }).eq('id', selectedBike)
    setMessage('Rental started successfully!')

    const { data: updatedRentals } = await supabase
      .from('rentals')
      .select('*, bikes(bike_id), users(name,dni,email)')
      .order('id', { ascending: false })
    setRentals(updatedRentals || [])

    setSelectedBike('')
    setSelectedUser('')
    setRentalType('')

    // ensure revenue is refreshed on home page
    mutate("/api/revenue");
    fetchRentals();
  }

  const closeRental = async (rental: any) => {
    const confirmed = window.confirm('Are you sure you want to close this rental?')
    if (!confirmed) return

    const damageInput = window.prompt('Enter damage cost in € (if any):', '0')
    const damageCost = parseFloat(damageInput || '0')
    if (isNaN(damageCost) || damageCost < 0) {
      setMessage('Invalid damage cost entered.')
      return
    }

    const start = new Date(rental.start_date)
    const end = new Date()

    let totalCost = 0
    let refund = 0

    if (rental.user_type === 'charity') {
      // Charity rentals: no cost, no refund, no fees
      totalCost = 0
      refund = 0
    } else {
      const months = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30))
      const costPeriods = Math.ceil(months / 3)
      const rentalFee = costPeriods * 10
      const deposit = rental.user_type === 'adult' ? 50 : 30
      totalCost = rentalFee + damageCost
      refund = Math.max(deposit - totalCost, 0)
    }

    const { error } = await supabase
      .from('rentals')
      .update({
        end_date: end.toISOString().split('T')[0],
        total_cost: totalCost,
        damage_cost: damageCost,
        deposit_refund: refund,
        status: 'Completado',
      })
      .eq('id', rental.id)

    if (error) {
      setMessage('Error closing rental: ' + error.message)
      return
    }

    await supabase.from('bikes').update({ status: 'Disponible' }).eq('id', rental.bike_id)

    setMessage(
      `Rental closed. ${
        rental.user_type === 'charity'
          ? 'Charity rental — no charges.'
          : `Damage: €${damageCost}, Refund: €${refund}`
      }`
    )

    const { data: updatedRentals } = await supabase
      .from('rentals')
      .select('*, bikes(bike_id), users(name,dni,email)')
      .order('id', { ascending: false })
    setRentals(updatedRentals || [])
  }

  if (loading) return <Layout><p>Loading...</p></Layout>

  const filteredRentals = rentals.filter((r) => {
    const q = search.toLowerCase()
    return (
      r.bikes?.bike_id?.toLowerCase().includes(q) ||
      r.users?.name?.toLowerCase().includes(q) ||
      r.users?.dni?.toLowerCase().includes(q) ||
      r.users?.email?.toLowerCase().includes(q)
    )
  })

  const totalPages = Math.ceil(filteredRentals.length / rentalsPerPage)
  const currentRentals = filteredRentals.slice((page - 1) * rentalsPerPage, page * rentalsPerPage)

  const filteredBikes = bikes.filter(
    (b) => b.status === 'Disponible' && b.bike_id.toLowerCase().includes(bikeSearch.toLowerCase())
  )
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.dni.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  )

  // Replace hardcoded strings:
  const labels = {
    title: lang === "en" ? "Bike Rentals" : "Alquiler de Bicicletas",
    startRental: lang === "en" ? "Start New Rental" : "Iniciar Nuevo Alquiler",
    searchBike: lang === "en" ? "Search Bike" : "Buscar Bicicleta",
    selectBike: lang === "en" ? "Select Bike" : "Seleccionar Bicicleta",
    searchUser: lang === "en" ? "Search User" : "Buscar Usuario",
    selectUser: lang === "en" ? "Select User" : "Seleccionar Usuario",
    selectType: lang === "en" ? "Select Type" : "Seleccionar Tipo",
    adult: lang === "en" ? "Adult (€50 deposit)" : "Adulto (Depósito €50)",
    child: lang === "en" ? "Child (€30 deposit)" : "Niño (Depósito €30)",
    charity: lang === "en" ? "Charity (€0 deposit)" : "Caridad (Sin depósito)",
    start: lang === "en" ? "Start Rental" : "Iniciar Alquiler",
    searchPlaceholder: lang === "en"
      ? "Search by Bike ID, Name, DNI, or Email"
      : "Buscar por ID de Bicicleta, Nombre, DNI o Email",
    noRentals: lang === "en" ? "No rentals found." : "No se encontraron alquileres.",
    prev: lang === "en" ? "Prev" : "Anterior",
    next: lang === "en" ? "Next" : "Siguiente",
    page: lang === "en" ? "Page" : "Página",
    of: lang === "en" ? "of" : "de",
    close: lang === "en" ? "Close" : "Cerrar",
    // ...add more as needed
  };

  return (
    <Layout>
      <div className="bg-gray-100 min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">{labels.title}</h1>
            <button
              onClick={toggleLang}
              className="px-3 py-1 bg-gray-200 rounded"
            >
              {lang === "en" ? "ES" : "EN"}
            </button>
          </div>

          {message && (
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-2 mb-4 rounded">
              {message}
            </div>
          )}

          {/* Start New Rental */}
          <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">{labels.startRental}</h2>
            <div className="grid md:grid-cols-5 gap-3 items-center">
              {/* Bike Search */}
              <div>
                <input
                  type="text"
                  placeholder={labels.searchBike}
                  value={bikeSearch}
                  onChange={(e) => setBikeSearch(e.target.value)}
                  className="border px-3 py-2 w-full rounded mb-1"
                />
                <select
                  className="border rounded px-3 py-2 w-full"
                  value={selectedBike}
                  onChange={(e) => setSelectedBike(e.target.value)}
                >
                  <option value="">{labels.selectBike}</option>
                  {filteredBikes.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bike_id}
                    </option>
                  ))}
                </select>
              </div>

              {/* User Search */}
              <div>
                <input
                  type="text"
                  placeholder={labels.searchUser}
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="border px-3 py-2 w-full rounded mb-1"
                />
                <select
                  className="border rounded px-3 py-2 w-full"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  <option value="">{labels.selectUser}</option>
                  {filteredUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.dni})
                    </option>
                  ))}
                </select>
              </div>

              {/* Rental Type */}
              <select
                className="border rounded px-3 py-2 w-full"
                value={rentalType}
                onChange={(e) => setRentalType(e.target.value as 'adult' | 'child' | 'charity')}
              >
                <option value="">{labels.selectType}</option>
                <option value="adult">{labels.adult}</option>
                <option value="child">{labels.child}</option>
                <option value="charity">{labels.charity}</option>
              </select>

              {/* Start Button */}
              <button
                onClick={startRental}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 col-span-2 md:col-span-1"
              >
                {labels.start}
              </button>
            </div>
          </div>

          {/* Search + Rentals Table */}
          <input
            type="text"
            placeholder={labels.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-2 rounded w-full mb-4"
          />

          <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-200 text-gray-800">
                <tr>
                  <th className="p-2 border">ID</th>
                  <th className="p-2 border">Bike</th>
                  <th className="p-2 border">User</th>
                  <th className="p-2 border">Type</th>
                  <th className="p-2 border">Start</th>
                  <th className="p-2 border">End</th>
                  <th className="p-2 border">Cost (€)</th>
                  <th className="p-2 border">Refund (€)</th>
                  <th className="p-2 border">Status</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentRentals.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-4 text-center text-gray-500">
                      {labels.noRentals}
                    </td>
                  </tr>
                )}
                {currentRentals.map((r) => (
                  <tr
                    key={r.id}
                    className={`${
                      r.status === 'Completado'
                        ? 'bg-gray-50'
                        : 'bg-green-50 hover:bg-green-100'
                    } transition`}
                  >
                    <td className="p-2 border">{r.id}</td>
                    <td className="p-2 border">{r.bikes?.bike_id || r.bike_id}</td>
                    <td className="p-2 border">
                      {r.users?.name} ({r.users?.dni})
                    </td>
                    <td className="p-2 border capitalize">{r.user_type}</td>
                    <td className="p-2 border">{r.start_date}</td>
                    <td className="p-2 border">{r.end_date || '-'}</td>
                    <td className="p-2 border">{r.total_cost ?? '-'}</td>
                    <td className="p-2 border font-semibold text-green-700">
                      {r.deposit_refund ?? '-'}
                    </td>
                    <td className="p-2 border">{r.status}</td>
                    <td className="p-2 border text-center">
                      {!r.end_date && (
                        <button
                          onClick={() => closeRental(r)}
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                        >
                          {labels.close}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
            >
              {labels.prev}
            </button>
            <p>
              {labels.page} {page} {labels.of} {totalPages || 1}
            </p>
            <button
              disabled={page === totalPages || totalPages === 0}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
            >
              {labels.next}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
