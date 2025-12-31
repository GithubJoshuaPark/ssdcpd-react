// src/components/admin/UsersModal.tsx
import type { ChangeEvent, FC } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "../../i18n/useI18n";
import { getAllUserProfiles } from "../../services/firebaseService";
import type { UserProfile } from "../../types_interfaces/userProfile";
import DownloadDataWithExcelOrCsv from "../common/DownloadDataWithExcelOrCsv";
import { Toast } from "../common/Toast";
import { ProfileModal } from "../profile/ProfileModal";
import { SendEmailByAdminModal } from "./SendEmailByAdminModal";
import { SendEmailModal } from "./SendEmailModal";

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

  // --- Email Selection State ---
  const [selectedUids, setSelectedUids] = useState<Set<string>>(new Set());

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isInviteEmailModalOpen, setIsInviteEmailModalOpen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);

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
    setSelectedUids(new Set()); // 필터 변경 시 선택 초기화 (선택 사항)
  }, [searchTerm, itemsPerPage]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !selectedUser && !isEmailModalOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, selectedUser, isEmailModalOpen]);

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
          user.email?.toLowerCase().includes(term) ||
          user.role?.toLowerCase().includes(term) ||
          false
        );
      })
      .sort((a: UserProfile, b: UserProfile) => {
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

  // --- Selection Handlers ---
  const toggleSelectUser = (uid: string) => {
    const newSet = new Set(selectedUids);
    if (newSet.has(uid)) {
      newSet.delete(uid);
    } else {
      newSet.add(uid);
    }
    setSelectedUids(newSet);
  };

  const handleSelectAll = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // 현재 필터링된 목록의 모든 UID 선택
      const allUids = filteredUsers.map(u => u.uid);
      const newSet = new Set(selectedUids);
      allUids.forEach(uid => newSet.add(uid));
      setSelectedUids(newSet);
    } else {
      // 현재 필터링된 모든 UID 해제 (다른 필터로 선택된 건 유지할지, 전체 해제할지 결정 필요. 여기선 전체 해제로 단순화)
      // 또는 filteredUsers에 있는 것만 제거:
      const newSet = new Set(selectedUids);
      filteredUsers.forEach(u => newSet.delete(u.uid));
      setSelectedUids(newSet);
    }
  };

  // 현재 페이지의 모든 유저가 선택되었는지 확인 (헤더 체크박스용)
  const isAllSelected =
    filteredUsers.length > 0 &&
    paginatedUsers.every(u => selectedUids.has(u.uid)); // 'paginatedUsers' or 'filteredUsers'? -> Table Header usually controls visual items.

  // 선택된 사용자들의 이메일 목록 추출
  const selectedEmails = useMemo(() => {
    return users
      .filter(u => selectedUids.has(u.uid) && u.email)
      .map(u => u.email);
  }, [users, selectedUids]);

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

          <h2
            className="users-modal-title"
            style={{ display: "flex", alignItems: "center", gap: "10px" }}
          >
            {t("admin.usersTitle")}
            <span
              className="notification-badge"
              style={{
                backgroundColor: "var(--accent)",
                color: "#fff",
                fontSize: "1rem",
                padding: "2px 10px",
                borderRadius: "12px",
              }}
            >
              {filteredUsers.length}
            </span>
          </h2>

          {/* 검색 필터 및 페이지 설정 */}
          <div
            className="users-filter-section"
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "10px",
              marginBottom: "20px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              className="auth-input users-search-input"
              style={{ flex: 1, marginBottom: 0, minWidth: "200px" }}
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

            <button
              className="glass-btn"
              onClick={() => setIsDownloadOpen(true)}
            >
              Export
            </button>

            <button
              className="glass-btn"
              onClick={() => setIsInviteEmailModalOpen(true)}
            >
              Inviting...
            </button>

            {/* 이메일 발송 버튼 */}
            {selectedUids.size > 0 && (
              <button
                className="glass-btn glass-btn-primary"
                onClick={() => setIsEmailModalOpen(true)}
              >
                Send Email ({selectedUids.size})
              </button>
            )}
          </div>

          {/* 사용자 목록 테이블/카드 */}
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
                      <th style={{ width: "40px", textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={handleSelectAll}
                          style={{ cursor: "pointer" }}
                        />
                      </th>
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
                        <td style={{ textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={selectedUids.has(user.uid)}
                            onChange={() => toggleSelectUser(user.uid)}
                            style={{ cursor: "pointer" }}
                          />
                        </td>
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
                            style={{
                              background: "rgba(56, 189, 248, 0.15)",
                              color: "#7dd3fc",
                              border: "1px solid rgba(56, 189, 248, 0.3)",
                              backdropFilter: "blur(4px)",
                              boxShadow: "0 2px 10px rgba(56, 189, 248, 0.1)",
                            }}
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
                  <div
                    style={{
                      padding: "10px",
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: "8px",
                      marginBottom: "10px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      id="mobile-select-all"
                    />
                    <label
                      htmlFor="mobile-select-all"
                      style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}
                    >
                      Select All on Page
                    </label>
                  </div>

                  {paginatedUsers.map((user: UserProfile) => (
                    <div key={user.uid} className="user-mobile-card">
                      <div className="user-mobile-card-header">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <div className="users-avatar large">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt={user.name} />
                            ) : (
                              <div className="users-avatar-placeholder">
                                {user.email.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="user-mobile-card-body">
                        <div
                          className="user-info-row"
                          style={{
                            display: "flex",
                            justifyContent: "flex-start",
                            gap: "10px",
                            alignItems: "center",
                          }}
                        >
                          <span
                            className="user-info-label"
                            style={{ minWidth: "60px" }}
                          >
                            Select
                          </span>
                          <input
                            type="checkbox"
                            checked={selectedUids.has(user.uid)}
                            onChange={() => toggleSelectUser(user.uid)}
                          />
                        </div>
                        <div
                          className="user-info-row"
                          style={{
                            display: "flex",
                            justifyContent: "flex-start",
                            gap: "10px",
                          }}
                        >
                          <span
                            className="user-info-label"
                            style={{ minWidth: "60px" }}
                          >
                            {t("admin.table.name")}
                          </span>
                          <span className="user-info-value">
                            {user.name || "-"}
                          </span>
                        </div>
                        <div
                          className="user-info-row"
                          style={{
                            display: "flex",
                            justifyContent: "flex-start",
                            gap: "10px",
                          }}
                        >
                          <span
                            className="user-info-label"
                            style={{ minWidth: "60px" }}
                          >
                            {t("admin.table.email")}
                          </span>
                          <span className="user-info-value">{user.email}</span>
                        </div>
                        <div
                          className="user-info-row"
                          style={{
                            display: "flex",
                            justifyContent: "flex-start",
                            gap: "10px",
                            alignItems: "center",
                          }}
                        >
                          <span
                            className="user-info-label"
                            style={{ minWidth: "60px" }}
                          >
                            {t("admin.table.role")}
                          </span>
                          <span className={`role-badge ${user.role}`}>
                            {user.role}
                          </span>
                        </div>
                      </div>

                      <div className="user-mobile-card-footer">
                        <button
                          className="users-detail-button full-width"
                          style={{
                            background: "rgba(56, 189, 248, 0.15)",
                            color: "#7dd3fc",
                            border: "1px solid rgba(56, 189, 248, 0.3)",
                            backdropFilter: "blur(4px)",
                            boxShadow: "0 2px 10px rgba(56, 189, 248, 0.1)",
                          }}
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
          loadUsers();
        }}
      />

      {/* 이메일 발송 모달 */}
      <SendEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        targetEmails={selectedEmails}
        onSendSuccess={() => setSelectedUids(new Set())}
      />

      <SendEmailByAdminModal
        isOpen={isInviteEmailModalOpen}
        onClose={() => setIsInviteEmailModalOpen(false)}
      />

      <DownloadDataWithExcelOrCsv
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        data={filteredUsers}
        headers={[
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "role", label: "Role" },
          { key: "uid", label: "User ID" },
          { key: "created_at", label: "Signed Up" },
        ]}
        fileName="users_list"
      />

      {error && (
        <Toast message={error} type="error" onClose={() => setError(null)} />
      )}

      <style>{`
        .glass-btn {
            padding: 8px 16px;
            border-radius: 12px;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 0.9rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #ccc;
            background: rgba(255, 255, 255, 0.05);
            white-space: nowrap;
        }
        
        .glass-btn:hover {
            background: rgba(255, 255, 255, 0.15);
            color: white;
            border-color: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        
        .glass-btn-primary {
            background: rgba(59, 130, 246, 0.2);
            border: 1px solid rgba(59, 130, 246, 0.4);
            color: #60a5fa;
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.1);
            margin-left: 10px;
        }
        
        .glass-btn-primary:hover {
            background: rgba(59, 130, 246, 0.5);
            border-color: rgba(59, 130, 246, 0.8);
            color: white;
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.3);
            transform: translateY(-2px);
        }
      `}</style>
    </>
  );
};
