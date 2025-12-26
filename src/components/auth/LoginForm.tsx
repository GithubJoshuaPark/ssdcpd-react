import type { MultiFactorResolver } from "firebase/auth";
import type { FC, FormEvent } from "react";
import { useEffect, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { useI18n } from "../../i18n/useI18n";
import { Toast } from "../common/Toast";

interface LoginFormProps {
  onSwitchToSignup: () => void;
  onSwitchToForgotPassword: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export const LoginForm: FC<LoginFormProps> = ({
  onSwitchToSignup,
  onSwitchToForgotPassword,
  onSuccess,
  onError,
}) => {
  const { login, getMfaResolver, sendMfaSignInCode, resolveMfaSignIn } =
    useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // --- MFA States ---
  const [resolver, setResolver] = useState<MultiFactorResolver | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [isMfaStep, setIsMfaStep] = useState(false);

  // --- Toast State ---
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // --- MFA 코드 자동 발송 (isMfaStep 전환 후 컨테이너가 DOM에 나타난 뒤 실행) ---
  useEffect(() => {
    const triggerMfaCode = async () => {
      // resolver가 있고, isMfaStep이며, 아직 verificationId가 없을 때만 실행
      if (isMfaStep && resolver && !verificationId && !loading) {
        setLoading(true);
        try {
          const vId = await sendMfaSignInCode(
            resolver,
            "login-recaptcha-container"
          );
          setVerificationId(vId);
          console.log("MFA Sign-in code sent.");
          setToast({
            message:
              "등록된 전화번호로 전송된 6자리 코드를 입력 후 로그인 하세요.",
            type: "success",
          });
        } catch (mfaError) {
          console.error("MFA Send Error:", mfaError);
          onError("Failed to send verification code.");
          // 실패 시 원상복구
          setIsMfaStep(false);
          setResolver(null);
        } finally {
          setLoading(false);
        }
      }
    };

    triggerMfaCode();
  }, [
    isMfaStep,
    resolver,
    verificationId,
    sendMfaSignInCode,
    onError,
    loading,
  ]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      onSuccess();
    } catch (error: unknown) {
      const mfaResolver = getMfaResolver(error);
      if (mfaResolver) {
        setResolver(mfaResolver);
        setIsMfaStep(true);
        // 이제 useEffect가 이를 감지하고 코드를 발송합니다.
        return;
      }

      if (error instanceof Error) {
        if (error.message === "EMAIL_NOT_VERIFIED") {
          onError(t("auth.emailNotVerified"));
        } else if (error.message.includes("invalid-credential")) {
          onError(t("auth.invalidCredentials"));
        } else if (error.message.includes("user-not-found")) {
          onError(t("auth.userNotFound"));
        } else if (error.message.includes("wrong-password")) {
          onError(t("auth.wrongPassword"));
        } else {
          onError(error.message);
        }
      }
    } finally {
      if (!isMfaStep) setLoading(false);
    }
  };

  const handleMfaVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (!resolver || !verificationId || !verificationCode) return;

    setLoading(true);
    try {
      await resolveMfaSignIn(resolver, verificationId, verificationCode);
      onSuccess();
    } catch (error) {
      console.error("MFA Verification Error:", error);
      onError("Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  if (isMfaStep) {
    return (
      <form className="auth-form" onSubmit={handleMfaVerify}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <h3 style={{ color: "var(--accent)", marginBottom: "10px" }}>
            🔒 {t("auth.googleLogin") ? "2-Step Verification" : "2단계 인증"}
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            {t("auth.googleSignup")
              ? "Enter the 6-digit code sent to your phone."
              : "등록된 전화번호로 전송된 6자리 코드를 입력하세요."}
          </p>
        </div>

        <div className="auth-form-group">
          <input
            type="text"
            className="auth-input"
            value={verificationCode}
            onChange={e => setVerificationCode(e.target.value)}
            placeholder="000000"
            maxLength={6}
            required
            autoFocus
            style={{
              textAlign: "center",
              fontSize: "1.5rem",
              letterSpacing: "8px",
            }}
          />
        </div>

        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? "..." : t("auth.login")}
        </button>

        <button
          type="button"
          className="auth-link"
          onClick={() => setIsMfaStep(false)}
          style={{ width: "100%", marginTop: "10px" }}
        >
          {t("common.cancel") || "Cancel"}
        </button>
        <div
          id="login-recaptcha-container"
          style={{
            marginTop: "15px",
            display: "flex",
            justifyContent: "center",
          }}
        ></div>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </form>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-form-group">
        <label htmlFor="login-email">{t("auth.email")}</label>
        <input
          id="login-email"
          type="email"
          className="auth-input"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div className="auth-form-group">
        <label htmlFor="login-password">{t("auth.password")}</label>
        <input
          id="login-password"
          type="password"
          className="auth-input"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>

      <button type="submit" className="auth-button" disabled={loading}>
        {loading ? "..." : t("auth.login")}
      </button>

      <div className="auth-links">
        <button
          type="button"
          className="auth-link"
          onClick={onSwitchToForgotPassword}
        >
          {t("auth.forgotPassword")}
        </button>
      </div>

      <div className="auth-footer">
        <p>
          {t("auth.dontHaveAccount")}{" "}
          <button
            type="button"
            className="auth-link"
            onClick={onSwitchToSignup}
          >
            {t("auth.signup")}
          </button>
        </p>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </form>
  );
};
