import { FormEvent, useEffect, useState } from 'react';
import {
  CompanySettings,
  ContractType,
  createUser,
  CreateUserInput,
  fetchCompanySettings,
  fetchUsers,
  updateCompanySettings,
  updateUser,
  UpdateUserInput,
  User,
  UserRole,
} from '../api/client';
import { MoonIcon, SunIcon } from '../components/icons';

const dateFormatter = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' });

const emptyForm: CreateUserInput = { username: '', name: '', password: '', role: 'employee' };
const emptyCompany: CompanySettings = { legalName: '', cif: '', ccc: '' };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<CreateUserInput>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const [company, setCompany] = useState<CompanySettings>(emptyCompany);
  const [savingCompany, setSavingCompany] = useState(false);
  const [companyFeedback, setCompanyFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadUsers = () => fetchUsers().then((data) => setUsers(data));

  useEffect(() => {
    Promise.all([
      loadUsers(),
      fetchCompanySettings().then((data) =>
        setCompany({ legalName: data.legalName ?? '', cif: data.cif ?? '', ccc: data.ccc ?? '' }),
      ),
    ]).finally(() => setLoading(false));
  }, []);

  const saveField = async (user: User, input: UpdateUserInput) => {
    setPendingId(user.id);
    try {
      await updateUser(user.id, input);
      await loadUsers();
    } finally {
      setPendingId(null);
    }
  };

  // NIF/NAF inputs save on blur, only when the value actually changed.
  const changeIdField = (user: User, field: 'nif' | 'naf', value: string) => {
    const next = value.trim().toUpperCase() || null;
    if (next === (user[field] ?? null)) return;
    saveField(user, { [field]: next });
  };

  const saveCompany = async (event: FormEvent) => {
    event.preventDefault();
    setSavingCompany(true);
    setCompanyFeedback(null);
    try {
      const saved = await updateCompanySettings(company);
      setCompany({ legalName: saved.legalName ?? '', cif: saved.cif ?? '', ccc: saved.ccc ?? '' });
      setCompanyFeedback({ type: 'success', text: 'Datos de empresa guardados.' });
    } catch {
      setCompanyFeedback({ type: 'error', text: 'No se pudieron guardar los datos de empresa.' });
    } finally {
      setSavingCompany(false);
    }
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createUser(form);
      setForm(emptyForm);
      await loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'No se ha podido crear el usuario.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (user: User) => {
    setPendingId(user.id);
    try {
      await updateUser(user.id, { active: !user.active });
      await loadUsers();
    } finally {
      setPendingId(null);
    }
  };

  const changeRole = async (user: User, role: UserRole) => {
    setPendingId(user.id);
    try {
      await updateUser(user.id, { role });
      await loadUsers();
    } finally {
      setPendingId(null);
    }
  };

  const changeWeeklyHours = async (user: User, value: string) => {
    if (value === '') return;
    const weeklyHours = Number(value);
    if (Number.isNaN(weeklyHours)) return;
    setPendingId(user.id);
    try {
      await updateUser(user.id, { weeklyHours });
      await loadUsers();
    } finally {
      setPendingId(null);
    }
  };

  const resetPassword = async (user: User) => {
    const newPassword = window.prompt(`Nueva contraseña para "${user.username}" (mínimo 6 caracteres):`);
    if (!newPassword) return;
    if (newPassword.length < 6) {
      window.alert('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setPendingId(user.id);
    try {
      await updateUser(user.id, { password: newPassword });
    } finally {
      setPendingId(null);
    }
  };

  if (loading) {
    return <p>Cargando...</p>;
  }

  return (
    <div className="users-page">
      <h2>Usuarios</h2>
      <p className="hint">Crea una cuenta por cada empleado. Solo los administradores ven esta página.</p>

      <form className="user-form" onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="Usuario"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Nombre"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          minLength={6}
          required
        />
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
        >
          <option value="employee">Empleado</option>
          <option value="admin">Administrador</option>
          <option value="kiosk">Kiosk</option>
        </select>
        <input
          type="number"
          placeholder="Horas semanales (opcional)"
          min={0}
          max={168}
          value={form.weeklyHours ?? ''}
          onChange={(e) => setForm({ ...form, weeklyHours: e.target.value ? Number(e.target.value) : undefined })}
        />
        <select
          value={form.contractType ?? ''}
          onChange={(e) => setForm({ ...form, contractType: (e.target.value || null) as ContractType | null })}
        >
          <option value="">Tipo de contrato</option>
          <option value="full_time">Jornada completa</option>
          <option value="part_time">Tiempo parcial</option>
        </select>
        <input
          type="text"
          placeholder="NIF (opcional)"
          maxLength={20}
          value={form.nif ?? ''}
          onChange={(e) => setForm({ ...form, nif: e.target.value })}
        />
        <input
          type="text"
          placeholder="NAF (opcional)"
          maxLength={20}
          value={form.naf ?? ''}
          onChange={(e) => setForm({ ...form, naf: e.target.value })}
        />
        <button type="submit" disabled={submitting}>
          {submitting ? 'Creando...' : 'Crear usuario'}
        </button>
      </form>
      {error && <div className="feedback feedback-error">{error}</div>}

      <div className="table-scroll">
        <table className="stats-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Horas/sem</th>
              <th>Contrato</th>
              <th>NIF</th>
              <th>NAF</th>
              <th>Estado</th>
              <th>Tema</th>
              <th>Creado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.name}</td>
                <td>
                  <select
                    value={user.role}
                    disabled={pendingId === user.id}
                    onChange={(e) => changeRole(user, e.target.value as UserRole)}
                  >
                    <option value="employee">Empleado</option>
                    <option value="admin">Administrador</option>
                    <option value="kiosk">Kiosk</option>
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    className="weekly-hours-input"
                    min={0}
                    max={168}
                    defaultValue={user.weeklyHours ?? ''}
                    disabled={pendingId === user.id}
                    onBlur={(e) => changeWeeklyHours(user, e.target.value)}
                  />
                </td>
                <td>
                  <select
                    value={user.contractType ?? ''}
                    disabled={pendingId === user.id}
                    onChange={(e) => saveField(user, { contractType: (e.target.value || null) as ContractType | null })}
                  >
                    <option value="">—</option>
                    <option value="full_time">Completa</option>
                    <option value="part_time">Parcial</option>
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    className="id-field-input"
                    maxLength={20}
                    defaultValue={user.nif ?? ''}
                    disabled={pendingId === user.id}
                    onBlur={(e) => changeIdField(user, 'nif', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="id-field-input"
                    maxLength={20}
                    defaultValue={user.naf ?? ''}
                    disabled={pendingId === user.id}
                    onBlur={(e) => changeIdField(user, 'naf', e.target.value)}
                  />
                </td>
                <td>{user.active ? 'Activo' : 'Inactivo'}</td>
                <td className="theme-cell">
                  {user.theme === 'dark' ? <MoonIcon /> : <SunIcon />}
                  {user.theme === 'dark' ? 'Oscuro' : 'Claro'}
                </td>
                <td>{dateFormatter.format(new Date(user.createdAt))}</td>
                <td className="table-actions">
                  <button disabled={pendingId === user.id} onClick={() => toggleActive(user)}>
                    {user.active ? 'Desactivar' : 'Activar'}
                  </button>{' '}
                  <button disabled={pendingId === user.id} onClick={() => resetPassword(user)}>
                    Cambiar contraseña
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="company-settings">
        <h3>Datos de empresa</h3>
        <p className="hint">Aparecen en la cabecera del registro de jornada que se exporta desde Fichajes.</p>
        <form className="company-settings-form" onSubmit={saveCompany}>
          <label className="modal-field">
            Nombre o razón social
            <input
              type="text"
              maxLength={120}
              value={company.legalName ?? ''}
              onChange={(e) => setCompany({ ...company, legalName: e.target.value })}
            />
          </label>
          <label className="modal-field">
            CIF
            <input
              type="text"
              maxLength={20}
              value={company.cif ?? ''}
              onChange={(e) => setCompany({ ...company, cif: e.target.value })}
            />
          </label>
          <label className="modal-field">
            C.C.C.
            <input
              type="text"
              maxLength={30}
              value={company.ccc ?? ''}
              onChange={(e) => setCompany({ ...company, ccc: e.target.value })}
            />
          </label>
          <button type="submit" className="modal-save" disabled={savingCompany}>
            {savingCompany ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
        {companyFeedback && (
          <div className={`feedback ${companyFeedback.type === 'error' ? 'feedback-error' : ''}`}>{companyFeedback.text}</div>
        )}
      </section>
    </div>
  );
}
