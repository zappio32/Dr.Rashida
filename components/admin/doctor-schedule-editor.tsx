'use client';
import { FormEvent, useState } from 'react';
import { DoctorBreak, DoctorDaySchedule, DoctorLeave, WEEK_DAYS, addDoctorLeave, removeDoctorLeave, updateDoctorSchedule } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/client';

const DAY_LABELS: Record<string, string> = { MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday', SUN: 'Sunday' };

function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function defaultDays(existing: DoctorDaySchedule[]): DoctorDaySchedule[] {
  return WEEK_DAYS.map(day => existing.find(item => item.day === day) || { day, off: true, startTime: '09:00', endTime: '13:00', slotDurationMin: 30, breaks: [] });
}

export function DoctorScheduleEditor({ doctorId, initialDays, initialLeaves }: { doctorId: string; initialDays: DoctorDaySchedule[]; initialLeaves: DoctorLeave[] }) {
  const [days, setDays] = useState<DoctorDaySchedule[]>(defaultDays(initialDays));
  const [saving, setSaving] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleSuccess, setScheduleSuccess] = useState('');

  const [leaves, setLeaves] = useState(initialLeaves);
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveSaving, setLeaveSaving] = useState(false);
  const [leaveError, setLeaveError] = useState('');
  const [busyLeaveId, setBusyLeaveId] = useState<string | null>(null);

  function updateDay(day: string, patch: Partial<DoctorDaySchedule>) {
    setDays(current => current.map(item => (item.day === day ? { ...item, ...patch } : item)));
  }

  function addBreak(day: string) {
    setDays(current => current.map(item => (item.day === day ? { ...item, breaks: [...item.breaks, { startTime: '11:00', endTime: '11:30' }] } : item)));
  }

  function updateBreak(day: string, index: number, patch: Partial<DoctorBreak>) {
    setDays(current => current.map(item => {
      if (item.day !== day) return item;
      const breaks = item.breaks.map((item2, index2) => (index2 === index ? { ...item2, ...patch } : item2));
      return { ...item, breaks };
    }));
  }

  function removeBreak(day: string, index: number) {
    setDays(current => current.map(item => (item.day === day ? { ...item, breaks: item.breaks.filter((_, index2) => index2 !== index) } : item)));
  }

  function validateDays(): string {
    for (const day of days) {
      if (day.off) continue;
      const start = toMinutes(day.startTime);
      const end = toMinutes(day.endTime);
      if (Number.isNaN(start) || Number.isNaN(end)) return `${DAY_LABELS[day.day]}: enter valid start and end times.`;
      if (end <= start) return `${DAY_LABELS[day.day]}: end time must be after start time.`;
      if (!day.slotDurationMin || day.slotDurationMin <= 0) return `${DAY_LABELS[day.day]}: slot duration must be greater than 0.`;
      const sortedBreaks = [...day.breaks].map(item => ({ start: toMinutes(item.startTime), end: toMinutes(item.endTime) })).sort((a, b) => a.start - b.start);
      for (const item of sortedBreaks) {
        if (Number.isNaN(item.start) || Number.isNaN(item.end) || item.end <= item.start) return `${DAY_LABELS[day.day]}: each break needs a valid start/end time.`;
        if (item.start < start || item.end > end) return `${DAY_LABELS[day.day]}: breaks must fall within the working hours.`;
      }
      for (let index = 1; index < sortedBreaks.length; index += 1) {
        if (sortedBreaks[index].start < sortedBreaks[index - 1].end) return `${DAY_LABELS[day.day]}: breaks cannot overlap.`;
      }
    }
    return '';
  }

  async function saveSchedule() {
    setScheduleError(''); setScheduleSuccess('');
    const validationError = validateDays();
    if (validationError) return setScheduleError(validationError);
    setSaving(true);
    try {
      const result = await updateDoctorSchedule(doctorId, days);
      setDays(defaultDays(result.days || days));
      setScheduleSuccess('Schedule saved.');
      setTimeout(() => setScheduleSuccess(''), 4000);
    } catch (error) {
      setScheduleError(error instanceof ApiError ? error.message : 'Unable to save this schedule.');
    } finally {
      setSaving(false);
    }
  }

  async function submitLeave(event: FormEvent) {
    event.preventDefault();
    setLeaveError('');
    if (!leaveDate) return setLeaveError('Choose a date to block.');
    setLeaveSaving(true);
    try {
      const result = await addDoctorLeave(doctorId, leaveDate, leaveReason.trim() || undefined);
      setLeaves(current => [...current, result.leave].sort((a, b) => a.date.localeCompare(b.date)));
      setLeaveDate(''); setLeaveReason('');
    } catch (error) {
      setLeaveError(error instanceof ApiError ? error.message : 'Unable to add this leave date.');
    } finally {
      setLeaveSaving(false);
    }
  }

  async function removeLeave(leave: DoctorLeave) {
    setBusyLeaveId(leave.id);
    setLeaveError('');
    try {
      await removeDoctorLeave(doctorId, leave.id);
      setLeaves(current => current.filter(item => item.id !== leave.id));
    } catch (error) {
      setLeaveError(error instanceof ApiError ? error.message : 'Unable to remove this leave date.');
    } finally {
      setBusyLeaveId(null);
    }
  }

  return (
    <>
      <section className="list-card" style={{ marginTop: 18 }}>
        <div className="eyebrow">Weekly schedule</div>
        <h2 style={{ fontSize: 26, marginTop: 8 }}>Working hours & breaks</h2>
        <p className="muted">This schedule applies only to this doctor and never affects any other doctor&apos;s availability.</p>
        {scheduleSuccess && <div className="form-success">{scheduleSuccess}</div>}
        {scheduleError && <div className="form-error">{scheduleError}</div>}
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Day</th><th>Off</th><th>Start</th><th>End</th><th>Slot (min)</th><th>Breaks</th></tr>
            </thead>
            <tbody>
              {days.map(day => (
                <tr key={day.day}>
                  <td>{DAY_LABELS[day.day]}</td>
                  <td><input type="checkbox" checked={day.off} onChange={event => updateDay(day.day, { off: event.target.checked })} /></td>
                  <td><input type="time" value={day.startTime} disabled={day.off} onChange={event => updateDay(day.day, { startTime: event.target.value })} /></td>
                  <td><input type="time" value={day.endTime} disabled={day.off} onChange={event => updateDay(day.day, { endTime: event.target.value })} /></td>
                  <td><input type="number" min={5} step="5" style={{ width: 80 }} value={day.slotDurationMin} disabled={day.off} onChange={event => updateDay(day.day, { slotDurationMin: Number(event.target.value) })} /></td>
                  <td>
                    {day.breaks.map((item, index) => (
                      <div key={index} className="row-actions" style={{ marginBottom: 6 }}>
                        <input type="time" value={item.startTime} disabled={day.off} onChange={event => updateBreak(day.day, index, { startTime: event.target.value })} />
                        <input type="time" value={item.endTime} disabled={day.off} onChange={event => updateBreak(day.day, index, { endTime: event.target.value })} />
                        <button type="button" className="btn quiet" disabled={day.off} onClick={() => removeBreak(day.day, index)}>Remove</button>
                      </div>
                    ))}
                    <button type="button" className="btn quiet" disabled={day.off} onClick={() => addBreak(day.day)}>+ Add break</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="actions" style={{ justifyContent: 'flex-end', marginTop: 18 }}>
          <button type="button" className="btn primary" disabled={saving} onClick={saveSchedule}>{saving ? 'Saving...' : 'Save Schedule'}</button>
        </div>
      </section>

      <section className="list-card" style={{ marginTop: 18 }}>
        <div className="eyebrow">Availability</div>
        <h2 style={{ fontSize: 26, marginTop: 8 }}>Leave / blocked dates</h2>
        <p className="muted">Dates blocked here only affect this doctor. Other doctors remain available.</p>
        {leaveError && <div className="form-error">{leaveError}</div>}
        <form onSubmit={submitLeave} className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16, alignItems: 'end', maxWidth: 640 }}>
          <div className="field">
            <label>Date</label>
            <input type="date" value={leaveDate} onChange={event => setLeaveDate(event.target.value)} required />
          </div>
          <div className="field">
            <label>Reason (optional)</label>
            <input value={leaveReason} onChange={event => setLeaveReason(event.target.value)} placeholder="e.g. Personal leave" />
          </div>
          <button type="submit" className="btn primary" disabled={leaveSaving}>{leaveSaving ? 'Adding...' : 'Add leave'}</button>
        </form>

        {leaves.length === 0 ? (
          <p className="muted" style={{ marginTop: 16 }}>No leave dates configured.</p>
        ) : (
          <div className="table-wrap" style={{ marginTop: 16 }}>
            <table className="table">
              <thead><tr><th>Date</th><th>Reason</th><th>Actions</th></tr></thead>
              <tbody>
                {leaves.map(leave => (
                  <tr key={leave.id}>
                    <td>{leave.date}</td>
                    <td>{leave.reason || '—'}</td>
                    <td><button type="button" className="btn quiet" disabled={busyLeaveId === leave.id} onClick={() => removeLeave(leave)}>{busyLeaveId === leave.id ? '...' : 'Remove'}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
