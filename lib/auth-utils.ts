import { requireAuthUser, validateOwnership, AuthError } from './auth-policy';
import { getAdminSession } from '@/lib/admin-auth';

/**
 * Ensures the request is authenticated via Clerk or Admin session.
 * Returns the verified Prisma User object or throws an authorization error.
 */
export async function verifyAuthenticatedUser() {
  return await requireAuthUser();
}

/**
 * Ensures that the authenticated user owns the data identified by targetUserId.
 * Super Admins are exempt from ownership restrictions.
 */
export async function verifyUserOwnsData(targetUserId: string) {
  const admin = await getAdminSession();
  if (admin) {
    return { isSuperAdmin: true, admin };
  }

  const user = await requireAuthUser();
  validateOwnership(targetUserId, user.id, user.role);

  return user;
}

/**
 * Ensures the caller is an authenticated Admin (via admin_session cookie)
 * or a verified User with role ADMIN or INSTRUCTOR.
 */
export async function requireAdminOrInstructor() {
  const admin = await getAdminSession();
  if (admin) {
    return { admin, role: admin.role || 'ADMIN' };
  }

  const dbUser = await requireAuthUser();
  if (dbUser.role === 'ADMIN' || dbUser.role === 'INSTRUCTOR') {
    return { user: dbUser, role: dbUser.role };
  }

  throw new AuthError('Forbidden: Administrative access required', 403);
}
