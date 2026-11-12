import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { checkAdminLoginRateLimit } from '@/lib/rate-limit';
import { ADMIN_COOKIE_OPTIONS } from '@/lib/admin-auth';

// A pre-computed dummy hash to run bcrypt.compare against if user is not found.
// This prevents timing-attack user enumeration.
const DUMMY_BCRYPT_HASH = '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012';

export async function POST(req: Request) {
  try {
    // 1. IP-based rate limiting (5 attempts per 15 mins)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
               req.headers.get('x-real-ip') ||
               '127.0.0.1';

    const rateLimit = await checkAdminLoginRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimit.resetTimeMs - Date.now()) / 1000)),
          },
        }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.username || !body.password) {
      return NextResponse.json(
        { error: 'Username and password are required.' },
        { status: 400 }
      );
    }

    const { username, password } = body;
    const cleanUser = String(username).trim();
    const cleanPass = String(password).trim();

    if (!cleanUser || !cleanPass) {
      return NextResponse.json(
        { error: 'Username and password cannot be empty.' },
        { status: 400 }
      );
    }

    // 2. Find admin by username or email
    const admin = await prisma.admin.findFirst({
      where: {
        OR: [
          { username: { equals: cleanUser, mode: 'insensitive' } },
          { email: { equals: cleanUser, mode: 'insensitive' } },
        ],
      },
    });

    // Constant-time password check: always call bcrypt.compare even if admin is null
    const hashToCompare = admin?.passwordHash || DUMMY_BCRYPT_HASH;
    const isValidPassword = await bcrypt.compare(cleanPass, hashToCompare);

    if (!admin || !isValidPassword || !admin.isActive) {
      return NextResponse.json(
        { error: 'Invalid admin credentials.' },
        { status: 401 }
      );
    }

    // 3. Generate secure 32-byte session token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + ADMIN_COOKIE_OPTIONS.maxAge * 1000);

    await prisma.adminSession.create({
      data: {
        adminId: admin.id,
        token,
        expiresAt,
      },
    });

    // Update last login timestamp
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE_OPTIONS.name, token, {
      httpOnly: ADMIN_COOKIE_OPTIONS.httpOnly,
      secure: ADMIN_COOKIE_OPTIONS.secure,
      sameSite: ADMIN_COOKIE_OPTIONS.sameSite,
      path: ADMIN_COOKIE_OPTIONS.path,
      maxAge: ADMIN_COOKIE_OPTIONS.maxAge,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error: any) {
    console.error('[Admin Login Error]: Authentication exception occurred');
    return NextResponse.json(
      { error: 'Authentication failed. Please try again.' },
      { status: 500 }
    );
  }
}
