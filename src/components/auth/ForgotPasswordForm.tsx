// src/components/auth/ForgotPasswordForm.tsx
import type { FC, FormEvent } from 'react'
import { useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { useI18n } from '../../i18n/useI18n'

interface ForgotPasswordFormProps {
  onSwitchToLogin: () => void
  onSuccess: () => void
  onError: (message: string) => void
}

export const ForgotPasswordForm: FC<ForgotPasswordFormProps> = ({
  onSwitchToLogin,
  onSuccess,
  onError,
}) => {
  const { resetPassword } = useAuth()
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await resetPassword(email)
      onSuccess()
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes('user-not-found')) {
          onError(t('auth.userNotFound'))
        } else if (error.message.includes('invalid-email')) {
          onError(t('auth.invalidEmail'))
        } else {
          onError(error.message)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-form-group">
        <label htmlFor="forgot-email">{t('auth.email')}</label>
        <input
          id="forgot-email"
          type="email"
          className="auth-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <button type="submit" className="auth-button" disabled={loading}>
        {loading ? '...' : t('auth.sendResetEmail')}
      </button>

      <div className="auth-links">
        <button type="button" className="auth-link" onClick={onSwitchToLogin}>
          {t('auth.backToLogin')}
        </button>
      </div>
    </form>
  )
}
