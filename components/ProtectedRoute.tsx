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

  const mission = {
    en: (
      <>
        <strong>Our Mission:</strong> Recicleta is an association dedicated to empowering communities through accessible, sustainable, and enjoyable cycling. We refurbish donated bikes, offer affordable rentals, and promote eco-friendly mobility for all ages. Join us in building a greener, healthier future—one bike at a time!
      </>
    ),
    es: (
      <>
        <strong>Nuestra Misión:</strong> Recicleta es una asociación voluntaria dedicada al taller de auto-reparación de bicicletas, reciclaje y préstamo de bicis. Compartimos herramientas y saberes para fortalecer la comunidad, fomentar la movilidad sostenible y hacer que el ciclismo sea accesible para todos.
      </>
    ),
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-50 text-center p-8">
      <Image src="/bike-logo.png" alt="Recicleta" width={96} height={96} className="mx-auto mb-6" />
      <h1 className="text-3xl font-bold mb-4">
        {lang === "en" ? "Welcome to Recicleta!" : "¡Bienvenido a Recicleta!"}
      </h1>
      <p className="text-lg max-w-xl mb-6">{mission[lang]}</p>
      <RentalPrices lang={lang} />
      <div className="flex flex-col md:flex-row gap-3 md:space-x-4 mb-4 w-full max-w-xs mx-auto">
        <Link href="/login" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full text-center">
          {lang === "en" ? "Volunteer Login" : "Ingreso Voluntario"}
        </Link>
        <Link href="/register" className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 w-full text-center">
          {lang === "en" ? "Fill Out Rental Application" : "Completar Solicitud de Alquiler"}
        </Link>
      </div>
      {/* Add Available Bikes Button */}
      <div className="flex justify-center mb-6 w-full max-w-xs mx-auto">
        <button
          onClick={() => router.push("/available-bikes")}
          className="bg-green-700 text-white px-4 py-2 rounded shadow hover:bg-green-800 w-full text-center transition"
        >
          {lang === "en" ? "View Available Bikes" : "Ver bicicletas disponibles"}
        </button>
      </div>
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
      <button
        onClick={toggleLang}
        className="bg-gray-200 px-3 py-1 rounded mt-6"
        aria-label="Toggle language"
      >
        {lang === "en" ? "ES" : "EN"}
      </button>
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

  // Allow access to /login, /register, and /available-bikes without authentication
  const publicRoutes = ["/login", "/register", "/available-bikes"];
  if (publicRoutes.includes(router.pathname)) return <>{children}</>;
  if (loading) return <div>Loading...</div>;
  if (!user) return <SplashPage />;
  return <>{children}</>;
}