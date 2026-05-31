import { useState } from 'react'
import Layout from '@/components/Layout'
import { useLanguage } from '@/context/LanguageContext'
import en from '@/locales/en.json'
import es from '@/locales/es.json'

export default function VisitPage() {
  const { lang } = useLanguage()
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [firstTime, setFirstTime] = useState(true)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const t = (key: string) => {
    const localeData = lang === 'en' ? (en as Record<string, string>) : (es as Record<string, string>)
    return localeData[key] || key
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage(null)
    if (!firstName || !reason) {
      setMessage(lang === 'en' ? 'Please fill required fields' : 'Por favor completa los campos requeridos')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, email: email || null, firstTime, reason }),
      })
      if (!res.ok) throw new Error('Network error')
      setMessage(t('visitSuccess'))
      setFirstName('')
      setEmail('')
      setFirstTime(true)
      setReason('')
    } catch (err: unknown) {
      console.error(err)
      setMessage(t('visitError'))
    } finally {
      setLoading(false)
    }
  }

  const reasons = [
    { value: 'fixing-bike', label: t('reasonFixBike') },
    { value: 'learning-maintenance', label: t('reasonLearnMaintenance') },
    { value: 'advice-help', label: t('reasonAdviceHelp') },
    { value: 'volunteering', label: t('reasonVolunteer') },
    { value: 'other', label: t('reasonOther') },
  ]

  return (
    <Layout>
      <div className="max-w-xl mx-auto bg-white p-6 rounded shadow mt-8">
        <h1 className="text-2xl font-bold mb-4">{t('visitTitle')}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-semibold mb-1">{t('firstName')}</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full border px-3 py-2 rounded"
              required
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">{t('emailOptional')}</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border px-3 py-2 rounded"
              type="email"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">{t('firstTime')}</label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={firstTime === true}
                  onChange={() => setFirstTime(true)}
                />
                <span>{t('yes')}</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={firstTime === false}
                  onChange={() => setFirstTime(false)}
                />
                <span>{t('no')}</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">{t('reasonLabel')}</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border px-3 py-2 rounded"
              required
            >
              <option value="">{lang === 'en' ? 'Select...' : 'Selecciona...'}</option>
              {reasons.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (lang === 'en' ? 'Saving...' : 'Guardando...') : t('submit')}
            </button>
          </div>

          {message && <div className="mt-2 text-sm">{message}</div>}
        </form>
      </div>
    </Layout>
  )
}
