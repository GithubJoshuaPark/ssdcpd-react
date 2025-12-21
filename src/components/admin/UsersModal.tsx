// src/components/admin/UsersModal.tsx
import type { FC, ChangeEvent } from 'react'
import { useState, useEffect } from 'react'
import { getAllUserProfiles } from '../../services/firebaseService'
import type { UserProfile } from '../../types_interfaces/userProfile'
import { ProfileModal } from '../profile/ProfileModal'
import { Toast } from '../common/Toast'
import { useI18n } from '../../i18n/useI18n'

interface UsersModalProps {
  isOpen: boolean
  onClose: () => void
}

export const UsersModal: FC<UsersModalProps> = ({ isOpen, onClose }) => {
  const { t } = useI18n()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadUsers()
    }
  }, [isOpen])

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !selectedUser) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose, selectedUser])

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

  const loadUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAllUserProfiles()
      setUsers(data)
    } catch (err) {
      console.error('Failed to load users:', err)
      setError(t('admin.error') || 'Failed to load user list.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const filteredUsers = users.filter((user) => {
    const term = searchTerm.toLowerCase()
    return (
      (user.name?.toLowerCase().includes(term) || false) ||
      user.email.toLowerCase().includes(term) ||
      (user.role?.toLowerCase().includes(term) || false)
    )
  })

  const handleUserClick = (user: UserProfile) => {
    setSelectedUser(user)
  }

  const closeProfileModal = () => {
    setSelectedUser(null)
  }

  if (!isOpen) return null

  return (
    <>
      <div className="auth-modal-overlay" onClick={onClose}>
        <div className="users-modal" onClick={(e) => e.stopPropagation()}>
          <button className="auth-modal-close" onClick={onClose}>
            ✕
          </button>

          <h2 className="users-modal-title">{t('admin.usersTitle')}</h2>

          {/* 검색 필터 */}
          <div className="users-filter-section">
            <input
              type="text"
              className="auth-input users-search-input"
              placeholder={t('admin.searchPlaceholder')}
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>

          {/* 사용자 목록 테이블 */}
          <div className="users-table-container">
            {loading ? (
              <div className="users-loading">{t('admin.loading')}</div>
            ) : error ? (
              <div className="users-error">{error}</div>
            ) : filteredUsers.length === 0 ? (
              <div className="users-empty">{t('admin.empty')}</div>
            ) : (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>{t('admin.table.profile')}</th>
                    <th>{t('admin.table.name')}</th>
                    <th>{t('admin.table.email')}</th>
                    <th>{t('admin.table.role')}</th>
                    <th>{t('admin.table.action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
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
                      <td>{user.name || '-'}</td>
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
                          {t('admin.detail')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* 선택된 사용자 상세 정보 (읽기 전용 프로필 모달) */}
      <ProfileModal
        isOpen={!!selectedUser}
        onClose={closeProfileModal}
        targetProfile={selectedUser || undefined}
      />

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
