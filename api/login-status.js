// /api/login-status.js
import admin from './_firebaseAdmin';

const db = admin.database();

export default async function handler(req, res) {
  // ✅ CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'code is required' });
    return;
  }

  try {
    const ref = db.ref(`loginSessions/${code}`);
    const snap = await ref.get();

    if (!snap.exists()) {
      res.status(200).json({ status: 'not_found' });
      return;
    }

    const session = snap.val();
    const now = Date.now();

    if (session.expiresAt && now > session.expiresAt) {
      await ref.update({ status: 'expired' });
      res.status(200).json({ status: 'expired' });
      return;
    }

    if (session.status === 'pending') {
      res.status(200).json({ status: 'pending' });
      return;
    }

    if (session.status === 'done') {
      res.status(200).json({
        status: 'done',
        customToken: session.customToken || null,
        uid: session.uid || null,
      });
      return;
    }

    res.status(200).json({ status: session.status || 'unknown' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
}
