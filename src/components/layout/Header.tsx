import type { FC } from 'react'
import { useState } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { useAuth } from '../../auth/useAuth'
import { AuthModal } from '../auth/AuthModal'
import { ProfileModal } from '../profile/ProfileModal'
import { Toast } from '../common/Toast'

export const Header: FC = () => {
  const { lang, setLang, t } = useI18n()
  const { currentUser, userProfile, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [showLogoutToast, setShowLogoutToast] = useState(false)

  const toggleLang = () => {
    setLang(lang === 'en' ? 'ko' : 'en')
  }

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev)
  }

  // 모바일에서 메뉴 클릭 후 자동으로 닫히게 하고 싶으면 사용
  const handleNavClick = () => {
    setIsMenuOpen(false)
  }

  const handleLogout = async () => {
    try {
      await logout()
      setShowLogoutToast(true)
      setIsMenuOpen(false)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleLoginClick = () => {
    setIsAuthModalOpen(true)
    setIsMenuOpen(false)
  }

  const handleProfileClick = () => {
    setIsProfileModalOpen(true)
    setIsMenuOpen(false)
  }

  return (
    <>
      <header className="top-nav">
        <div className="logo">
          <span className="logo-mark">CPD</span>
          <span className="logo-text">Senior Software Developer</span>
        </div>

        {/* 햄버거 버튼 */}
        <button
          id="hamburger"
          className={`hamburger ${isMenuOpen ? 'active' : ''}`}
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
          onClick={toggleMenu}
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>

        {/* 내비게이션 */}
        <nav
          className={`nav-links ${isMenuOpen ? 'active' : ''}`}
          id="navMenu"
        >
          <a href="#overview" onClick={handleNavClick}>
            {t('nav.overview')}
          </a>
          <a href="#tracks" onClick={handleNavClick}>
            {t('nav.tracks')}
          </a>
          <a href="#timeline" onClick={handleNavClick}>
            {t('nav.timeline')}
          </a>
          <a href="#about" onClick={handleNavClick}>
            {t('nav.about')}
          </a>

          {currentUser ? (
            <>
              <span
                className="user-name clickable"
                onClick={handleProfileClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleProfileClick()}
              >
                {userProfile?.name || currentUser.email?.split('@')[0]}
              </span>
              <button onClick={handleLogout} className="auth-nav-button">
                {t('auth.logout')}
              </button>
            </>
          ) : (
            <button onClick={handleLoginClick} className="auth-nav-button">
              {t('auth.login')}
            </button>
          )}

          <button onClick={toggleLang} className="lang-toggle">
            {lang === 'en' ? 'KR' : 'EN'}
          </button>
        </nav>
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {showLogoutToast && (
        <Toast
          message={t('auth.logoutSuccess')}
          type="success"
          onClose={() => setShowLogoutToast(false)}
        />
      )}
    </>
  )
}
