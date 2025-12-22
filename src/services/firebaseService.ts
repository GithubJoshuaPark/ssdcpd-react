// src/services/firebaseService.ts
import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getAuth,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type UserCredential,
} from "firebase/auth";
import {
  Database,
  DataSnapshot,
  get,
  getDatabase,
  ref,
} from "firebase/database";
import {
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  setDoc,
  updateDoc,
  type Firestore,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref as storageRef,
  uploadBytes,
  type FirebaseStorage,
} from "firebase/storage";

// ----- 타입 가져오기 -----
import type { Track } from "../types_interfaces/track";
import type { TranslationsByLang } from "../types_interfaces/translations";
import type { UserProfile } from "../types_interfaces/userProfile";

// ----- Firebase 초기화 -----

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env
    .VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
};

const app = initializeApp(firebaseConfig);
const database: Database = getDatabase(app); // Realtime Database
const auth: Auth = getAuth(app); // Authentication
const firestore: Firestore = getFirestore(app); // Cloud Firestore
const storage: FirebaseStorage = getStorage(app); // Cloud Storage
const functions = getFunctions(app); // Cloud Functions

// ----- Service functions (기존 firebase-service.js 대응) -----

// translations 전체
export async function getAllTranslations(): Promise<TranslationsByLang | null> {
  try {
    const snapshot: DataSnapshot = await get(ref(database, "translations"));

    if (!snapshot.exists()) {
      console.warn("No translations data available");
      return null;
    }

    return snapshot.val() as TranslationsByLang;
  } catch (err) {
    console.error("Error fetching translations:", err);
    throw err;
  }
}

// tracks 전체
export async function getAllTracks(): Promise<Track[]> {
  try {
    const snapshot: DataSnapshot = await get(ref(database, "tracks"));

    if (!snapshot.exists()) {
      console.warn("No tracks data available");
      return [];
    }

    const tracksObj = snapshot.val() as Record<string, unknown>;

    const result: Track[] = Object.entries(tracksObj).map(([id, raw]) => {
      const value = raw as Record<string, unknown>;

      return {
        id,
        title: String(value.title ?? ""),
        level: value.level ? String(value.level) : undefined,
        category: value.category as Track["category"],
        status: value.status as Track["status"],
        short: value.short ? String(value.short) : undefined,
        short_ko: value.short_ko ? String(value.short_ko) : undefined,
        url: value.url ? String(value.url) : undefined,
        tags: Array.isArray(value.tags) ? (value.tags as string[]) : undefined,
      };
    });

    return result;
  } catch (err) {
    console.error("Error fetching tracks:", err);
    throw err;
  }
}

/**
 * Create a new track in Firebase Realtime Database
 */
export async function createTrack(track: Omit<Track, "id">): Promise<string> {
  try {
    const { push, set } = await import("firebase/database");
    const tracksRef = ref(database, "tracks");
    const newTrackRef = push(tracksRef);

    if (!newTrackRef.key) {
      throw new Error("Failed to generate track ID");
    }

    await set(newTrackRef, track);
    return newTrackRef.key;
  } catch (err) {
    console.error("Error creating track:", err);
    throw err;
  }
}

/**
 * Update an existing track in Firebase Realtime Database
 */
export async function updateTrack(
  id: string,
  updates: Partial<Track>
): Promise<void> {
  try {
    const { update } = await import("firebase/database");
    const trackRef = ref(database, `tracks/${id}`);

    // Remove id from updates if present
    const updateData = { ...updates };
    delete updateData.id;

    await update(trackRef, updateData);
  } catch (err) {
    console.error("Error updating track:", err);
    throw err;
  }
}

/**
 * Delete a track from Firebase Realtime Database
 */
export async function deleteTrack(id: string): Promise<void> {
  try {
    const { remove } = await import("firebase/database");
    const trackRef = ref(database, `tracks/${id}`);
    await remove(trackRef);
  } catch (err) {
    console.error("Error deleting track:", err);
    throw err;
  }
}

// ----- Authentication functions -----

/**
 * 사용자 IP 주소 조회 (외부 API 사용)
 */
export async function getUserIpAddress(): Promise<string | undefined> {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip;
  } catch (err) {
    console.error("Error fetching IP address:", err);
    return undefined;
  }
}

/**
 * Firestore에 사용자 프로필 생성
 */
export async function createUserProfile(
  uid: string,
  email: string,
  name?: string,
  password?: string
): Promise<void> {
  try {
    const ipAddress = await getUserIpAddress();
    const now = new Date().toISOString();

    const userProfile: UserProfile = {
      uid,
      email,
      name: name || "",
      password: password || "",
      bio: "",
      photoURL: "",
      role: "user",
      email_verified: false,
      ip_address: ipAddress,
      created_at: now,
      updated_at: now,
    };

    await setDoc(doc(firestore, "user_profile", uid), userProfile);
  } catch (err) {
    console.error("Error creating user profile:", err);
    throw err;
  }
}

/**
 * Firestore에서 사용자 프로필 조회
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const docRef = doc(firestore, "user_profile", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    } else {
      console.warn("No user profile found for uid:", uid);
      return null;
    }
  } catch (err) {
    console.error("Error fetching user profile:", err);
    throw err;
  }
}

/**
 * 모든 사용자 프로필 조회 (Admin only)
 */
export async function getAllUserProfiles(): Promise<UserProfile[]> {
  try {
    const { collection, getDocs } = await import("firebase/firestore");
    const querySnapshot = await getDocs(collection(firestore, "user_profile"));

    const users: UserProfile[] = [];
    querySnapshot.forEach(doc => {
      users.push(doc.data() as UserProfile);
    });

    return users;
  } catch (err) {
    console.error("Error fetching all user profiles:", err);
    throw err;
  }
}

