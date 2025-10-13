import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useLanguage } from "@/context/LanguageContext";
import Image from "next/image";
import type { User } from "@supabase/supabase-js";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const { lang, toggleLang } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user || null);
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const navLinks = [
    { href: "/bikes", label: lang === "en" ? "Bikes" : "Bicicletas" },
    { href: "/users", label: lang === "en" ? "Users" : "Usuarios" },
    { href: "/users/pending", label: lang === "en" ? "Pending Users" : "Usuarios pendientes" },
    { href: "/rentals", label: lang === "en" ? "Rentals" : "Alquileres" },
    { href: "/memberships", label: lang === "en" ? "Membership" : "Membresía" },
    { href: "/sales", label: lang === "en" ? "Sales" : "Ventas" },
  ];

  return (
    <div>
      {/* Nav Bar */}
      <nav className="bg-gray-800 text-white px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 w-full">
          <div className="flex items-center justify-between w-full md:w-auto">
            <Link href="/" className="flex items-center">
              <Image
                src="/bike-logo.png"
                alt="Recicleta"
                width={32}
                height={32}
                className="h-8 w-8"
              />
            </Link>
            {/* Mobile Nav Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden bg-gray-700 px-3 py-1 rounded hover:bg-gray-600 ml-2"
              aria-label="Open navigation"
            >
              ☰
            </button>
          </div>
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              navLinks.map((link) => (
                <Link key={link.href} href={link.href} legacyBehavior>
                  <a className="hover:underline">{link.label}</a>
                </Link>
              ))
            ) : (
              <>
                <Link href="/register" legacyBehavior>
                  <a className="hover:underline">
                    {lang === "en" ? "Register" : "Registrar"}
                  </a>
                </Link>
                <Link href="/login" legacyBehavior>
                  <a className="hover:underline">
                    {lang === "en" ? "Login" : "Ingresar"}
                  </a>
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2 mt-2 md:mt-0">
          {/* Language Toggle Button */}
          <button
            onClick={toggleLang}
            className="bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
            aria-label="Toggle language"
          >
            {lang === "en" ? "ES" : "EN"}
          </button>
          {user ? (
            <button
              onClick={handleLogout}
              className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
            >
              {lang === "en" ? "Logout" : "Salir"}
            </button>
          ) : null}
          {user?.email && (
            <span className="bg-gray-700 px-3 py-1 rounded text-sm truncate max-w-[120px] md:max-w-none">
              {user.email}
            </span>
          )}
        </div>
      </nav>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gray-900 text-white px-4 py-2">
          {user ? (
            navLinks.map((link) => (
              <Link key={link.href} href={link.href} legacyBehavior>
                <a
                  className="block py-2 border-b border-gray-700 hover:bg-gray-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              </Link>
            ))
          ) : (
            <>
              <Link href="/register" legacyBehavior>
                <a
                  className="block py-2 border-b border-gray-700 hover:bg-gray-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {lang === "en" ? "Register" : "Registrar"}
                </a>
              </Link>
              <Link href="/login" legacyBehavior>
                <a
                  className="block py-2 border-b border-gray-700 hover:bg-gray-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {lang === "en" ? "Login" : "Ingresar"}
                </a>
              </Link>
            </>
          )}
          {/* Show user email on mobile */}
          {user?.email && (
            <div className="py-2 text-xs text-gray-300 truncate">{user.email}</div>
          )}
        </div>
      )}

      <main className="p-2 md:p-6">{children}</main>
    </div>
  );
}
