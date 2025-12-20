// src/components/common/ConfirmDialog.tsx
import type { FC } from 'react'
import { useI18n } from '../../i18n/useI18n'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText: string
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmDialog: FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  onConfirm,
  onCancel,
}) => {
  const { t } = useI18n()

  if (!isOpen) return null

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-dialog-title">{title}</h3>
        <p className="confirm-dialog-message">{message}</p>
        <div className="confirm-dialog-actions">
          <button className="confirm-dialog-cancel" onClick={onCancel}>
            {t('profile.cancel')}
          </button>
          <button className="confirm-dialog-confirm" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
