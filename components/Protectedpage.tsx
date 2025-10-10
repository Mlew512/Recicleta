import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import Layout from './Layout'
import Image from 'next/image'
import type { User } from '@supabase/supabase-js';

export default function ProtectedPage({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null);

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
  if (!user) return (
    <Layout>
      <div className="text-center mt-16">
        <Image src="/bike-logo.png" alt="Bike Logo" width={96} height={96} className="mx-auto" />
      </div>
    </Layout>
  )

  return <>{children}</>
}
