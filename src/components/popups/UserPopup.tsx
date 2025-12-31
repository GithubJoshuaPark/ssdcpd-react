import type { FC } from "react";
import { useEffect, useMemo, useState } from "react";
import { FaCheck, FaSearch, FaTimes } from "react-icons/fa";
import { getAllUserProfiles } from "../../services/firebaseService";
import type { UserProfile } from "../../types_interfaces/userProfile";

interface UserPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (users: UserProfile[]) => void;
  selectionMode: "single" | "multiple";
  title?: string;
}

export const UserPopup: FC<UserPopupProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectionMode,
  title = "Select User",
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const data = await getAllUserProfiles();
        setUsers(data);
      } catch (err) {
        console.error("Failed to fetch users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
    setSelectedIds(new Set());
    setSearchTerm("");
  }, [isOpen]);

  // Reset to page 1 when search or itemsPerPage changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const toggleUser = (uid: string) => {
    const newSet = new Set(selectedIds);
    if (selectionMode === "single") {
      newSet.clear();
      newSet.add(uid);
    } else {
      if (newSet.has(uid)) newSet.delete(uid);
      else newSet.add(uid);
    }
    setSelectedIds(newSet);
  };

  const handleConfirm = () => {
    const selected = users.filter(u => selectedIds.has(u.uid));
    onSelect(selected);
    onClose();
  };

  const filteredUsers = useMemo(() => {
    return users.filter(
      u =>
        (u.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        zIndex: 15000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className="card"
        style={{
          width: "90%",
          maxWidth: "500px",
          height: "80vh",
          display: "flex",
          flexDirection: "column",
          padding: 0,
          background: "#1e1e1e", // Fallback
          backgroundColor: "var(--card-bg, #1e1e1e)",
          border: "1px solid var(--card-border, #333)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid var(--card-border, #333)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "600" }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="glass-btn glass-btn-cancel"
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              padding: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <FaTimes />
          </button>
        </div>

        <div
          style={{
            padding: "16px",
            borderBottom: "1px solid var(--card-border, #333)",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ position: "relative" }}>
            <FaSearch
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted, #888)",
              }}
            />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="auth-input"
              style={{
                width: "100%",
                paddingLeft: "36px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid var(--card-border, #333)",
                color: "var(--text-color, #fff)",
                borderRadius: "8px",
                height: "40px",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted, #888)",
                whiteSpace: "nowrap",
              }}
            >
              Show:
            </span>
            <select
              value={itemsPerPage}
              onChange={e => setItemsPerPage(Number(e.target.value))}
              className="glass-btn"
              style={{
                width: "70px",
                padding: "4px 8px",
                height: "32px",
                cursor: "pointer",
                justifyContent: "space-between",
                color: "var(--text-color, #fff)",
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

        <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px",
                color: "var(--text-muted, #888)",
              }}
            >
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px",
                color: "var(--text-muted, #888)",
              }}
            >
              No users found.
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {paginatedUsers.map(user => {
                const isSelected = selectedIds.has(user.uid);
                return (
                  <div
                    key={user.uid}
                    onClick={() => toggleUser(user.uid)}
                    style={{
                      padding: "12px 16px",
                      borderRadius: "8px",
                      background: isSelected
                        ? "rgba(59, 130, 246, 0.15)"
                        : "rgba(255,255,255,0.02)",
                      border: isSelected
                        ? "1px solid var(--accent, #3b82f6)"
                        : "1px solid transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "all 0.2s",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          overflow: "hidden",
                          flexShrink: 0,
                          backgroundColor: user.photoURL
                            ? "transparent"
                            : "rgba(255, 255, 255, 0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.name || "User"}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              fontSize: "0.9rem",
                              color: "#e5e7eb",
                              fontWeight: "600",
                            }}
                          >
                            {(user.email || "U").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: "600", fontSize: "0.95rem" }}>
                          {user.name || "Unknown"}
                        </div>
                        <div
                          style={{
                            fontSize: "0.85rem",
                            color: "var(--text-muted, #888)",
                          }}
                        >
                          {user.email}
                        </div>
                      </div>
                    </div>
                    {isSelected && <FaCheck color="var(--accent, #3b82f6)" />}
                  </div>
                );
              })}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "15px",
                    padding: "10px 0",
                    marginTop: "10px",
                    borderTop: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="glass-btn"
                    style={{
                      padding: "6px 12px",
                      fontSize: "0.8rem",
                      opacity: currentPage === 1 ? 0.5 : 1,
                      cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    }}
                  >
                    {"< Prev"}
                  </button>
                  <span
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-muted, #888)",
                    }}
                  >
                    Page <strong>{currentPage}</strong> of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage(p => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="glass-btn"
                    style={{
                      padding: "6px 12px",
                      fontSize: "0.8rem",
                      opacity: currentPage === totalPages ? 0.5 : 1,
                      cursor:
                        currentPage === totalPages ? "not-allowed" : "pointer",
                    }}
                  >
                    {"Next >"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid var(--card-border, #333)",
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            background: "rgba(0,0,0,0.2)",
          }}
        >
          <div
            style={{
              marginRight: "auto",
              fontSize: "0.9rem",
              color: "var(--text-muted)",
              alignSelf: "center",
            }}
          >
            {selectedIds.size} selected
          </div>
          <button
            onClick={onClose}
            className="glass-btn glass-btn-cancel"
            style={{ justifyContent: "center" }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="glass-btn glass-btn-primary"
            disabled={selectedIds.size === 0}
            style={{
              justifyContent: "center",
              opacity: selectedIds.size === 0 ? 0.5 : 1,
              cursor: selectedIds.size === 0 ? "not-allowed" : "pointer",
            }}
          >
            Confirm
          </button>
        </div>
      </div>
      <style>{`
        .glass-btn {
          padding: 8px 16px;
          border-radius: 8px;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          transition: all 0.3s ease;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.9rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-color, #eee);
        }
        .glass-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-1px);
        }
        .glass-btn-primary {
          background: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 146, 0.3);
          color: #60a5fa;
        }
        .glass-btn-primary:hover {
          background: rgba(59, 130, 246, 0.3);
          border-color: rgba(59, 130, 246, 0.5);
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
        }
        .glass-btn-cancel {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #fca5a5;
        }
        .glass-btn-cancel:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.4);
          transform: translateY(-1px);
          color: #fca5a5;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.1);
        }
      `}</style>
    </div>
  );
};
