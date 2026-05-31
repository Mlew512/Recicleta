import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import type { User } from "@supabase/supabase-js";
import RentalPrices from "@/components/RentalPrices";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";


function SplashPage() {
  const { lang, toggleLang } = useLanguage();
  const router = useRouter();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [publicStats, setPublicStats] = useState({
    bikesRepaired: 0,
    freeBikeRentals: 0,
    co2Saved: 0,
    communitySavings: 0,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    const fetchPublicStats = async () => {
      const { count: bikesRepaired } = await supabase
        .from("bikes")
        .select("id", { count: "exact" })
        .eq("condition", "Good");
      const { count: totalRentals } = await supabase
        .from("rentals")
        .select("id", { count: "exact" });
      const { count: freeBikeRentals } = await supabase
        .from("rentals")
        .select("id", { count: "exact" })
        .eq("user_type", "charity");

      if (!mounted) return;
      setPublicStats({
        bikesRepaired: bikesRepaired ?? 0,
        freeBikeRentals: freeBikeRentals ?? 0,
        co2Saved: Math.round((totalRentals ?? 0) * 3),
        communitySavings: (freeBikeRentals ?? 0) * 30,
        loading: false,
      });
    };

    fetchPublicStats();
    return () => {
      mounted = false;
    };
  }, []);

  const labels = {
    bikesRepaired: lang === "en" ? "Bikes Repaired" : "Bicicletas Reparadas",
    bikesRepairedDesc: lang === "en" ? "Bikes restored to good condition" : "Bicicletas restauradas en buen estado",
    freeBikeRentals: lang === "en" ? "Free Bike Rentals" : "Préstamos Gratuitos",
    freeBikeRentalsDesc: lang === "en" ? "Bikes provided free to people in need" : "Bicicletas entregadas gratis a personas necesitadas",
    co2Saved: lang === "en" ? "kg CO₂ Avoided" : "kg CO₂ Evitado",
    co2SavedDesc: lang === "en" ? "Estimated CO₂ prevented from car trips (~3 kg per rental)" : "CO₂ evitado de viajes en auto (~3 kg por alquiler)",
    communitySavings: lang === "en" ? "Community Savings" : "Ahorros Comunitarios",
    communitySavingsDesc: lang === "en" ? "Estimated savings for free rental recipients (€30 per rental)" : "Ahorros estimados para beneficiarios (€30 por préstamo)",
  };

  const mission = {
    en: (
      <>
        <strong>Recicleta San Anton:</strong> a non-profit community bicycle workshop in Cuenca. It is a shared space where people can repair their own bikes, learn basic mechanics, use tools in a collaborative environment, and access low-cost bicycle rentals. In special cases, support is available for people with limited resources.  </>
    ),
    es: (
      <>
        <strong>Recicleta San Antón</strong> Recicleta San Antón es un taller comunitario de bicicletas sin ánimo de lucro en Cuenca. Es un espacio compartido donde las personas pueden reparar su propia bicicleta, aprender mecánica básica, utilizar herramientas en un entorno colaborativo y acceder a alquileres de bicicletas de bajo coste. En casos especiales, se ofrece apoyo a personas con recursos limitados.</>
    ),
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-50 text-center p-8">
      <Image src="/bike-logo.png" alt="Recicleta" width={96} height={96} className="mx-auto mb-6" />
      <h1 className="text-3xl font-bold mb-4">
        {lang === "en" ? "Welcome to Recicleta!" : "¡Bienvenido a Recicleta!"}
      </h1> <button
        onClick={toggleLang}
        className="bg-gray-200 px-3 py-1 rounded mt-6"
        aria-label="Toggle language"
      >
        {lang === "en" ? "ES" : "EN"}
      </button>
     
       
   

 {/* Add Available Bikes Button */}
      <div className="grid gap-3 mb-6 w-full max-w-xs mx-auto">
        <button
          onClick={() => router.push("/available-bikes")}
          className="bg-teal-700 text-white px-4 py-2 rounded shadow hover:bg-green-800 w-full text-center transition"
        >
          {lang === "en" ? "View Available Bikes" : "Ver bicicletas disponibles"}
        </button>
        <button
          onClick={() => router.push("/visit")}
          className="bg-blue-700 text-white px-4 py-2 rounded shadow hover:bg-blue-800 w-full text-center transition"
        >
          {lang === "en" ? "Workshop Check-in" : "Registro de visitas"}
        </button>
        <Link href="/register" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-gray-700 w-full text-center">
          {lang === "en" ? "Fill Out Rental Application" : "Completar Solicitud de Alquiler"}
        </Link>
        <Link href="/login" className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full text-center">
          {lang === "en" ? "Volunteer Login" : "Ingreso Voluntario"}
        </Link>
        
      </div>
      <div className="bg-white border border-green-200 rounded shadow-sm p-6 mb-6 max-w-5xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6 text-center text-green-800">
          {lang === "en" ? "Community Impact (since Jan 2026)" : "Impacto Comunitario (desde Enero 2026)"}
        </h2>
        <div className="public-stats-container">
          <div className="public-stat-card public-stat-card-default">
            <div className="stat-value">{publicStats.loading ? "..." : publicStats.bikesRepaired}</div>
            <div className="stat-label">{labels.bikesRepaired}</div>
            <button className="stat-info-btn" onClick={() => setExpandedCard(expandedCard === "bikes" ? null : "bikes")}>
              ℹ️
            </button>
            {expandedCard === "bikes" && (
              <div className="stat-description">{labels.bikesRepairedDesc}</div>
            )}
          </div>

          <div className="public-stat-card public-stat-card-default">
            <div className="stat-value">{publicStats.loading ? "..." : publicStats.freeBikeRentals}</div>
            <div className="stat-label">{labels.freeBikeRentals}</div>
            <button className="stat-info-btn" onClick={() => setExpandedCard(expandedCard === "free" ? null : "free")}>
              ℹ️
            </button>
            {expandedCard === "free" && (
              <div className="stat-description">{labels.freeBikeRentalsDesc}</div>
            )}
          </div>

          <div className="public-stat-card public-stat-card-eco">
            <div className="stat-value stat-value-eco">{publicStats.loading ? "..." : `${publicStats.co2Saved} kg`}</div>
            <div className="stat-label stat-label-eco">{labels.co2Saved}</div>
            <button className="stat-info-btn" onClick={() => setExpandedCard(expandedCard === "co2" ? null : "co2")}>
              ℹ️
            </button>
            {expandedCard === "co2" && (
              <div className="stat-description">{labels.co2SavedDesc}</div>
            )}
          </div>

          <div className="public-stat-card public-stat-card-default">
            <div className="stat-value">{publicStats.loading ? "..." : `€${publicStats.communitySavings}`}</div>
            <div className="stat-label">{labels.communitySavings}</div>
            <button className="stat-info-btn" onClick={() => setExpandedCard(expandedCard === "savings" ? null : "savings")}>
              ℹ️
            </button>
            {expandedCard === "savings" && (
              <div className="stat-description">{labels.communitySavingsDesc}</div>
            )}
          </div>
        </div>
      </div><RentalPrices lang={lang} />
      <p className="text-lg max-w-xl mb-6">{mission[lang]}</p>
      
     
     
      <div className="flex flex-col items-center gap-2 mt-6">
        <span className="font-semibold">{lang === "en" ? "Follow us:" : "Síguenos:"}</span>
        <div className="flex gap-4">
          <a
            href="https://instagram.com/recicletasananton"
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-600 hover:underline flex items-center gap-1"
          >
            <svg width="20" height="20" fill="currentColor" className="inline-block"><path d="M7 2C4.243 2 2 4.243 2 7v6c0 2.757 2.243 5 5 5h6c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5H7zm0 2h6c1.654 0 3 1.346 3 3v6c0 1.654-1.346 3-3 3H7c-1.654 0-3-1.346-3-3V7c0-1.654 1.346-3 3-3zm6 2a1 1 0 100 2 1 1 0 000-2zm-3 1a4 4 0 100 8 4 4 0 000-8zm0 2a2 2 0 110 4 2 2 0 010-4z"/></svg>
            @recicletasananton
          </a>
          <a
            href="https://facebook.com/recicletasananton"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 hover:underline flex items-center gap-1"
          >
            <svg width="20" height="20" fill="currentColor" className="inline-block"><path d="M17 2H3C1.346 2 0 3.346 0 5v10c0 1.654 1.346 3 3 3h7v-7H7v-3h3V7c0-2.206 1.794-4 4-4h3v3h-3c-.553 0-1 .447-1 1v2h4l-1 3h-3v7h3c1.654 0 3-1.346 3-3V5c0-1.654-1.346-3-3-3z"/></svg>
            Recicleta San Anton
          </a>
        </div>
      </div>
      
    </div>
  );
}

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Allow access to public pages without authentication
  const publicRoutes = ["/login", "/register", "/available-bikes", "/visit"];
  if (publicRoutes.includes(router.pathname)) return <>{children}</>;
  if (loading) return <div>Loading...</div>;
  if (!user) return <SplashPage />;
  return <>{children}</>;
}