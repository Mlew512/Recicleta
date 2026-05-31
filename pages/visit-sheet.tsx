import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Layout from '@/components/Layout'
import { useLanguage } from '@/context/LanguageContext'
import en from '@/locales/en.json'
import es from '@/locales/es.json'

type VisitRecord = {
  id: number
  first_name: string
  email: string | null
  first_time: boolean
  reason: string
  created_at: string
}

const reasonLabels = {
  'fixing-bike': 'reasonFixBike',
  'learning-maintenance': 'reasonLearnMaintenance',
  'advice-help': 'reasonAdviceHelp',
  volunteer: 'reasonVolunteer',
  other: 'reasonOther',
}

export default function VisitSheetPage() {
  const { lang } = useLanguage()
  const [visits, setVisits] = useState<VisitRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const labels = useMemo(() => {
    return lang === 'en' ? (en as Record<string, string>) : (es as Record<string, string>)
  }, [lang])

  const t = (key: string) => labels[key] || key

  useEffect(() => {
    const fetchVisits = async () => {
      setLoading(true)
      setError(null)
      const year = new Date().getFullYear()
      const start = `${year}-01-01`
      const end = `${year + 1}-01-01`
      const { data, error: fetchError } = await supabase
        .from<VisitRecord>('visits')
        .select('id, first_name, email, first_time, reason, created_at')
        .gte('created_at', start)
        .lt('created_at', end)
        .order('created_at', { ascending: false })

      if (fetchError) {
        setError(fetchError.message)
        setVisits([])
      } else {
        setVisits(data || [])
      }
      setLoading(false)
    }
    fetchVisits()
  }, [])

  const stats = useMemo(() => {
    const total = visits.length
    const firstTime = visits.filter((v) => v.first_time).length
    const repeat = total - firstTime
    const reasonCount = visits.reduce<Record<string, number>>((acc, visit) => {
      acc[visit.reason] = (acc[visit.reason] || 0) + 1
      return acc
    }, {})

    return { total, firstTime, repeat, reasonCount }
  }, [visits])

  const formatDate = (createdAt: string) => {
    return new Date(createdAt).toLocaleString(lang === 'en' ? 'en-US' : 'es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto bg-white p-6 rounded shadow mt-8">
        <h1 className="text-2xl font-bold mb-4">{t('visitSheetTitle')}</h1>
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <div className="border rounded p-4 bg-gray-50">
            <p className="text-sm text-gray-500">{t('visitsThisYear')}</p>
            <p className="text-3xl font-semibold">{stats.total}</p>
          </div>
          <div className="border rounded p-4 bg-gray-50">
            <p className="text-sm text-gray-500">{t('firstTimeVisitors')}</p>
            <p className="text-3xl font-semibold">{stats.firstTime}</p>
          </div>
          <div className="border rounded p-4 bg-gray-50">
            <p className="text-sm text-gray-500">{t('repeatVisitors')}</p>
            <p className="text-3xl font-semibold">{stats.repeat}</p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">{t('reasonStats')}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(stats.reasonCount).map(([reason, count]) => (
              <div key={reason} className="border rounded p-4 bg-gray-50">
                <p className="text-sm text-gray-500">{t(reasonLabels[reason] || reason)}</p>
                <p className="text-2xl font-semibold">{count}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">{t('visitorSignInSheet')}</h2>
          {loading ? (
            <div>{lang === 'en' ? 'Loading...' : 'Cargando...'}</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-3 py-2 text-left text-sm font-semibold text-gray-700">{t('visitorName')}</th>
                    <th className="border px-3 py-2 text-left text-sm font-semibold text-gray-700">{t('visitorEmail')}</th>
                    <th className="border px-3 py-2 text-left text-sm font-semibold text-gray-700">{t('visitorFirstTime')}</th>
                    <th className="border px-3 py-2 text-left text-sm font-semibold text-gray-700">{t('visitorReason')}</th>
                    <th className="border px-3 py-2 text-left text-sm font-semibold text-gray-700">{t('visitorDate')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visits.length === 0 ? (
                    <tr>
                      <td className="border px-3 py-4 text-center text-sm text-gray-500" colSpan={5}>
                        {lang === 'en' ? 'No visits recorded yet.' : 'Aún no hay visitas registradas.'}
                      </td>
                    </tr>
                  ) : (
                    visits.map((visit) => (
                      <tr key={visit.id} className="odd:bg-white even:bg-gray-50">
                        <td className="border px-3 py-2">{visit.first_name}</td>
                        <td className="border px-3 py-2">{visit.email || '-'}</td>
                        <td className="border px-3 py-2">{visit.first_time ? (lang === 'en' ? 'Yes' : 'Sí') : (lang === 'en' ? 'No' : 'No')}</td>
                        <td className="border px-3 py-2">{t(reasonLabels[visit.reason] || visit.reason)}</td>
                        <td className="border px-3 py-2">{formatDate(visit.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
