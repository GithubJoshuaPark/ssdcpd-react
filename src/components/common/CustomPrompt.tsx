// src/components/common/CustomPrompt.tsx
import type { FC, FormEvent } from 'react'
import { useState, useEffect } from 'react'

interface CustomPromptProps {
  isOpen: boolean
  title: string
  message: string
  placeholder?: string
  defaultValue?: string
  onConfirm: (value: string) => void
  onCancel: () => void
}

export const CustomPrompt: FC<CustomPromptProps> = ({
  isOpen,
  title,
  message,
  placeholder = '',
  defaultValue = '',
  onConfirm,
  onCancel,
}) => {
  // Initialize state with defaultValue directly
  // When isOpen changes, the parent should remount this component using a key
  const [inputValue, setInputValue] = useState(defaultValue)

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) {
      onConfirm(inputValue)
    }
  }

  return (
    <div className="custom-prompt-overlay" onClick={onCancel}>
      <div className="custom-prompt" onClick={(e) => e.stopPropagation()}>
        <h3 className="custom-prompt-title">{title}</h3>
        {message && <p className="custom-prompt-message">{message}</p>}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="custom-prompt-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            autoFocus
          />

          <div className="custom-prompt-actions">
            <button
              type="button"
              className="custom-prompt-cancel"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="custom-prompt-confirm"
              disabled={!inputValue.trim()}
            >
              OK
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
