// pages/bikes/index.tsx
import Layout from "@/components/Layout";
import Image from "next/image";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import useSWR from "swr";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/router";
import dayjs from "dayjs";

const fetcher = async () => {
  const { data, error } = await supabase
    .from("bikes")
    .select("*")
    .order("id", { ascending: false });
  if (error) throw error;
  return data;
};

export default function BikesPage() {
  const { lang } = useLanguage();
  const router = useRouter();

  // =====================
  // Hooks (top-level only)
  // =====================
  const { data: bikes, error, mutate } = useSWR("/api/bikes", fetcher);

  // Add new bike states
  const [bikeId, setBikeId] = useState("");
  const [type, setType] = useState("");
  const [brandModel, setBrandModel] = useState("");
  const [size, setSize] = useState("");
  const [condition, setCondition] = useState("Good");
  const [status, setStatus] = useState("Disponible");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Global states
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Edit modal states
  const [editingBike, setEditingBike] = useState<Record<string, unknown>>(null);
  const [editBikeId, setEditBikeId] = useState("");
  const [editType, setEditType] = useState("");
  const [editBrandModel, setEditBrandModel] = useState("");
  const [editSize, setEditSize] = useState("");
  const [editCondition, setEditCondition] = useState("Good");
  const [editStatus, setEditStatus] = useState("Disponible");
  const [editNotes, setEditNotes] = useState("");
  const [editPhoto, setEditPhoto] = useState<File | null>(null);
  const [editUploading, setEditUploading] = useState(false);

  // Auto-populate bikeId with next available (yy000 format)
  // This effect runs when bikes data changes
  useEffect(() => {
    if (!bikes) return;
    const year = dayjs().format("YY");
    // Filter bike_ids for current year
    const yearBikes = bikes
      .map((b: Record<string, unknown>) => String(b.bike_id))
      .filter(id => id.startsWith(year));
    let nextNumber = 1;
    if (yearBikes.length > 0) {
      const maxNum = Math.max(
        ...yearBikes.map(id => parseInt(id.slice(2), 10)).filter(n => !isNaN(n))
      );
      nextNumber = maxNum + 1;
    }
    const nextId = `${year}${String(nextNumber).padStart(3, "0")}`;
    setBikeId(nextId);
  }, [bikes]);

  // Early returns
  if (error)
    return (
      <Layout>
        <p>
          {lang === "en" ? "Error loading bikes" : "Error cargando bicicletas"}
        </p>
      </Layout>
    );
  if (!bikes)
    return (
      <Layout>
        <p>{lang === "en" ? "Loading..." : "Cargando..."}</p>
      </Layout>
    );

  // Filter & search
  const filteredBikes = bikes.filter((bike) => {
    const text =
      `${bike.bike_id} ${bike.brand_model} ${bike.type} ${bike.size} ${bike.condition}`.toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());
    const matchesFilter =
      filter === "all"
        ? true
        : filter === "available"
        ? bike.status === "Disponible"
        : bike.status !== "Disponible";
    return matchesSearch && matchesFilter;
  });

  // Pagination
  const totalPages = Math.ceil(filteredBikes.length / itemsPerPage);
  const paginatedBikes = filteredBikes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // =====================
  // Add Bike
  // =====================
  const addBike = async () => {
    if (!bikeId) {
      setMessage(lang === "en" ? "Enter bike ID" : "Ingrese ID de bicicleta");
      return;
    }
    let photoUrl = null;
    if (photo) {
      try {
        setUploading(true);
        const ext = photo.name.split(".").pop();
        const fileName = `${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("bike-photos")
          .upload(fileName, photo);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage
          .from("bike-photos")
          .getPublicUrl(fileName);
        photoUrl = publicUrlData?.publicUrl || null;
      } catch (err: Record<string, unknown>) {
        setMessage(
          (lang === "en"
            ? "Error uploading photo: "
            : "Error subiendo foto: ") + err.message
        );
        return;
      } finally {
        setUploading(false);
      }
    }
    const { error: insertError } = await supabase.from("bikes").insert([
      {
        bike_id: bikeId,
        type,
        brand_model: brandModel,
        size,
        condition,
        status,
        notes,
        photo_url: photoUrl,
      },
    ]);
    if (insertError)
      setMessage(
        (lang === "en"
          ? "Error adding bike: "
          : "Error agregando bicicleta: ") + insertError.message
      );
    else {
      setBikeId("");
      setType("");
      setBrandModel("");
      setSize("");
      setCondition("Good");
      setStatus("Disponible");
      setNotes("");
      setPhoto(null);
      setMessage(
        lang === "en" ? "Bike added successfully!" : "Bicicleta agregada!"
      );
      mutate();
    }
  };
  

  // =====================
  // Delete Bike
  // =====================
  const deleteBike = async (id: number) => {
    if (!confirm(lang === "en" ? "Are you sure?" : "¿Está seguro?")) return;
    const { error } = await supabase.from("bikes").delete().eq("id", id);
    if (error)
      setMessage(
        (lang === "en"
          ? "Error deleting bike: "
          : "Error eliminando bicicleta: ") + error.message
      );
    else {
      setMessage(lang === "en" ? "Bike deleted!" : "Bicicleta eliminada!");
      mutate();
    }
  };

  // =====================
  // Edit Bike
  // =====================
  const openEditModal = (bike: Record<string, unknown>) => {
    setEditingBike(bike);
    setEditBikeId(bike.bike_id);
    setEditType(bike.type);
    setEditBrandModel(bike.brand_model);
    setEditSize(bike.size);
    setEditCondition(bike.condition);
    setEditStatus(bike.status);
    setEditNotes(bike.notes || "");
    setEditPhoto(null);
  };

  const saveEditBike = async () => {
    let photoUrl = editingBike.photo_url || null;
    if (editPhoto) {
      try {
        setEditUploading(true);
        const ext = editPhoto.name.split(".").pop();
        const fileName = `${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("bike-photos")
          .upload(fileName, editPhoto);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage
          .from("bike-photos")
          .getPublicUrl(fileName);
        photoUrl = publicUrlData?.publicUrl || null;
      } catch (err: Record<string, unknown>) {
        setMessage(
          (lang === "en"
            ? "Error uploading photo: "
            : "Error subiendo foto: ") + err.message
        );
        return;
      } finally {
        setEditUploading(false);
      }
    }

    const { error } = await supabase
      .from("bikes")
      .update({
        bike_id: editBikeId,
        type: editType,
        brand_model: editBrandModel,
        size: editSize,
        condition: editCondition,
        status: editStatus,
        notes: editNotes,
        photo_url: photoUrl,
      })
      .eq("id", editingBike.id);

    if (error)
      setMessage(
        (lang === "en"
          ? "Error updating bike: "
          : "Error actualizando bicicleta: ") + error.message
      );
    else {
      setMessage(lang === "en" ? "Bike updated!" : "Bicicleta actualizada!");
      setEditingBike(null);
      mutate();
    }
  };

  // =====================
  // Render
  // =====================
  return (
    <Layout>
      <div className="bg-gray-100 min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">
              {lang === "en" ? "Bike Inventory" : "Inventario de Bicicletas"}
            </h1>
          </div>

          {message && (
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-2 mb-4 rounded">
              {message}
            </div>
          )}

          {/* Add New Bike */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {lang === "en" ? "Add New Bike" : "Agregar Bicicleta"}
            </h2>

            {/* Make the form responsive */}
            <form
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-center"
              onSubmit={e => {
                e.preventDefault();
                addBike();
              }}
            >
              <input
                type="text"
                placeholder={lang === "en" ? "Bike ID" : "ID de Bicicleta"}
                value={bikeId}
                onChange={(e) => setBikeId(e.target.value)}
                className="border px-3 py-2 rounded w-full"
              />
              <input
                type="text"
                placeholder={lang === "en" ? "Brand/Model" : "Marca/Modelo"}
                value={brandModel}
                onChange={(e) => setBrandModel(e.target.value)}
                className="border px-3 py-2 rounded w-full"
              />
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="border px-3 py-2 rounded w-full"
              >
                <option value="">
                  {lang === "en" ? "Select Type" : "Seleccionar Tipo"}
                </option>
                <option value="Hybrid">{lang === "en" ? "Hybrid" : "Híbrida"}</option>
                <option value="Mountain">{lang === "en" ? "Mountain" : "Montaña"}</option>
                <option value="Gravel">{lang === "en" ? "Gravel" : "Grava"}</option>
                <option value="Folding">{lang === "en" ? "Folding" : "Plegable"}</option>
                <option value="BMX">BMX</option>
                <option value="Childrens">{lang === "en" ? "Childrens" : "Infantil"}</option>
                <option value="Road">{lang === "en" ? "Road" : "Carretera"}</option>
              </select>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="border px-3 py-2 rounded w-full"
              >
                <option value="">
                  {lang === "en"
                    ? "Select Size (BB–Seatpost Height)"
                    : "Seleccionar Tamaño (Pedalier–Tubo de Sillín)"}
                </option>
                <option value="XS">XS (≈ 38–42 cm)</option>
                <option value="S">S (≈ 43–46 cm)</option>
                <option value="M">M (≈ 47–50 cm)</option>
                <option value="L">L (≈ 51–54 cm)</option>
                <option value="XL">XL (≈ 55–58 cm)</option>
                <option value="XXL">XXL (≈ 59–62 cm)</option>
              </select>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="border px-3 py-2 rounded w-full"
              >
                <option value="Disponible">{lang === "en" ? "Available" : "Disponible"}</option>
                <option value="En uso">{lang === "en" ? "In Use" : "En uso"}</option>
              </select>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="border px-3 py-2 rounded w-full"
              >
                <option value="Good">{lang === "en" ? "Good" : "Bueno"}</option>
                <option value="Needs Maintenance">
                  {lang === "en" ? "Needs Maintenance" : "Necesita Mantenimiento"}
                </option>
              </select>
              <input
                type="text"
                placeholder={lang === "en" ? "Notes" : "Notas"}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="border px-3 py-2 rounded w-full"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                className="border px-3 py-2 rounded bg-gray-50 w-full"
              />
              <button
                type="submit"
                disabled={uploading}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full"
              >
                {uploading
                  ? lang === "en"
                    ? "Uploading..."
                    : "Subiendo..."
                  : lang === "en"
                  ? "Add Bike"
                  : "Agregar"}
              </button>
            </form>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
            <input
              type="text"
              placeholder={lang === "en" ? "Search..." : "Buscar..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border px-3 py-2 rounded w-full md:w-1/2"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border px-3 py-2 rounded"
            >
              <option value="all">{lang === "en" ? "All" : "Todas"}</option>
              <option value="available">
                {lang === "en" ? "Available" : "Disponibles"}
              </option>
              <option value="unavailable">
                {lang === "en"
                  ? "In Use / Maintenance"
                  : "En Uso / Mantenimiento"}
              </option>
            </select>
          </div>

          {/* Bike Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {paginatedBikes.length === 0 ? (
              <p className="col-span-full text-gray-500 text-center">
                {lang === "en"
                  ? "No bikes found"
                  : "No se encontraron bicicletas"}
              </p>
            ) : (
              paginatedBikes.map((bike) => (
                <div key={bike.id} className="bg-white rounded shadow p-4 flex flex-col">
                  <Image
                    src={bike.photo_url || "/bikeplaceholder.png"}
                    alt={bike.brand_model || bike.bike_id}
                    className="h-48 w-full object-cover"
                    width={400}
                    height={192}
                    unoptimized
                  />
                  <div className="p-4 flex-1">
                    <h3 className="text-lg font-semibold mb-1">
                      {bike.brand_model || bike.bike_id}
                    </h3>
                    <p className="text-sm font-medium mb-1">
                      {bike.type} | {bike.size}
                    </p>
                    <p
                      className={`text-sm font-medium mb-2 ${
                        bike.status === "Disponible"
                          ? "text-green-600"
                          : "text-orange-600"
                      }`}
                    >
                      {bike.status}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      {bike.condition}
                    </p>
                    <p className="text-sm text-gray-500 mb-2">{bike.notes}</p>
                    <p className="text-xs text-gray-400 mb-4">{bike.bike_id}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(bike)}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                      >
                        {lang === "en" ? "Edit" : "Editar"}
                      </button>
                      <button
                        onClick={() => deleteBike(bike.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                      >
                        {lang === "en" ? "Delete" : "Eliminar"}
                      </button>
                    </div>
                  </div>
                  <button
                    className="mt-2 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    onClick={() => router.push(`/rentals?bike=${bike.id}`)}
                  >
                    {lang === "en" ? "Rent" : "Alquilar"}
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6 gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded ${
                      page === currentPage
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
          )}

          {/* Edit Modal */}
          {editingBike && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
                <h2 className="text-xl font-semibold mb-4">
                  {lang === "en" ? "Edit Bike" : "Editar Bicicleta"}
                </h2>
                <input
                  type="text"
                  placeholder="Bike ID"
                  value={editBikeId}
                  onChange={(e) => setEditBikeId(e.target.value)}
                  className="border px-3 py-2 rounded w-full mb-3"
                />
                <input
                  type="text"
                  placeholder={lang === "en" ? "Brand/Model" : "Marca/Modelo"}
                  value={editBrandModel}
                  onChange={(e) => setEditBrandModel(e.target.value)}
                  className="border px-3 py-2 rounded w-full mb-3"
                />
                <input
                  type="text"
                  placeholder={lang === "en" ? "Type" : "Tipo"}
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="border px-3 py-2 rounded w-full mb-3"
                />
                <input
                  type="text"
                  placeholder={lang === "en" ? "Size" : "Tamaño"}
                  value={editSize}
                  onChange={(e) => setEditSize(e.target.value)}
                  className="border px-3 py-2 rounded w-full mb-3"
                />
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="border px-3 py-2 rounded w-full mb-3"
                >
                  <option value="Disponible">
                    {lang === "en" ? "Available" : "Disponible"}
                  </option>
                  <option value="En uso">
                    {lang === "en" ? "In Use" : "En uso"}
                  </option>
                </select>
                <select
                  value={editCondition}
                  onChange={(e) => setEditCondition(e.target.value)}
                  className="border px-3 py-2 rounded w-full mb-3"
                >
                  <option value="Good">
                    {lang === "en" ? "Good" : "Bueno"}
                  </option>
                  <option value="Needs Maintenance">
                    {lang === "en"
                      ? "Needs Maintenance"
                      : "Necesita Mantenimiento"}
                  </option>
                </select>
                <input
                  type="text"
                  placeholder={lang === "en" ? "Notes" : "Notas"}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="border px-3 py-2 rounded w-full mb-3"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditPhoto(e.target.files?.[0] || null)}
                  className="border px-3 py-2 rounded w-full mb-4"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingBike(null)}
                    className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                  >
                    {lang === "en" ? "Cancel" : "Cancelar"}
                  </button>
                  <button
                    onClick={saveEditBike}
                    disabled={editUploading}
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {editUploading
                      ? lang === "en"
                        ? "Saving..."
                        : "Guardando..."
                      : lang === "en"
                      ? "Save"
                      : "Guardar"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
