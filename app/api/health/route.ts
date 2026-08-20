import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, database: 'connected', environment: process.env.NODE_ENV || 'unknown' });
  } catch {
    return NextResponse.json({ ok: false, database: 'unavailable', environment: process.env.NODE_ENV || 'unknown' }, { status: 503 });
  }
}
