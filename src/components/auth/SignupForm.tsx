// src/components/auth/SignupForm.tsx
import type { FC, FormEvent } from 'react'
import { useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { useI18n } from '../../i18n/useI18n'

interface SignupFormProps {
  onSwitchToLogin: () => void
  onSuccess: () => void
  onError: (message: string) => void
}

export const SignupForm: FC<SignupFormProps> = ({
  onSwitchToLogin,
  onSuccess,
  onError,
}) => {
  const { signup } = useAuth()
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // 유효성 검증
    if (password.length < 6) {
      onError(t('auth.passwordTooShort'))
      return
    }

    if (password !== confirmPassword) {
      onError(t('auth.passwordMismatch'))
      return
    }

    setLoading(true)

    try {
      await signup(email, password, name || undefined)
      onSuccess()
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes('email-already-in-use')) {
          onError(t('auth.emailAlreadyInUse'))
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
        <label htmlFor="signup-name">{t('auth.name')}</label>
        <input
          id="signup-name"
          type="text"
          className="auth-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
      </div>

      <div className="auth-form-group">
        <label htmlFor="signup-email">{t('auth.email')}</label>
        <input
          id="signup-email"
          type="email"
          className="auth-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div className="auth-form-group">
        <label htmlFor="signup-password">{t('auth.password')}</label>
        <input
          id="signup-password"
          type="password"
          className="auth-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
      </div>

      <div className="auth-form-group">
        <label htmlFor="signup-confirm-password">
          {t('auth.confirmPassword')}
        </label>
        <input
          id="signup-confirm-password"
          type="password"
          className="auth-input"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
      </div>

      <button type="submit" className="auth-button" disabled={loading}>
        {loading ? '...' : t('auth.createAccount')}
      </button>

      <div className="auth-footer">
        <p>
          {t('auth.alreadyHaveAccount')}{' '}
          <button
            type="button"
            className="auth-link"
            onClick={onSwitchToLogin}
          >
            {t('auth.login')}
          </button>
        </p>
      </div>
    </form>
  )
}
