import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Layout from "@/components/Layout";
import { useLanguage } from "@/context/LanguageContext";

const PAGE_SIZE = 9;

const sizeToHeightOrAge: Record<string, { height: string; age?: string }> = {
  XXS: { height: "140–150 cm" },
  XS: { height: "150–160 cm" },
  S: { height: "160–168 cm" },
  M: { height: "168–175 cm" },
  L: { height: "175–183 cm" },
  XL: { height: "183–190 cm" },
  XXL: { height: "190+ cm" },
  "Childrens-XXS": { height: "100–115 cm", age: "Ages 3–5" },
  "Childrens-XS": { height: "110–120 cm", age: "Ages 4–6" },
  "Childrens-S": { height: "115–130 cm", age: "Ages 5–7" },
  "Childrens-M": { height: "130–145 cm", age: "Ages 6–8" },
  "Childrens-L": { height: "145–160 cm", age: "Ages 7–9" },
  "Childrens-XL": { height: "155–170 cm", age: "Ages 8–11" },
  "Childrens-XXL": { height: "160–175 cm", age: "Ages 10–13" },
};

const bikeTypeLabels: Record<string, { en: string; es: string }> = {
  Hybrid: { en: "Hybrid", es: "Híbrida" },
  Mountain: { en: "Mountain", es: "Montaña" },
  Gravel: { en: "Gravel", es: "Grava" },
  Folding: { en: "Folding", es: "Plegable" },
  BMX: { en: "BMX", es: "BMX" },
  Childrens: { en: "Childrens", es: "Infantil" },
  Road: { en: "Road", es: "Carretera" },
};

// add this condition labels mapping
const conditionLabels: Record<string, { en: string; es: string }> = {
  Good: { en: "Good", es: "Bueno" },
  "Needs Maintenance": { en: "Needs maintenance", es: "Necesita mantenimiento" },
  // add other condition keys if you use them in DB
};

type Bike = {
  id: number | string;
  condition: string;
  brand_model?: string | null;
  bike_id?: string | null;
  type: string;
  size: string;
  photo_url?: string | null;
  status?: string | null;
};

