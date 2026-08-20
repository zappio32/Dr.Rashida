import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { z } from 'zod';
const schema=z.object({name:z.string().min(2),description:z.string().min(2),durationMin:z.number().int().positive(),fee:z.number().int().nonnegative(),active:z.boolean().optional()});
export async function GET(){try{await requireRole(['ADMIN']);return NextResponse.json({services:await prisma.service.findMany({orderBy:{createdAt:'asc'}})})}catch{return NextResponse.json({error:'You do not have permission to access this information.'},{status:403})}}
export async function POST(request:Request){try{const session=await requireRole(['ADMIN']);const input=schema.parse(await request.json());const service=await prisma.service.create({data:input});await prisma.auditLog.create({data:{userId:session.userId,action:'SERVICE_CREATED',entity:'Service',entityId:service.id}});return NextResponse.json({service},{status:201})}catch{return NextResponse.json({error:'Invalid service or unauthorized request.'},{status:400})}}
