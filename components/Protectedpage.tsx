import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import Layout from './Layout'

export default function ProtectedPage({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<Record<string, unknown>>(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.push('/')
      } else {
        setUser(data.session.user)
      }
      setLoading(false)
    }
    checkUser()
  }, [router])

  if (loading) return <Layout><p>Loading...</p></Layout>
  if (!user) return <Layout><div className="text-center mt-16"><img src="/bike-logo.png" alt="Bike Logo" className="mx-auto" /></div></Layout>

  return <>{children}</>
}
