import { FormEvent, useEffect, useState } from 'react';
import { createUser, CreateUserInput, fetchUsers, updateUser, User, UserRole } from '../api/client';

const dateFormatter = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' });

const emptyForm: CreateUserInput = { username: '', name: '', password: '', role: 'employee' };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<CreateUserInput>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const loadUsers = () => fetchUsers().then((data) => setUsers(data));

  useEffect(() => {
    loadUsers().finally(() => setLoading(false));
  }, []);

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
        </select>
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
              <th>Estado</th>
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
                  </select>
                </td>
                <td>{user.active ? 'Activo' : 'Inactivo'}</td>
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
    </div>
  );
}
