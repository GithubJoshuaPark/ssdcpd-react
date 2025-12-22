import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { useI18n } from "../../i18n/useI18n";
import { TracksModal } from "../admin/TracksModal";
import { UsersModal } from "../admin/UsersModal";
import { AuthModal } from "../auth/AuthModal";
import { Toast } from "../common/Toast";
import { ProfileModal } from "../profile/ProfileModal";

export const Header: FC = () => {
  const navigate = useNavigate();
  const { lang, setLang, t } = useI18n();
  const { currentUser, userProfile, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [isTracksModalOpen, setIsTracksModalOpen] = useState(false);
  const [showLogoutToast, setShowLogoutToast] = useState(false);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const [isCpdDropdownOpen, setIsCpdDropdownOpen] = useState(false);

  const adminDropdownRef = useRef<HTMLDivElement>(null);
  const cpdDropdownRef = useRef<HTMLDivElement>(null);

  const toggleLang = () => {
    setLang(lang === "en" ? "ko" : "en");
  };

  const toggleMenu = () => {
    setIsMenuOpen(prev => !prev);
  };

  const handleNavClick = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setShowLogoutToast(true);
      setIsMenuOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleLoginClick = () => {
    setIsAuthModalOpen(true);
    setIsMenuOpen(false);
  };

  const handleProfileClick = () => {
    setIsProfileModalOpen(true);
    setIsMenuOpen(false);
  };

  const handleUsersClick = () => {
    setIsUsersModalOpen(true);
    setIsMenuOpen(false);
    setIsAdminDropdownOpen(false);
  };

  const handleTracksClick = () => {
    setIsTracksModalOpen(true);
    setIsMenuOpen(false);
    setIsAdminDropdownOpen(false);
  };

  const toggleAdminDropdown = () => {
    setIsAdminDropdownOpen(prev => !prev);
    setIsCpdDropdownOpen(false);
  };

  const toggleCpdDropdown = () => {
    setIsCpdDropdownOpen(prev => !prev);
    setIsAdminDropdownOpen(false);
  };

  // Click outside to close admin dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        isAdminDropdownOpen &&
        adminDropdownRef.current &&
        !adminDropdownRef.current.contains(target)
      ) {
        setIsAdminDropdownOpen(false);
      }

      if (
        isCpdDropdownOpen &&
        cpdDropdownRef.current &&
        !cpdDropdownRef.current.contains(target)
      ) {
        setIsCpdDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAdminDropdownOpen, isCpdDropdownOpen]);

  // ESC key to close admin dropdown
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsAdminDropdownOpen(false);
        setIsCpdDropdownOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <>
      <header className="top-nav">
        <Link to="/" className="logo" onClick={handleNavClick}>
          <span className="logo-mark">CPD</span>
          <span className="logo-text">Senior Software Developer</span>
        </Link>

        {/* 햄버거 버튼 */}
        <button
          id="hamburger"
          className={`hamburger ${isMenuOpen ? "active" : ""}`}
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
          onClick={toggleMenu}
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>

        {/* 내비게이션 */}
        <nav className={`nav-links ${isMenuOpen ? "active" : ""}`} id="navMenu">
          <Link to="/" className="nav-item-link" onClick={handleNavClick}>
            Home
          </Link>

          <div className="admin-dropdown-container" ref={cpdDropdownRef}>
            <button
              className="admin-dropdown-trigger"
              onClick={toggleCpdDropdown}
              aria-expanded={isCpdDropdownOpen}
              aria-haspopup="true"
            >
              CPD
              <span
                className={`dropdown-arrow ${isCpdDropdownOpen ? "open" : ""}`}
              >
                ▼
              </span>
            </button>

            {isCpdDropdownOpen && (
              <div className="admin-dropdown-menu">
                <Link
                  to="/cpd#overview"
                  className="admin-dropdown-item"
                  onClick={() => {
                    handleNavClick();
                    setIsCpdDropdownOpen(false);
                  }}
                >
                  {t("nav.overview")}
                </Link>
                <Link
                  to="/cpd#tracks"
                  className="admin-dropdown-item"
                  onClick={() => {
                    handleNavClick();
                    setIsCpdDropdownOpen(false);
                  }}
                >
                  {t("nav.tracks")}
                </Link>
                <Link
                  to="/cpd#timeline"
                  className="admin-dropdown-item"
                  onClick={() => {
                    handleNavClick();
                    setIsCpdDropdownOpen(false);
                  }}
                >
                  {t("nav.timeline")}
                </Link>
                <Link
                  to="/cpd#about"
                  className="admin-dropdown-item"
                  onClick={() => {
                    handleNavClick();
                    setIsCpdDropdownOpen(false);
                  }}
                >
                  {t("nav.about")}
                </Link>
              </div>
            )}
          </div>

          {userProfile?.role === "admin" && (
            <div className="admin-dropdown-container" ref={adminDropdownRef}>
              <button
                className="admin-dropdown-trigger"
                onClick={toggleAdminDropdown}
                aria-expanded={isAdminDropdownOpen}
                aria-haspopup="true"
              >
                Admin
                <span
                  className={`dropdown-arrow ${
                    isAdminDropdownOpen ? "open" : ""
                  }`}
                >
                  ▼
                </span>
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
                onKeyDown={e => e.key === "Enter" && handleProfileClick()}
              >
                {userProfile?.name || currentUser.email?.split("@")[0]}
              </span>
              <button onClick={handleLogout} className="auth-nav-button">
                {t("auth.logout")}
              </button>
            </>
          ) : (
            <button onClick={handleLoginClick} className="auth-nav-button">
              {t("auth.login")}
            </button>
          )}

          <button onClick={toggleLang} className="lang-toggle">
            {lang === "en" ? "KR" : "EN"}
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
          message={t("auth.logoutSuccess")}
          type="success"
          onClose={() => setShowLogoutToast(false)}
        />
      )}
    </>
  );
};
