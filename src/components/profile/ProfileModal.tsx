// src/components/profile/ProfileModal.tsx
import { onValue, ref } from "firebase/database";
import type { ChangeEvent, FC, FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { useI18n } from "../../i18n/useI18n";
import { database } from "../../services/firebaseService";
import type { Notice } from "../../types_interfaces/notice";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { CustomPrompt } from "../common/CustomPrompt";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { RichEditor } from "../common/RichEditor";
import { Toast, type ToastType } from "../common/Toast";

import {
  multiFactor,
  type PhoneMultiFactorInfo,
  type RecaptchaVerifier,
} from "firebase/auth";
import type { UserProfile } from "../../types_interfaces/userProfile";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetProfile?: UserProfile;
  onUserDeleted?: () => void; // 사용자 삭제 후 콜백 (UsersModal 새로고침용)
}

export const ProfileModal: FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  targetProfile,
  onUserDeleted,
}) => {
  const {
    userProfile: currentUserProfile,
    updateProfile,
    uploadProfilePhoto,
    changePassword,
    deleteAccount,
    sendMfaEnrollmentCode,
    finalizeMfaEnrollment,
    disableMfa,
    currentUser,
  } = useAuth();
  const { t } = useI18n();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCurrentPasswordPrompt, setShowCurrentPasswordPrompt] =
    useState(false);
  const [showNewPasswordPrompt, setShowNewPasswordPrompt] = useState(false);
  const [showMfaDisableConfirm, setShowMfaDisableConfirm] = useState(false);
  const [currentPasswordTemp, setCurrentPasswordTemp] = useState("");
  const [processing, setProcessing] = useState(false);
  const verifierRef = useRef<RecaptchaVerifier | null>(null); // 리캡차 인스턴스 저장을 위한 상태 (Ref로 변경)

  // --- MFA States ---
  const [mfaPhoneNumber, setMfaPhoneNumber] = useState("");
  const [mfaVerificationCode, setMfaVerificationCode] = useState("");
  const [mfaVerificationId, setMfaVerificationId] = useState("");
  const [mfaStep, setMfaStep] = useState<"idle" | "verifying">("idle");
  const [mfaSendingCode, setMfaSendingCode] = useState(false);

  const [noticeCount, setNoticeCount] = useState(0);

  const enrolledFactors = currentUser
    ? multiFactor(currentUser).enrolledFactors
    : [];
  const isMfaEnabled = enrolledFactors.length > 0;
  const enrolledPhone = isMfaEnabled
    ? (enrolledFactors[0] as PhoneMultiFactorInfo).phoneNumber
    : "";

  // 읽기 전용 모드 여부 (targetProfile이 있으면 True)
  const isReadOnly = !!targetProfile;
  // 표시할 프로필 (targetProfile 혹은 현재 로그인한 사용자 프로필)
  const displayProfile = targetProfile || currentUserProfile;
  // 현재 사용자가 관리자인지 확인
  const isCurrentUserAdmin = currentUserProfile?.role === "admin";
  // 삭제 버튼 표시 여부: 자신의 프로필이거나, 관리자가 다른 사용자를 보는 경우
  const canDelete = !isReadOnly || (isReadOnly && isCurrentUserAdmin);

  // 프로필 데이터 초기화
  useEffect(() => {
    if (isOpen && displayProfile) {
      setName(displayProfile.name || "");
      setBio(displayProfile.bio || "");
      setImagePreview(displayProfile.photoURL || null);
      setImageFile(null);
    }
  }, [isOpen, displayProfile]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (
        e.key === "Escape" &&
        isOpen &&
        !showDeleteConfirm &&
        !showMfaDisableConfirm &&
        !showCurrentPasswordPrompt &&
        !showNewPasswordPrompt
      ) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [
    isOpen,
    showDeleteConfirm,
    showMfaDisableConfirm,
    showCurrentPasswordPrompt,
    showNewPasswordPrompt,
    onClose,
  ]);

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

  // 리캡차 인스턴스 관리 (Cleanup only)
  useEffect(() => {
    // 자동 초기화 로직 제거 (사용자 요청: disableMfa 시 위젯 숨김)
    // 필요 시 handleSendMfaCode 에서 on-demand로 생성됨.

    return () => {
      if (verifierRef.current) {
        try {
          // Check if container still exists before clearing to avoid DOM errors
          const container = document.getElementById("recaptcha-container");
          if (container) {
            verifierRef.current.clear();
          }
          verifierRef.current = null;
        } catch (e) {
          console.error("Verifier cleanup error:", e);
          // Ignore clear errors (often caused by DOM element already removed)
        }
      }
    };
  }, []);

  // Listen to unread notices (same logic as Header)
  useEffect(() => {
    // Only fetch for current user's own profile view
    if (isReadOnly || !currentUser?.email) return;

    const noticesRef = ref(database, "notices");
    const unsubscribe = onValue(noticesRef, snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const now = Date.now();
        const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;
        const userEmail = currentUser.email!;

        const count = Object.values(data as Record<string, Notice>).filter(
          n => {
            if (!n || typeof n !== "object") return false;
            if (n.sentAt < twoDaysAgo) return false;

            const recipients = n.recipients;
            if (Array.isArray(recipients)) {
              return recipients.includes(userEmail);
            } else if (typeof recipients === "string") {
              return recipients === userEmail;
            }
            return false;
          }
        ).length;

        setNoticeCount(count);
      } else {
        setNoticeCount(0);
      }
    });

    return () => unsubscribe();
  }, [currentUser?.email, isReadOnly]);

  if (!isOpen) return null;

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return; // 읽기 전용이면 무시

    const file = e.target.files?.[0];
    if (file) {
      // 파일 크기 제한 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setToast({
          message: "Image size must be less than 5MB",
          type: "error",
        });
        return;
      }

      // 이미지 파일만 허용
      if (!file.type.startsWith("image/")) {
        setToast({ message: "Please select an image file", type: "error" });
        return;
      }

      setImageFile(file);

      // 미리보기 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    setProcessing(true);
    setLoading(true);

    try {
      // 프로필 정보 업데이트
      await updateProfile(name, bio);

      // 이미지 업로드 (새 이미지가 선택된 경우)
      if (imageFile) {
        await uploadProfilePhoto(imageFile);
      }

      setToast({ message: t("profile.uploadSuccess"), type: "success" });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Profile update error:", error);
      setToast({ message: t("profile.uploadError"), type: "error" });
    } finally {
      setLoading(false);
      setProcessing(false);
    }
  };

  const handleChangePassword = () => {
    setShowCurrentPasswordPrompt(true);
  };

  const handleCurrentPasswordConfirm = (currentPassword: string) => {
    setShowCurrentPasswordPrompt(false);
    setCurrentPasswordTemp(currentPassword);
    setShowNewPasswordPrompt(true);
  };

  const handleNewPasswordConfirm = async (newPassword: string) => {
    setShowNewPasswordPrompt(false);

    if (newPassword.length < 6) {
      setToast({ message: t("auth.passwordTooShort"), type: "error" });
      setCurrentPasswordTemp(""); // Clear stored password
      return;
    }

    setProcessing(true);
    try {
      await changePassword(currentPasswordTemp, newPassword);

      setToast({
        message: t("profile.passwordChangeSuccess"),
        type: "success",
      });
      setCurrentPasswordTemp(""); // Clear stored password
    } catch (error) {
      console.error("Password change error:", error);
      setCurrentPasswordTemp(""); // Clear stored password

      // Check for specific Firebase errors
      if (error instanceof Error) {
        if (
          error.message.includes("auth/wrong-password") ||
          error.message.includes("auth/invalid-credential")
        ) {
          setToast({
            message: t("auth.wrongPassword") || "Current password is incorrect",
            type: "error",
          });
        } else {
          setToast({ message: "Failed to change password", type: "error" });
        }
      } else {
        setToast({ message: "Failed to change password", type: "error" });
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteAccount = async () => {
    setProcessing(true);
    try {
      if (isReadOnly && isCurrentUserAdmin && displayProfile) {
        // 관리자가 다른 사용자 삭제
        //const { deleteUserAccountByAdmin } = await import('../../services/firebaseService')
        //await deleteUserAccountByAdmin(displayProfile.uid, displayProfile.photoURL)

        // ⭐ Cloud Function 사용 (Auth 계정까지 완전 삭제)
        const { deleteUserByAdminFunction } = await import(
          "../../services/firebaseService"
        );
        await deleteUserByAdminFunction(
          displayProfile.uid,
          displayProfile.photoURL
        );

        setToast({ message: t("profile.deleteSuccess"), type: "success" });
        setTimeout(() => {
          onClose();
          // UsersModal 새로고침
          onUserDeleted?.();
        }, 1500);
      } else {
        // 자신의 계정 삭제
        await deleteAccount();
        setToast({ message: t("profile.deleteSuccess"), type: "success" });
        setTimeout(() => {
          onClose();
          // 로그인 모달은 AuthProvider에서 자동으로 처리됨
        }, 1500);
      }
    } catch (error) {
      console.error("Account deletion error:", error);
      setToast({ message: "Failed to delete account", type: "error" });
    } finally {
      setProcessing(false);
    }
  };

  // --- MFA Handlers ---
  const handleSendMfaCode = async () => {
    if (!mfaPhoneNumber) {
      setToast({ message: "Please enter a phone number", type: "error" });
      return;
    }

    setMfaSendingCode(true);
    setLoading(true);

    try {
      // verifier가 초기화되지 않았다면 초기화 및 렌더링 시도 후 중단 (사용자 입력 필요)
      if (!verifierRef.current) {
        try {
          const { getRecaptchaVerifier } = await import(
            "../../services/firebaseService"
          );
          const verifier = getRecaptchaVerifier("recaptcha-container");
          verifierRef.current = verifier;
          await verifier.render();

          setToast({
            message: "Please check the box to verify you are not a robot.",
            type: "info",
          });
        } catch (e) {
          console.error("Recaptcha manual init error:", e);
          setToast({
            message: "Failed to load Recaptcha. Please refresh.",
            type: "error",
          });
          setMfaSendingCode(false);
          setLoading(false);
          return;
        }
      }

      const verificationId = await sendMfaEnrollmentCode(
        mfaPhoneNumber,
        verifierRef.current
      );

      setMfaVerificationId(verificationId);
      setMfaStep("verifying");
      setToast({ message: "Verification code sent!", type: "success" });
    } catch (error: unknown) {
      console.error("MFA Send error:", error);
      const firebaseError = error as { code?: string };

      if (firebaseError.code === "auth/invalid-app-credential") {
        setToast({
          message:
            "Auth domain error. Check Firebase Console authorized domains.",
          type: "error",
        });
      } else if (firebaseError.code === "auth/invalid-recaptcha-token") {
        setToast({
          message: "ReCAPTCHA token error. Reloading...",
          type: "error",
        });
        // 토큰 에러 시 verifier 초기화하여 재생성 유도
        if (verifierRef.current) {
          try {
            verifierRef.current.clear();
          } catch (e) {
            // Ignore clear error
            console.warn(e);
          }
          verifierRef.current = null;
        }
      } else if (firebaseError.code === "auth/requires-recent-login") {
        setToast({
          message:
            t("auth.requiresRecentLogin") ||
            "Please sign in again to enable 2FA for security.",
          type: "error",
        });
      } else {
        setToast({
          message: "Failed to send code. Check number format.",
          type: "error",
        });
      }
    } finally {
      setMfaSendingCode(false);
      setLoading(false);
    }
  };

  const handleEnrollMfa = async () => {
    if (!mfaVerificationCode) {
      setToast({ message: "Please enter verification code", type: "error" });
      return;
    }

    setProcessing(true);
    try {
      await finalizeMfaEnrollment(mfaVerificationId, mfaVerificationCode);
      setToast({ message: "2FA Enabled successfully!", type: "success" });
      setMfaStep("idle");
      setMfaPhoneNumber("");
      setMfaVerificationCode("");
    } catch (error) {
      console.error("MFA Enrollment error:", error);
      setToast({ message: "Invalid verification code", type: "error" });
    } finally {
      setProcessing(false);
    }
  };

  const handleDisableMfa = () => {
    if (!enrolledFactors[0]) return;
    setShowMfaDisableConfirm(true);
  };

  const handleConfirmDisableMfa = async () => {
    setShowMfaDisableConfirm(false);
    if (!enrolledFactors[0]) return;

    setProcessing(true);
    try {
      // 기존 리캡차 정리 (해제 후 깔끔한 상태 유지)
      if (verifierRef.current) {
        try {
          verifierRef.current.clear();
        } catch (e) {
          console.error("Verifier clear error:", e);
          // ignore
        }
        verifierRef.current = null;
      }

      const factorId = enrolledFactors[0].uid;
      await disableMfa(factorId);
      setToast({ message: "2FA Disabled successfully", type: "success" });
      setMfaStep("idle");
    } catch (error) {
      console.error("MFA Disable error:", error);
      setToast({
        message: "Failed to disable 2FA. Re-authentication might be needed.",
        type: "error",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <div className="auth-modal-overlay" onClick={onClose}>
        <div className="profile-modal" onClick={e => e.stopPropagation()}>
          <button className="auth-modal-close" onClick={onClose}>
            ✕
          </button>

          <h2
            className="profile-modal-title"
            style={{ display: "flex", alignItems: "center", gap: "10px" }}
          >
            {isReadOnly ? "User Profile" : t("profile.title")}
            {!isReadOnly && noticeCount >= 1 && (
              <span
                className="notification-badge"
                style={{
                  backgroundColor: "var(--accent)",
                  color: "#fff",
                  fontSize: "1rem",
                  padding: "2px 10px",
                  borderRadius: "12px",
                }}
              >
                {noticeCount}
              </span>
            )}
          </h2>

          <form className="profile-form" onSubmit={handleSubmit}>
            {/* 프로필 이미지 */}
            <div
              className={`profile-image-section ${
                isReadOnly ? "readonly" : ""
              }`}
            >
              <div className="profile-image-preview">
                {imagePreview ? (
                  <img src={imagePreview} alt="Profile" />
                ) : (
                  <div className="profile-image-placeholder">
                    {displayProfile?.email?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {!isReadOnly && (
                <label className="profile-upload-button">
                  {t("profile.uploadPhoto")}
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                  />
                </label>
              )}
            </div>

            {/* 이름 */}
            <div className="auth-form-group">
              <label htmlFor="profile-name">{t("profile.name")}</label>
              <input
                id="profile-name"
                type="text"
                className="auth-input"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
                readOnly={isReadOnly}
                disabled={isReadOnly}
              />
            </div>

            {/* 이메일 (읽기 전용 표시) */}
            <div className="auth-form-group">
              <label>Email</label>
              <input
                type="text"
                className="auth-input"
                value={displayProfile?.email || ""}
                readOnly
                disabled
              />
            </div>

            {/* 권한 (Admin Only) */}
            {isReadOnly && (
              <div className="auth-form-group">
                <label>Role</label>
                <input
                  type="text"
                  className="auth-input"
                  value={displayProfile?.role || "user"}
                  readOnly
                  disabled
                />
              </div>
            )}

            {/* 자기소개 */}
            <div className="auth-form-group">
              <label htmlFor="profile-bio">{t("profile.bio")}</label>
              <RichEditor
                value={bio}
                onChange={setBio}
                readOnly={isReadOnly}
                placeholder="Tell us about yourself..."
                minHeight="120px"
              />
            </div>

            {/* 2FA Section (Only for self-profile) */}
            {!isReadOnly && (
              <div
                className="profile-mfa-section"
                style={{
                  marginTop: "10px",
                  padding: "15px",
                  background: "rgba(56, 189, 248, 0.05)",
                  border: "1px solid rgba(56, 189, 248, 0.2)",
                  borderRadius: "12px",
                }}
              >
                <h3
                  style={{
                    fontSize: "0.95rem",
                    marginBottom: "10px",
                    color: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  🔒 {t("profile.2faStatus") || "2-Step Verification"}
                </h3>

                {isMfaEnabled ? (
                  <div
                    style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}
                  >
                    <div style={{ marginBottom: "10px" }}>
                      ✅ {t("profile.2faEnabled") || "Enabled with"}{" "}
                      <strong>{enrolledPhone}</strong>
                    </div>
                    <button
                      type="button"
                      className="profile-secondary-button"
                      onClick={handleDisableMfa}
                      style={{
                        padding: "8px",
                        fontSize: "0.8rem",
                        width: "100%",
                      }}
                    >
                      {t("profile.changeNumber") || "Change Number"}
                    </button>
                  </div>
                ) : (
                  <>
                    <p
                      style={{
                        fontSize: "0.82rem",
                        color: "var(--text-muted)",
                        marginBottom: "12px",
                      }}
                    >
                      {t("profile.2faDescription") ||
                        "Protect your account with SMS verification."}
                    </p>

                    {mfaStep === "idle" ? (
                      <div
                        className="auth-form-group"
                        style={{ marginBottom: 0 }}
                      >
                        <div style={{ display: "flex", gap: "8px" }}>
                          <input
                            type="tel"
                            placeholder="+821012345678"
                            className="auth-input"
                            value={mfaPhoneNumber}
                            onChange={e => setMfaPhoneNumber(e.target.value)}
                            disabled={mfaSendingCode}
                            style={{ flex: 7, minWidth: 0 }}
                          />
                          <button
                            type="button"
                            className="auth-button"
                            onClick={handleSendMfaCode}
                            disabled={mfaSendingCode}
                            style={{
                              flex: 3,
                              padding: "0 5px",
                              width: "auto",
                              margin: 0,
                              fontSize: "0.85rem",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {mfaSendingCode
                              ? "..."
                              : t("profile.sendCode") || "Send Code"}
                          </button>
                        </div>
                        <div
                          id="recaptcha-container"
                          style={{
                            marginTop: "15px",
                            display: "flex",
                            justifyContent: "center",
                          }}
                        ></div>
                      </div>
                    ) : (
                      <div
                        className="auth-form-group"
                        style={{ marginBottom: 0 }}
                      >
                        <div style={{ display: "flex", gap: "8px" }}>
                          <input
                            type="text"
                            placeholder="6-digit code"
                            className="auth-input"
                            value={mfaVerificationCode}
                            onChange={e =>
                              setMfaVerificationCode(e.target.value)
                            }
                            maxLength={6}
                            style={{
                              flex: 1,
                              textAlign: "center",
                              letterSpacing: "2px",
                            }}
                          />
                          <button
                            type="button"
                            className="auth-button"
                            onClick={handleEnrollMfa}
                            style={{
                              padding: "0 20px",
                              width: "auto",
                              margin: 0,
                              fontSize: "0.85rem",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {t("profile.verify") || "Verify"}
                          </button>
                        </div>
                        <button
                          type="button"
                          className="profile-secondary-button"
                          onClick={() => setMfaStep("idle")}
                          style={{
                            marginTop: "12px",
                            padding: "8px",
                            fontSize: "0.8rem",
                            width: "100%",
                          }}
                        >
                          {t("profile.changeNumber") || "Change Number"}
                        </button>
                      </div>
                    )}
                  </>
                )}
                {/* Removed duplicate recaptcha-container */}
              </div>
            )}

            {/* 버튼 그룹 */}
            {!isReadOnly && (
              <>
                {/* 저장 버튼 */}
                <button
                  type="submit"
                  className="auth-button"
                  disabled={loading}
                >
                  {loading ? "..." : t("profile.save")}
                </button>

                {/* 비밀번호 변경 */}
                <button
                  type="button"
                  className="profile-secondary-button"
                  onClick={handleChangePassword}
                >
                  {t("profile.changePassword")}
                </button>

                {/* 계정 탈퇴 */}
                <button
                  type="button"
                  className="profile-delete-button"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  {t("profile.deleteAccount")}
                </button>
              </>
            )}

            {/* 관리자가 다른 사용자를 볼 때 삭제 버튼 */}
            {isReadOnly && canDelete && (
              <button
                type="button"
                className="profile-delete-button"
                onClick={() => setShowDeleteConfirm(true)}
              >
                {t("profile.deleteAccount")}
              </button>
            )}
          </form>
        </div>
      </div>

      {/* 계정 탈퇴 확인 다이얼로그 */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title={t("profile.deleteConfirmTitle")}
        message={t("profile.deleteConfirmMessage")}
        confirmText={t("profile.deleteConfirmButton")}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          handleDeleteAccount();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* MFA 해제 확인 다이얼로그 */}
      <ConfirmDialog
        isOpen={showMfaDisableConfirm}
        title={t("profile.2faStatus") || "2-MFA Verification"}
        message="Are you sure you want to reset 2-MFA verification?"
        confirmText={t("profile.confirm") || "Confirm"}
        onConfirm={handleConfirmDisableMfa}
        onCancel={() => setShowMfaDisableConfirm(false)}
      />

      {/* Toast 알림 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* 현재 비밀번호 입력 프롬프트 */}
      <CustomPrompt
        key={showCurrentPasswordPrompt ? "current-open" : "current-closed"}
        isOpen={showCurrentPasswordPrompt}
        title={t("profile.changePassword")}
        message="Enter your current password"
        placeholder="Current password"
        defaultValue=""
        onConfirm={handleCurrentPasswordConfirm}
        onCancel={() => {
          setShowCurrentPasswordPrompt(false);
          setCurrentPasswordTemp("");
        }}
      />

      {/* 새 비밀번호 입력 프롬프트 */}
      <CustomPrompt
        key={showNewPasswordPrompt ? "new-open" : "new-closed"}
        isOpen={showNewPasswordPrompt}
        title={t("profile.changePassword")}
        message={t("profile.enterNewPassword")}
        placeholder="New password (min 6 characters)"
        defaultValue=""
        onConfirm={handleNewPasswordConfirm}
        onCancel={() => {
          setShowNewPasswordPrompt(false);
          setCurrentPasswordTemp("");
        }}
      />

      {processing && <LoadingSpinner />}
    </>
  );
};
