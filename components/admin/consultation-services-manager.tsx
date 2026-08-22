'use client';
import { FormEvent, useState } from 'react';
import { AdminService, createService, deleteService, updateService } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/client';

type FormState = { name: string; description: string; fee: string; durationMin: string; active: boolean };
const emptyForm: FormState = { name: '', description: '', fee: '', durationMin: '', active: true };

export function ConsultationServicesManager({ initialServices }: { initialServices: AdminService[] }) {
  const [services, setServices] = useState(initialServices);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminService | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [listError, setListError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(service: AdminService) {
    setEditing(service);
    setForm({
      name: service.name,
      description: service.description || '',
      fee: String(service.fee),
      durationMin: String(service.durationMin),
      active: service.active
    });
    setFormError('');
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    const fee = Number(form.fee);
    const durationMin = Number(form.durationMin);
    if (!form.name.trim()) return setFormError('Consultation name is required.');
    if (!form.fee.trim() || Number.isNaN(fee) || fee < 0) return setFormError('Consultation fee must be a valid amount and cannot be negative.');
    if (!form.durationMin.trim() || Number.isNaN(durationMin) || durationMin <= 0) return setFormError('Duration is required.');
    setSaving(true);
    const input = { name: form.name.trim(), description: form.description.trim(), fee, durationMin, active: form.active };
    try {
      if (editing) {
        const result = await updateService(editing.id, input);
        setServices(current => current.map(item => (item.id === editing.id ? result.service : item)));
        setSuccessMessage('Consultation type updated.');
      } else {
        const result = await createService(input);
        setServices(current => [...current, result.service]);
        setSuccessMessage('Consultation type added.');
      }
      setModalOpen(false);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Unable to save this consultation type.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(service: AdminService) {
    setBusyId(service.id);
    setListError('');
    try {
      const result = await updateService(service.id, { active: !service.active });
      setServices(current => current.map(item => (item.id === service.id ? result.service : item)));
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
      await deleteService(id);
      setServices(current => current.filter(item => item.id !== id));
      setSuccessMessage('Consultation type deleted.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (error) {
      setListError(error instanceof ApiError ? error.message : 'Unable to delete this consultation type. It may already be used by appointments.');
    } finally {
      setBusyId(null);
      setConfirmDeleteId(null);
    }
  }

  return (
    <section className="list-card">
      <div className="section-toolbar">
        <div>
          <div className="eyebrow">Configuration</div>
          <h1 style={{ fontSize: 34, marginTop: 8 }}>Consultation Services</h1>
          <p className="muted">Manage consultation types, fees, duration and availability.</p>
        </div>
        <button type="button" className="btn primary" onClick={openAdd}>+ Add Consultation Type</button>
      </div>

      {successMessage && <div className="form-success">{successMessage}</div>}
      {listError && <div className="form-error">{listError}</div>}

      {services.length === 0 ? (
        <p className="muted">No consultation types yet. Add one to get started.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Consultation Type</th>
                <th>Description</th>
                <th>Fee</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map(service => (
                <tr key={service.id}>
                  <td>{service.name}</td>
                  <td>{service.description || '—'}</td>
                  <td>₹{service.fee.toLocaleString('en-IN')}</td>
                  <td>{service.durationMin} min</td>
                  <td><span className={`status-pill ${service.active ? 'active' : 'inactive'}`}>{service.active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="btn quiet" onClick={() => openEdit(service)}>Edit</button>
                      <button type="button" className="btn soft" disabled={busyId === service.id} onClick={() => toggleActive(service)}>
                        {busyId === service.id ? '...' : service.active ? 'Deactivate' : 'Activate'}
                      </button>
                      {confirmDeleteId === service.id ? (
                        <>
                          <button type="button" className="btn danger" disabled={busyId === service.id} onClick={() => confirmDelete(service.id)}>Confirm delete</button>
                          <button type="button" className="btn quiet" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                        </>
                      ) : (
                        <button type="button" className="btn quiet" onClick={() => setConfirmDeleteId(service.id)}>Delete</button>
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
            <h2>{editing ? 'Edit Consultation Type' : 'Add Consultation Type'}</h2>
            <form onSubmit={submit}>
              <div className="field">
                <label>Consultation Name</label>
                <input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} required />
              </div>
              <div className="field">
                <label>Description</label>
                <textarea rows={3} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} />
              </div>
              <div className="field">
                <label>Consultation Fee (₹)</label>
                <input type="number" min={0} step="1" value={form.fee} onChange={event => setForm({ ...form, fee: event.target.value })} required />
              </div>
              <div className="field">
                <label>Duration (minutes)</label>
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
                <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Saving...' : 'Save Consultation Type'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
