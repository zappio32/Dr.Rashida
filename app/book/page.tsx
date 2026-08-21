import { apiServerFetch } from '@/lib/api/server';
import { BookingForm } from '@/components/booking-form';
export const dynamic = 'force-dynamic';
export default async function BookPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) { const params = await searchParams; const data = await apiServerFetch<{ services: { id: string; name: string; durationMin: number; fee: number; description: string; active: boolean }[] }>('/api/public/services'); const services = data?.services || []; return <main className="auth"><BookingForm services={services} defaultType={params.type} /></main>; }
