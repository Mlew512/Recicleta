// pages/bikes/index.tsx
import Layout from "@/components/Layout";
import Image from "next/image";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import useSWR from "swr";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import imageCompression from "browser-image-compression";

const fetcher = async () => {
  const { data, error } = await supabase
    .from("bikes")
    .select("*")
    .order("id", { ascending: false });
  if (error) throw error;
  return data;
};

// Update the Bike interface to include an index signature
interface Bike {
  id: number;                 // <-- add
  bike_id: string;
  type: string;
  brand_model: string;
  size: string;
  condition: string;
  status: string;
  notes?: string | null;      // <-- add
  photo_url?: string | null;  // <-- add
  [key: string]: unknown;
}

// Sizing guides by bike type
const sizingGuides: Record<string, { [size: string]: string }> = {
  Hybrid: {
    XXS: "35–38 cm",
    XS: "39–42 cm",
    S: "43–46 cm",
    M: "47–50 cm",
    L: "51–54 cm",
    XL: "55–58 cm",
    XXL: "59–62 cm",
  },
  Mountain: {
    XXS: "33–36 cm",
    XS: "37–40 cm",
    S: "41–44 cm",
    M: "45–48 cm",
    L: "49–52 cm",
    XL: "53–56 cm",
    XXL: "57–60 cm",
  },
  Road: {
    XXS: "44–47 cm",
    XS: "48–50 cm",
    S: "51–53 cm",
    M: "54–56 cm",
    L: "57–59 cm",
    XL: "60–62 cm",
    XXL: "63–65 cm",
  },
  Gravel: {
    XXS: "44–47 cm",
    XS: "48–50 cm",
    S: "51–53 cm",
    M: "54–56 cm",
    L: "57–59 cm",
    XL: "60–62 cm",
    XXL: "63–65 cm",
  },
  Folding: {
    XXS: "No standard",
    XS: "No standard",
    S: "No standard",
    M: "No standard",
    L: "No standard",
    XL: "No standard",
    XXL: "No standard",
  },
  BMX: {
    XXS: "No standard",
    XS: "No standard",
    S: "No standard",
    M: "No standard",
    L: "No standard",
    XL: "No standard",
    XXL: "No standard",
  },
  Childrens: {
    XXS: "16–18 cm",
    XS: "19–21 cm",
    S: "22–24 cm",
    M: "25–27 cm",
    L: "28–30 cm",
    XL: "31–33 cm",
    XXL: "34–36 cm",
  },
};

// Add this mapping above your BikesPage component:
const sizeToHeightOrAge: Record<string, { height: string; age?: string }> = {
  // Adult bikes
  XXS: { height: "140–150 cm" },
  XS: { height: "150–160 cm" },
  S: { height: "160–168 cm" },
  M: { height: "168–175 cm" },
  L: { height: "175–183 cm" },
  XL: { height: "183–190 cm" },
  XXL: { height: "190+ cm" },
  // Children's bikes (show age)
  "Childrens-XXS": { height: "100–115 cm", age: "Ages 3–5" },
  "Childrens-XS": { height: "110–120 cm", age: "Ages 4–6" },
  "Childrens-S": { height: "115–130 cm", age: "Ages 5–7" },
  "Childrens-M": { height: "130–145 cm", age: "Ages 6–8" },
  "Childrens-L": { height: "145–160 cm", age: "Ages 7–9" },
  "Childrens-XL": { height: "155–170 cm", age: "Ages 8–11" },
  "Childrens-XXL": { height: "160–175 cm", age: "Ages 10–13" },
};

const PAGE_SIZE = 12; // page size for bikes list

