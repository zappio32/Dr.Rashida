import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
export async function GET(){try{await requireRole(['ADMIN']);return NextResponse.json({appointments:await prisma.appointment.findMany({include:{patient:{select:{name:true,email:true,phone:true}},service:true,payment:true},orderBy:{startsAt:'desc'}})})}catch{return NextResponse.json({error:'You do not have permission to access this information.'},{status:403})}}
