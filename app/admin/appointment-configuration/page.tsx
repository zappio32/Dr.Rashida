import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/api/server';
import { SignOutButton } from '@/components/sign-out-button';

export const dynamic = 'force-dynamic';

const sections = [
  { href: '/admin/appointment-configuration/departments', title: 'Departments', description: 'Add and manage clinical departments (unlimited, fully custom).' },
  { href: '/admin/appointment-configuration/doctors', title: 'Doctors', description: 'Add doctors, assign departments, and configure appointment duration.' },
  { href: '/admin/appointment-configuration/doctors', title: 'Doctor Schedules', description: 'Open a doctor and set weekly working hours and breaks.' },
  { href: '/admin/appointment-configuration/doctors', title: 'Doctor Leaves / Blocked Dates', description: 'Open a doctor to block specific dates without affecting other doctors.' },
  { href: '/admin/services', title: 'Consultation Services', description: 'Manage consultation types, fees, duration and availability.' }
];

export default async function AdminAppointmentConfigurationPage() {
  const session = await getServerSession();
  if (!session || session.role !== 'ADMIN') redirect('/admin/login');
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
        <div className="eyebrow">Admin portal</div>
        <h1 style={{ fontSize: 40, marginTop: 12 }}>Appointment Configuration</h1>
        <p className="muted">Manage departments, doctors, schedules, and blocked dates.</p>
        <div className="cards" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginTop: 26 }}>
          {sections.map(section => (
            <Link key={section.title} href={section.href} className="card">
              <h3 style={{ margin: '0 0 8px' }}>{section.title}</h3>
              <p>{section.description}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
