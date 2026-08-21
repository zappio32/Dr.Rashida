'use client';
import { useRouter } from 'next/navigation';
import { logout } from '@/lib/api/auth';

export function SignOutButton() {
  const router = useRouter();
  async function signOut() { await logout(); router.push('/'); router.refresh(); }
  return <button type="button" className="btn soft" onClick={signOut}>Sign out</button>;
}
