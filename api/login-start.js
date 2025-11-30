// /api/login-start.js
import admin from './_firebaseAdmin';

const db = admin.database();

function generateCode() {
  // 6자리 코드 (A-Z + 0-9) - 헷갈리는 문자 제거(I, O, 1, 0 등)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const now = Date.now();
    const expiresInMs = 5 * 60 * 1000; // 5분
    const expiresAt = now + expiresInMs;

    let code = generateCode();
    const ref = db.ref(`loginSessions/${code}`);
    const snap = await ref.get();

    if (snap.exists()) {
      code = generateCode(); // 단순 1회 재생성 (충돌 확률 매우 낮음)
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
