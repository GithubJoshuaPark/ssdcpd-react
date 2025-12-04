// src/types_interfaces/translations.ts

// 필요 시 확장 가능하도록 최소 구조만 정의
export interface I18nBundle {
  nav?: Record<string, string>
  hero?: Record<string, string>
  tracks?: Record<string, string>
  filter?: Record<string, string>
  timeline?: Record<string, unknown>
  about?: Record<string, unknown>
  track?: Record<string, string>
  // 그 외 추가 번역 섹션 확장 가능
  [section: string]: unknown
}

// lang → i18n bundle
export type TranslationsByLang = Record<string, I18nBundle>