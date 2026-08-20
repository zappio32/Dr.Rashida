import { prisma } from '@/lib/prisma';
import { BookingForm } from '@/components/booking-form';
export const dynamic = 'force-dynamic';
export default async function BookPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) { const params = await searchParams; const services = await prisma.service.findMany({ where: { active: true }, orderBy: { createdAt: 'asc' } }); return <main className="auth"><BookingForm services={services} defaultType={params.type} /></main>; }
