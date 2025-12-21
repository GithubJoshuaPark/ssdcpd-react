// src/components/profile/ProfileModal.tsx
import type { FC, FormEvent, ChangeEvent } from 'react'
import { useState, useEffect } from 'react'
import { useAuth } from '../../auth/useAuth'
import { useI18n } from '../../i18n/useI18n'
import { Toast, type ToastType } from '../common/Toast'
import { ConfirmDialog } from '../common/ConfirmDialog'
import { CustomPrompt } from '../common/CustomPrompt'

import type { UserProfile } from '../../types_interfaces/userProfile'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  targetProfile?: UserProfile
}

export const ProfileModal: FC<ProfileModalProps> = ({ isOpen, onClose, targetProfile }) => {
  const { userProfile: currentUserProfile, updateProfile, uploadProfilePhoto, changePassword, deleteAccount } = useAuth()
  const { t } = useI18n()

  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCurrentPasswordPrompt, setShowCurrentPasswordPrompt] = useState(false)
  const [showNewPasswordPrompt, setShowNewPasswordPrompt] = useState(false)
  const [currentPasswordTemp, setCurrentPasswordTemp] = useState('')

  // 읽기 전용 모드 여부 (targetProfile이 있으면 True)
  const isReadOnly = !!targetProfile
  // 표시할 프로필 (targetProfile 혹은 현재 로그인한 사용자 프로필)
  const displayProfile = targetProfile || currentUserProfile

  // 프로필 데이터 초기화
  useEffect(() => {
    if (isOpen && displayProfile) {
      setName(displayProfile.name || '')
      setBio(displayProfile.bio || '')
      setImagePreview(displayProfile.photoURL || null)
      setImageFile(null)
    }
  }, [isOpen, displayProfile])

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !showDeleteConfirm && !showCurrentPasswordPrompt && !showNewPasswordPrompt) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, showDeleteConfirm, showCurrentPasswordPrompt, showNewPasswordPrompt, onClose])

  // 모달이 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return // 읽기 전용이면 무시

    const file = e.target.files?.[0]
    if (file) {
      // 파일 크기 제한 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setToast({ message: 'Image size must be less than 5MB', type: 'error' })
        return
      }

      // 이미지 파일만 허용
      if (!file.type.startsWith('image/')) {
        setToast({ message: 'Please select an image file', type: 'error' })
        return
      }

      setImageFile(file)

      // 미리보기 생성
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (isReadOnly) return

    setLoading(true)

    try {
      // 프로필 정보 업데이트
      await updateProfile(name, bio)

      // 이미지 업로드 (새 이미지가 선택된 경우)
      if (imageFile) {
        await uploadProfilePhoto(imageFile)
      }

      setToast({ message: t('profile.uploadSuccess'), type: 'success' })
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      console.error('Profile update error:', error)
      setToast({ message: t('profile.uploadError'), type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = () => {
    setShowCurrentPasswordPrompt(true)
  }

  const handleCurrentPasswordConfirm = (currentPassword: string) => {
    setShowCurrentPasswordPrompt(false)
    setCurrentPasswordTemp(currentPassword)
    setShowNewPasswordPrompt(true)
  }

  const handleNewPasswordConfirm = async (newPassword: string) => {
    setShowNewPasswordPrompt(false)

    if (newPassword.length < 6) {
      setToast({ message: t('auth.passwordTooShort'), type: 'error' })
      setCurrentPasswordTemp('') // Clear stored password
      return
    }

    try {
      await changePassword(currentPasswordTemp, newPassword)
      setToast({ message: t('profile.passwordChangeSuccess'), type: 'success' })
      setCurrentPasswordTemp('') // Clear stored password
    } catch (error) {
      console.error('Password change error:', error)
      setCurrentPasswordTemp('') // Clear stored password

      // Check for specific Firebase errors
      if (error instanceof Error) {
        if (error.message.includes('auth/wrong-password') || error.message.includes('auth/invalid-credential')) {
          setToast({ message: t('auth.wrongPassword') || 'Current password is incorrect', type: 'error' })
        } else {
          setToast({ message: 'Failed to change password', type: 'error' })
        }
      } else {
        setToast({ message: 'Failed to change password', type: 'error' })
      }
    }
  }

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount()
      setToast({ message: t('profile.deleteSuccess'), type: 'success' })
      setTimeout(() => {
        onClose()
        // 로그인 모달은 AuthProvider에서 자동으로 처리됨
      }, 1500)
    } catch (error) {
      console.error('Account deletion error:', error)
      setToast({ message: 'Failed to delete account', type: 'error' })
    }
  }

  return (
    <>
      <div className="auth-modal-overlay" onClick={onClose}>
        <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
          <button className="auth-modal-close" onClick={onClose}>
            ✕
          </button>

          <h2 className="profile-modal-title">
            {isReadOnly ? 'User Profile' : t('profile.title')}
          </h2>

          <form className="profile-form" onSubmit={handleSubmit}>
            {/* 프로필 이미지 */}
            <div className={`profile-image-section ${isReadOnly ? 'readonly' : ''}`}>
              <div className="profile-image-preview">
                {imagePreview ? (
                  <img src={imagePreview} alt="Profile" />
                ) : (
                  <div className="profile-image-placeholder">
                    {displayProfile?.email?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {!isReadOnly && (
                <label className="profile-upload-button">
                  {t('profile.uploadPhoto')}
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>

            {/* 이름 */}
            <div className="auth-form-group">
              <label htmlFor="profile-name">{t('profile.name')}</label>
              <input
                id="profile-name"
                type="text"
                className="auth-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                readOnly={isReadOnly}
                disabled={isReadOnly}
              />
            </div>

            {/* 이메일 (읽기 전용 표시) */}
            <div className="auth-form-group">
              <label>Email</label>
              <input
                type="text"
                className="auth-input"
                value={displayProfile?.email || ''}
                readOnly
                disabled
              />
            </div>

            {/* 권한 (Admin Only) */}
            {isReadOnly && (
              <div className="auth-form-group">
                <label>Role</label>
                <input
                  type="text"
                  className="auth-input"
                  value={displayProfile?.role || 'user'}
                  readOnly
                  disabled
                />
              </div>
            )}

            {/* 자기소개 */}
            <div className="auth-form-group">
              <label htmlFor="profile-bio">{t('profile.bio')}</label>
              <textarea
                id="profile-bio"
                className="auth-input profile-textarea"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                readOnly={isReadOnly}
                disabled={isReadOnly}
              />
            </div>

            {/* 버튼 그룹 (수정 모드일 때만 표시) */}
            {!isReadOnly && (
              <>
                {/* 저장 버튼 */}
                <button type="submit" className="auth-button" disabled={loading}>
                  {loading ? '...' : t('profile.save')}
                </button>

                {/* 비밀번호 변경 */}
                <button
                  type="button"
                  className="profile-secondary-button"
                  onClick={handleChangePassword}
                >
                  {t('profile.changePassword')}
                </button>

                {/* 계정 탈퇴 */}
                <button
                  type="button"
                  className="profile-delete-button"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  {t('profile.deleteAccount')}
                </button>
              </>
            )}
          </form>
        </div>
      </div>

      {/* 계정 탈퇴 확인 다이얼로그 */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title={t('profile.deleteConfirmTitle')}
        message={t('profile.deleteConfirmMessage')}
        confirmText={t('profile.deleteConfirmButton')}
        onConfirm={() => {
          setShowDeleteConfirm(false)
          handleDeleteAccount()
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Toast 알림 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* 현재 비밀번호 입력 프롬프트 */}
      <CustomPrompt
        key={showCurrentPasswordPrompt ? 'current-open' : 'current-closed'}
        isOpen={showCurrentPasswordPrompt}
        title={t('profile.changePassword')}
        message="Enter your current password"
        placeholder="Current password"
        defaultValue=""
        onConfirm={handleCurrentPasswordConfirm}
        onCancel={() => {
          setShowCurrentPasswordPrompt(false)
          setCurrentPasswordTemp('')
        }}
      />

      {/* 새 비밀번호 입력 프롬프트 */}
      <CustomPrompt
        key={showNewPasswordPrompt ? 'new-open' : 'new-closed'}
        isOpen={showNewPasswordPrompt}
        title={t('profile.changePassword')}
        message={t('profile.enterNewPassword')}
        placeholder="New password (min 6 characters)"
        defaultValue=""
        onConfirm={handleNewPasswordConfirm}
        onCancel={() => {
          setShowNewPasswordPrompt(false)
          setCurrentPasswordTemp('')
        }}
      />
    </>
  )
}
