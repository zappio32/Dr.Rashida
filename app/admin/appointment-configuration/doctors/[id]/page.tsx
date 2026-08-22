import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getServerSession, apiServerFetch } from '@/lib/api/server';
import { SignOutButton } from '@/components/sign-out-button';
import { DoctorScheduleEditor } from '@/components/admin/doctor-schedule-editor';
import { Department, Doctor, DoctorDaySchedule, DoctorLeave } from '@/lib/api/admin';

export const dynamic = 'force-dynamic';

export default async function AdminDoctorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession();
  if (!session || session.role !== 'ADMIN') redirect('/admin/login');
  const [doctorData, departmentsData, scheduleData, leavesData] = await Promise.all([
    apiServerFetch<{ doctor: Doctor }>(`/api/admin/doctors/${id}`),
    apiServerFetch<{ departments: Department[] }>('/api/admin/departments'),
    apiServerFetch<{ days: DoctorDaySchedule[] }>(`/api/admin/doctors/${id}/schedule`),
    apiServerFetch<{ leaves: DoctorLeave[] }>(`/api/admin/doctors/${id}/leaves`)
  ]);
  const doctor = doctorData?.doctor;
  if (!doctor) notFound();
  const department = departmentsData?.departments.find(item => item.id === doctor.departmentId);
  return (
    <div className="dash">
      <div className="dashbar">
        <div className="container nav">
          <Link className="brand" href="/"><span className="mark">R</span>Dr. Rashida Ahmad</Link>
          <div className="actions">
            <Link className="btn quiet" href="/admin/appointment-configuration/doctors">Back to doctors</Link>
            <span>{session.name}</span>
            <SignOutButton />
          </div>
        </div>
      </div>
      <main className="container dashmain">
        <section className="list-card">
          <div className="eyebrow">Appointment configuration</div>
          <h1 style={{ fontSize: 34, marginTop: 8 }}>{doctor.name}</h1>
          <p className="muted">{doctor.qualification} · {department?.name || 'Unassigned department'} · {doctor.durationMin} min per appointment</p>
          <span className={`status-pill ${doctor.active ? 'active' : 'inactive'}`}>{doctor.active ? 'Active' : 'Inactive'}</span>
        </section>
        <DoctorScheduleEditor doctorId={doctor.id} initialDays={scheduleData?.days || []} initialLeaves={leavesData?.leaves || []} />
      </main>
    </div>
  );
}
