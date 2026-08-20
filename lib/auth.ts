import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { Role } from '@prisma/client';
import { prisma } from './prisma';
import { getServerEnv } from './env';

const COOKIE = 'dra_session';
export type Session = { userId: string; role: Role; name: string; email: string };

function secret() {
  return new TextEncoder().encode(getServerEnv().AUTH_SECRET);
}

export async function createSession(session: Session) {
  const environment = getServerEnv();
  const token = await new SignJWT(session).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('7d').sign(secret());
  (await cookies()).set(COOKIE, token, { httpOnly: true, secure: environment.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 });
}
export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try { return (await jwtVerify(token, secret())).payload as unknown as Session; } catch { return null; }
}
export async function clearSession() { (await cookies()).delete(COOKIE); }
export async function requireRole(roles: Role[]) {
  const session = await getSession();
  if (!session || !roles.includes(session.role)) throw new Error('UNAUTHORIZED');
  return session;
}
export async function getDoctor() { return prisma.doctorProfile.findFirst({ include: { user: true } }); }
