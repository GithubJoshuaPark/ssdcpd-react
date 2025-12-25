// src/components/admin/UsersModal.tsx
import type { ChangeEvent, FC } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "../../i18n/useI18n";
import { getAllUserProfiles } from "../../services/firebaseService";
import type { UserProfile } from "../../types_interfaces/userProfile";
import { Toast } from "../common/Toast";
import { ProfileModal } from "../profile/ProfileModal";

interface UsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UsersModal: FC<UsersModalProps> = ({ isOpen, onClose }) => {
  const { t } = useI18n();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllUserProfiles();
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users:", err);
      setError(t("admin.error") || "Failed to load user list.");
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen, loadUsers]);

  // Reset to page 1 when search or itemsPerPage changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !selectedUser) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, selectedUser]);

  // 모달이 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return users
      .filter((user: UserProfile) => {
        return (
          user.name?.toLowerCase().includes(term) ||
          false ||
          user.email.toLowerCase().includes(term) ||
          user.role?.toLowerCase().includes(term) ||
          false
        );
      })
      .sort((a: UserProfile, b: UserProfile) => {
        // Sort by creation date descending
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });
  }, [users, searchTerm]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const handleUserClick = (user: UserProfile) => {
    setSelectedUser(user);
  };

  const closeProfileModal = () => {
    setSelectedUser(null);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="auth-modal-overlay" onClick={onClose}>
        <div className="users-modal" onClick={e => e.stopPropagation()}>
          <button className="auth-modal-close" onClick={onClose}>
            ✕
          </button>

          <h2 className="users-modal-title">{t("admin.usersTitle")}</h2>

          {/* 검색 필터 및 페이지 설정 */}
          <div
            className="users-filter-section"
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "10px",
              marginBottom: "20px",
              alignItems: "center",
            }}
          >
            <input
              type="text"
              className="auth-input users-search-input"
              style={{ flex: 1, marginBottom: 0 }}
              placeholder={t("admin.searchPlaceholder")}
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  whiteSpace: "nowrap",
                }}
              >
                Show:
              </span>
              <select
                value={itemsPerPage}
                onChange={e => setItemsPerPage(Number(e.target.value))}
                className="auth-input"
                style={{
                  width: "70px",
                  padding: "6px 8px",
                  marginBottom: 0,
                  cursor: "pointer",
                }}
              >
                {[5, 10, 20, 30].map(val => (
                  <option key={val} value={val}>
                    {val}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 사용자 목록 테이블 */}
          <div className="users-table-container">
            {loading ? (
              <div className="users-loading">{t("admin.loading")}</div>
            ) : error ? (
              <div className="users-error">{error}</div>
            ) : filteredUsers.length === 0 ? (
              <div className="users-empty">{t("admin.empty")}</div>
            ) : (
              <>
                {/* Desktop View: Table */}
                <table className="users-table desktop-only">
                  <thead>
                    <tr>
                      <th>{t("admin.table.profile")}</th>
                      <th>{t("admin.table.name")}</th>
                      <th>{t("admin.table.email")}</th>
                      <th>{t("admin.table.role")}</th>
                      <th>{t("admin.table.action")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((user: UserProfile) => (
                      <tr key={user.uid}>
                        <td>
                          <div className="users-avatar">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt={user.name} />
                            ) : (
                              <div className="users-avatar-placeholder">
                                {user.email.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>{user.name || "-"}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`role-badge ${user.role}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <button
                            className="users-detail-button"
                            onClick={() => handleUserClick(user)}
                          >
                            {t("admin.detail")}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile View: Cards */}
                <div className="users-mobile-cards mobile-only">
                  {paginatedUsers.map((user: UserProfile) => (
                    <div key={user.uid} className="user-mobile-card">
                      <div className="user-mobile-card-header">
                        <div className="users-avatar large">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt={user.name} />
                          ) : (
                            <div className="users-avatar-placeholder">
                              {user.email.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className={`role-badge ${user.role}`}>
                          {user.role}
                        </span>
                      </div>

                      <div className="user-mobile-card-body">
                        <div className="user-info-row">
                          <span className="user-info-label">
                            {t("admin.table.name")}
                          </span>
                          <span className="user-info-value">
                            {user.name || "-"}
                          </span>
                        </div>
                        <div className="user-info-row">
                          <span className="user-info-label">
                            {t("admin.table.email")}
                          </span>
                          <span className="user-info-value">{user.email}</span>
                        </div>
                      </div>

                      <div className="user-mobile-card-footer">
                        <button
                          className="users-detail-button full-width"
                          onClick={() => handleUserClick(user)}
                        >
                          {t("admin.detail")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div
                    className="pagination-controls"
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "15px",
                      padding: "20px 0 10px",
                      borderTop: "1px solid rgba(255,255,255,0.1)",
                      marginTop: "20px",
                    }}
                  >
                    <button
                      className="chip"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      style={{
                        opacity: currentPage === 1 ? 0.5 : 1,
                        cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      }}
                    >
                      &larr; Prev
                    </button>
                    <span
                      style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}
                    >
                      Page <strong>{currentPage}</strong> of {totalPages}
                    </span>
                    <button
                      className="chip"
                      disabled={currentPage === totalPages}
                      onClick={() =>
                        setCurrentPage(p => Math.min(totalPages, p + 1))
                      }
                      style={{
                        opacity: currentPage === totalPages ? 0.5 : 1,
                        cursor:
                          currentPage === totalPages
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      Next &rarr;
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 선택된 사용자 상세 정보 (읽기 전용 프로필 모달) */}
      <ProfileModal
        isOpen={!!selectedUser}
        onClose={closeProfileModal}
        targetProfile={selectedUser || undefined}
        onUserDeleted={() => {
          // 사용자 삭제 후 목록 새로고침
          loadUsers();
        }}
      />

      {error && (
        <Toast message={error} type="error" onClose={() => setError(null)} />
      )}
    </>
  );
};
