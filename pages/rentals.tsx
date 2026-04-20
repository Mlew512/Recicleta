import Layout from "@/components/Layout";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Database } from "@/lib/database.types";
import { useLanguage } from "@/context/LanguageContext";
import { mutate } from "swr";
import { useRouter } from "next/router";

type Rental = {
  id: string;
  user_id: string;
  bike_id: string;
  start_date: string;
  end_date: string;
  rental_type: string;
  user_type: "adult" | "child" | "charity";
  deposit: number;
  rental_fee: number;
  total_cost: number;
  status: string;
  damage_cost: number;
  deposit_refund: number;
  created_by_email?: string;
  closed_by_email?: string;
  users?: {
    id: string;
    name: string;
    dni: string;
    email: string;
    phone: string;
    address: string;
    // ...other user fields...
  };
  bikes?: {
    id: string;
    brand_model: string;
    bike_id: string;
    type?: string; // <-- Add this line
    photo_url?: string | null;
    // ...other bike fields...
  };
  notes?: string; // <-- New field for rental notes
  // ...other fields if needed...
};

type Bike = Database["public"]["Tables"]["bikes"]["Row"];
type User = Database["public"]["Tables"]["users"]["Row"];
type RentalType = "adult" | "child" | "charity" | "";

function formatDate(dateStr: string, lang: string) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString(lang === "es" ? "es-ES" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function parseEUDate(dateStr: string): Date {
  if (!dateStr) return new Date(0);
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(dateStr);
}

// Add this mapping near the top of your file:
const bikeTypeLabels: Record<string, { en: string; es: string }> = {
  Hybrid: { en: "Hybrid", es: "Híbrida" },
  Mountain: { en: "Mountain", es: "Montaña" },
  Gravel: { en: "Gravel", es: "Grava" },
  Folding: { en: "Folding", es: "Plegable" },
  BMX: { en: "BMX", es: "BMX" },
  Childrens: { en: "Childrens", es: "Infantil" },
  Road: { en: "Road", es: "Carretera" },
};

export default function RentalsPage() {
  const router = useRouter();
  const selectedBikeFromQuery = router.query.bike as string;
  const { lang, toggleLang } = useLanguage();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedBike, setSelectedBike] = useState<string>(
    selectedBikeFromQuery || ""
  );
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [rentalType, setRentalType] = useState<RentalType>("");
  const [search, setSearch] = useState("");
  const [bikeSearch, setBikeSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [notes, setNotes] = useState(""); // Add this state for notes

  const [page, setPage] = useState(1);
  const rentalsPerPage = 10;
  const [editingRentalId, setEditingRentalId] = useState<string | null>(null);
  const [editBikeId, setEditBikeId] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [search, showActiveOnly]);

  const closeLightbox = () => setLightboxSrc(null);

  // Use useCallback to memoize loadData
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: bikesData }, { data: usersData }, { data: rentalsData }] =
        await Promise.all([
          supabase.from("bikes").select("*"),
          supabase.from("users").select("*"),
          supabase.from("rentals").select(`
          *,
          bikes (
            id, bike_id, type, status, brand_model, size, condition, photo_url
          ),
          users (
            id, name, email, dni
          )
        `),
        ]);

      if (bikesData) setBikes(bikesData);
      if (usersData) setUsers(usersData);
      if (rentalsData) setRentals(rentalsData);
    } catch (err: unknown) {
      console.error("Error loading data:", err);
      setMessage("Error loading data");
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies since all setState functions are stable

  // Now useEffect won't complain about the dependency
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Example rental fee logic for different bike types
  const getRentalFee = (
    bikeType: string | undefined,
    rentalType: RentalType
  ): number => {
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
      setMessage("Please select a bike, user, and rental type.");
      return;
    }

    // Get current user email
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userEmail = user?.email || null;

    const deposit =
      rentalType === "adult" ? 50 : rentalType === "child" ? 30 : 0;

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
        created_by_email: userEmail, // <-- This will now work!
        notes: notes.trim() || "",
      },
    ]);

    if (error) {
      setMessage("Error starting rental: " + error.message);
      return;
    }

    await supabase
      .from("bikes")
      .update({ status: "En uso" })
      .eq("id", selectedBike);

    setMessage("Rental started successfully!");

    await loadData();

    setSelectedBike("");
    setSelectedUser("");
    setRentalType("");
    setNotes("");

    mutate("/api/revenue");
  };

  const closeRental = async (rental: Rental) => {
    const confirmed = window.confirm(
      "Are you sure you want to close this rental?"
    );
    if (!confirmed) return;

    const damageInput = window.prompt("Enter damage cost in € (if any):", "0");
    const damageCost = parseFloat(damageInput || "0");
    if (isNaN(damageCost) || damageCost < 0) {
      setMessage("Invalid damage cost entered.");
      return;
    }

    const start = new Date(rental.start_date);
    const end = new Date();

    let totalCost = 0;
    let refund = 0;

    // Calculate number of days between start and end dates
    const msPerDay = 1000 * 60 * 60 * 24;
    const days = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / msPerDay)
    );

    // Calculate number of 3-month periods (minimum 1)
    const periods = Math.max(1, Math.ceil(days / 90)); // 90 days = ~3 months

    const isChildRental =
      rental.user_type === "child" ||
      rental.bikes?.type?.toLowerCase() === "childrens";

    if (isChildRental) {
      // Children's bikes: 5 euro per 3-month period, 30 euro deposit
      totalCost = periods * 5;
      refund = Math.max(30 - totalCost - damageCost, 0);
    } else if (rental.user_type === "charity") {
      totalCost = 0;
      refund = 0;
    } else {
      // Adult bikes: 10 euro per 3-month period, 50 euro deposit
      totalCost = periods * 10 + damageCost;
      refund = Math.max(50 - totalCost, 0);
    }

    // Add damage cost if anyx
    if (damageCost > 0) {
      totalCost += damageCost;
      refund = Math.max(refund - damageCost, 0);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const closerEmail = user?.email || null;

    const { error: updateError } = await supabase
      .from("rentals")
      .update({
        end_date: end.toISOString(),
        total_cost: totalCost,
        deposit_refund: refund,
        status: "Completado",
        closed_by_email: closerEmail,
      })
      .eq("id", rental.id);

    if (updateError) throw updateError;

    await supabase
      .from("bikes")
      .update({ status: "Disponible" })
      .eq("id", rental.bike_id);

    setMessage(
      `Rental closed. ${
        rental.user_type === "charity"
          ? "Charity rental — no charges."
          : `Damage: €${damageCost}, Refund: €${refund}`
      }`
    );

    await loadData();
  };

  const handleEditBike = (rental: Rental) => {
    setEditingRentalId(rental.id);
    setEditBikeId(rental.bike_id);
    setEditNotes(rental.notes || "");
  };

  const handleSaveBike = async (rental: Rental) => {
    await supabase
      .from("rentals")
      .update({ bike_id: editBikeId, notes: editNotes })
      .eq("id", rental.id);

    // Set new bike as "En uso"
    await supabase
      .from("bikes")
      .update({ status: "En uso" })
      .eq("id", editBikeId);

    // Optionally set previous bike as "Disponible" if not rented elsewhere
    if (rental.bike_id !== editBikeId) {
      const { data: otherRentals } = await supabase
        .from("rentals")
        .select("id")
        .eq("bike_id", rental.bike_id)
        .eq("status", "Activo");

      if (!otherRentals || otherRentals.length === 0) {
        await supabase
          .from("bikes")
          .update({ status: "Disponible" })
          .eq("id", rental.bike_id);
      }
    }

    setEditingRentalId(null);
    await loadData();
  };

  const handleCancelEdit = () => {
    setEditingRentalId(null);
  };

  // Improve handleDeleteRental to ensure UI updates
  const handleDeleteRental = async (rentalId: string) => {
    if (
      !confirm(
        lang === "en"
          ? "Are you sure you want to delete this rental?"
          : "¿Estás seguro de que quieres eliminar este alquiler?"
      )
    ) {
      return;
    }

    try {
      setMessage(lang === "en" ? "Deleting..." : "Eliminando...");

      // Find the bike_id first to update its status after deletion
      const { data: rental } = await supabase
        .from("rentals")
        .select("bike_id")
        .eq("id", rentalId)
        .single();

      const bikeId = rental?.bike_id;

      // Delete the rental
      const { error: deleteError } = await supabase
        .from("rentals")
        .delete()
        .eq("id", rentalId);

      if (deleteError) throw deleteError;

      // Update the bike status to Disponible
      if (bikeId) {
        const { error: updateError } = await supabase
          .from("bikes")
          .update({ status: "Disponible" })
          .eq("id", bikeId);

        if (updateError) {
          console.error("Error updating bike status:", updateError);
        }
      }

      setMessage(
        lang === "en"
          ? "Rental deleted successfully!"
          : "¡Alquiler eliminado con éxito!"
      );

      // Update UI immediately (optimistic UI update)
      setRentals((prevRentals) => prevRentals.filter((r) => r.id !== rentalId));

      // Also refresh the data to ensure consistency
      loadData();
    } catch (error: unknown) {
      console.error("Delete error:", error);
      setMessage(
        lang === "en"
          ? "Error deleting rental."
          : "Error al eliminar el alquiler."
      );
    }
  };

  const filteredRentals = rentals.filter((r: Rental) => {
     if (showActiveOnly && r.end_date) return false;
    const q = search.toLowerCase();
    return (
      r.bikes?.bike_id?.toLowerCase().includes(q) ||
      r.users?.name?.toLowerCase().includes(q) ||
      r.users?.dni?.toLowerCase().includes(q) ||
      r.users?.email?.toLowerCase().includes(q)
    );
  });

  // Sort: active first (no end_date), then by start_date descending (newest first)
  const sortedRentals = [...filteredRentals].sort((a, b) => {
    // Active first (no end_date)
    if (!a.end_date && b.end_date) return -1;
    if (a.end_date && !b.end_date) return 1;
    // Newest first
    return parseEUDate(b.start_date).getTime() - parseEUDate(a.start_date).getTime();
  });

  // Use sortedRentals for pagination
  const totalPages = Math.ceil(sortedRentals.length / rentalsPerPage);
  const currentRentals = sortedRentals.slice(
    (page - 1) * rentalsPerPage,
    page * rentalsPerPage
  );

  const filteredBikes = bikes.filter(
    (b) =>
      b.status === "Disponible" &&
      (b.bike_id.toLowerCase().includes(bikeSearch.toLowerCase()) ||
        b.brand_model?.toLowerCase().includes(bikeSearch.toLowerCase()))
  );
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.dni.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

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
    searchPlaceholder:
      lang === "en"
        ? "Search by Bike ID, Name, DNI, or Email"
        : "Buscar por ID de Bicicleta, Nombre, DNI o Email",
    noRentals:
      lang === "en" ? "No rentals found." : "No se encontraron alquileres.",
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
    showActiveOnly: lang === "en" ? "Show only active rentals" : "Mostrar solo alquileres activos",
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
            <form
              className="flex flex-wrap gap-3 items-center"
              onSubmit={(e) => {
                e.preventDefault();
                startRental();
              }}
            >
              {/* Bike Search */}
              <div className="relative flex-1 min-w-[180px]">
                <input
                  type="text"
                  placeholder={labels.searchBike}
                  value={
                    selectedBike
                      ? bikes.find((b) => b.id === selectedBike)?.bike_id +
                        " – " +
                        bikes.find((b) => b.id === selectedBike)?.brand_model
                      : bikeSearch
                  }
                  onChange={(e) => {
                    setBikeSearch(e.target.value);
                    setSelectedBike("");
                  }}
                  className="border px-3 py-2 w-full rounded"
                  autoComplete="off"
                />
                {bikeSearch && filteredBikes.length > 0 && (
                  <div className="absolute left-0 right-0 bg-white border rounded shadow mt-1 z-10 max-h-48 overflow-y-auto">
                    {filteredBikes.map((b) => (
                      <div
                        key={b.id}
                        className="px-3 py-2 cursor-pointer hover:bg-green-100"
                        onClick={() => {
                          setSelectedBike(b.id);
                          setBikeSearch("");
                        }}
                      >
                        <b>{b.bike_id}</b> – {b.brand_model} (
                        {bikeTypeLabels[b.type]?.[lang] || b.type})
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* User Search */}
              <div className="relative flex-1 min-w-[180px]">
                <input
                  type="text"
                  placeholder={labels.searchUser}
                  value={
                    selectedUser
                      ? users.find((u) => u.id === selectedUser)?.name +
                        " (" +
                        users.find((u) => u.id === selectedUser)?.dni +
                        ")"
                      : userSearch
                  }
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setSelectedUser("");
                  }}
                  className="border px-3 py-2 w-full rounded"
                  autoComplete="off"
                />
                {userSearch && filteredUsers.length > 0 && (
                  <div className="absolute left-0 right-0 bg-white border rounded shadow mt-1 z-10 max-h-48 overflow-y-auto">
                    {filteredUsers.map((u) => (
                      <div
                        key={u.id}
                        className="px-3 py-2 cursor-pointer hover:bg-green-100"
                        onClick={() => {
                          setSelectedUser(u.id);
                          setUserSearch("");
                        }}
                      >
                        <b>{u.name}</b> ({u.dni}) – {u.email}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rental Type */}
              <div className="flex-1 min-w-[140px]">
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
              </div>

              {/* Notes Input */}
              <div className="flex-1 min-w-[180px]">
                <input
                  type="text"
                  placeholder={
                    lang === "en" ? "Notes (optional)" : "Notas (opcional)"
                  }
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="border px-3 py-2 rounded w-full"
                />
              </div>

              {/* Start Button */}
              <div>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  {labels.start}
                </button>
              </div>
            </form>
          </div>

          {/* Search + Rentals Table */}
          <div className="flex items-center gap-4 mb-4">
            <input
              type="text"
              placeholder={labels.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border px-3 py-2 rounded flex-1"
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
              />
              {labels.showActiveOnly}
            </label>
          </div>

          {/* Responsive Table for Desktop */}
          <div className="hidden md:block overflow-x-auto bg-white shadow rounded-lg mb-4">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th
                    className="p-2 border text-left"
                    style={{ width: "60px" }}
                  >
                    {lang === "en" ? "Edit" : "Editar"}
                  </th>
                  <th className="p-2 border">Photo</th>
                  <th className="p-2 border">Bike</th>
                  <th className="p-2 border">User</th>
                  <th className="p-2 border">Start</th>
                  <th className="p-2 border">End</th>
                  <th className="p-2 border">Type</th>
                  <th className="p-2 border">Deposit</th>
                  <th className="p-2 border">
                    {lang === "en" ? "Cost (€)" : "Costo (€)"}
                  </th>
                  <th className="p-2 border">
                    {lang === "en" ? "Refund (€)" : "Reembolso (€)"}
                  </th>
                  <th className="p-2 border">
                    {lang === "en" ? "Notes" : "Notas"}
                  </th>
                  <th
                    className="p-2 border text-xs font-normal"
                    style={{ width: "90px" }}
                  >
                    Check-in
                    <br />
                    <span className="text-xs text-gray-500">(user)</span>
                  </th>
                  <th
                    className="p-2 border text-xs font-normal"
                    style={{ width: "90px" }}
                  >
                    Check-out
                    <br />
                    <span className="text-xs text-gray-500">(user)</span>
                  </th>
                  <th
                    className="p-2 border text-right"
                    style={{ width: "120px" }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentRentals.map((rental) => (
                  <tr key={rental.id} className="hover:bg-gray-100">
                    {/* Edit button on the left */}
                    <td className="border p-2 text-left">
                      {editingRentalId === rental.id ? (
                        <>
                          <button
                            className="bg-green-600 text-white px-2 py-1 rounded mr-2"
                            onClick={() => handleSaveBike(rental)}
                          >
                            {lang === "en" ? "Save" : "Guardar"}
                          </button>
                          <button
                            className="bg-gray-400 text-white px-2 py-1 rounded mr-2"
                            onClick={handleCancelEdit}
                          >
                            {lang === "en" ? "Cancel" : "Cancelar"}
                          </button>
                          <button
                            className="bg-red-600 text-white px-2 py-1 rounded"
                            onClick={() => handleDeleteRental(rental.id)}
                          >
                            {lang === "en" ? "Delete" : "Eliminar"}
                          </button>
                        </>
                      ) : (
                        <button
                          className="bg-blue-600 text-white px-2 py-1 rounded"
                          onClick={() => handleEditBike(rental)}
                        >
                          {lang === "en" ? "Edit" : "Editar"}
                        </button>
                      )}
                    </td>
                    <td className="border p-2">
                      <button
                        type="button"
                        onClick={() =>
                          rental.bikes?.photo_url &&
                          setLightboxSrc(rental.bikes.photo_url)
                        }
                        className="h-14 w-20 overflow-hidden rounded p-0 border-0 bg-transparent cursor-pointer"
                      >
                        <Image
                          src={rental.bikes?.photo_url || "/bikeplaceholder.png"}
                          alt={rental.bikes?.brand_model || rental.bike_id}
                          width={80}
                          height={56}
                          className="h-full w-full object-cover"
                          unoptimized
                        />
                      </button>
                    </td>
                    <td className="border p-2">
                      {editingRentalId === rental.id ? (
                        <select
                          className="border px-2 py-1 rounded w-full"
                          value={editBikeId}
                          onChange={(e) => setEditBikeId(e.target.value)}
                        >
                          <option value="">Select a bike</option>
                          {bikes
                            .filter(
                              (b) =>
                                b.status === "Disponible" ||
                                b.id === rental.bike_id
                            )
                            .sort((a, b) =>
                              a.id === rental.bike_id
                                ? -1
                                : b.id === rental.bike_id
                                ? 1
                                : 0
                            ) // Put current bike first
                            .map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.brand_model} • {b.type} • {b.size}
                                {b.id === rental.bike_id ? " • *current" : ""}
                              </option>
                            ))}
                        </select>
                      ) : (
                        rental.bikes?.brand_model || rental.bike_id
                      )}
                    </td>
                    <td className="border p-2">
                      {rental.users?.name || rental.user_id}
                    </td>
                    <td className="border p-2">
                      {formatDate(rental.start_date, lang)}
                    </td>
                    <td className="border p-2">
                      {formatDate(rental.end_date, lang)}
                    </td>
                    <td className="border p-2">
                      {rental.user_type
                        ? rental.user_type.charAt(0).toUpperCase() +
                          rental.user_type.slice(1)
                        : lang === "en"
                        ? "Unknown"
                        : "Desconocido"}
                    </td>
                    <td className="border p-2">{rental.deposit}</td>
                    <td className="border p-2">{rental.total_cost}</td>
                    <td className="border p-2">{rental.deposit_refund}</td>
                    <td className="border p-2 text-xs text-gray-600">
                      {editingRentalId === rental.id ? (
                        <input
                          type="text"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          className="border px-2 py-1 rounded w-full text-xs"
                          placeholder={
                            lang === "en" ? "Edit notes..." : "Editar notas..."
                          }
                        />
                      ) : (
                        rental.notes || ""
                      )}
                    </td>
                    <td className="border p-2 text-xs text-gray-600">
                      {rental.created_by_email?.split("@")[0]}
                    </td>
                    <td className="border p-2 text-xs text-gray-600">
                      {rental.closed_by_email?.split("@")[0]}
                    </td>
                    <td className="border p-2 text-right">
                      {editingRentalId !== rental.id &&
                        rental.status === "Activo" && (
                          <button
                            onClick={() => closeRental(rental)}
                            className="bg-blue-500 text-white px-3 py-1 rounded"
                          >
                            {lang === "en" ? "Return Bike" : "Devolver bici"}
                          </button>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden">
            {currentRentals.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded shadow p-4 mb-4 border"
              >
                {/* Renter's name as card title */}
                <button
                type="button"
                onClick={() => r.bikes?.photo_url && setLightboxSrc(r.bikes.photo_url)}
                className="mb-3 w-full h-40 overflow-hidden rounded p-0 border-0 bg-transparent cursor-pointer"
              >
                <Image
                  src={r.bikes?.photo_url || "/bikeplaceholder.png"}
                  alt={r.bikes?.brand_model || r.bike_id}
                  width={320}
                  height={160}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              </button>
              <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-lg">
                    {r.users?.name ||
                      (lang === "en" ? "Unknown user" : "Usuario desconocido")}
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-gray-200">
                    {r.status}
                  </span>
                </div>
                {/* Bike info */}
                <div className="mb-2">
                  <b>{lang === "en" ? "Bike:" : "Bicicleta:"}</b>{" "}
                  {r.bikes
                    ? `${r.bikes.brand_model} (${r.bikes.bike_id})${
                        r.bikes.type
                          ? " – " +
                            (bikeTypeLabels[r.bikes.type]?.[lang] ||
                              r.bikes.type)
                          : ""
                      }`
                    : r.bike_id}
                </div>
                {/* Inline Edit Bike */}
                {editingRentalId === r.id && (
                  <div className="mb-2">
                    <label className="block mb-1 font-medium">
                      {lang === "en" ? "Change Bike:" : "Cambiar bicicleta:"}
                    </label>
                    <select
                      className="border px-2 py-1 rounded w-full"
                      value={editBikeId}
                      onChange={(e) => setEditBikeId(e.target.value)}
                    >
                      <option value="">Select a bike</option>
                      {bikes
                        .filter(
                          (b) => b.status === "Disponible" || b.id === r.bike_id
                        )
                        .sort((a, b) =>
                          a.id === r.bike_id ? -1 : b.id === r.bike_id ? 1 : 0
                        ) // Put current bike first
                        .map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.brand_model} • {b.type} • {b.size}
                            {b.id === r.bike_id ? " • *current" : ""}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
                {/* Rental details */}
                <div className="text-sm mb-2 space-y-2">
                  <div>
                    <b>{lang === "en" ? "Type:" : "Tipo:"}</b> {r.user_type}
                  </div>
                  <div>
                    <b>{lang === "en" ? "Start:" : "Inicio:"}</b> {formatDate(r.start_date, lang)}
                  </div>
                  {r.end_date && (
                    <div>
                      <b>{lang === "en" ? "End:" : "Fin:"}</b> {formatDate(r.end_date, lang)}
                    </div>
                  )}
                  <div>
                    <b>{lang === "en" ? "Deposit:" : "Depósito:"}</b>{" "}
                    {r.deposit ?? "-"}
                  </div>
                  {r.status === "Completado" && (
                    <>
                      <div>
                        <b>{lang === "en" ? "Cost:" : "Costo:"}</b>{" "}
                        {r.total_cost ?? "-"}
                      </div>
                      <div>
                        <b>{lang === "en" ? "Damages:" : "Daños:"}</b>{" "}
                        {r.damage_cost ?? "-"}
                      </div>
                      <div>
                        <b>{lang === "en" ? "Refund:" : "Reembolso:"}</b>{" "}
                        {r.deposit_refund ?? "-"}
                      </div>
                      <div>
                        <b>{lang === "en" ? "Staff Check-out:" : "Personal egreso:"}</b>{" "}
                        {r.closed_by_email ||
                          (lang === "en" ? "N/A" : "No disponible")}
                      </div>
                    </>
                  )}
                  <div>
                    <b>{lang === "en" ? "Staff Check-in:" : "Personal ingreso:"}</b>{" "}
                    {r.created_by_email ||
                      (lang === "en" ? "N/A" : "No disponible")}
                  </div>
                  {/* New field for notes */}
                  <div>
                    <b>{lang === "en" ? "Notes:" : "Notas:"}</b>{" "}
                    {r.notes || "-"}
                  </div>
                </div>
                {/* Action buttons */}
                <div className="flex gap-2">
                  {editingRentalId === r.id ? (
                    <>
                      <button
                        className="bg-green-600 text-white px-2 py-1 rounded"
                        onClick={() => handleSaveBike(r)}
                      >
                        {lang === "en" ? "Save" : "Guardar"}
                      </button>
                      <button
                        className="bg-gray-400 text-white px-2 py-1 rounded"
                        onClick={handleCancelEdit}
                      >
                        {lang === "en" ? "Cancel" : "Cancelar"}
                      </button>
                    </>
                  ) : (
                    <button
                      className="bg-blue-600 text-white px-2 py-1 rounded"
                      onClick={() => handleEditBike(r)}
                    >
                      {lang === "en" ? "Edit Bike" : "Editar bici"}
                    </button>
                  )}
                  {r.status === "Activo" && (
                    <button
                      onClick={() => closeRental(r)}
                      className="bg-blue-500 text-white px-3 py-1 rounded"
                    >
                      {labels.close}
                    </button>
                  )}
                </div>
              </div>
            ))}
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

          {lightboxSrc && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
              onClick={closeLightbox}
            >
              <button
                type="button"
                className="absolute top-4 right-4 text-white text-2xl"
                onClick={closeLightbox}
              >
                ×
              </button>
              <div className="max-w-[95vw] max-h-[95vh] overflow-hidden rounded shadow-lg">
                <img
                  src={lightboxSrc}
                  alt="Bike full screen"
                  className="max-w-full max-h-[95vh] object-contain"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
