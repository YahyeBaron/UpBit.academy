import crypto from 'crypto';
import { cookies } from 'next/headers';

export async function generateCSRFToken(): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const cookieStore = await cookies();
  cookieStore.set('csrf_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600, // 1 hour
  });
  return token;
}

export async function verifyCSRFToken(token: string): Promise<boolean> {
  if (!token) return false;
  const cookieStore = await cookies();
  const storedToken = cookieStore.get('csrf_token')?.value;
  return storedToken === token;
}
