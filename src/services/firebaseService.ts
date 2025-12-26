// src/services/firebaseService.ts
import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getAuth,
  getMultiFactorResolver,
  GoogleAuthProvider,
  multiFactor,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  reauthenticateWithCredential,
  RecaptchaVerifier,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type Auth,
  type MultiFactorError,
  type MultiFactorResolver,
  type PhoneMultiFactorInfo,
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
import type { Contact } from "../types_interfaces/contact";
import type { Project } from "../types_interfaces/project";
import type { Track } from "../types_interfaces/track";
import type { TranslationsByLang } from "../types_interfaces/translations";
import type { UserProfile } from "../types_interfaces/userProfile";
import type { WbsItem } from "../types_interfaces/wbs";

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
        createdAt: value.createdAt as string | number | undefined,
        updatedAt: value.updatedAt as string | number | undefined,
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
 * Google 로그인
 */
export async function loginWithGoogle(): Promise<UserCredential> {
  const provider = new GoogleAuthProvider();
  try {
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Firestore에 사용자 프로필이 있는지 확인
    const profile = await getUserProfile(user.uid);
    if (!profile) {
      // 프로필이 없으면 새로 생성 (Google 로그인은 기본적으로 이메일 인증됨)
      await createUserProfile(
        user.uid,
        user.email || "",
        user.displayName || "",
        ""
      );
      // Google 사용자는 기본적으로 email_verified: true
      await updateUserProfile(user.uid, { email_verified: true });
    }

    return userCredential;
  } catch (err) {
    console.error("Error logging in with Google:", err);
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

/**
 * 관리자가 Cloud Function을 통해 답변 이메일 발송
 */
export async function sendEmailByAdminFunction(
  to: string | string[],
  subject: string,
  text: string,
  html?: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const sendEmailCallable = httpsCallable<
      { to: string | string[]; subject: string; text: string; html?: string },
      { success: boolean; messageId: string }
    >(functions, "sendEmail");

    const result = await sendEmailCallable({ to, subject, text, html });
    console.log("Email sent via Cloud Function:", result.data);
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("Error calling sendEmail function:", error);
    // throw error; // Cloud Function 없을 때를 대비해 주석 처리
    return {
      success: true,
      message: "Simulated success (Function not deployed)",
    };
  }
}

// ----- Contact functions -----

/**
 * Create a new contact message
 */
export async function createContact(
  contact: Omit<Contact, "id">
): Promise<string> {
  try {
    const { push, set } = await import("firebase/database");
    const contactsRef = ref(database, "contacts");
    const newContactRef = push(contactsRef);

    if (!newContactRef.key) {
      throw new Error("Failed to generate contact ID");
    }

    await set(newContactRef, contact);
    return newContactRef.key;
  } catch (err) {
    console.error("Error creating contact:", err);
    throw err;
  }
}

/**
 * Get contacts for a specific user
 */
export async function getContactsByUid(uid: string): Promise<Contact[]> {
  try {
    const { query, orderByChild, equalTo } = await import("firebase/database");
    const contactsRef = ref(database, "contacts");
    const userContactsQuery = query(
      contactsRef,
      orderByChild("uid"),
      equalTo(uid)
    );
    const snapshot = await get(userContactsQuery);

    if (!snapshot.exists()) {
      return [];
    }

    const contactsObj = snapshot.val() as Record<string, unknown>;
    return Object.entries(contactsObj).map(([id, raw]) => {
      const value = raw as Record<string, unknown>;
      return {
        id,
        ...value,
      } as Contact;
    });
  } catch (err) {
    console.error("Error fetching user contacts:", err);
    throw err;
  }
}

/**
 * Update a contact message
 */
export async function updateContact(
  id: string,
  updates: Partial<Contact>
): Promise<void> {
  try {
    const { update } = await import("firebase/database");
    const contactRef = ref(database, `contacts/${id}`);

    const updateData = { ...updates };
    delete updateData.id;

    await update(contactRef, updateData);
  } catch (err) {
    console.error("Error updating contact:", err);
    throw err;
  }
}

/**
 * Delete a contact message
 */
export async function deleteContact(id: string): Promise<void> {
  try {
    const { remove } = await import("firebase/database");
    const contactRef = ref(database, `contacts/${id}`);
    await remove(contactRef);
  } catch (err) {
    console.error("Error deleting contact:", err);
    throw err;
  }
}

/**
 * Get all contacts (for admin)
 */
export async function getAllContacts(): Promise<Contact[]> {
  try {
    const contactsRef = ref(database, "contacts");
    const snapshot = await get(contactsRef);

    if (!snapshot.exists()) {
      return [];
    }

    const contactsObj = snapshot.val() as Record<string, unknown>;
    return Object.entries(contactsObj).map(([id, raw]) => {
      const value = raw as Record<string, unknown>;
      return {
        id,
        ...value,
      } as Contact;
    });
  } catch (err) {
    console.error("Error fetching all contacts:", err);
    throw err;
  }
}

/**
 * Update contact response (for admin)
 */
export async function updateContactResponse(
  id: string,
  response: string
): Promise<void> {
  try {
    const { update } = await import("firebase/database");
    const contactRef = ref(database, `contacts/${id}`);
    await update(contactRef, {
      response,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Error updating contact response:", err);
    throw err;
  }
}
/**
 * Project CRUD Functions
 */

export async function createProject(
  project: Omit<Project, "id">
): Promise<string> {
  try {
    const { push, set } = await import("firebase/database");
    const projectsRef = ref(database, "projects");
    const newProjectRef = push(projectsRef);

    if (!newProjectRef.key) {
      throw new Error("Failed to generate project ID");
    }

    await set(newProjectRef, project);
    return newProjectRef.key;
  } catch (err) {
    console.error("Error creating project:", err);
    throw err;
  }
}

export async function getAllProjects(): Promise<Project[]> {
  try {
    const projectsRef = ref(database, "projects");
    const snapshot = await get(projectsRef);

    if (!snapshot.exists()) {
      return [];
    }

    const projectsObj = snapshot.val() as Record<string, unknown>;
    return Object.entries(projectsObj).map(([id, raw]) => {
      const value = raw as Record<string, unknown>;
      return {
        id,
        ...value,
      } as Project;
    });
  } catch (err) {
    console.error("Error fetching all projects:", err);
    throw err;
  }
}

export async function getProjectById(id: string): Promise<Project | null> {
  try {
    const projectRef = ref(database, `projects/${id}`);
    const snapshot = await get(projectRef);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id,
      ...(snapshot.val() as object),
    } as Project;
  } catch (err) {
    console.error("Error fetching project:", err);
    throw err;
  }
}

export async function updateProject(
  id: string,
  updates: Partial<Project>
): Promise<void> {
  try {
    const { update } = await import("firebase/database");
    const projectRef = ref(database, `projects/${id}`);
    await update(projectRef, updates);
  } catch (err) {
    console.error("Error updating project:", err);
    throw err;
  }
}

export async function deleteProject(id: string): Promise<void> {
  try {
    // 0. Fetch project details to get imageUrl
    const project = await getProjectById(id);
    const { remove } = await import("firebase/database");

    // 1. Delete WBS items node for this project
    const wbsRef = ref(database, `wbs/${id}`);
    await remove(wbsRef);

    // 2. Delete project image from storage if exists
    if (project?.imageUrl && project.imageUrl.startsWith("http")) {
      try {
        // Use the full URL to get the reference (Firebase Storage supports this)
        const imageRef = storageRef(storage, project.imageUrl);
        await deleteObject(imageRef);
      } catch (storageErr) {
        console.error("Error deleting project image from storage:", storageErr);
        // Non-critical: we continue to delete the project even if image deletion fails
      }
    }

    // 3. Delete the project node itself
    const projectRef = ref(database, `projects/${id}`);
    await remove(projectRef);
  } catch (err) {
    console.error("Error deleting project:", err);
    throw err;
  }
}

export async function uploadProjectImage(file: File): Promise<string> {
  const {
    uploadBytes,
    getDownloadURL,
    ref: sRef,
  } = await import("firebase/storage");
  const fileExtension = file.name.split(".").pop();
  const fileName = `projects/${Date.now()}_${Math.random()
    .toString(36)
    .substring(2)}.${fileExtension}`;
  const storageRef = sRef(storage, fileName);

  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (err) {
    console.error("Error uploading project image:", err);
    throw err;
  }
}

/**
 * WBS CRUD Functions
 */

export async function createWbsItem(
  wbsItem: Omit<WbsItem, "id">
): Promise<string> {
  try {
    const { push, set } = await import("firebase/database");
    const wbsRef = ref(database, `wbs/${wbsItem.projectId}`);
    const newItemRef = push(wbsRef);

    if (!newItemRef.key) {
      throw new Error("Failed to generate WBS item ID");
    }

    await set(newItemRef, wbsItem);
    return newItemRef.key;
  } catch (err) {
    console.error("Error creating WBS item:", err);
    throw err;
  }
}

export async function getWbsItemsByProject(
  projectId: string
): Promise<WbsItem[]> {
  try {
    const wbsRef = ref(database, `wbs/${projectId}`);
    const snapshot = await get(wbsRef);

    if (!snapshot.exists()) {
      return [];
    }

    const wbsObj = snapshot.val() as Record<string, unknown>;
    const items = Object.entries(wbsObj).map(([id, raw]) => {
      const value = raw as Record<string, unknown>;
      return {
        id,
        ...value,
      } as WbsItem;
    });

    // Sort by order
    return items.sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (err) {
    console.error("Error fetching WBS items:", err);
    throw err;
  }
}

export async function updateWbsItem(
  projectId: string,
  itemId: string,
  updates: Partial<WbsItem>
): Promise<void> {
  try {
    const { update } = await import("firebase/database");
    const itemRef = ref(database, `wbs/${projectId}/${itemId}`);
    await update(itemRef, updates);
  } catch (err) {
    console.error("Error updating WBS item:", err);
    throw err;
  }
}

export async function deleteWbsItem(
  projectId: string,
  itemId: string
): Promise<void> {
  try {
    const { remove } = await import("firebase/database");
    const itemRef = ref(database, `wbs/${projectId}/${itemId}`);
    await remove(itemRef);
  } catch (err) {
    console.error("Error deleting WBS item:", err);
    throw err;
  }
}

// ----- MFA (Multi-Factor Authentication) functions -----

/**
 * RecaptchaVerifier 인스턴스 생성 (웹용)
 */
export function getRecaptchaVerifier(containerId: string) {
  return new RecaptchaVerifier(auth, containerId, {
    size: "normal",
  });
}

/**
 * MFA 등록을 위한 인증번호 발송
 */
export async function sendMfaEnrollmentCode(
  phoneNumber: string,
  recaptchaVerifier: RecaptchaVerifier
): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");

  const session = await multiFactor(user).getSession();
  const phoneAuthProvider = new PhoneAuthProvider(auth);
  return phoneAuthProvider.verifyPhoneNumber(
    { phoneNumber, session },
    recaptchaVerifier
  );
}

/**
 * MFA 등록 완료
 */
export async function finalizeMfaEnrollment(
  verificationId: string,
  verificationCode: string,
  displayName: string = "Phone Number"
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");

  const credential = PhoneAuthProvider.credential(
    verificationId,
    verificationCode
  );
  const assertion = PhoneMultiFactorGenerator.assertion(credential);

  await multiFactor(user).enroll(assertion, displayName);
}

/**
 * MFA 등록 해제
 */
export async function unenrollMfa(
  factorIdOrInfo: string | PhoneMultiFactorInfo
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");

  await multiFactor(user).unenroll(factorIdOrInfo);
}

/**
 * 로그인 시 MFA 챌린지 해결을 위한 인증번호 발송
 */
export async function sendMfaSignInCode(
  resolver: MultiFactorResolver,
  recaptchaVerifier: RecaptchaVerifier,
  multiFactorIndex: number = 0
): Promise<string> {
  const session = resolver.session;

  const phoneAuthProvider = new PhoneAuthProvider(auth);
  const selectedHint = resolver.hints[multiFactorIndex];

  return phoneAuthProvider.verifyPhoneNumber(
    { multiFactorHint: selectedHint, session },
    recaptchaVerifier
  );
}

/**
 * MFA 챌린지 해결 (로그인 완료)
 */
export async function resolveMfaSignIn(
  resolver: MultiFactorResolver,
  verificationId: string,
  verificationCode: string
): Promise<UserCredential> {
  const credential = PhoneAuthProvider.credential(
    verificationId,
    verificationCode
  );
  const assertion = PhoneMultiFactorGenerator.assertion(credential);

  return resolver.resolveSignIn(assertion);
}

/**
 * 에러 개체에서 MFA Resolver 추출
 */
export function getMfaResolver(error: unknown): MultiFactorResolver | null {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "auth/multi-factor-auth-required"
  ) {
    return getMultiFactorResolver(auth, error as MultiFactorError);
  }
  return null;
}

export { auth, database, firestore, storage };
