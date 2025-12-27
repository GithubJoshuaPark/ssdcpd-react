// src/auth/AuthContext.tsx
import type {
  MultiFactorResolver,
  RecaptchaVerifier,
  User,
  UserCredential,
} from "firebase/auth";
import { createContext } from "react";
import type { UserProfile } from "../types_interfaces/userProfile";

export interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (name: string, bio: string) => Promise<void>;
  uploadProfilePhoto: (file: File) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  deleteAccount: () => Promise<void>;
  sendMfaEnrollmentCode: (
    phoneNumber: string,
    verifier: RecaptchaVerifier
  ) => Promise<string>;
  finalizeMfaEnrollment: (
    verificationId: string,
    verificationCode: string
  ) => Promise<void>;
  sendMfaSignInCode: (
    resolver: MultiFactorResolver,
    containerId: string
  ) => Promise<string>;
  resolveMfaSignIn: (
    resolver: MultiFactorResolver,
    verificationId: string,
    verificationCode: string
  ) => Promise<UserCredential>;
  getMfaResolver: (error: unknown) => MultiFactorResolver | null;
  disableMfa: (factorId: string) => Promise<void>;
  changePasswordForUser: (user: User, newPassword: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
