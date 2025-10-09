import { useState, useEffect } from 'react'
import en from '@/locales/en.json'
import es from '@/locales/es.json'

type Translations = typeof en

export default function useTranslation() {
  const [lang, setLang] = useState<'en' | 'es'>('en')
  const [t, setT] = useState<Translations>(en)

  useEffect(() => {
    const storedLang = localStorage.getItem('lang') as 'en' | 'es' | null
    if (storedLang) setLang(storedLang)
  }, [])

  useEffect(() => {
    setT(lang === 'en' ? en : es)
    localStorage.setItem('lang', lang)
  }, [lang])

  const toggleLanguage = () => {
    setLang(prev => (prev === 'en' ? 'es' : 'en'))
  }

  return { t, lang, toggleLanguage }
}
