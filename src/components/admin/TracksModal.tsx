// src/components/admin/TracksModal.tsx
import type { FC, ChangeEvent } from 'react'
import { useState, useEffect, useCallback } from 'react'
import { getAllTracks, deleteTrack } from '../../services/firebaseService'
import type { Track } from '../../types_interfaces/track'
import { TrackFormModal } from './TrackFormModal.tsx'
import { Toast } from '../common/Toast'
import { ConfirmDialog } from '../common/ConfirmDialog'

interface TracksModalProps {
  isOpen: boolean
  onClose: () => void
}

export const TracksModal: FC<TracksModalProps> = ({ isOpen, onClose }) => {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [trackToDelete, setTrackToDelete] = useState<Track | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadTracks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAllTracks()
      setTracks(data)
    } catch (err) {
      console.error('Failed to load tracks:', err)
      setError('Failed to load tracks list.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadTracks()
    }
  }, [isOpen, loadTracks])

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isFormOpen && !trackToDelete) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, isFormOpen, trackToDelete, onClose])

  // 모달이 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const filteredTracks = tracks.filter((track) => {
    const term = searchTerm.toLowerCase()
    return (
      track.title.toLowerCase().includes(term) ||
      track.category.toLowerCase().includes(term) ||
      (track.tags?.some(tag => tag.toLowerCase().includes(term)) || false)
    )
  })

  const handleAddNew = () => {
    setSelectedTrack(null)
    setIsFormOpen(true)
  }

  const handleEdit = (track: Track) => {
    setSelectedTrack(track)
    setIsFormOpen(true)
  }

  const handleDeleteClick = (track: Track) => {
    setTrackToDelete(track)
  }

  const handleDeleteConfirm = async () => {
    if (!trackToDelete?.id) return

    try {
      await deleteTrack(trackToDelete.id)
      setSuccess('Track deleted successfully')
      setTrackToDelete(null)
      loadTracks()
    } catch (err) {
      console.error('Failed to delete track:', err)
      setError('Failed to delete track')
      setTrackToDelete(null)
    }
  }

  const handleFormClose = (shouldReload?: boolean) => {
    setIsFormOpen(false)
    setSelectedTrack(null)
    if (shouldReload) {
      loadTracks()
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="auth-modal-overlay" onClick={onClose}>
        <div className="tracks-modal" onClick={(e) => e.stopPropagation()}>
          <button className="auth-modal-close" onClick={onClose}>
            ✕
          </button>

          <h2 className="tracks-modal-title">Tracks Management</h2>

          {/* 검색 및 추가 버튼 */}
          <div className="tracks-filter-section">
            <input
              type="text"
              className="auth-input tracks-search-input"
              placeholder="Search by title, category, or tags..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <button className="auth-button" onClick={handleAddNew}>
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
                    {filteredTracks.map((track) => (
                      <tr key={track.id}>
                        <td>
                          <div className="track-title">
                            {track.title}
                            {track.url && (
                              <a href={track.url} target="_blank" rel="noopener noreferrer" className="track-link-icon">
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
                        <td>{track.level || '-'}</td>
                        <td>
                          <span className={`status-badge ${track.status || 'active'}`}>
                            {track.status || 'Active'}
                          </span>
                        </td>
                        <td>
                          <div className="track-tags">
                            {track.tags?.slice(0, 3).map((tag, idx) => (
                              <span key={idx} className="track-tag">{tag}</span>
                            ))}
                            {(track.tags?.length || 0) > 3 && (
                              <span className="track-tag-more">+{(track.tags?.length || 0) - 3}</span>
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
                  {filteredTracks.map((track) => (
                    <div key={track.id} className="track-mobile-card">
                      <div className="track-mobile-card-header">
                        <h3 className="track-mobile-title">
                          {track.title}
                          {track.url && (
                            <a href={track.url} target="_blank" rel="noopener noreferrer" className="track-link-icon">
                              🔗
                            </a>
                          )}
                        </h3>
                        <div className="track-mobile-badges">
                          <span className={`category-badge ${track.category}`}>
                            {track.category}
                          </span>
                          <span className={`status-badge ${track.status || 'active'}`}>
                            {track.status || 'Active'}
                          </span>
                        </div>
                      </div>

                      <div className="track-mobile-card-body">
                        {track.level && (
                          <div className="track-info-row">
                            <span className="track-info-label">Level:</span>
                            <span className="track-info-value">{track.level}</span>
                          </div>
                        )}
                        {track.short && (
                          <div className="track-info-row">
                            <span className="track-info-label">Description:</span>
                            <span className="track-info-value">{track.short}</span>
                          </div>
                        )}
                        {track.tags && track.tags.length > 0 && (
                          <div className="track-tags">
                            {track.tags.map((tag, idx) => (
                              <span key={idx} className="track-tag">{tag}</span>
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
        <Toast
          message={error}
          type="error"
          onClose={() => setError(null)}
        />
      )}
    </>
  )
}
