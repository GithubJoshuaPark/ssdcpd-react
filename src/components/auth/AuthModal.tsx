// src/components/auth/AuthModal.tsx
import type { FC } from "react";
import { useEffect, useState } from "react";
import { FaGoogle } from "react-icons/fa";
import { useAuth } from "../../auth/useAuth";
import { useI18n } from "../../i18n/useI18n";
import { Toast, type ToastType } from "../common/Toast";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";

type AuthView = "login" | "signup" | "forgot-password";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { t } = useI18n();
  const { loginWithGoogle } = useAuth();
  const [currentView, setCurrentView] = useState<AuthView>("login");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

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

  if (!isOpen) return null;

  const handleSignupSuccess = () => {
    setToast({
      message: t("auth.emailSent"),
      type: "success",
    });
    setCurrentView("login");
  };

  const handleLoginSuccess = () => {
    setToast({
      message: t("auth.loginSuccess"),
      type: "success",
    });
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleForgotPasswordSuccess = () => {
    setToast({
      message: t("auth.resetEmailSent"),
      type: "success",
    });
    setCurrentView("login");
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      handleLoginSuccess();
    } catch (error) {
      console.error("Google login error:", error);
      handleError("Google login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleError = (message: string) => {
    setToast({
      message,
      type: "error",
    });
  };

  return (
    <>
      <div className="auth-modal-overlay" onClick={onClose}>
        <div className="auth-modal" onClick={e => e.stopPropagation()}>
          <button className="auth-modal-close" onClick={onClose}>
            ✕
          </button>

          <div className="auth-tabs">
            <button
              className={`auth-tab ${currentView === "login" ? "active" : ""}`}
              onClick={() => setCurrentView("login")}
            >
              {t("auth.login")}
            </button>
            <button
              className={`auth-tab ${currentView === "signup" ? "active" : ""}`}
              onClick={() => setCurrentView("signup")}
            >
              {t("auth.signup")}
            </button>
          </div>

          {currentView === "login" && (
            <LoginForm
              onSwitchToSignup={() => setCurrentView("signup")}
              onSwitchToForgotPassword={() => setCurrentView("forgot-password")}
              onSuccess={handleLoginSuccess}
              onError={handleError}
            />
          )}

          {currentView === "signup" && (
            <SignupForm
              onSwitchToLogin={() => setCurrentView("login")}
              onSuccess={handleSignupSuccess}
              onError={handleError}
            />
          )}

          {currentView === "forgot-password" && (
            <ForgotPasswordForm
              onSwitchToLogin={() => setCurrentView("login")}
              onSuccess={handleForgotPasswordSuccess}
              onError={handleError}
            />
          )}

          {currentView !== "forgot-password" && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  margin: "20px 0",
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    height: "1px",
                    background: "var(--card-border)",
                  }}
                ></div>
                <span style={{ padding: "0 10px" }}>
                  {t("auth.or") || "OR"}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: "1px",
                    background: "var(--card-border)",
                  }}
                ></div>
              </div>

              <button
                type="button"
                className="auth-button"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                }}
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <FaGoogle />
                {currentView === "login"
                  ? t("auth.googleLogin") || "Login with Google"
                  : t("auth.googleSignup") || "Sign up with Google"}
              </button>
            </>
          )}
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};
