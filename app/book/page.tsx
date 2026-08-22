import { apiServerFetch } from '@/lib/api/server';
import { BookingForm } from '@/components/booking-form';
import { PublicDepartment } from '@/lib/api/appointments';
export const dynamic = 'force-dynamic';
export default async function BookPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) { const params = await searchParams; const [servicesData, departmentsData] = await Promise.all([apiServerFetch<{ services: { id: string; name: string; durationMin: number; fee: number; description: string; active: boolean }[] }>('/api/public/services'), apiServerFetch<{ departments: PublicDepartment[] }>('/api/public/departments')]); const services = (servicesData?.services || []).filter(service => service.active !== false); const departments = departmentsData?.departments || []; return <main className="auth"><BookingForm services={services} departments={departments} defaultType={params.type} /></main>; }
