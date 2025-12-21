import type { FC } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { useAuth } from '../../auth/useAuth'
import { AuthModal } from '../auth/AuthModal'
import { ProfileModal } from '../profile/ProfileModal'
import { UsersModal } from '../admin/UsersModal'
import { TracksModal } from '../admin/TracksModal'
import { Toast } from '../common/Toast'

export const Header: FC = () => {
  const { lang, setLang, t } = useI18n()
  const { currentUser, userProfile, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false)
  const [isTracksModalOpen, setIsTracksModalOpen] = useState(false)
  const [showLogoutToast, setShowLogoutToast] = useState(false)
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false)

  const adminDropdownRef = useRef<HTMLDivElement>(null)

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

  const handleUsersClick = () => {
    setIsUsersModalOpen(true)
    setIsMenuOpen(false)
    setIsAdminDropdownOpen(false)
  }

  const handleTracksClick = () => {
    setIsTracksModalOpen(true)
    setIsMenuOpen(false)
    setIsAdminDropdownOpen(false)
  }

  const toggleAdminDropdown = () => {
    setIsAdminDropdownOpen((prev) => !prev)
  }

  // Click outside to close admin dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isAdminDropdownOpen && adminDropdownRef.current && !adminDropdownRef.current.contains(event.target as Node)) {
        setIsAdminDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isAdminDropdownOpen])

  // ESC key to close admin dropdown
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isAdminDropdownOpen) {
        setIsAdminDropdownOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isAdminDropdownOpen])

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

          {userProfile?.role === 'admin' && (
            <div className="admin-dropdown-container" ref={adminDropdownRef}>
              <button
                className="admin-dropdown-trigger"
                onClick={toggleAdminDropdown}
                aria-expanded={isAdminDropdownOpen}
                aria-haspopup="true"
              >
                Admin
                <span className={`dropdown-arrow ${isAdminDropdownOpen ? 'open' : ''}`}>▼</span>
              </button>

              {isAdminDropdownOpen && (
                <div className="admin-dropdown-menu">
                  <button
                    className="admin-dropdown-item"
                    onClick={handleUsersClick}
                  >
                    👥 Users
                  </button>
                  <button
                    className="admin-dropdown-item"
                    onClick={handleTracksClick}
                  >
                    📚 Tracks
                  </button>
                </div>
              )}
            </div>
          )}

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

      <UsersModal
        isOpen={isUsersModalOpen}
        onClose={() => setIsUsersModalOpen(false)}
      />

      <TracksModal
        isOpen={isTracksModalOpen}
        onClose={() => setIsTracksModalOpen(false)}
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
