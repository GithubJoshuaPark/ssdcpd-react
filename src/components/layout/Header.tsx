import { onValue, ref } from "firebase/database";
import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { useI18n } from "../../i18n/useI18n";
import { database } from "../../services/firebaseService";
import type { Contact } from "../../types_interfaces/contact";
import type { Notice } from "../../types_interfaces/notice";
import { ContactsModal } from "../admin/ContactsModal";
import { NoticesModal } from "../admin/NoticesModal";
import { ProjectsModal } from "../admin/ProjectsModal";
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
  const [isContactsModalOpen, setIsContactsModalOpen] = useState(false);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
  const [isNoticesModalOpen, setIsNoticesModalOpen] = useState(false);
  const [showLogoutToast, setShowLogoutToast] = useState(false);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const [isCpdDropdownOpen, setIsCpdDropdownOpen] = useState(false);
  const [isHomeDropdownOpen, setIsHomeDropdownOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [noticeCount, setNoticeCount] = useState(0);

  const adminDropdownRef = useRef<HTMLDivElement>(null);
  const cpdDropdownRef = useRef<HTMLDivElement>(null);
  const homeDropdownRef = useRef<HTMLDivElement>(null);

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

  const handleContactsClick = () => {
    setIsContactsModalOpen(true);
    setIsMenuOpen(false);
    setIsAdminDropdownOpen(false);
  };

  const handleProjectsClick = () => {
    setIsProjectsModalOpen(true);
    setIsMenuOpen(false);
    setIsAdminDropdownOpen(false);
  };

  const handleNoticesClick = () => {
    setIsNoticesModalOpen(true);
    setIsMenuOpen(false);
    setIsAdminDropdownOpen(false);
  };

  const toggleCpdDropdown = () => {
    setIsCpdDropdownOpen(prev => !prev);
    setIsAdminDropdownOpen(false);
    setIsHomeDropdownOpen(false);
  };

  const toggleHomeDropdown = () => {
    setIsHomeDropdownOpen(prev => !prev);
    setIsAdminDropdownOpen(false);
    setIsCpdDropdownOpen(false);
  };

  const toggleAdminDropdown = () => {
    setIsAdminDropdownOpen(prev => !prev);
    setIsCpdDropdownOpen(false);
    setIsHomeDropdownOpen(false);
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

      if (
        isHomeDropdownOpen &&
        homeDropdownRef.current &&
        !homeDropdownRef.current.contains(target)
      ) {
        setIsHomeDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAdminDropdownOpen, isCpdDropdownOpen, isHomeDropdownOpen]);

  // ESC key to close admin dropdown
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsAdminDropdownOpen(false);
        setIsCpdDropdownOpen(false);
        setIsHomeDropdownOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Listen to pending contacts count (for admin)
  useEffect(() => {
    if (userProfile?.role === "admin") {
      const contactsRef = ref(database, "contacts");
      const unsubscribe = onValue(contactsRef, snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.val() as Record<string, Contact>;
          const count = Object.values(data).filter(c => !c.response).length;
          setPendingCount(count);
        } else {
          setPendingCount(0);
        }
      });
      return () => unsubscribe();
    } else {
      setTimeout(() => setPendingCount(0), 0);
    }
  }, [userProfile?.role]);

  // Listen to unread notices for the current user (last 2 days)
  useEffect(() => {
    if (!currentUser?.email) {
      // If no user, we naturally stop listening.
      // We can also reset count if we want to be safe, but doing it synchronously inside useEffect triggers warnings.
      // Since 'currentUser' changes will re-trigger this effect, let's just use a timeout or assume 0 init.
      // Actually, if we just return, the previous subscription cleans up, and if we want 0, we can wrap in setTimeout or use a separate logic.
      // But simpler: just initialize count to 0 in the 'else' of snapshot or depend on 'currentUser' change to reset?
      // Let's just avoid the explicit set here if it's already 0 or handled by unmount.
      return;
    }

    const noticesRef = ref(database, "notices");
    const unsubscribe = onValue(noticesRef, snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const now = Date.now();
        const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;
        const userEmail = currentUser.email!;

        const count = Object.values(data as Record<string, Notice>).filter(
          n => {
            if (!n || typeof n !== "object") return false;
            // Check time
            if (n.sentAt < twoDaysAgo) return false;

            // Check recipient
            const recipients = n.recipients;
            if (Array.isArray(recipients)) {
              return recipients.includes(userEmail);
            } else if (typeof recipients === "string") {
              return recipients === userEmail;
            }
            return false;
          }
        ).length;

        setNoticeCount(count);
      } else {
        setNoticeCount(0);
      }
    });

    return () => unsubscribe();
  }, [currentUser?.email]);

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
          <div className="admin-dropdown-container" ref={homeDropdownRef}>
            <button
              className="admin-dropdown-trigger"
              onClick={toggleHomeDropdown}
              aria-expanded={isHomeDropdownOpen}
              aria-haspopup="true"
            >
              Home
              <span
                className={`dropdown-arrow ${isHomeDropdownOpen ? "open" : ""}`}
              >
                ▼
              </span>
            </button>

            {isHomeDropdownOpen && (
              <div className="admin-dropdown-menu">
                <Link
                  to="/"
                  className="admin-dropdown-item"
                  onClick={() => {
                    handleNavClick();
                    setIsHomeDropdownOpen(false);
                  }}
                >
                  🏠 Introduction
                </Link>
                <Link
                  to="/projects"
                  className="admin-dropdown-item"
                  onClick={() => {
                    handleNavClick();
                    setIsHomeDropdownOpen(false);
                  }}
                >
                  🚀 Projects
                </Link>
              </div>
            )}
          </div>

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
                {pendingCount > 0 && <span className="admin-status-dot"></span>}
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
                  <Link
                    to="/organization"
                    className="admin-dropdown-item"
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                    }}
                    onClick={() => {
                      handleNavClick();
                      setIsAdminDropdownOpen(false);
                    }}
                  >
                    🏢 Organization
                  </Link>
                  <button
                    className="admin-dropdown-item"
                    onClick={handleProjectsClick}
                  >
                    🚀 Projects
                  </button>
                  <hr
                    style={{
                      border: "0",
                      height: "1px",
                      background: "rgba(255, 255, 255, 0.1)",
                      margin: "5px 0",
                    }}
                  />
                  <button
                    className="admin-dropdown-item"
                    onClick={handleContactsClick}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                    }}
                  >
                    <span>✉️ Contacts</span>
                    {pendingCount > 0 && (
                      <span className="notification-badge">{pendingCount}</span>
                    )}
                  </button>
                  <button
                    className="admin-dropdown-item"
                    onClick={handleNoticesClick}
                  >
                    📢 Notices
                  </button>
                  <hr
                    style={{
                      border: "0",
                      height: "1px",
                      background: "rgba(255, 255, 255, 0.1)",
                      margin: "5px 0",
                    }}
                  />
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
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {userProfile?.name || currentUser.email?.split("@")[0]}
                {noticeCount > 0 && (
                  <span
                    className="notification-badge"
                    style={{
                      marginLeft: "8px",
                      backgroundColor: "var(--accent)", // Use accent color or red
                      color: "#fff",
                      fontSize: "0.75rem",
                      padding: "2px 6px",
                      borderRadius: "10px",
                    }}
                  >
                    {noticeCount}
                  </span>
                )}
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
        onOpenNotices={() => {
          // ProfileModal stays open or closes? Usually modal on modal stack.
          // Let's close ProfileModal or keep it?
          // User typically wants to see notices.
          // Let's keep ProfileModal open or close it.
          // Simpler to close ProfileModal as NoticesModal is large.
          setIsProfileModalOpen(false);
          setIsNoticesModalOpen(true);
          // But wait, filterRecipient is based on currentUser.email in Header.
          // Note: Header's NoticesModal assumes filterRecipient is ONLY current user if passed.
          // We need to ensure state is managed.
        }}
      />

      <UsersModal
        isOpen={isUsersModalOpen}
        onClose={() => setIsUsersModalOpen(false)}
      />

      <TracksModal
        isOpen={isTracksModalOpen}
        onClose={() => setIsTracksModalOpen(false)}
      />

      <ContactsModal
        isOpen={isContactsModalOpen}
        onClose={() => setIsContactsModalOpen(false)}
      />

      <ProjectsModal
        isOpen={isProjectsModalOpen}
        onClose={() => setIsProjectsModalOpen(false)}
      />

      <NoticesModal
        isOpen={isNoticesModalOpen}
        onClose={() => setIsNoticesModalOpen(false)}
        filterRecipient={currentUser?.email || undefined}
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
