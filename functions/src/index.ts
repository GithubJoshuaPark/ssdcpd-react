// functions/src/index.ts
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'

admin.initializeApp()

interface DeleteUserData {
  uid: string
  photoURL?: string
}

export const deleteUserByAdmin = onCall<DeleteUserData>(async (request) => {
  // 1. 인증 확인
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'User must be authenticated'
    )
  }

  // 2. 관리자 권한 확인
  const callerUid = request.auth.uid
  const callerDoc = await admin.firestore()
    .collection('user_profile')
    .doc(callerUid)
    .get()

  const callerRole = callerDoc.data()?.role
  if (callerRole !== 'admin') {
    throw new HttpsError(
      'permission-denied',
      'Only admins can delete users'
    )
  }

  // 3. 삭제할 사용자 UID
  const { uid, photoURL } = request.data

  try {
    // 4. Storage 이미지 삭제 (있는 경우)
    if (photoURL) {
      const bucket = admin.storage().bucket()
      const url = new URL(photoURL)
      const path = decodeURIComponent(url.pathname.split('/o/')[1].split('?')[0])
      await bucket.file(path).delete().catch(() => {
        console.log('Image not found or already deleted')
      })
    }

    // 5. Firestore 문서 삭제
    await admin.firestore()
      .collection('user_profile')
      .doc(uid)
      .delete()

    // 6. ⭐ Auth 계정 삭제 (Admin SDK로 가능!)
    await admin.auth().deleteUser(uid)

    return { success: true, message: 'User deleted successfully' }
  } catch (error) {
    console.error('Error deleting user:', error)
    throw new HttpsError(
      'internal',
      'Failed to delete user'
    )
  }
})