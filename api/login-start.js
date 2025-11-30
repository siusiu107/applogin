// /api/login-start.js
import admin from './_firebaseAdmin';

const db = admin.database();

export default async function handler(req, res) {
  // ✅ CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // ✅ 프리플라이트 처리
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const now = Date.now();
    const expiresInMs = 5 * 60 * 1000; // 5분
    const expiresAt = now + expiresInMs;

    // 6자리 코드 생성 (헷갈리는 문자 제거)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }

    const ref = db.ref(`loginSessions/${code}`);
    const snap = await ref.get();
    if (snap.exists()) {
      // 극단적인 경우에만 한 번 더 생성
      let alt = '';
      for (let i = 0; i < 6; i++) {
        alt += chars[Math.floor(Math.random() * chars.length)];
      }
      code = alt;
    }

    await db.ref(`loginSessions/${code}`).set({
      status: 'pending',
      createdAt: now,
      expiresAt,
    });

    res.status(200).json({
      code,
      expiresIn: Math.floor(expiresInMs / 1000), // 초 단위
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
}
