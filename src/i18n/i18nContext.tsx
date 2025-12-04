import { createContext } from 'react'

export type Lang = 'en' | 'ko'

export interface I18nContextValue {
  lang: Lang
  translations: Record<string, unknown> | null
  setLang: (lang: Lang) => void
  t: (key: string) => string
}

export const I18nContext = createContext<I18nContextValue>({
  lang: 'en',
  translations: null,
  setLang: () => {},
  t: (key: string) => key,   // 기본값: key 반환
})
