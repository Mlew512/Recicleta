import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { useLanguage } from "@/context/LanguageContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<null | Record<string, unknown>>(null)
  const { lang, toggleLang } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const session = supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const navLinks = [
    { href: "/bikes", label: lang === "en" ? "Bikes" : "Bicicletas" },
    { href: "/users", label: lang === "en" ? "Users" : "Usuarios" },
    { href: "/rentals", label: lang === "en" ? "Rentals" : "Alquileres" },
    { href: "/memberships", label: lang === "en" ? "Membership" : "Membresía" },
    { href: "/sales", label: lang === "en" ? "Sales" : "Ventas" },
  ];

  return (
    <div>
      {/* Nav Bar */}
      <nav className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <img src="/bike-logo.png" alt="Recicleta" className="h-8 w-8" />
          </Link>
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              navLinks.map(link => (
                <Link key={link.href} href={link.href} className="hover:underline">{link.label}</Link>
              ))
            ) : (
              <>
                <Link href="/register" className="hover:underline">
                  {lang === "en" ? "Register" : "Registrar"}
                </Link>
                <Link href="/login" className="hover:underline">
                  {lang === "en" ? "Login" : "Ingresar"}
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Nav Toggle */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
            aria-label="Open navigation"
          >
            ☰
          </button>
        </div>

        <div className="flex items-center space-x-2">
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
        </div>
      </nav>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gray-900 text-white px-4 py-2">
          {user ? (
            navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="block py-2 border-b border-gray-700 hover:bg-gray-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))
          ) : (
            <>
              <Link
                href="/register"
                className="block py-2 border-b border-gray-700 hover:bg-gray-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                {lang === "en" ? "Register" : "Registrar"}
              </Link>
              <Link
                href="/login"
                className="block py-2 border-b border-gray-700 hover:bg-gray-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                {lang === "en" ? "Login" : "Ingresar"}
              </Link>
            </>
          )}
        </div>
      )}

      <main className="p-6">{children}</main>
    </div>
  )
}
