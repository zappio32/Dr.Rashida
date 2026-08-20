import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';
import { z } from 'zod';
const schema=z.object({name:z.string().min(2).max(120),email:z.string().email(),password:z.string().min(10)});
export async function POST(request:Request){try{const input=schema.parse(await request.json());const passwordHash=await bcrypt.hash(input.password,12);const user=await prisma.user.create({data:{name:input.name,email:input.email.toLowerCase(),passwordHash,role:'PATIENT',patientProfile:{create:{}}}});await createSession({userId:user.id,role:user.role,name:user.name,email:user.email});return NextResponse.json({ok:true})}catch(error){if(error instanceof Error&&error.message.includes('Unique constraint'))return NextResponse.json({error:'An account with that email already exists.'},{status:409});return NextResponse.json({error:'Unable to create account.'},{status:400})}}
