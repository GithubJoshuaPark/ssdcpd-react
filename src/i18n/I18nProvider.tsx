import { useEffect, useState } from 'react'
import { I18nContext, type Lang } from './i18nContext'
import type { TranslationsByLang } from '../types_interfaces/translations'
import { getAllTranslations } from '../services/firebaseService'

interface Props {
  children: React.ReactNode
}

// 중첩 객체에서 "timeline.item1.title" 같은 path 값을 안전하게 꺼내는 helper
function getNestedValue(obj: unknown, path: string[]): unknown {
  let current: unknown = obj

  for (const key of path) {
    if (!current || typeof current !== 'object') {
      return undefined
    }
    const record = current as Record<string, unknown>
    if (!(key in record)) {
      return undefined
    }
    current = record[key]
  }

  return current
}

export const I18nProvider: React.FC<Props> = ({ children }) => {
  const [lang, setLang] = useState<Lang>('en')
  const [translations, setTranslations] = useState<TranslationsByLang | null>(null)

  // Firebase에서 번역 데이터 로딩
  useEffect(() => {
    async function load() {
      const data = await getAllTranslations()
        if (data) {
            setTranslations(data)
            console.log('Translations loaded successfully')
            console.log(data)
        }
        else {
            console.error('Failed to load translations')
        }
    }
    load()
  }, [])

  // 번역 함수
  function t(key: string): string {
    if (!translations) {
      return key
    }

    const langDict = translations[lang]
    const segments = key.split('.')

    const value = getNestedValue(langDict, segments)
    return typeof value === 'string' ? value : key
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, translations, t }}>
      {children}
    </I18nContext.Provider>
  )
}