/**
 * Firestore에서 사용자 프로필 업데이트
 */
export async function updateUserProfile(
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> {
  try {
    const docRef = doc(firestore, "user_profile", uid);
    await updateDoc(docRef, {
      ...updates,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Error updating user profile:", err);
    throw err;
  }
}

/**
 * 회원가입
 */
export async function signupWithEmail(
  email: string,
  password: string,
  name?: string
): Promise<UserCredential> {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Firestore에 사용자 프로필 생성
    await createUserProfile(userCredential.user.uid, email, name, password);

    // 이메일 인증 발송
    await sendEmailVerification(userCredential.user);

    return userCredential;
  } catch (err) {
    console.error("Error signing up:", err);
    throw err;
  }
}

/**
 * 로그인
 */
export async function loginWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    // 이메일 인증 상태 확인 및 Firestore 업데이트
    if (userCredential.user.emailVerified) {
      const profile = await getUserProfile(userCredential.user.uid);
      if (profile && !profile.email_verified) {
        await updateUserProfile(userCredential.user.uid, {
          email_verified: true,
        });
      }
    }

    return userCredential;
  } catch (err) {
    console.error("Error logging in:", err);
    throw err;
  }
}

/**
 * 로그아웃
 */
export async function logout(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.error("Error logging out:", err);
    throw err;
  }
}

/**
 * 비밀번호 재설정 이메일 발송
 */
export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (err) {
    console.error("Error sending password reset email:", err);
    throw err;
  }
}

// ----- Profile Management functions -----

/**
 * 프로필 이미지 업로드
 */
export async function uploadProfileImage(
  uid: string,
  file: File
): Promise<string> {
  try {
    const imageRef = storageRef(storage, `profiles/${uid}/profile.jpg`);
    await uploadBytes(imageRef, file);
    const downloadURL = await getDownloadURL(imageRef);
    return downloadURL;
  } catch (err) {
    console.error("Error uploading profile image:", err);
    throw err;
  }
}

/**
 * 프로필 이미지 삭제
 */
export async function deleteProfileImage(photoURL: string): Promise<void> {
  try {
    // photoURL에서 Storage 경로 추출
    const url = new URL(photoURL);
    const path = decodeURIComponent(url.pathname.split("/o/")[1].split("?")[0]);
    const imageRef = storageRef(storage, path);
    await deleteObject(imageRef);
  } catch (err) {
    console.error("Error deleting profile image:", err);
    // 이미지 삭제 실패는 치명적이지 않으므로 에러를 던지지 않음
  }
}

/**
 * 사용자 재인증 (비밀번호 변경 등 민감한 작업 전에 필요)
 */
export async function reauthenticateUser(
  currentPassword: string
): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error("No user is currently signed in");
    }

    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );
    await reauthenticateWithCredential(user, credential);
  } catch (err) {
    console.error("Error reauthenticating user:", err);
    throw err;
  }
}

/**
 * 사용자 비밀번호 변경
 */
export async function updateUserPassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No user is currently signed in");
    }

    // 먼저 재인증
    await reauthenticateUser(currentPassword);

    // 비밀번호 변경
    const { updatePassword } = await import("firebase/auth");
    await updatePassword(user, newPassword);
    await updateUserProfile(user.uid, { password: newPassword });
  } catch (err) {
    console.error("Error updating password:", err);
    throw err;
  }
}

/**
 * 계정 탈퇴 (Storage 이미지, Firestore 문서, Auth 계정 모두 삭제)
 */
export async function deleteUserAccount(
  uid: string,
  photoURL?: string
): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No user is currently signed in");
    }

    // 1. Storage 이미지 삭제 (있는 경우)
    if (photoURL) {
      await deleteProfileImage(photoURL);
    }

    // 2. Firestore 문서 삭제
    const docRef = doc(firestore, "user_profile", uid);
    await deleteDoc(docRef);

    // 3. Auth 계정 삭제
    const { deleteUser } = await import("firebase/auth");
    await deleteUser(user);
  } catch (err) {
    console.error("Error deleting user account:", err);
    throw err;
  }
}

/**
 * 관리자가 다른 사용자 계정 삭제 (Firestore 문서 및 Storage 이미지만 삭제)
 * Auth 계정은 현재 로그인한 사용자만 삭제할 수 있으므로 제외
 */
export async function deleteUserAccountByAdmin(
  uid: string,
  photoURL?: string
): Promise<void> {
  try {
    // 1. Storage 이미지 삭제 (있는 경우)
    if (photoURL) {
      await deleteProfileImage(photoURL);
    }

    // 2. Firestore 문서 삭제
    const docRef = doc(firestore, "user_profile", uid);
    await deleteDoc(docRef);

    // Note: Auth 계정은 삭제하지 않음 (현재 로그인한 사용자만 자신의 Auth 계정 삭제 가능)
  } catch (err) {
    console.error("Error deleting user account by admin:", err);
    throw err;
  }
}

/**
 * 관리자가 Cloud Function을 통해 사용자 계정 완전 삭제
 * (Auth + Firestore + Storage 모두 삭제)
 * Cloud Function이 배포되어 있어야 사용 가능
 */
export async function deleteUserByAdminFunction(
  uid: string,
  photoURL?: string
): Promise<void> {
  try {
    const deleteUserCallable = httpsCallable<
      { uid: string; photoURL?: string },
      { success: boolean; message: string }
    >(functions, "deleteUserByAdmin");

    const result = await deleteUserCallable({ uid, photoURL });
    console.log("User deleted via Cloud Function:", result.data);
  } catch (error) {
    console.error("Error calling deleteUserByAdmin function:", error);
    throw error;
  }
}

export { auth, database, firestore, storage };
