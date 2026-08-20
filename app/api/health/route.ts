import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const environment = getServerEnv();
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok', ok: true, database: 'connected', environment: environment.NODE_ENV });
  } catch (error) {
    console.error('[health] check failed:', error instanceof Error ? error.message : error);
    return NextResponse.json({ status: 'error', ok: false, database: 'unavailable' }, { status: 503 });
  }
}
