// src/auth/AuthProvider.tsx
import type { MultiFactorResolver, RecaptchaVerifier } from "firebase/auth";
import { multiFactor, onAuthStateChanged, type User } from "firebase/auth";
import type { FC, ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  auth,
  deleteProfileImage,
  deleteUserAccount,
  finalizeMfaEnrollment as firebaseFinalizeMfaEnrollment,
  getMfaResolver as firebaseGetMfaResolver,
  loginWithGoogle as firebaseLoginWithGoogle,
  logout as firebaseLogout,
  resetPassword as firebaseResetPassword,
  resolveMfaSignIn as firebaseResolveMfaSignIn,
  sendMfaEnrollmentCode as firebaseSendMfaEnrollmentCode,
  sendMfaSignInCode as firebaseSendMfaSignInCode,
  unenrollMfa as firebaseUnenrollMfa,
  getRecaptchaVerifier,
  getUserProfile,
  loginWithEmail,
  signupWithEmail,
  updateUserPassword,
  updateUserProfile,
  uploadProfileImage,
} from "../services/firebaseService";
import type { UserProfile } from "../types_interfaces/userProfile";
import { AuthContext } from "./AuthContext";

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      setCurrentUser(user);

      if (user) {
        // 사용자가 로그인한 경우 Firestore에서 프로필 로드
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error("Error loading user profile:", error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Recaptcha 배지 가시성 제어 (로그인 시 보임, 로그아웃 시 숨김)
  useEffect(() => {
    const updateBadgeVisibility = () => {
      const badge = document.querySelector(".grecaptcha-badge") as HTMLElement;
      if (badge) {
        // 배지는 MFA가 설정된 사용자가 로그인했을 때만 표시
        const isMfaEnabled =
          currentUser && multiFactor(currentUser).enrolledFactors.length > 0;
        badge.style.visibility = isMfaEnabled ? "visible" : "hidden";
      }
    };

    // DOM 변경 감지 (배지가 나중에 로드될 수 있음)
    const observer = new MutationObserver(updateBadgeVisibility);
    observer.observe(document.body, { childList: true, subtree: true });

    // 초기 실행
    updateBadgeVisibility();

    return () => observer.disconnect();
  }, [currentUser]);

  const signup = async (email: string, password: string, name?: string) => {
    await signupWithEmail(email, password, name);
    // 회원가입 직후 자동 로그인 방지 (이메일 인증 강제화)
    await firebaseLogout();
  };

  const login = async (email: string, password: string) => {
    const userCredential = await loginWithEmail(email, password);

    // 이메일 인증 확인
    if (!userCredential.user.emailVerified) {
      await firebaseLogout();
      throw new Error("EMAIL_NOT_VERIFIED");
    }
  };

  const loginWithGoogle = async () => {
    await firebaseLoginWithGoogle();
  };

  const logout = async () => {
    await firebaseLogout();
  };

  const resetPassword = async (email: string) => {
    await firebaseResetPassword(email);
  };

  const updateProfile = async (name: string, bio: string) => {
    if (!currentUser) {
      throw new Error("No user is currently signed in");
    }

    await updateUserProfile(currentUser.uid, { name, bio });

    // 로컬 상태 업데이트
    const updatedProfile = await getUserProfile(currentUser.uid);
    setUserProfile(updatedProfile);
  };

  const uploadProfilePhoto = async (file: File) => {
    if (!currentUser) {
      throw new Error("No user is currently signed in");
    }

    // 이전 이미지가 있으면 삭제
    if (userProfile?.photoURL) {
      await deleteProfileImage(userProfile.photoURL);
    }

    // 새 이미지 업로드
    const photoURL = await uploadProfileImage(currentUser.uid, file);

    // Firestore 업데이트
    await updateUserProfile(currentUser.uid, { photoURL });

    // 로컬 상태 업데이트
    const updatedProfile = await getUserProfile(currentUser.uid);
    setUserProfile(updatedProfile);
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    await updateUserPassword(currentPassword, newPassword);
  };

  const deleteAccount = async () => {
    if (!currentUser) {
      throw new Error("No user is currently signed in");
    }

    await deleteUserAccount(currentUser.uid, userProfile?.photoURL);
  };

  const sendMfaEnrollmentCode = async (
    phoneNumber: string,
    verifier: RecaptchaVerifier
  ) => {
    const verificationId = await firebaseSendMfaEnrollmentCode(
      phoneNumber,
      verifier
    );
    return verificationId;
  };

  const finalizeMfaEnrollment = async (
    verificationId: string,
    verificationCode: string
  ) => {
    await firebaseFinalizeMfaEnrollment(verificationId, verificationCode);
    if (currentUser) {
      const profile = await getUserProfile(currentUser.uid);
      setUserProfile(profile);
    }
  };

  const disableMfa = async (factorId: string) => {
    await firebaseUnenrollMfa(factorId);
    if (currentUser) {
      const profile = await getUserProfile(currentUser.uid);
      setUserProfile(profile);
    }
  };

  const sendMfaSignInCode = async (
    resolver: MultiFactorResolver,
    containerId: string
  ) => {
    const recaptchaVerifier = getRecaptchaVerifier(containerId);
    return await firebaseSendMfaSignInCode(resolver, recaptchaVerifier);
  };

  const resolveMfaSignIn = async (
    resolver: MultiFactorResolver,
    verificationId: string,
    verificationCode: string
  ) => {
    return await firebaseResolveMfaSignIn(
      resolver,
      verificationId,
      verificationCode
    );
  };

  const getMfaResolver = (error: unknown) => {
    return firebaseGetMfaResolver(error);
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    updateProfile,
    uploadProfilePhoto,
    changePassword,
    deleteAccount,
    sendMfaEnrollmentCode,
    finalizeMfaEnrollment,
    disableMfa,
    sendMfaSignInCode,
    resolveMfaSignIn,
    getMfaResolver,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
