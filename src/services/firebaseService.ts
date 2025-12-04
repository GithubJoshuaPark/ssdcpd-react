// src/services/firebaseService.ts
import { initializeApp } from 'firebase/app'
import {
    getDatabase,
    ref,
    get,
    Database,
    DataSnapshot,
} from 'firebase/database'

// ----- 타입 가져오기 -----
import type { TranslationsByLang } from '../types_interfaces/translations'
import type { Track } from '../types_interfaces/track'

// ----- Firebase 초기화 -----

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
}

const app = initializeApp(firebaseConfig)
const database: Database = getDatabase(app)

// ----- Service functions (기존 firebase-service.js 대응) -----

// translations 전체
export async function getAllTranslations(): Promise<TranslationsByLang | null> {
  try {
    const snapshot: DataSnapshot = await get(ref(database, 'translations'))

    if (!snapshot.exists()) {
      console.warn('No translations data available')
      return null
    }

    return snapshot.val() as TranslationsByLang
  } catch (err) {
    console.error('Error fetching translations:', err)
    throw err
  }
}

// tracks 전체
export async function getAllTracks(): Promise<Track[]> {
  try {
    const snapshot: DataSnapshot = await get(ref(database, 'tracks'))

    if (!snapshot.exists()) {
      console.warn('No tracks data available')
      return []
    }

    const tracksObj = snapshot.val() as Record<string, unknown>

    const result: Track[] = Object.entries(tracksObj).map(([id, raw]) => {
      const value = raw as Record<string, unknown>

      return {
        id,
        title: String(value.title ?? ''),
        level: value.level ? String(value.level) : undefined,
        category: value.category as Track['category'],
        status: value.status as Track['status'],
        short: value.short ? String(value.short) : undefined,
        short_ko: value.short_ko ? String(value.short_ko) : undefined,
        url: value.url ? String(value.url) : undefined,
        tags: Array.isArray(value.tags)
          ? (value.tags as string[])
          : undefined,
      }
    })

    return result
  } catch (err) {
    console.error('Error fetching tracks:', err)
    throw err
  }
}

export { database }
