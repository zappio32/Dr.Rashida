'use client';
import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { Department, Doctor, createDoctor, deleteDoctor, updateDoctor } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/client';

type FormState = { name: string; qualification: string; departmentId: string; durationMin: string; active: boolean };
function emptyForm(defaultDepartmentId: string): FormState {
  return { name: '', qualification: '', departmentId: defaultDepartmentId, durationMin: '', active: true };
}

export function DoctorManager({ initialDoctors, departments }: { initialDoctors: Doctor[]; departments: Department[] }) {
  const activeDepartments = useMemo(() => departments.filter(item => item.active), [departments]);
  const [doctors, setDoctors] = useState(initialDoctors);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm(activeDepartments[0]?.id || ''));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [listError, setListError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function departmentName(id: string) { return departments.find(item => item.id === id)?.name || 'Unassigned'; }

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return doctors.filter(item => {
      if (departmentFilter && item.departmentId !== departmentFilter) return false;
      if (!term) return true;
      return item.name.toLowerCase().includes(term) || item.qualification.toLowerCase().includes(term) || departmentName(item.departmentId).toLowerCase().includes(term);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctors, search, departmentFilter, departments]);

  function openAdd() { setEditing(null); setForm(emptyForm(activeDepartments[0]?.id || '')); setFormError(''); setModalOpen(true); }
  function openEdit(doctor: Doctor) { setEditing(doctor); setForm({ name: doctor.name, qualification: doctor.qualification, departmentId: doctor.departmentId, durationMin: String(doctor.durationMin), active: doctor.active }); setFormError(''); setModalOpen(true); }
  function closeModal() { if (!saving) setModalOpen(false); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    const durationMin = Number(form.durationMin);
    if (!form.name.trim()) return setFormError('Doctor name is required.');
    if (!form.qualification.trim()) return setFormError('Qualification is required.');
    if (!form.departmentId) return setFormError('Assign this doctor to a department.');
    const department = departments.find(item => item.id === form.departmentId);
    if (!department?.active) return setFormError('Cannot assign an inactive department to a doctor.');
    if (!form.durationMin.trim() || Number.isNaN(durationMin) || durationMin <= 0) return setFormError('Appointment duration must be a valid number of minutes.');
    setSaving(true);
    const input = { name: form.name.trim(), qualification: form.qualification.trim(), departmentId: form.departmentId, durationMin, active: form.active };
    try {
      if (editing) {
        const result = await updateDoctor(editing.id, input);
        setDoctors(current => current.map(item => (item.id === editing.id ? result.doctor : item)));
        setSuccessMessage('Doctor updated.');
      } else {
        const result = await createDoctor(input);
        setDoctors(current => [...current, result.doctor]);
        setSuccessMessage('Doctor added.');
      }
      setModalOpen(false);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Unable to save this doctor.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(doctor: Doctor) {
    setBusyId(doctor.id);
    setListError('');
    try {
      const result = await updateDoctor(doctor.id, { active: !doctor.active });
      setDoctors(current => current.map(item => (item.id === doctor.id ? result.doctor : item)));
    } catch (error) {
      setListError(error instanceof ApiError ? error.message : 'Unable to update status.');
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete(id: string) {
    setBusyId(id);
    setListError('');
    try {
      await deleteDoctor(id);
      setDoctors(current => current.filter(item => item.id !== id));
      setSuccessMessage('Doctor deleted.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (error) {
      setListError(error instanceof ApiError ? error.message : 'Unable to delete this doctor. They may already have appointments.');
    } finally {
      setBusyId(null);
      setConfirmDeleteId(null);
    }
  }

  return (
    <section className="list-card">
      <div className="section-toolbar">
        <div>
          <div className="eyebrow">Appointment configuration</div>
          <h1 style={{ fontSize: 34, marginTop: 8 }}>Doctors</h1>
          <p className="muted">Add doctors, assign departments, and configure appointment settings.</p>
        </div>
        <button type="button" className="btn primary" onClick={openAdd} disabled={activeDepartments.length === 0}>+ Add Doctor</button>
      </div>

      {activeDepartments.length === 0 && <p className="muted">Add at least one active department before creating doctors.</p>}

      <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 640 }}>
        <div className="field">
          <label>Search doctors</label>
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by name or qualification..." />
        </div>
        <div className="field">
          <label>Filter by department</label>
          <select value={departmentFilter} onChange={event => setDepartmentFilter(event.target.value)}>
            <option value="">All departments</option>
            {departments.map(department => <option key={department.id} value={department.id}>{department.name}</option>)}
          </select>
        </div>
      </div>

      {successMessage && <div className="form-success">{successMessage}</div>}
      {listError && <div className="form-error">{listError}</div>}

      {visible.length === 0 ? (
        <p className="muted">No doctors found.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Doctor</th><th>Qualification</th><th>Department</th><th>Duration</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {visible.map(doctor => (
                <tr key={doctor.id}>
                  <td>{doctor.name}</td>
                  <td>{doctor.qualification}</td>
                  <td>{departmentName(doctor.departmentId)}</td>
                  <td>{doctor.durationMin} min</td>
                  <td><span className={`status-pill ${doctor.active ? 'active' : 'inactive'}`}>{doctor.active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div className="row-actions">
                      <Link className="btn quiet" href={`/admin/appointment-configuration/doctors/${doctor.id}`}>Schedule</Link>
                      <button type="button" className="btn quiet" onClick={() => openEdit(doctor)}>Edit</button>
                      <button type="button" className="btn soft" disabled={busyId === doctor.id} onClick={() => toggleActive(doctor)}>
                        {busyId === doctor.id ? '...' : doctor.active ? 'Deactivate' : 'Activate'}
                      </button>
                      {confirmDeleteId === doctor.id ? (
                        <>
                          <button type="button" className="btn danger" disabled={busyId === doctor.id} onClick={() => confirmDelete(doctor.id)}>Confirm delete</button>
                          <button type="button" className="btn quiet" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                        </>
                      ) : (
                        <button type="button" className="btn quiet" onClick={() => setConfirmDeleteId(doctor.id)}>Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={event => event.stopPropagation()}>
            <h2>{editing ? 'Edit Doctor' : 'Add Doctor'}</h2>
            <form onSubmit={submit}>
              <div className="field">
                <label>Doctor name</label>
                <input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} required placeholder="e.g. Dr. Ahmed Khan" />
              </div>
              <div className="field">
                <label>Qualification</label>
                <input value={form.qualification} onChange={event => setForm({ ...form, qualification: event.target.value })} required placeholder="e.g. MBBS, MD Gynaecology" />
              </div>
              <div className="field">
                <label>Department / specialization</label>
                <select value={form.departmentId} onChange={event => setForm({ ...form, departmentId: event.target.value })} required>
                  <option value="">Select department</option>
                  {departments.map(department => (
                    <option key={department.id} value={department.id} disabled={!department.active}>
                      {department.name}{!department.active ? ' (inactive)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Appointment duration (minutes)</label>
                <input type="number" min={1} step="1" value={form.durationMin} onChange={event => setForm({ ...form, durationMin: event.target.value })} required />
              </div>
              <div className="field">
                <label>Status</label>
                <select value={form.active ? 'ACTIVE' : 'INACTIVE'} onChange={event => setForm({ ...form, active: event.target.value === 'ACTIVE' })}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              {formError && <div className="form-error">{formError}</div>}
              <div className="actions" style={{ justifyContent: 'flex-end', marginTop: 22, gap: 10 }}>
                <button type="button" className="btn quiet" onClick={closeModal} disabled={saving}>Cancel</button>
                <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Saving...' : 'Save Doctor'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
