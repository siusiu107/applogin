// /api/_firebaseAdmin.js
import admin from 'firebase-admin';

const svc = process.env.FIREBASE_SERVICE_ACCOUNT;
const databaseURL = process.env.FIREBASE_DATABASE_URL;

if (!svc) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT env가 설정되어 있지 않습니다.');
}
if (!databaseURL) {
  throw new Error('FIREBASE_DATABASE_URL env가 설정되어 있지 않습니다.');
}

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(svc);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL,
  });
}

export default admin;
