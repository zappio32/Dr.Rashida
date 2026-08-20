import { NextResponse } from 'next/server';
import { getAvailableSlots } from '@/lib/availability';
export async function GET(request: Request) { const url = new URL(request.url); const date = url.searchParams.get('date'); const serviceId = url.searchParams.get('serviceId'); if (!date || !serviceId) return NextResponse.json({ error: 'date and serviceId are required' }, { status: 400 }); return NextResponse.json({ slots: await getAvailableSlots(date, serviceId), timezone: process.env.CLINIC_TIMEZONE || 'Asia/Kolkata' }); }
