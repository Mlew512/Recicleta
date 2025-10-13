// pages/login.tsx
import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import Layout from '@/components/Layout'
import { useLanguage } from '@/context/LanguageContext' // <-- import your context

export default function LoginPage() {
  const router = useRouter()
  const { lang } = useLanguage() // <-- use context instead of router.locale
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const labels = {
    title: lang === 'en' ? 'Login' : 'Ingresar',
    email: lang === 'en' ? 'Email' : 'Correo electrónico',
    password: lang === 'en' ? 'Password' : 'Contraseña',
    login: lang === 'en' ? 'Login' : 'Ingresar',
    success: lang === 'en' ? 'Login successful! Redirecting...' : '¡Ingreso exitoso! Redirigiendo...',
    error: lang === 'en' ? 'Login failed.' : 'Error al ingresar.',
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setMessage(labels.error + ' ' + error.message)
    } else {
      setMessage(labels.success)
      setTimeout(() => {
        router.push('/')
      }, 1500)
    }
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">{labels.title}</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder={labels.email}
            className="border px-3 py-2 rounded"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder={labels.password}
            className="border px-3 py-2 rounded"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {labels.login}
          </button>
        </form>
        {message && <div className="mt-4 text-center text-green-700 font-semibold">{message}</div>}
      </div>
    </Layout>
  )
}
