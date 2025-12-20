// src/components/auth/LoginForm.tsx
import type { FC, FormEvent } from 'react'
import { useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { useI18n } from '../../i18n/useI18n'

interface LoginFormProps {
  onSwitchToSignup: () => void
  onSwitchToForgotPassword: () => void
  onSuccess: () => void
  onError: (message: string) => void
}

export const LoginForm: FC<LoginFormProps> = ({
  onSwitchToSignup,
  onSwitchToForgotPassword,
  onSuccess,
  onError,
}) => {
  const { login } = useAuth()
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await login(email, password)
      onSuccess()
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message === 'EMAIL_NOT_VERIFIED') {
          onError(t('auth.emailNotVerified'))
        } else if (error.message.includes('invalid-credential')) {
          onError(t('auth.invalidCredentials'))
        } else if (error.message.includes('user-not-found')) {
          onError(t('auth.userNotFound'))
        } else if (error.message.includes('wrong-password')) {
          onError(t('auth.wrongPassword'))
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
        <label htmlFor="login-email">{t('auth.email')}</label>
        <input
          id="login-email"
          type="email"
          className="auth-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div className="auth-form-group">
        <label htmlFor="login-password">{t('auth.password')}</label>
        <input
          id="login-password"
          type="password"
          className="auth-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>

      <button type="submit" className="auth-button" disabled={loading}>
        {loading ? '...' : t('auth.login')}
      </button>

      <div className="auth-links">
        <button
          type="button"
          className="auth-link"
          onClick={onSwitchToForgotPassword}
        >
          {t('auth.forgotPassword')}
        </button>
      </div>

      <div className="auth-footer">
        <p>
          {t('auth.dontHaveAccount')}{' '}
          <button
            type="button"
            className="auth-link"
            onClick={onSwitchToSignup}
          >
            {t('auth.signup')}
          </button>
        </p>
      </div>
    </form>
  )
}