export default function BikesPage() {
  const { lang } = useLanguage();
  const router = useRouter();
  const { data: bikes, mutate } = useSWR("/api/bikes", fetcher);

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

  // Pagination state and derived data
  const [page, setPage] = useState(1);
  const items = Array.isArray(bikes) ? bikes : [];
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const paginatedBikes = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1); // reset to first page when list changes
  }, [items.length]);
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
  // =====================
  // Add Bike
  // =====================
  // Helper: consistent storage path per bike (prevents extra files)
  const getBikePhotoPath = (bikePk: number) => `bikes/${bikePk}.jpg`;
  const getPublicUrlWithVersion = (path: string) => {
    const { data } = supabase.storage.from("bike-photos").getPublicUrl(path);
    const url = data?.publicUrl || "";
    return url ? `${url}?v=${Date.now()}` : null;
  };

  // Add Bike: insert first to get ID, then upload with upsert to a fixed path, then update photo_url
  const addBike = async () => {
    // Validation: require brandModel, type, and size
    if (!brandModel || !type || !size) {
      setMessage(
        lang === "en"
          ? "Brand/Model, Type, and Size are required."
          : "Marca/Modelo, Tipo y Tamaño son obligatorios."
      );
      return;
    }
    if (!bikeId) {
      setMessage(lang === "en" ? "Enter bike ID" : "Ingrese ID de bicicleta");
      return;
    }
    try {
      setUploading(true);

      // 1) Create bike without photo to get the new ID
      const { data: inserted, error: insertErr } = await supabase
        .from("bikes")
        .insert([
          {
            bike_id: bikeId,
            type,
            brand_model: brandModel,
            size,
            condition,
            status,
            notes,
            photo_url: null,
          },
        ])
        .select("id")
        .single();
      if (insertErr) throw insertErr;

      let photoUrl: string | null = null;
      if (photo) {
        const path = getBikePhotoPath(inserted.id);
        const { error: uploadErr } = await supabase.storage
          .from("bike-photos")
          .upload(path, photo, {
            upsert: true,
            cacheControl: "0",
            contentType: photo.type,
          });
        if (uploadErr) {
          setMessage((lang === "en" ? "Error uploading photo: " : "Error subiendo foto: ") + uploadErr.message);
          setUploading(false);
          return;
        }
        photoUrl = getPublicUrlWithVersion(path);
      }

      if (photoUrl) {
        const { error: updateErr } = await supabase
          .from("bikes")
          .update({ photo_url: photoUrl })
          .eq("id", inserted.id);
        if (updateErr) {
          setMessage((lang === "en" ? "Error updating photo URL: " : "Error actualizando URL de la foto: ") + updateErr.message);
          setUploading(false);
          return;
        }
      }

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
    } catch (err: unknown) {
      setMessage((lang === "en" ? "Error adding bike: " : "Error agregando bicicleta: ") + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploading(false);
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
  // Add a single draft object for the edit modal to avoid stale cross-bike state
  // 1) State for the edit modal
  type BikeDraft = {
    bike_id: string;
    type: string;
    brand_model: string;
    size: string;
    condition: string;
    status: string;
    notes: string;        // controlled string
    photo_url: string | null;
  };

  const [editingBike, setEditingBike] = useState<Bike | null>(null);
  const [editDraft, setEditDraft] = useState<BikeDraft | null>(null);
  const [editNotesTouched, setEditNotesTouched] = useState(false);
  const [editPhoto, setEditPhoto] = useState<File | null>(null);
  const [editUploading, setEditUploading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Open/Close helpers
  const openEditModal = (bike: Bike) => {
    setEditingBike(bike);
    setEditDraft({
      bike_id: bike.bike_id || "",
      type: bike.type || "",
      brand_model: bike.brand_model || "",
      size: bike.size || "",
      condition: bike.condition || "",
      status: bike.status || "",
      notes: bike.notes ?? "",     // auto-populate notes
      photo_url: bike.photo_url ?? null,
    });
    setEditNotesTouched(false);
    setEditPhoto(null);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingBike(null);
    setEditDraft(null);
    setEditPhoto(null);
    setEditNotesTouched(false);
  };

  // Edit Bike: just overwrite the same fixed path with upsert=true and update photo_url
  const saveEditBike = async () => {
    if (!editingBike || !editDraft) return;

    let photo_url = editDraft.photo_url;

    try {
      if (editPhoto) {
        setEditUploading(true);
        const path = getBikePhotoPath(editingBike.id);
        const { error: uploadErr } = await supabase.storage
          .from("bike-photos")
          .upload(path, editPhoto, { upsert: true, cacheControl: "0", contentType: editPhoto.type });
        if (uploadErr) throw uploadErr;
        photo_url = getPublicUrlWithVersion(path);
      }
    } catch (err: unknown) {
      setMessage((lang === "en" ? "Error uploading photo: " : "Error subiendo foto: ") + (err instanceof Error ? err.message : String(err)));
      setEditUploading(false);
      return;
    } finally {
      setEditUploading(false);
    }

    // If notes were not touched, keep original notes to avoid accidental erase
    const notesToSave = editNotesTouched ? editDraft.notes : (editingBike.notes ?? "");

    const { error } = await supabase
      .from("bikes")
      .update({
        bike_id: editDraft.bike_id,
        type: editDraft.type,
        brand_model: editDraft.brand_model,
        size: editDraft.size,
        condition: editDraft.condition,
        status: editDraft.status,
        notes: notesToSave,
        photo_url,
      })
      .eq("id", editingBike.id);

    if (error) {
      setMessage((lang === "en" ? "Error updating bike: " : "Error actualizando bicicleta: ") + error.message);
      return;
    }

    await mutate();
    closeEditModal();
    setMessage(lang === "en" ? "Bike updated!" : "¡Bicicleta actualizada!");
  };

  // =====================
  // Image Upload Handler
  // =====================
  // const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (!file) return;

  //   // Set options for compression and resizing
  //   const options = {
  //     maxSizeMB: 0.3,           // Target max size in MB (e.g. 300 KB)
  //     maxWidthOrHeight: 1200,   // Resize to max 1200px width or height
  //     useWebWorker: true,
  //   };

  //   try {
  //     const compressedFile = await imageCompression(file, options);

  //     // Now upload compressedFile to Supabase Storage
  //     // await supabase.storage.from('your-bucket').upload('path', compressedFile);

  //   } catch (error) {
  //     console.error("Image compression error:", error);
  //   }
  // };

  // Compressed photo handler
  const handleCompressedPhoto = async (file: File, setter: (f: File | null) => void) => {
    const options = {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
    };
    try {
      const compressedFile = await imageCompression(file, options);
      setter(compressedFile);
    } catch (error) {
      setMessage(
        (lang === "en"
          ? "Image compression error: "
          : "Error de compresión de imagen: ") + (error instanceof Error ? error.message : String(error))
      );
      setter(null);
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
                {type && sizingGuides[type]
                  ? Object.entries(sizingGuides[type]).map(([key, val]) => (
                      <option key={key} value={key}>
                        {key} {val !== "No standard" ? `(${val})` : ""}
                      </option>
                    ))
                  : ["XS", "S", "M", "L", "XL", "XXL"].map(key => (
                      <option key={key} value={key}>
                        {key}
                      </option>
                    ))}
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
                capture="environment" // This hints mobile browsers to use the rear camera
                onChange={async (e) => {
                  const file = e.target.files?.[0] || null;
                  if (!file) {
                    setPhoto(null);
                    return;
                  }
                  // Compress and resize before setting photo
                  await handleCompressedPhoto(file, setPhoto);
                }}
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
                    {bike.size && (
                      <p className="text-xs text-gray-500 mb-1">
                        {bike.type === "Childrens"
                          ? lang === "en"
                            ? `Recommended: ${sizeToHeightOrAge[`Childrens-${bike.size}`]?.age || "Ages 3–13"}`
                            : `Recomendado: ${sizeToHeightOrAge[`Childrens-${bike.size}`]?.age || "3–13 años"}`
                          : lang === "en"
                          ? `Recommended height: ${sizeToHeightOrAge[bike.size]?.height || ""}`
                          : `Altura recomendada: ${sizeToHeightOrAge[bike.size]?.height || ""}`
                        }
                      </p>
                    )}
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
                    </div>
                  </div>
                  {bike.status === "Disponible" && (
                    <button
                      className="mt-2 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                      onClick={() => router.push(`/rentals?bike=${bike.id}`)}
                    >
                      {lang === "en" ? "Rent" : "Alquilar"}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6" role="navigation" aria-label="Pagination">
              <button
                type="button" // important: prevent form submit
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              >
                {lang === "en" ? "Previous" : "Anterior"}
              </button>
              <span className="font-semibold">
                {lang === "en" ? "Page" : "Página"} {page} / {totalPages}
              </span>
              <button
                type="button" // important: prevent form submit
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              >
                {lang === "en" ? "Next" : "Siguiente"}
              </button>
            </div>
          )}

          {/* Edit Modal */}
          {showEditModal && editingBike && editDraft && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div key={editingBike.id} className="bg-white rounded-lg p-6 w/full max-w-md">
                <h2 className="text-xl font-semibold mb-4">
                  {lang === "en" ? "Edit Bike" : "Editar Bicicleta"}
                </h2>

                <input
                  type="text"
                  placeholder="Bike ID"
                  value={editDraft.bike_id}
                  onChange={(e) => setEditDraft(d => d ? { ...d, bike_id: e.target.value } : d)}
                  className="border px-3 py-2 rounded w-full mb-3"
                />

                <input
                  type="text"
                  placeholder={lang === "en" ? "Brand/Model" : "Marca/Modelo"}
                  value={editDraft.brand_model}
                  onChange={(e) => setEditDraft(d => d ? { ...d, brand_model: e.target.value } : d)}
                  className="border px-3 py-2 rounded w-full mb-3"
                />

                <select
                  value={editDraft.type}
                  onChange={(e) => setEditDraft(d => d ? { ...d, type: e.target.value } : d)}
                  className="border px-3 py-2 rounded w-full mb-3"
                >
                  <option value="">{lang === "en" ? "Select Type" : "Seleccionar Tipo"}</option>
                  <option value="Hybrid">{lang === "en" ? "Hybrid" : "Híbrida"}</option>
                  <option value="Mountain">{lang === "en" ? "Mountain" : "Montaña"}</option>
                  <option value="Gravel">{lang === "en" ? "Gravel" : "Grava"}</option>
                  <option value="Folding">{lang === "en" ? "Folding" : "Plegable"}</option>
                  <option value="BMX">BMX</option>
                  <option value="Childrens">{lang === "en" ? "Childrens" : "Infantil"}</option>
                  <option value="Road">{lang === "en" ? "Road" : "Carretera"}</option>
                </select>

                <select
                  value={editDraft.size}
                  onChange={(e) => setEditDraft(d => d ? { ...d, size: e.target.value } : d)}
                  className="border px-3 py-2 rounded w-full mb-3"
                >
                  <option value="">
                    {lang === "en"
                      ? "Select Size (BB–Seatpost Height)"
                      : "Seleccionar Tamaño (Pedalier–Tubo de Sillín)"}
                  </option>
                  {editDraft.type && sizingGuides[editDraft.type]
                    ? Object.entries(sizingGuides[editDraft.type]).map(([key, val]) => (
                        <option key={key} value={key}>
                          {key} {val !== "No standard" ? `(${val})` : ""}
                        </option>
                      ))
                    : ["XS", "S", "M", "L", "XL", "XXL"].map(key => (
                        <option key={key} value={key}>{key}</option>
                      ))}
                </select>

                <select
                  value={editDraft.status}
                  onChange={(e) => setEditDraft(d => d ? { ...d, status: e.target.value } : d)}
                  className="border px-3 py-2 rounded w-full mb-3"
                >
                  <option value="Disponible">{lang === "en" ? "Available" : "Disponible"}</option>
                  <option value="En uso">{lang === "en" ? "In Use" : "En uso"}</option>
                </select>

                <select
                  value={editDraft.condition}
                  onChange={(e) => setEditDraft(d => d ? { ...d, condition: e.target.value } : d)}
                  className="border px-3 py-2 rounded w-full mb-3"
                >
                  <option value="Good">{lang === "en" ? "Good" : "Bueno"}</option>
                  <option value="Needs Maintenance">
                    {lang === "en" ? "Needs Maintenance" : "Necesita Mantenimiento"}
                  </option>
                </select>

                <label className="block text-sm font-medium mb-1">
                  {lang === "en" ? "Notes" : "Notas"}
                </label>
                <textarea
                  value={editDraft.notes}
                  onChange={(e) => {
                    const v = e.target.value;
                    setEditDraft(d => d ? { ...d, notes: v } : d);
                    setEditNotesTouched(true);
                  }}
                  className="border px-3 py-2 rounded w-full mb-4 min-h-[80px]"
                  placeholder={lang === "en" ? "Notes..." : "Notas..."}
                />

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={async (e) => {
                    const file = e.target.files?.[0] || null;
                    if (!file) { setEditPhoto(null); return; }
                    await handleCompressedPhoto(file, setEditPhoto);
                  }}
                  className="border px-3 py-2 rounded w-full mb-4"
                />

                <div className="flex justify-end gap-2">
                  <button
          onClick={() => {
            if (window.confirm(lang === "en" ? "Are you sure you want to delete this bike?" : "¿Está seguro de que quiere eliminar esta bicicleta?")) {
              deleteBike(editingBike.id);
              closeEditModal();
            }
          }}
          className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
        >
          {lang === "en" ? "Delete Bike" : "Eliminar Bicicleta"}
        </button>
                  <button onClick={closeEditModal} className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400">
                    {lang === "en" ? "Cancel" : "Cancelar"}
                  </button>
                  <button onClick={saveEditBike} disabled={editUploading} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
                    {editUploading ? (lang === "en" ? "Saving..." : "Guardando...") : (lang === "en" ? "Save" : "Guardar")}
                  </button>
                </div>
                
              </div>
            </div>
          )        
        }</div>
      </div>
    </Layout>
  );
}