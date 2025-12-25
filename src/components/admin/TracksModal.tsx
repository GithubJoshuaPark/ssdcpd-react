// src/components/admin/TracksModal.tsx
import type { ChangeEvent, FC } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { deleteTrack, getAllTracks } from "../../services/firebaseService";
import type { Track } from "../../types_interfaces/track";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { Toast } from "../common/Toast";
import { TrackFormModal } from "./TrackFormModal.tsx";

interface TracksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TracksModal: FC<TracksModalProps> = ({ isOpen, onClose }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [trackToDelete, setTrackToDelete] = useState<Track | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const loadTracks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllTracks();
      setTracks(data);
    } catch (err) {
      console.error("Failed to load tracks:", err);
      setError("Failed to load tracks list.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadTracks();
    }
  }, [isOpen, loadTracks]);

  // Reset to page 1 when search or itemsPerPage changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isFormOpen && !trackToDelete) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, isFormOpen, trackToDelete, onClose]);

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

  const filteredTracks = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return tracks
      .filter((track: Track) => {
        return (
          track.title.toLowerCase().includes(term) ||
          track.category.toLowerCase().includes(term) ||
          track.tags?.some((tag: string) => tag.toLowerCase().includes(term)) ||
          false
        );
      })
      .sort((a: Track, b: Track) => {
        // Sort by creation date/updated date descending (if available)
        const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
  }, [tracks, searchTerm]);

  const totalPages = Math.ceil(filteredTracks.length / itemsPerPage);
  const paginatedTracks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTracks.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTracks, currentPage, itemsPerPage]);

  const handleAddNew = () => {
    setSelectedTrack(null);
    setIsFormOpen(true);
  };

  const handleEdit = (track: Track) => {
    setSelectedTrack(track);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (track: Track) => {
    setTrackToDelete(track);
  };

  const handleDeleteConfirm = async () => {
    if (!trackToDelete?.id) return;

    try {
      await deleteTrack(trackToDelete.id);
      setSuccess("Track deleted successfully");
      setTrackToDelete(null);
      loadTracks();
    } catch (err) {
      console.error("Failed to delete track:", err);
      setError("Failed to delete track");
      setTrackToDelete(null);
    }
  };

  const handleFormClose = (shouldReload?: boolean) => {
    setIsFormOpen(false);
    setSelectedTrack(null);
    if (shouldReload) {
      loadTracks();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="auth-modal-overlay" onClick={onClose}>
        <div className="tracks-modal" onClick={e => e.stopPropagation()}>
          <button className="auth-modal-close" onClick={onClose}>
            ✕
          </button>

          <h2 className="tracks-modal-title">Tracks Management</h2>

          {/* 검색 및 추가 버튼 */}
          <div
            className="tracks-filter-section"
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "12px",
              alignItems: "center",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              className="auth-input tracks-search-input"
              style={{ flex: 1, marginBottom: 0 }}
              placeholder="Search by title, category, or tags..."
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
              className="auth-button"
              onClick={handleAddNew}
              style={{ marginBottom: 0 }}
            >
              + Add New Track
            </button>
          </div>

          {/* 트랙 목록 테이블/카드 */}
          <div className="tracks-table-container">
            {loading ? (
              <div className="tracks-loading">Loading...</div>
            ) : error ? (
              <div className="tracks-error">{error}</div>
            ) : filteredTracks.length === 0 ? (
              <div className="tracks-empty">No tracks found</div>
            ) : (
              <>
                {/* Desktop View: Table */}
                <table className="tracks-table desktop-only">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Level</th>
                      <th>Status</th>
                      <th>Tags</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTracks.map(track => (
                      <tr key={track.id}>
                        <td>
                          <div className="track-title">
                            {track.title}
                            {track.url && (
                              <a
                                href={track.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="track-link-icon"
                              >
                                🔗
                              </a>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`category-badge ${track.category}`}>
                            {track.category}
                          </span>
                        </td>
                        <td>{track.level || "-"}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              track.status || "active"
                            }`}
                          >
                            {track.status || "Active"}
                          </span>
                        </td>
                        <td>
                          <div className="track-tags">
                            {track.tags?.slice(0, 3).map((tag, idx) => (
                              <span key={idx} className="track-tag">
                                {tag}
                              </span>
                            ))}
                            {(track.tags?.length || 0) > 3 && (
                              <span className="track-tag-more">
                                +{(track.tags?.length || 0) - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="track-actions">
                            <button
                              className="track-edit-button"
                              onClick={() => handleEdit(track)}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              className="track-delete-button"
                              onClick={() => handleDeleteClick(track)}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile View: Cards */}
                <div className="tracks-mobile-cards mobile-only">
                  {paginatedTracks.map(track => (
                    <div key={track.id} className="track-mobile-card">
                      <div className="track-mobile-card-header">
                        <h3 className="track-mobile-title">
                          {track.title}
                          {track.url && (
                            <a
                              href={track.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="track-link-icon"
                            >
                              🔗
                            </a>
                          )}
                        </h3>
                        <div className="track-mobile-badges">
                          <span className={`category-badge ${track.category}`}>
                            {track.category}
                          </span>
                          <span
                            className={`status-badge ${
                              track.status || "active"
                            }`}
                          >
                            {track.status || "Active"}
                          </span>
                        </div>
                      </div>

                      <div className="track-mobile-card-body">
                        {track.level && (
                          <div className="track-info-row">
                            <span className="track-info-label">Level:</span>
                            <span className="track-info-value">
                              {track.level}
                            </span>
                          </div>
                        )}
                        {track.short && (
                          <div className="track-info-row">
                            <span className="track-info-label">
                              Description:
                            </span>
                            <span className="track-info-value">
                              {track.short}
                            </span>
                          </div>
                        )}
                        {track.tags && track.tags.length > 0 && (
                          <div className="track-tags">
                            {track.tags.map((tag, idx) => (
                              <span key={idx} className="track-tag">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="track-mobile-card-footer">
                        <button
                          className="track-edit-button"
                          onClick={() => handleEdit(track)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="track-delete-button"
                          onClick={() => handleDeleteClick(track)}
                        >
                          🗑️ Delete
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

      {/* Track Form Modal */}
      <TrackFormModal
        isOpen={isFormOpen}
        onClose={handleFormClose}
        track={selectedTrack}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!trackToDelete}
        title="Delete Track"
        message={`Are you sure you want to delete "${trackToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setTrackToDelete(null)}
      />

      {/* Success Toast */}
      {success && (
        <Toast
          message={success}
          type="success"
          onClose={() => setSuccess(null)}
        />
      )}

      {/* Error Toast */}
      {error && (
        <Toast message={error} type="error" onClose={() => setError(null)} />
      )}
    </>
  );
};
