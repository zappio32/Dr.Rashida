import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
export async function GET(){try{const session=await requireRole(['ADMIN','DOCTOR']);const notifications=await prisma.notification.findMany({where:session.role==='DOCTOR'?{userId:session.userId}:{},include:{logs:true},orderBy:{createdAt:'desc'},take:100});return NextResponse.json({notifications})}catch{return NextResponse.json({error:'You do not have permission to access this information.'},{status:403})}}
