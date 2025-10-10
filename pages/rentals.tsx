import Layout from '@/components/Layout'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Database } from '@/lib/database.types'
import { useLanguage } from "@/context/LanguageContext";
import { mutate } from "swr";
import { useRouter } from "next/router";

type Rental = Database['public']['Tables']['rentals']['Row']
type Bike = Database['public']['Tables']['bikes']['Row']
type User = Database['public']['Tables']['users']['Row']
type RentalType = 'adult' | 'child' | 'charity' | ''

export default function RentalsPage() {
  const router = useRouter();
  const selectedBikeFromQuery = router.query.bike as string;
  const { lang, toggleLang } = useLanguage();
  const [rentals, setRentals] = useState<Rental[]>([])
  const [bikes, setBikes] = useState<Bike[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedBike, setSelectedBike] = useState<string>(selectedBikeFromQuery || "")
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [rentalType, setRentalType] = useState<RentalType>('')
  const [search, setSearch] = useState('')
  const [bikeSearch, setBikeSearch] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const rentalsPerPage = 10

  // Use useCallback to memoize loadData
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: bikesData }, { data: usersData }, { data: rentalsData }] = await Promise.all([
        supabase.from('bikes').select('*'),
        supabase.from('users').select('*'),
        supabase.from('rentals').select(`
          *,
          bikes (
            id, bike_id, type, status, brand_model, size, condition
          ),
          users (
            id, name, email, dni
          )
        `)
      ]);

      if (bikesData) setBikes(bikesData);
      if (usersData) setUsers(usersData);
      if (rentalsData) setRentals(rentalsData);
    } catch (err: unknown) {
      console.error('Error loading data:', err);
      setMessage('Error loading data');
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies since all setState functions are stable

  // Now useEffect won't complain about the dependency
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Example rental fee logic for different bike types
  const getRentalFee = (bikeType: string | undefined, rentalType: RentalType): number => {
    // For charity rentals
    if (rentalType === "charity") return 0;
    
    // Initial rental period is free (covered by deposit)
    // This will be adjusted when the rental is closed based on duration
    return 0;
  };

  const getDeposit = (rentalType: RentalType): number => {
    if (rentalType === "adult") return 50;
    if (rentalType === "child") return 30;
    return 0;
  };

  const startRental = async () => {
    if (!selectedBike || !selectedUser || !rentalType) {
      setMessage('Please select a bike, user, and rental type.')
      return
    }

    const deposit = rentalType === "adult" ? 50 : 
                   rentalType === "child" ? 30 : 0;

    const { error } = await supabase.from("rentals").insert([
      {
        transaction_id: `T${Date.now()}`,
        bike_id: selectedBike,
        user_id: selectedUser || null,
        start_date: new Date().toISOString().split("T")[0],
        status: "Activo",
        rental_fee: 0, // Actual fee will be calculated on close
        deposit: deposit,
        total_cost: 0, // Will be calculated when closed
        user_type: rentalType || "adult",
      },
    ]);

    if (error) {
      setMessage('Error starting rental: ' + error.message)
      return
    }

    await supabase.from('bikes').update({ status: 'En uso' }).eq('id', selectedBike)
    setMessage('Rental started successfully!')

    await loadData();

    setSelectedBike('')
    setSelectedUser('')
    setRentalType('')

    mutate("/api/revenue");
  }

  const closeRental = async (rental: Rental) => {
    const confirmed = window.confirm('Are you sure you want to close this rental?')
    if (!confirmed) return

    const damageInput = window.prompt('Enter damage cost in € (if any):', '0')
    const damageCost = parseFloat(damageInput || '0')
    if (isNaN(damageCost) || damageCost < 0) {
      setMessage('Invalid damage cost entered.')
      return
    }

    const start = new Date(rental.start_date);
    const end = new Date();

    let totalCost = 0;
    let refund = 0;

    // Calculate number of days between start and end dates
    const msPerDay = 1000 * 60 * 60 * 24;
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / msPerDay));

    // Calculate number of 3-month periods (minimum 1)
    const periods = Math.max(1, Math.ceil(days / 90)); // 90 days = ~3 months

    const isChildRental =
      rental.user_type === 'child' ||
      rental.bikes?.type?.toLowerCase() === 'childrens';

    if (isChildRental) {
      // Children's bikes: 5 euro per 3-month period, 30 euro deposit
      totalCost = periods * 5;
      refund = Math.max(30 - totalCost - damageCost, 0);
    } else if (rental.user_type === 'charity') {
      totalCost = 0;
      refund = 0;
    } else {
      // Adult bikes: 10 euro per 3-month period, 50 euro deposit
      totalCost = periods * 10 + damageCost;
      refund = Math.max(50 - totalCost, 0);
    }

    // Add damage cost if any
    if (damageCost > 0) {
      totalCost += damageCost;
      refund = Math.max(refund - damageCost, 0);
    }

    const { error: updateError } = await supabase
      .from('rentals')
      .update({
        end_date: end.toISOString(),
        total_cost: totalCost,
        deposit_refund: refund,
        status: 'Completado'
      })
      .eq('id', rental.id);

    if (updateError) throw updateError;

    await supabase.from('bikes').update({ status: 'Disponible' }).eq('id', rental.bike_id)

    setMessage(
      `Rental closed. ${
        rental.user_type === 'charity'
          ? 'Charity rental — no charges.'
          : `Damage: €${damageCost}, Refund: €${refund}`
      }`
    )

    await loadData();
  }

  const filteredRentals = rentals.filter((r: Rental) => {
    const q = search.toLowerCase();
    return (
      r.bikes?.bike_id?.toLowerCase().includes(q) ||
      r.users?.name?.toLowerCase().includes(q) ||
      r.users?.dni?.toLowerCase().includes(q) ||
      r.users?.email?.toLowerCase().includes(q)
    );
  })

  const totalPages = Math.ceil(filteredRentals.length / rentalsPerPage)
  const currentRentals = filteredRentals.slice((page - 1) * rentalsPerPage, page * rentalsPerPage)

  const filteredBikes = bikes.filter(
    (b) =>
      b.status === 'Disponible' &&
      (
        b.bike_id.toLowerCase().includes(bikeSearch.toLowerCase()) ||
        (b.brand_model?.toLowerCase().includes(bikeSearch.toLowerCase()))
      )
  );
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.dni.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  )

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
    deposit: lang === "en" ? "Deposit (€)" : "Depósito (€)",
    cost: lang === "en" ? "Cost (€)" : "Costo (€)",
    damages: lang === "en" ? "Damages (€)" : "Daños (€)",
    refund: lang === "en" ? "Refund (€)" : "Reembolso (€)",
    status: lang === "en" ? "Status" : "Estado",
    actions: lang === "en" ? "Actions" : "Acciones",
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
                      {b.bike_id} – {b.brand_model}
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
                onChange={(e) => setRentalType(e.target.value as RentalType)}
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
                  <th className="p-2 border">{labels.deposit}</th>
                  <th className="p-2 border">{labels.cost}</th>
                  <th className="p-2 border">{labels.damages}</th>
                  <th className="p-2 border">{labels.refund}</th>
                  <th className="p-2 border">{labels.status}</th>
                  <th className="p-2 border">{labels.actions}</th>
                </tr>
              </thead>
              <tbody>
                {currentRentals.length === 0 && (
                  <tr>
                    <td colSpan={12} className="p-4 text-center text-gray-500">
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
                    {/* Deposit: always show */}
                    <td className="p-2 border">{r.deposit ?? '-'}</td>
                    {/* Cost: show when completed, hide while active */}
                    <td className="p-2 border">
                      {r.status === "Completado" ? r.total_cost ?? '-' : '-'}
                    </td>
                    {/* Damages: show when completed, hide while active */}
                    <td className="p-2 border">
                      {r.status === "Completado" ? r.damage_cost ?? '-' : '-'}
                    </td>
                    {/* Refund: show when completed, hide while active */}
                    <td className="p-2 border font-semibold text-green-700">
                      {r.status === "Completado" ? r.deposit_refund ?? '-' : '-'}
                    </td>
                    <td className="p-2 border">{r.status}</td>
                    <td className="p-2 border text-center">
                      {r.status === "Activo" && (
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
