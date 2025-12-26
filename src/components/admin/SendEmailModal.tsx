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

        <h2 className="auth-modal-title">
          {t("admin.sendEmail") || "Send Email"}
        </h2>
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
              className="auth-link"
              onClick={onClose}
              disabled={sending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="auth-button"
              style={{ width: "auto", padding: "10px 25px" }}
              disabled={sending}
            >
              {sending ? "Sending..." : "Send Email"}
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
    </div>
  );
};
