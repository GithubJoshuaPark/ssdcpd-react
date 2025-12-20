// src/types_interfaces/userProfile.ts

export interface UserProfile {
  uid: string
  email: string
  name?: string
  bio?: string
  photoURL?: string
  role: 'user' | 'admin'
  email_verified: boolean
  ip_address?: string
  created_at: string
  updated_at: string
}
