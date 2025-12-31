import type { FC, FormEvent } from "react";
import { useState } from "react";
import { useI18n } from "../../i18n/useI18n";
import { sendEmailByAdminFunction } from "../../services/firebaseService";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { RichEditor } from "../common/RichEditor";
import { Toast } from "../common/Toast";

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetEmails: string[];
  onSendSuccess?: () => void;
}

export const SendEmailModal: FC<SendEmailModalProps> = ({
  isOpen,
  onClose,
  targetEmails,
  onSendSuccess,
}) => {
  const { t } = useI18n();
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  if (!isOpen) return null;

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) return;

    setSending(true);
    try {
      // 기존 단일 발송 함수를 다중 발송용으로 수정했거나,
      // 여기서 루프를 돌거나, 백엔드가 배열을 받도록 수정해야 함.
      // 현재 firebaseService는 string | string[] 을 받도록 수정됨.
      const result = await sendEmailByAdminFunction(
        targetEmails,
        subject,
        content
      );

      if (result.success) {
        setToast({ message: "Email sent successfully!", type: "success" });
        setTimeout(() => {
          onClose();
          setSubject("");
          setContent("");
          setToast(null);
          if (onSendSuccess) onSendSuccess();
        }, 1500);
      } else {
        setToast({
          message: result.message || "Failed to send email.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Email send error:", error);
      setToast({ message: "An unexpected error occurred.", type: "error" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div
        className="auth-modal"
        style={{ maxWidth: "600px", width: "90%" }}
        onClick={e => e.stopPropagation()}
      >
        <button className="auth-modal-close" onClick={onClose}>
          ✕
        </button>

        <h2 className="auth-modal-title">{t("admin.sendEmail") || "Send"}</h2>
        <p style={{ marginBottom: "15px", color: "var(--text-muted)" }}>
          To: {targetEmails.length} recipients
          {targetEmails.length < 5 && ` (${targetEmails.join(", ")})`}
        </p>

        <form onSubmit={handleSend} className="auth-form">
          <div className="auth-form-group">
            <label>Subject</label>
            <input
              type="text"
              className="auth-input"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Enter email subject"
              required
            />
          </div>

          <div className="auth-form-group">
            <label>Content</label>
            <RichEditor
              value={content}
              onChange={setContent}
              placeholder="Enter email message..."
              minHeight="200px"
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              marginTop: "10px",
            }}
          >
            <button
              type="button"
              className="glass-btn glass-btn-cancel"
              onClick={onClose}
              disabled={sending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="glass-btn glass-btn-primary"
              disabled={sending}
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </form>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {sending && <LoadingSpinner message="Sending Email..." />}
      </div>
      <style>{`
        .glass-btn {
            padding: 10px 20px;
            border-radius: 12px;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-size: 0.9rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .glass-btn-cancel {
            background: rgba(255, 255, 255, 0.05);
            color: #aaa;
        }
        
        .glass-btn-cancel:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.15);
            color: white;
            border-color: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        
        .glass-btn-primary {
            background: rgba(59, 130, 246, 0.2);
            border-color: rgba(59, 130, 246, 0.4);
            color: #60a5fa;
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.1);
        }
        
        .glass-btn-primary:hover:not(:disabled) {
            background: rgba(59, 130, 246, 0.5);
            border-color: rgba(59, 130, 246, 0.8);
            color: white;
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
            transform: translateY(-2px);
        }

        .glass-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};
