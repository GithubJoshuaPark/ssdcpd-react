// functions/src/index.ts
import * as admin from "firebase-admin";
import { HttpsError, onCall } from "firebase-functions/v2/https";

admin.initializeApp();

interface DeleteUserData {
  uid: string;
  photoURL?: string;
}

export const deleteUserByAdmin = onCall<DeleteUserData>(async request => {
  // 1. 인증 확인
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  // 2. 관리자 권한 확인
  const callerUid = request.auth.uid;
  const callerDoc = await admin
    .firestore()
    .collection("user_profile")
    .doc(callerUid)
    .get();

  const callerRole = callerDoc.data()?.role;
  if (callerRole !== "admin") {
    throw new HttpsError("permission-denied", "Only admins can delete users");
  }

  // 3. 삭제할 사용자 UID
  const { uid, photoURL } = request.data;

  try {
    // 4. Storage 이미지 삭제 (있는 경우)
    if (photoURL) {
      const bucket = admin.storage().bucket();
      const url = new URL(photoURL);
      const path = decodeURIComponent(
        url.pathname.split("/o/")[1].split("?")[0]
      );
      await bucket
        .file(path)
        .delete()
        .catch(() => {
          console.log("Image not found or already deleted");
        });
    }

    // 5. Firestore 문서 삭제
    await admin.firestore().collection("user_profile").doc(uid).delete();

    // 6. ⭐ Auth 계정 삭제 (Admin SDK로 가능!)
    await admin.auth().deleteUser(uid);

    return { success: true, message: "User deleted successfully" };
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new HttpsError("internal", "Failed to delete user");
  }
});

interface SendEmailData {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  cc?: string | string[];
}

export const sendEmail = onCall<SendEmailData>(async request => {
  // 1. 인증 확인
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  // 2. 관리자 권한 확인 (Firestore user_profile 컬렉션 기준)
  const callerUid = request.auth.uid;
  const callerDoc = await admin
    .firestore()
    .collection("user_profile")
    .doc(callerUid)
    .get();

  const callerRole = callerDoc.data()?.role;
  if (callerRole !== "admin") {
    throw new HttpsError("permission-denied", "Only admins can send emails");
  }

  const { to, subject, text, html, cc } = request.data;

  // 3. Nodemailer 설정 (실제 서비스 시에는 환경 변수나 Secret 사용 권장)
  // 여기서는 구조를 잡기 위해 nodemailer를 가져옵니다.
  const nodemailer = await import("nodemailer");

  // 주의: GMail 등 사용 시 앱 비밀번호가 필요하거나 소유자 인증이 필요할 수 있습니다.
  // 실제 SMTP 설정은 프로젝트 환경에 맞게 수정해야 합니다.
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER || "",
      pass: process.env.EMAIL_PASS || "",
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"SSDCPD Admin" <${
        process.env.EMAIL_USER || "soromiso@gmail.com"
      }>`,
      to,
      cc,
      subject,
      text,
      html: html || text,
    });

    console.log("Message sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new HttpsError("internal", "Failed to send email");
  }
});
