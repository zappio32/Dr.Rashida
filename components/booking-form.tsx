'use client';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAppointment, getAvailability, listPublicDoctors, AppointmentInput, PublicDepartment, PublicDoctor } from '@/lib/api/appointments';
import { ApiError } from '@/lib/api/client';

type Service = { id: string; name: string; durationMin: number; fee: number; description: string };

export function BookingForm({ services, departments, defaultType }: { services: Service[]; departments: PublicDepartment[]; defaultType?: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [type, setType] = useState(defaultType === 'CLINIC' ? 'CLINIC' : 'ONLINE');
  const [serviceId, setServiceId] = useState(services[0]?.id || '');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || '');
  const [doctors, setDoctors] = useState<PublicDoctor[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!departmentId) { setDoctors([]); setDoctorId(''); return; }
    let active = true;
    setDoctorsLoading(true);
    listPublicDoctors(departmentId).then(data => {
      if (!active) return;
      const nextDoctors = data?.doctors || [];
      setDoctors(nextDoctors);
      setDoctorId(current => (current && nextDoctors.some(item => item.id === current) ? current : nextDoctors[0]?.id || ''));
    }).catch(() => {
      if (!active) return;
      setDoctors([]); setDoctorId('');
    }).finally(() => { if (active) setDoctorsLoading(false); });
    return () => { active = false; };
  }, [departmentId]);

  useEffect(() => {
    if (step !== 2 || !date || !doctorId) return;
    let active = true;
    setSlotsLoading(true); setSlotsError('');
    getAvailability(date, { doctorId, serviceId, consultationType: type }).then(data => {
      if (!active) return;
      const nextSlots = Array.isArray(data) ? data : (data?.slots || []);
      setSlots(nextSlots);
      setTime(current => (current && nextSlots.includes(current) ? current : ''));
    }).catch(error => {
      if (!active) return;
      setSlots([]);
      setSlotsError(error instanceof ApiError ? error.message : 'Unable to load available times.');
    }).finally(() => { if (active) setSlotsLoading(false); });
    return () => { active = false; };
  }, [step, date, doctorId, serviceId, type]);

  const service = services.find(item => item.id === serviceId);
  const doctor = doctors.find(item => item.id === doctorId);

  function next(event?: FormEvent) {
    event?.preventDefault();
    setError('');
    if (step === 1 && (!type || !serviceId || !departmentId || !doctorId)) return setError('Choose a consultation type, department, doctor, and service.');
    if (step === 2 && (!date || !time)) return setError('Choose an available date and time.');
    setStep(step + 1);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError('');
    const form = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const result = await createAppointment({ ...form, serviceId, doctorId, consultationType: type, localDate: date, localTime: time } as unknown as AppointmentInput);
      router.push(`/appointment/confirmation?id=${result.bookingId}`);
    } catch (error) {
      setSaving(false);
      if (error instanceof ApiError) {
        setError(error.message);
        if (error.status === 409) { setTime(''); setStep(2); }
      } else {
        setError('Unable to book this appointment.');
      }
    }
  }

  const dates = Array.from({ length: 21 }, (_, index) => { const value = new Date(); value.setDate(value.getDate() + index + 1); return value.toISOString().slice(0, 10); });

  return <div className="auth-card" style={{ width: 'min(760px,100%)' }}>
    <div className="eyebrow">Appointment booking · Step {step} of 4</div>
    <h1 style={{ fontSize: 42, margin: '12px 0 25px' }}>{['Choose a consultation', 'Find your time', 'Your details', 'Review & confirm'][step - 1]}</h1>
    <div style={{ display: 'flex', gap: 6, marginBottom: 26 }}>{[1, 2, 3, 4].map(item =>
      <span key={item} style={{ height: 5, flex: 1, background: item <= step ? 'var(--deep)' : 'var(--line)', borderRadius: 4 }} />)}</div>
    {step === 1 && <>
      <div className="cards" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>{[['ONLINE', 'Online consultation', 'Meet securely from home.'], ['CLINIC', 'Clinic consultation', 'Visit the clinic in person.']].map(item =>
        <button type="button" key={item[0]} className="card" onClick={() => setType(item[0])} style={{ textAlign: 'left', border: `2px solid ${type === item[0] ? 'var(--deep)' : 'var(--line)'}` }}>
          <span className="badge">{item[0]}</span>
          <h3 style={{ margin: '18px 0 8px' }}>{item[1]}</h3>
          <p>{item[2]}</p>
        </button>)}</div>
      <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <div className="field">
          <label>Department</label>
          <select value={departmentId} onChange={event => setDepartmentId(event.target.value)}>
            <option value="">Select department</option>{departments.map(item =>
              <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        </div>
        <div className="field">
          <label>Doctor</label>
          <select value={doctorId} onChange={event => setDoctorId(event.target.value)} disabled={!departmentId || doctorsLoading}>
            <option value="">{doctorsLoading ? 'Loading doctors...' : doctors.length === 0 ? 'No doctors available' : 'Select doctor'}</option>{doctors.map(item =>
              <option key={item.id} value={item.id}>{item.name} · {item.qualification}</option>)}</select>
        </div>
      </div>
      <div className="field">
        <label>Service</label>
        <select value={serviceId} onChange={event => setServiceId(event.target.value)}>{services.map(item =>
          <option key={item.id} value={item.id}>{item.name} · ₹{item.fee.toLocaleString('en-IN')}</option>)}</select>
      </div>
      <div className="actions" style={{ justifyContent: 'flex-end', marginTop: 22 }}>
        <button className="btn primary" onClick={() => next()}>Continue →</button>
      </div>
    </>}{step === 2 && <>
      <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="field">
          <label>Date</label>
          <select value={date} onChange={event => { setDate(event.target.value); setTime(''); setSlots([]); setSlotsError(''); }}>
            <option value="">Select date</option>{dates.map(item =>
              <option key={item} value={item}>{new Date(`${item}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</option>)}</select>
        </div>
        <div className="field">
          <label>Available time</label>
          <select value={time} onChange={event => setTime(event.target.value)} disabled={!date || slotsLoading}>
            <option value="">{!date ? 'Select date first' : slotsLoading ? 'Loading available times...' : slots.length === 0 ? 'No available times' : 'Select time'}</option>{slots.map(item =>
              <option key={item} value={item}>{item}</option>)}</select>{slotsError && <div className="form-error">{slotsError}</div>}</div>
      </div>
      <p className="muted" style={{ fontSize: 13 }}>Availability is calculated on the server using the doctor's schedule, holidays, blocked slots, and existing appointments.</p>
      <div className="actions" style={{ justifyContent: 'space-between', marginTop: 22 }}>
        <button className="btn quiet" onClick={() => setStep(1)}>← Back</button>
        <button className="btn primary" onClick={() => next()}>Continue →</button>
      </div>
    </>}{step === 3 && <form onSubmit={next}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="field">
          <label>Full name</label>
          <input name="name" required />
        </div>
        <div className="field">
          <label>Mobile number</label>
          <input name="phone" required />
        </div>
        <div className="field">
          <label>Age</label>
          <input name="age" type="number" min="1" max="120" />
        </div>
        <div className="field">
          <label>City</label>
          <input name="city" />
        </div>
        <div className="field" style={{ gridColumn: '1/-1' }}>
          <label>Main health concern</label>
          <textarea name="concern" rows={4} maxLength={3000} />
        </div>
        <div className="field" style={{ gridColumn: '1/-1' }}>
          <label>
            <input name="consent" type="checkbox" required /> I consent to secure processing of these details for this appointment.</label>
        </div>
      </div>
      <div className="actions" style={{ justifyContent: 'space-between', marginTop: 22 }}>
        <button type="button" className="btn quiet" onClick={() => setStep(2)}>← Back</button>
        <button className="btn primary">Review appointment →</button>
      </div>
    </form>}{step === 4 && <form onSubmit={submit}>
      <div className="list-card">
        <div className="appointment">
          <span>Doctor</span>
          <b>{doctor?.name || 'Dr. Rashida Ahmad'}</b>
        </div>
        <div className="appointment">
          <span>Service</span>
          <b>{service?.name}</b>
        </div>
        <div className="appointment">
          <span>Type</span>
          <b>{type === 'ONLINE' ? 'Online' : 'Clinic'}</b>
        </div>
        <div className="appointment">
          <span>Date & time</span>
          <b>{date} · {time} IST</b>
        </div>
        <div className="appointment">
          <span>Duration / fee</span>
          <b>{service?.durationMin} min · ₹{service?.fee.toLocaleString('en-IN')}</b>
        </div>
      </div>{error && <div className="form-error">{error}</div>}<div className="actions" style={{ justifyContent: 'space-between', marginTop: 22 }}>
        <button type="button" className="btn quiet" onClick={() => setStep(3)}>← Back</button>
        <button className="btn primary" disabled={saving}>{saving ? 'Booking...' : 'Confirm & book appointment'}</button>
      </div>
    </form>}{error && step !== 4 && <div className="form-error">{error}</div>}</div>;
}