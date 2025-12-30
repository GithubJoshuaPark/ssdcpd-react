import type { FC } from "react";
import { useEffect, useState } from "react";
import { sendEmailByAdminFunction } from "../../services/firebaseService"; // Updated function with CC
import { LoadingSpinner } from "../common/LoadingSpinner";
import { RichEditor } from "../common/RichEditor";
import { Toast } from "../common/Toast";

interface SendEmailByAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTo?: string;
}

const DEFAULT_SUBJECT =
  "[초대] Senior Software Developer's CPD 프로젝트에 초대합니다";
const DEFAULT_CONTENT = `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px;">
  <h2 style="color: #1a1a1a; margin-bottom: 20px;">안녕하세요,</h2>
  <p style="font-size: 16px;"><strong>Senior Software Developer's CPD (SSDCPD)</strong> 프로젝트에 초대합니다.</p>
  <p style="color: #555;">이 플랫폼은 시니어 개발자의 지속적인 학습과 성장을 보여주는 포트폴리오 웹 애플리케이션입니다.</p>
  
  <div style="margin: 25px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef;">
    <p style="margin: 0 0 15px 0; font-weight: bold; color: #444;">👇 웹사이트 바로가기</p>
    
    <div style="margin-bottom: 15px;">
      <span style="display: inline-block; width: 80px; font-weight: 600; color: #666;">SSDCPD:</span>
      <a href="https://ssdcpd-react.web.app/" style="color: #007bff; text-decoration: none; font-weight: bold;">https://ssdcpd-react.web.app/</a>
    </div>
    
    <div>
      <span style="display: inline-block; width: 80px; font-weight: 600; color: #666;">SOROMISO:</span>
      <a href="https://soromiso.kr/" style="color: #28a745; text-decoration: none; font-weight: bold;">https://soromiso.kr/</a>
    </div>
  </div>

  <p style="color: #888; font-size: 14px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">감사합니다.<br/>Joshua Park 드림</p>
</div>
`;

export const SendEmailByAdminModal: FC<SendEmailByAdminModalProps> = ({
  isOpen,
  onClose,
  defaultTo = "",
}) => {
  const [to, setTo] = useState(defaultTo);
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTo(defaultTo);
      setCc("");
      setSubject(DEFAULT_SUBJECT);
      setContent(DEFAULT_CONTENT);
      setToast(null);
    }
  }, [isOpen, defaultTo]);

  const handleSend = async () => {
    const toList = to
      .split(",")
      .map(e => e.trim())
      .filter(Boolean);
    const ccList = cc
      .split(",")
      .map(e => e.trim())
      .filter(Boolean);

    if (toList.length === 0) {
      setToast({
        message: "Please enter at least one recipient.",
        type: "error",
      });
      return;
    }
    if (!subject.trim()) {
      setToast({ message: "Please enter a subject.", type: "error" });
      return;
    }
    if (!content.trim()) {
      setToast({ message: "Please enter content.", type: "error" });
      return;
    }

    setLoading(true);
    try {
      // sendEmailByAdminFunction(to, subject, text, html?, cc?)
      // We pass content as 'text' for simplicity, or handle HTML if supported.
      // The function signature says 'text', and 'html' optional.
      // RichEditor produces HTML usually, but let's assume content is suitable.
      // Actually RichEditor usually returns HTML string. So we pass it as 'text' (if pure text needed) or 'html'.
      // sendEmailByAdminFunction treats 3rd arg as 'text'.
      // Let's pass content as text for now, or both if we can strip tags.
      // For now, passing content as text because the previous usage in SendEmailModal implied it.

      const result = await sendEmailByAdminFunction(
        toList,
        subject,
        content, // text (if content contains HTML tags, they will appear in plain text email?)
        content, // html (pass same content to html arg if RichEditor produces HTML)
        ccList
      );

      if (result.success) {
        setToast({ message: "Email sent successfully!", type: "success" });
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        throw new Error(result.message || "Failed to send email");
      }
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : "An error occurred while sending email.";
      setToast({
        message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      {loading && <LoadingSpinner message="Sending Email..." />}
      <div
        className="auth-modal-content"
        style={{
          width: "90%",
          maxWidth: "800px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          className="auth-modal-close"
          onClick={onClose}
          style={{ top: "15px", right: "20px" }}
        >
          ✕
        </button>

        <h2 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
          Send Email (Admin)
        </h2>

        <div className="auth-form-group">
          <label>To (comma separated)</label>
          <input
            type="text"
            className="auth-input"
            placeholder="user1@example.com, user2@example.com"
            value={to}
            onChange={e => setTo(e.target.value)}
          />
        </div>

        <div className="auth-form-group">
          <label>CC (comma separated)</label>
          <input
            type="text"
            className="auth-input"
            placeholder="manager@example.com, admin@example.com"
            value={cc}
            onChange={e => setCc(e.target.value)}
          />
        </div>

        <div className="auth-form-group">
          <label>Subject</label>
          <input
            type="text"
            className="auth-input"
            placeholder="Enter email subject..."
            value={subject}
            onChange={e => setSubject(e.target.value)}
          />
        </div>

        <div
          className="auth-form-group"
          style={{ flex: 1, minHeight: "300px" }}
        >
          <label>Content</label>
          <div
            style={{
              border: "1px solid var(--card-border)",
              borderRadius: "8px",
              overflow: "hidden",
              height: "100%",
            }}
          >
            <RichEditor
              value={content}
              onChange={setContent}
              placeholder="Write your email content here..."
            />
          </div>
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
            className="auth-button secondary"
            onClick={onClose}
            style={{
              width: "auto",
              padding: "10px 20px",
              background: "transparent",
              border: "1px solid var(--card-border)",
            }}
          >
            Cancel
          </button>
          <button
            className="auth-button"
            onClick={handleSend}
            disabled={loading}
            style={{ width: "auto", padding: "10px 24px" }}
          >
            {loading ? "Sending..." : "Send Email"}
          </button>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
