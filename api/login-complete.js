// /api/login-complete.js
import admin from './_firebaseAdmin';

const db = admin.database();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { code, idToken } = req.body || {};

  if (!code || !idToken) {
    res.status(400).json({ error: 'code and idToken are required' });
    return;
  }

  try {
    // 1) idToken 검증 → uid 얻기
    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;

    // 2) 세션 찾기
    const ref = db.ref(`loginSessions/${code}`);
    const snap = await ref.get();

    if (!snap.exists()) {
      res.status(400).json({ error: 'invalid_code' });
      return;
    }

    const session = snap.val();
    const now = Date.now();

    if (session.expiresAt && now > session.expiresAt) {
      await ref.update({ status: 'expired' });
      res.status(400).json({ error: 'code_expired' });
      return;
    }

    if (session.status !== 'pending') {
      res.status(400).json({ error: 'session_not_pending' });
      return;
    }

    // 3) 앱(WebView)에서 사용할 customToken 생성
    const customToken = await admin.auth().createCustomToken(uid);

    // 4) 세션 업데이트
    await ref.update({
      status: 'done',
      uid,
      customToken,
      completedAt: now,
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
}
