import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession, apiServerFetch } from '@/lib/api/server';
import { SignOutButton } from '@/components/sign-out-button';
import { DepartmentManager } from '@/components/admin/department-manager';
import { Department } from '@/lib/api/admin';

export const dynamic = 'force-dynamic';

export default async function AdminDepartmentsPage() {
  const session = await getServerSession();
  if (!session || session.role !== 'ADMIN') redirect('/admin/login');
  const data = await apiServerFetch<{ departments: Department[] }>('/api/admin/departments');
  const departments = data?.departments || [];
  return (
    <div className="dash">
      <div className="dashbar">
        <div className="container nav">
          <Link className="brand" href="/"><span className="mark">R</span>Dr. Rashida Ahmad</Link>
          <div className="actions">
            <Link className="btn quiet" href="/admin/appointment-configuration">Back to configuration</Link>
            <span>{session.name}</span>
            <SignOutButton />
          </div>
        </div>
      </div>
      <main className="container dashmain">
        <DepartmentManager initialDepartments={departments} />
      </main>
    </div>
  );
}
