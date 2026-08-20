import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';
import { loginSchema } from '@/lib/validation';
export async function POST(request: Request) { try { const input = loginSchema.parse(await request.json()); const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } }); if (!user || !user.isActive || !(await bcrypt.compare(input.password, user.passwordHash))) return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 }); await createSession({ userId: user.id, role: user.role, name: user.name, email: user.email }); return NextResponse.json({ role: user.role }); } catch { return NextResponse.json({ error: 'Invalid login request.' }, { status: 400 }); } }
