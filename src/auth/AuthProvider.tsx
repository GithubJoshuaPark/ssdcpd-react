// src/auth/AuthProvider.tsx
import type { FC, ReactNode } from 'react'
import { useState, useEffect } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { AuthContext } from './AuthContext'
import type { UserProfile } from '../types_interfaces/userProfile'
import {
  auth,
  signupWithEmail,
  loginWithEmail,
  logout as firebaseLogout,
  resetPassword as firebaseResetPassword,
  getUserProfile,
  updateUserProfile,
  uploadProfileImage,
  deleteProfileImage,
  updateUserPassword,
  deleteUserAccount,
} from '../services/firebaseService'

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)

      if (user) {
        // 사용자가 로그인한 경우 Firestore에서 프로필 로드
        try {
          const profile = await getUserProfile(user.uid)
          setUserProfile(profile)
        } catch (error) {
          console.error('Error loading user profile:', error)
          setUserProfile(null)
        }
      } else {
        setUserProfile(null)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signup = async (email: string, password: string, name?: string) => {
    await signupWithEmail(email, password, name)
  }

  const login = async (email: string, password: string) => {
    const userCredential = await loginWithEmail(email, password)

    // 이메일 인증 확인
    if (!userCredential.user.emailVerified) {
      await firebaseLogout()
      throw new Error('EMAIL_NOT_VERIFIED')
    }
  }

  const logout = async () => {
    await firebaseLogout()
  }

  const resetPassword = async (email: string) => {
    await firebaseResetPassword(email)
  }

  const updateProfile = async (name: string, bio: string) => {
    if (!currentUser) {
      throw new Error('No user is currently signed in')
    }

    await updateUserProfile(currentUser.uid, { name, bio })

    // 로컬 상태 업데이트
    const updatedProfile = await getUserProfile(currentUser.uid)
    setUserProfile(updatedProfile)
  }

  const uploadProfilePhoto = async (file: File) => {
    if (!currentUser) {
      throw new Error('No user is currently signed in')
    }

    // 이전 이미지가 있으면 삭제
    if (userProfile?.photoURL) {
      await deleteProfileImage(userProfile.photoURL)
    }

    // 새 이미지 업로드
    const photoURL = await uploadProfileImage(currentUser.uid, file)

    // Firestore 업데이트
    await updateUserProfile(currentUser.uid, { photoURL })

    // 로컬 상태 업데이트
    const updatedProfile = await getUserProfile(currentUser.uid)
    setUserProfile(updatedProfile)
  }

  const changePassword = async (newPassword: string) => {
    await updateUserPassword(newPassword)
  }

  const deleteAccount = async () => {
    if (!currentUser) {
      throw new Error('No user is currently signed in')
    }

    await deleteUserAccount(currentUser.uid, userProfile?.photoURL)
  }

  const value = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    logout,
    resetPassword,
    updateProfile,
    uploadProfilePhoto,
    changePassword,
    deleteAccount,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
