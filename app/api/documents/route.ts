import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
const schema=z.object({appointmentId:z.string(),storageKey:z.string().min(1),originalName:z.string().min(1).max(255),mimeType:z.enum(['application/pdf','image/jpeg','image/png']),sizeBytes:z.number().int().positive().max(10_000_000)});
export async function POST(request:Request){const session=await getSession();if(!session)return NextResponse.json({error:'Unauthorized'},{status:401});try{const input=schema.parse(await request.json());const appointment=await prisma.appointment.findUnique({where:{id:input.appointmentId}});if(!appointment||appointment.patientId!==session.userId)return NextResponse.json({error:'You do not have permission to access this information.'},{status:403});const document=await prisma.medicalDocument.create({data:{...input,patientId:session.userId}});return NextResponse.json({document},{status:201})}catch{return NextResponse.json({error:'Invalid document metadata.'},{status:400})}}