export default function AvailableBikesPage() {
  const { lang } = useLanguage();
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [userHeight, setUserHeight] = useState<string>("");
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // close lightbox on ESC
  useEffect(() => {
    if (!lightboxSrc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxSrc(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxSrc]);

  useEffect(() => {
    supabase
      .from("bikes")
      .select("*")
      .eq("status", "Disponible")
      .then(({ data }) => setBikes(data || []));
  }, []);

  // Helper to check if a bike fits the user's height
  function fitsUserHeight(bike: Bike, height: number) {
    let range: string | undefined;
    if (bike.type === "Childrens") {
      range = sizeToHeightOrAge[`Childrens-${bike.size}`]?.height;
    } else {
      range = sizeToHeightOrAge[bike.size]?.height;
    }
    if (!range) return false;

    // Handle "190+ cm" and similar
    if (range.includes("+")) {
      const min = Number(range.replace("+ cm", ""));
      return height >= min;
    }
    // Handle "100–115 cm" and similar
    const [minStr, maxStr] = range.replace(" cm", "").split("–");
    const min = Number(minStr);
    const max = Number(maxStr);
    return height >= min && height <= max;
  }

  // Filter by type, name, height, or size
  const filteredBikes = bikes.filter((bike) => {
    const typeLabel = bikeTypeLabels[bike.type]?.[lang] || bike.type;
    const sizeLabel =
      bike.type === "Childrens"
        ? sizeToHeightOrAge[`Childrens-${bike.size}`]?.age
        : sizeToHeightOrAge[bike.size]?.height;

    // If userHeight is set, only show bikes that fit
    if (userHeight) {
      const heightNum = Number(userHeight);
      if (!fitsUserHeight(bike, heightNum)) return false;
    }

    return (
      (bike.brand_model?.toLowerCase().includes(search.toLowerCase()) ||
        typeLabel?.toLowerCase().includes(search.toLowerCase()) ||
        bike.size?.toLowerCase().includes(search.toLowerCase()) ||
        (sizeLabel && sizeLabel.toLowerCase().includes(search.toLowerCase())))
    );
  });

  // Pagination logic
  const totalBikes = filteredBikes.length;
  const totalPages = Math.ceil(totalBikes / PAGE_SIZE);
  const paginatedBikes = filteredBikes.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">
          {lang === "en" ? "Available Bikes" : "Bicicletas disponibles"}
        </h1>
        <div className="mb-4 text-gray-700 font-medium">
          {lang === "en"
            ? `Total available: ${totalBikes}`
            : `Total disponibles: ${totalBikes}`}
        </div>
        {/* User height search */}
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col w-full sm:w-1/3">
            <label className="font-semibold mb-1" htmlFor="height-search">
              {lang === "en"
                ? "Rider Height (cm)"
                : "Altura del ciclista (cm)"}
            </label>
            <input
              id="height-search"
              type="number"
              min={80}
              max={220}
              placeholder={
                lang === "en"
                  ? "Enter your height (cm) to find matching bikes..."
                  : "Introduce tu altura (cm) para ver bicis adecuadas..."
              }
              value={userHeight}
              onChange={(e) => {
                setUserHeight(e.target.value);
                setPage(1);
              }}
              className="border px-3 py-2 rounded w-full"
            />
          </div>
          <div className="flex flex-col w-full">
            <label className="font-semibold mb-1" htmlFor="general-search">
              {lang === "en"
                ? "Search"
                : "Buscar"}
            </label>
            <input
              id="general-search"
              type="text"
              placeholder={
                lang === "en"
                  ? "Search by type, name or size..."
                  : "Buscar por tipo, nombre o talla..."
              }
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="border px-3 py-2 rounded w-full"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {paginatedBikes.map((bike) => (
            <div
              key={bike.id}
              className="bg-white rounded-lg shadow p-4 flex flex-col"
            >
              <div className="font-bold text-lg mb-2">
                {bike.brand_model}
              </div>
              <div className="mb-1">
                <span className="font-medium">
                  {bikeTypeLabels[bike.type]?.[lang] || bike.type}
                </span>{" "}
                <span className="text-sm text-gray-600">| {bike.size}</span>
                {bike.condition ? (
                  <span className="ml-2 inline-block text-sm text-gray-700">
                    — {conditionLabels[bike.condition]?.[lang] || bike.condition}
                  </span>
                ) : null}
              </div>
              <div className="text-gray-600 text-sm mb-2">
                {bike.type === "Childrens"
                  ? (sizeToHeightOrAge[`Childrens-${bike.size}`]?.age
                      ? (lang === "en"
                          ? `Recommended: ${sizeToHeightOrAge[`Childrens-${bike.size}`]?.age}`
                          : `Recomendado: ${sizeToHeightOrAge[`Childrens-${bike.size}`]?.age}`)
                      : "")
                  : (sizeToHeightOrAge[bike.size]?.height
                      ? (lang === "en"
                          ? `Recommended height: ${sizeToHeightOrAge[bike.size]?.height}`
                          : `Altura recomendada: ${sizeToHeightOrAge[bike.size]?.height}`)
                      : "")}
              </div>
              {bike.photo_url && (
                <button
                  type="button"
                  onClick={() => setLightboxSrc(bike.photo_url || null)}
                  className="block w-full mb-2 p-0 border-0 bg-transparent"
                  aria-label={lang === "en" ? "Open image" : "Abrir imagen"}
                >
                  <img
                    src={bike.photo_url}
                    alt={bike.brand_model || "bike"}
                    className="rounded w-full h-40 object-cover mb-2 cursor-zoom-in"
                  />
                </button>
              )}
              {/* Notes removed from display */}
            </div>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
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
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            >
              {lang === "en" ? "Next" : "Siguiente"}
            </button>
          </div>
        )}
        {paginatedBikes.length === 0 && (
          <div className="text-gray-500 mt-8 text-center">
            {lang === "en"
              ? "No bikes available."
              : "No hay bicicletas disponibles."}
          </div>
        )}
      </div>
      {/* Lightbox / Image modal */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxSrc(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-w-[95vw] max-h-[95vh]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxSrc(null)}
              className="absolute -top-3 -right-3 bg-white rounded-full p-2 shadow"
              aria-label={lang === "en" ? "Close image" : "Cerrar imagen"}
            >
              ✕
            </button>
            <img src={lightboxSrc} alt="bike" className="max-w-full max-h-[85vh] rounded" />
          </div>
        </div>
      )}
    </Layout>
  );
}