import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession, apiServerFetch } from '@/lib/api/server';
import { SignOutButton } from '@/components/sign-out-button';
import { ConsultationServicesManager } from '@/components/admin/consultation-services-manager';
import { AdminService } from '@/lib/api/admin';

export const dynamic = 'force-dynamic';

export default async function AdminServicesPage() {
  const session = await getServerSession();
  if (!session || session.role !== 'ADMIN') redirect('/admin/login');
  const data = await apiServerFetch<{ services: AdminService[] }>('/api/admin/services');
  const services = data?.services || [];
  return (
    <div className="dash">
      <div className="dashbar">
        <div className="container nav">
          <Link className="brand" href="/"><span className="mark">R</span>Dr. Rashida Ahmad</Link>
          <div className="actions">
            <Link className="btn quiet" href="/admin/dashboard">Back to dashboard</Link>
            <span>{session.name}</span>
            <SignOutButton />
          </div>
        </div>
      </div>
      <main className="container dashmain">
        <ConsultationServicesManager initialServices={services} />
      </main>
    </div>
  );
}
