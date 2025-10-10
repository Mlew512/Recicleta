import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import Image from "next/image";
import type { User } from "@supabase/supabase-js";

function SplashPage() {
  const { lang, toggleLang } = useLanguage();

  const mission = {
    en: (
      <>
        <strong>Our Mission:</strong> Recicleta empowers communities by making cycling accessible, sustainable, and fun. We refurbish donated bikes, offer affordable rentals, and promote eco-friendly mobility for all ages. Join us in building a greener, healthier future—one bike at a time!
      </>
    ),
    es: (
      <>
        <strong>Nuestra Misión:</strong> Recicleta empodera a las comunidades haciendo que el ciclismo sea accesible, sostenible y divertido. Restauramos bicicletas donadas, ofrecemos alquileres asequibles y promovemos la movilidad ecológica para todas las edades. ¡Únete a nosotros para construir un futuro más verde y saludable, una bicicleta a la vez!
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
      <div className="space-x-4 mb-4">
        <Link href="/login" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          {lang === "en" ? "Login" : "Ingresar"}
        </Link>
        <Link href="/register" className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
          {lang === "en" ? "Register" : "Registrar"}
        </Link>
      </div>
      <button
        onClick={toggleLang}
        className="bg-gray-200 px-3 py-1 rounded"
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

  // Allow access to /login and /register without authentication
  if (router.pathname === "/login" || router.pathname === "/register") return <>{children}</>;
  if (loading) return <div>Loading...</div>;
  if (!user) return <SplashPage />;
  return <>{children}</>;
}