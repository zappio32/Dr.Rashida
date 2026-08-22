'use client';
import { FormEvent, useMemo, useState } from 'react';
import { Department, createDepartment, deleteDepartment, updateDepartment } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/client';

type FormState = { name: string; description: string; active: boolean };
const emptyForm: FormState = { name: '', description: '', active: true };

export function DepartmentManager({ initialDepartments }: { initialDepartments: Department[] }) {
  const [departments, setDepartments] = useState(initialDepartments);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [listError, setListError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return departments;
    return departments.filter(item => item.name.toLowerCase().includes(term) || item.description?.toLowerCase().includes(term));
  }, [departments, search]);

  function openAdd() { setEditing(null); setForm(emptyForm); setFormError(''); setModalOpen(true); }
  function openEdit(department: Department) { setEditing(department); setForm({ name: department.name, description: department.description || '', active: department.active }); setFormError(''); setModalOpen(true); }
  function closeModal() { if (!saving) setModalOpen(false); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    if (!form.name.trim()) return setFormError('Department name is required.');
    setSaving(true);
    const input = { name: form.name.trim(), description: form.description.trim(), active: form.active };
    try {
      if (editing) {
        const result = await updateDepartment(editing.id, input);
        setDepartments(current => current.map(item => (item.id === editing.id ? result.department : item)));
        setSuccessMessage('Department updated.');
      } else {
        const result = await createDepartment(input);
        setDepartments(current => [...current, result.department]);
        setSuccessMessage('Department added.');
      }
      setModalOpen(false);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Unable to save this department.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(department: Department) {
    setBusyId(department.id);
    setListError('');
    try {
      const result = await updateDepartment(department.id, { active: !department.active });
      setDepartments(current => current.map(item => (item.id === department.id ? result.department : item)));
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
      await deleteDepartment(id);
      setDepartments(current => current.filter(item => item.id !== id));
      setSuccessMessage('Department deleted.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (error) {
      setListError(error instanceof ApiError ? error.message : 'Unable to delete this department. It may already have doctors assigned.');
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
          <h1 style={{ fontSize: 34, marginTop: 8 }}>Departments</h1>
          <p className="muted">Add, edit, and manage clinical departments.</p>
        </div>
        <button type="button" className="btn primary" onClick={openAdd}>+ Add Department</button>
      </div>

      <div className="field" style={{ maxWidth: 320 }}>
        <label>Search departments</label>
        <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by name..." />
      </div>

      {successMessage && <div className="form-success">{successMessage}</div>}
      {listError && <div className="form-error">{listError}</div>}

      {visible.length === 0 ? (
        <p className="muted">No departments found.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Department</th><th>Description</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {visible.map(department => (
                <tr key={department.id}>
                  <td>{department.name}</td>
                  <td>{department.description || '—'}</td>
                  <td><span className={`status-pill ${department.active ? 'active' : 'inactive'}`}>{department.active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="btn quiet" onClick={() => openEdit(department)}>Edit</button>
                      <button type="button" className="btn soft" disabled={busyId === department.id} onClick={() => toggleActive(department)}>
                        {busyId === department.id ? '...' : department.active ? 'Deactivate' : 'Activate'}
                      </button>
                      {confirmDeleteId === department.id ? (
                        <>
                          <button type="button" className="btn danger" disabled={busyId === department.id} onClick={() => confirmDelete(department.id)}>Confirm delete</button>
                          <button type="button" className="btn quiet" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                        </>
                      ) : (
                        <button type="button" className="btn quiet" onClick={() => setConfirmDeleteId(department.id)}>Delete</button>
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
            <h2>{editing ? 'Edit Department' : 'Add Department'}</h2>
            <form onSubmit={submit}>
              <div className="field">
                <label>Department name</label>
                <input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} required placeholder="e.g. General Medicine" />
              </div>
              <div className="field">
                <label>Description</label>
                <textarea rows={3} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} />
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
                <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Saving...' : 'Save Department'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
