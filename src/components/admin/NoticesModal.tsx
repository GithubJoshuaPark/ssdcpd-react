import { onValue, ref, remove } from "firebase/database";
import type { FC } from "react";
import { Fragment, useEffect, useState } from "react";
import { useI18n } from "../../i18n/useI18n";
import { database } from "../../services/firebaseService";
import { ConfirmDialog } from "../common/ConfirmDialog";

interface Notice {
  id: string;
  subject: string;
  content: string;
  recipients: string | string[];
  sentAt: number;
  type?: string;
}

interface NoticesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NoticesModal: FC<NoticesModalProps> = ({ isOpen, onClose }) => {
  const { lang } = useI18n(); // Fix lint: 't' unused
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNoticeId, setExpandedNoticeId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetDeleteId, setTargetDeleteId] = useState<string | null>(null);

  // Filter & Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    if (!isOpen) return;

    const noticesRef = ref(database, "notices");
    const unsubscribe = onValue(noticesRef, snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const noticeList: Notice[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
        }));
        // Sort by sentAt descending (newest first)
        noticeList.sort((a, b) => b.sentAt - a.sentAt);
        setNotices(noticeList);
      } else {
        setNotices([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleExpand = (id: string) => {
    setExpandedNoticeId(expandedNoticeId === id ? null : id);
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return "-";
    return new Date(timestamp).toLocaleString(
      lang === "ko" ? "ko-KR" : "en-US"
    );
  };

  const getRecipientCount = (recipients: string | string[]) => {
    if (Array.isArray(recipients)) return recipients.length;
    return 1;
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTargetDeleteId(id);
    setConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!targetDeleteId) return;

    try {
      const noticeRef = ref(database, `notices/${targetDeleteId}`);
      await remove(noticeRef);
      setConfirmOpen(false);
      setTargetDeleteId(null);
    } catch (error) {
      console.error("Failed to delete notice:", error);
      alert("Failed to delete. Please try again.");
    }
  };

  // Filter Logic
  const filteredNotices = notices.filter(notice => {
    const term = searchTerm.toLowerCase();
    const subjectMatch = notice.subject?.toLowerCase().includes(term);
    const bodyMatch = notice.content?.toLowerCase().includes(term);

    // Check recipients
    let recipientMatch = false;
    if (Array.isArray(notice.recipients)) {
      recipientMatch = notice.recipients.some(r =>
        r.toLowerCase().includes(term)
      );
    } else if (typeof notice.recipients === "string") {
      recipientMatch = notice.recipients.toLowerCase().includes(term);
    }

    return subjectMatch || bodyMatch || recipientMatch;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredNotices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNotices = filteredNotices.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div
        className="auth-modal"
        style={{
          maxWidth: "900px",
          width: "95%",
          height: "85vh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={e => e.stopPropagation()}
      >
        <button className="auth-modal-close" onClick={onClose}>
          ✕
        </button>

        <h2 className="auth-modal-title">📢 Notices History</h2>

        {/* Search & Items Per Page Controls */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "20px",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            className="auth-input"
            placeholder="Search subject, content, or recipient..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            style={{ marginBottom: 0, flex: 1, minWidth: "200px" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Rows:
            </span>
            <select
              className="auth-input"
              value={itemsPerPage}
              onChange={e => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{ width: "auto", marginBottom: 0, padding: "8px" }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
            </select>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px",
                color: "var(--text-muted)",
              }}
            >
              Loading notices...
            </div>
          ) : filteredNotices.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px",
                color: "var(--text-muted)",
              }}
            >
              No notices found.
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: "22%" }}>Date</th>
                  <th style={{ width: "43%" }}>Subject</th>
                  <th style={{ width: "15%", textAlign: "center" }}>
                    Recipients
                  </th>
                  <th style={{ width: "20%", textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedNotices.map(notice => (
                  <Fragment key={notice.id}>
                    <tr className="admin-table-row">
                      <td
                        style={{
                          fontSize: "0.85rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {formatDate(notice.sentAt)}
                      </td>
                      <td
                        style={{ fontWeight: "500", color: "#fff" }}
                        title={notice.subject}
                      >
                        {notice.subject}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span className="role-badge user">
                          {getRecipientCount(notice.recipients)} users
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          className="action-btn view"
                          onClick={() => toggleExpand(notice.id)}
                        >
                          {expandedNoticeId === notice.id ? "Hide" : "View"}
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={e => handleDelete(notice.id, e)}
                        >
                          Del
                        </button>
                      </td>
                    </tr>
                    {expandedNoticeId === notice.id && (
                      <tr className="notice-detail-row">
                        <td colSpan={4} style={{ padding: 0, border: "none" }}>
                          <div
                            style={{
                              backgroundColor: "rgba(255, 255, 255, 0.05)",
                              padding: "20px",
                              borderBottom:
                                "1px solid rgba(255, 255, 255, 0.1)",
                              animation: "fadeIn 0.2s ease-in-out",
                            }}
                          >
                            <div style={{ marginBottom: "15px" }}>
                              <strong
                                style={{
                                  color: "var(--accent)",
                                  display: "block",
                                  marginBottom: "5px",
                                }}
                              >
                                To:
                              </strong>
                              <div
                                style={{
                                  background: "rgba(0,0,0,0.2)",
                                  padding: "8px",
                                  borderRadius: "4px",
                                  fontSize: "0.9rem",
                                  color: "var(--text-muted)",
                                  wordBreak: "break-all",
                                  maxHeight: "100px",
                                  overflowY: "auto",
                                }}
                              >
                                {Array.isArray(notice.recipients)
                                  ? notice.recipients.join(", ")
                                  : notice.recipients}
                              </div>
                            </div>

                            <div style={{ marginBottom: "10px" }}>
                              <strong
                                style={{
                                  color: "var(--accent)",
                                  display: "block",
                                  marginBottom: "5px",
                                }}
                              >
                                Message:
                              </strong>
                              <div
                                className="ql-editor"
                                style={{
                                  backgroundColor: "#fff",
                                  color: "#333",
                                  padding: "15px",
                                  borderRadius: "4px",
                                  minHeight: "150px",
                                }}
                                dangerouslySetInnerHTML={{
                                  __html: notice.content,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls */}
        {filteredNotices.length > 0 && (
          <div
            className="pagination-controls"
            style={{
              marginTop: "20px",
              display: "flex",
              justifyContent: "center",
              gap: "10px",
            }}
          >
            <button
              className="pagination-button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            >
              Previous
            </button>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                color: "var(--text-muted)",
              }}
            >
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="pagination-button"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage(prev => Math.min(prev + 1, totalPages))
              }
            >
              Next
            </button>
          </div>
        )}
      </div>
      <ConfirmDialog
        isOpen={confirmOpen}
        title="Delete History"
        message="Are you sure you want to delete this history?"
        confirmText="Delete"
        onConfirm={executeDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setTargetDeleteId(null);
        }}
      />
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .pagination-button {
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          color: #fff;
          cursor: pointer;
          transition: all 0.2s;
        }
        .pagination-button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.2);
        }
        .pagination-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Action Buttons */
        .action-btn {
          width: 60px;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          backdrop-filter: blur(4px);
          margin: 0 4px;
        }

        .action-btn.view {
          background: rgba(64, 196, 255, 0.1);
          color: #40c4ff;
          border: 1px solid rgba(64, 196, 255, 0.3);
        }

        .action-btn.view:hover {
          background: rgba(64, 196, 255, 0.2);
          border-color: #40c4ff;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(64, 196, 255, 0.2);
        }

        .action-btn.delete {
          background: rgba(255, 82, 82, 0.1);
          color: #ff5252;
          border: 1px solid rgba(255, 82, 82, 0.3);
        }

        .action-btn.delete:hover {
          background: rgba(255, 82, 82, 0.2);
          border-color: #ff5252;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 82, 82, 0.2);
        }
      `}</style>
    </div>
  );
};
