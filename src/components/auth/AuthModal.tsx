// src/components/auth/AuthModal.tsx
import type { FC } from 'react'
import { useState, useEffect } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { LoginForm } from './LoginForm'
import { SignupForm } from './SignupForm'
import { ForgotPasswordForm } from './ForgotPasswordForm'
import { Toast, type ToastType } from '../common/Toast'

type AuthView = 'login' | 'signup' | 'forgot-password'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AuthModal: FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { t } = useI18n()
  const [currentView, setCurrentView] = useState<AuthView>('login')
  const [toast, setToast] = useState<{
    message: string
    type: ToastType
  } | null>(null)

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

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

  const handleSignupSuccess = () => {
    setToast({
      message: t('auth.emailSent'),
      type: 'success',
    })
    setCurrentView('login')
  }

  const handleLoginSuccess = () => {
    setToast({
      message: t('auth.loginSuccess'),
      type: 'success',
    })
    setTimeout(() => {
      onClose()
    }, 1000)
  }

  const handleForgotPasswordSuccess = () => {
    setToast({
      message: t('auth.resetEmailSent'),
      type: 'success',
    })
    setCurrentView('login')
  }

  const handleError = (message: string) => {
    setToast({
      message,
      type: 'error',
    })
  }

  return (
    <>
      <div className="auth-modal-overlay" onClick={onClose}>
        <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
          <button className="auth-modal-close" onClick={onClose}>
            ✕
          </button>

          <div className="auth-tabs">
            <button
              className={`auth-tab ${currentView === 'login' ? 'active' : ''}`}
              onClick={() => setCurrentView('login')}
            >
              {t('auth.login')}
            </button>
            <button
              className={`auth-tab ${currentView === 'signup' ? 'active' : ''}`}
              onClick={() => setCurrentView('signup')}
            >
              {t('auth.signup')}
            </button>
          </div>

          {currentView === 'login' && (
            <LoginForm
              onSwitchToSignup={() => setCurrentView('signup')}
              onSwitchToForgotPassword={() => setCurrentView('forgot-password')}
              onSuccess={handleLoginSuccess}
              onError={handleError}
            />
          )}

          {currentView === 'signup' && (
            <SignupForm
              onSwitchToLogin={() => setCurrentView('login')}
              onSuccess={handleSignupSuccess}
              onError={handleError}
            />
          )}

          {currentView === 'forgot-password' && (
            <ForgotPasswordForm
              onSwitchToLogin={() => setCurrentView('login')}
              onSuccess={handleForgotPasswordSuccess}
              onError={handleError}
            />
          )}
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  )
}
