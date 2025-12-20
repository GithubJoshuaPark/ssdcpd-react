// src/auth/AuthContext.tsx
import { createContext } from 'react'
import type { User } from 'firebase/auth'
import type { UserProfile } from '../types_interfaces/userProfile'

export interface AuthContextType {
  currentUser: User | null
  userProfile: UserProfile | null
  loading: boolean
  signup: (email: string, password: string, name?: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateProfile: (name: string, bio: string) => Promise<void>
  uploadProfilePhoto: (file: File) => Promise<void>
  changePassword: (newPassword: string) => Promise<void>
  deleteAccount: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
