// src/components/common/CustomPrompt.tsx
import type { FC, FormEvent } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface CustomPromptProps {
  isOpen: boolean;
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export const CustomPrompt: FC<CustomPromptProps> = ({
  isOpen,
  title,
  message,
  placeholder = "",
  defaultValue = "",
  onConfirm,
  onCancel,
}) => {
  // Initialize state with defaultValue directly
  // When isOpen changes, the parent should remount this component using a key
  const [inputValue, setInputValue] = useState(defaultValue);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onConfirm(inputValue);
    }
  };

  return createPortal(
    <div
      className="custom-prompt-overlay"
      onClick={onCancel}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className="custom-prompt"
        onClick={e => e.stopPropagation()}
        style={{ margin: 0 }}
      >
        <h3 className="custom-prompt-title">{title}</h3>
        {message && <p className="custom-prompt-message">{message}</p>}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="custom-prompt-input"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
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
    </div>,
    document.body
  );
};
