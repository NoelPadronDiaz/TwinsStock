import { useEffect, useState } from 'react';
import {
  createTimeEntry,
  deleteTimeEntry,
  fetchTimeEntriesMonth,
  fetchTimeEntryEdits,
  fetchUsers,
  MonthTimeEntry,
  TimeEntriesMonth,
  TimeEntryEdit,
  updateTimeEntry,
  User,
} from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { CloseIcon, EditIcon, TrashIcon } from '../components/icons';
import { formatHoursMinutes, monthLabel } from '../utils/scheduleDates';
// Reuses the toolbar / month-nav / small-button styles of the schedule pages.
import './schedule-shared.css';

const BUSINESS_TIMEZONE = 'Atlantic/Canary';

const BLOCK_LABELS = { morning: 'Mañana', afternoon: 'Tarde' } as const;

const ACTION_LABELS: Record<TimeEntryEdit['action'], string> = {
  create: 'Añadido',
  update: 'Modificado',
  delete: 'Borrado',
};

const dayLabelFormatter = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', timeZone: 'UTC' });
const editDateFormatter = new Intl.DateTimeFormat('es-ES', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: BUSINESS_TIMEZONE,
});

function currentBusinessMonth() {
  const [year, month] = new Intl.DateTimeFormat('en-CA', { timeZone: BUSINESS_TIMEZONE, year: 'numeric', month: '2-digit' })
    .format(new Date())
    .split('-')
    .map(Number);
  return { year, month };
}

function dayLabel(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  return dayLabelFormatter.format(new Date(Date.UTC(y, m - 1, d)));
}

function apiErrorMessage(err: any, fallback: string): string {
  const message = err?.response?.data?.message;
  if (Array.isArray(message)) return message.join(' ');
  return message ?? fallback;
}

type EditorMode = 'create' | 'edit' | 'delete';

interface EditorState {
  mode: EditorMode;
  entry: MonthTimeEntry | null;
  date: string;
  clockIn: string;
  clockOut: string;
  reason: string;
}

export default function TimeEntriesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [{ year, month }, setPeriod] = useState(currentBusinessMonth);
  const [employees, setEmployees] = useState<User[]>([]);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [data, setData] = useState<TimeEntriesMonth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editor, setEditor] = useState<EditorState | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<TimeEntryEdit[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchUsers().then((users) => {
      const list = users.filter((u) => u.active && u.role !== 'kiosk');
      setEmployees(list);
      setEmployeeId((current) => current ?? list[0]?.id ?? null);
    });
  }, [isAdmin]);

  const load = async () => {
    if (isAdmin && !employeeId) return;
    setLoading(true);
    setError(null);
    try {
      setData(await fetchTimeEntriesMonth(isAdmin ? employeeId : null, year, month));
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudieron cargar los fichajes.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, year, month]);

  const changeMonth = (delta: number) => {
    setPeriod(({ year: y, month: m }) => {
      const index = y * 12 + (m - 1) + delta;
      return { year: Math.floor(index / 12), month: (index % 12) + 1 };
    });
  };

  const exportSheet = () => {
    const params = new URLSearchParams({ year: String(year), month: String(month) });
    if (isAdmin && employeeId) params.set('userId', employeeId);
    window.open(`/fichajes/imprimir?${params.toString()}`, '_blank');
  };

  const openEditor = (mode: EditorMode, date: string, entry: MonthTimeEntry | null = null) => {
    setEditor({
      mode,
      entry,
      date,
      clockIn: entry?.start ?? '',
      clockOut: entry?.end ?? '',
      reason: '',
    });
    setEditorError(null);
    setHistory([]);
    if (entry) {
      fetchTimeEntryEdits(entry.id).then(setHistory);
    }
  };

  const closeEditor = () => {
    setEditor(null);
    setEditorError(null);
    setHistory([]);
  };

  const saveEditor = async () => {
    if (!editor || !employeeId) return;
    setSaving(true);
    setEditorError(null);
    try {
      if (editor.mode === 'delete' && editor.entry) {
        await deleteTimeEntry(editor.entry.id, editor.reason);
      } else {
        const input = {
          date: editor.date,
          clockIn: editor.clockIn,
          clockOut: editor.clockOut || null,
          reason: editor.reason,
        };
        if (editor.mode === 'edit' && editor.entry) {
          await updateTimeEntry(editor.entry.id, input);
        } else {
          await createTimeEntry(employeeId, input);
        }
      }
      closeEditor();
      await load();
    } catch (err) {
      setEditorError(apiErrorMessage(err, 'No se pudo guardar el fichaje.'));
    } finally {
      setSaving(false);
    }
  };

  const firstOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
  const hasIssues = (data?.issues.length ?? 0) > 0;

  return (
    <div className="time-entries-page">
      <h2>Fichajes</h2>
      <p className="hint">
        {isAdmin
          ? 'Fichajes de cada empleado, mes a mes. Puedes corregirlos indicando el motivo y exportar el registro de jornada.'
          : 'Tus fichajes, mes a mes. Puedes exportar el registro de jornada de cualquier mes.'}
      </p>

      <div className="schedule-toolbar">
        <div className="schedule-month-nav">
          {isAdmin && (
            <select
              className="time-entries-employee"
              value={employeeId ?? ''}
              onChange={(e) => setEmployeeId(e.target.value)}
              aria-label="Empleado"
            >
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          )}
          <button className="preset-button" onClick={() => changeMonth(-1)} aria-label="Mes anterior">
            ←
          </button>
          <span className="time-entries-month">
            {monthLabel(month - 1)} {year}
          </span>
          <button className="preset-button" onClick={() => changeMonth(1)} aria-label="Mes siguiente">
            →
          </button>
        </div>
        <div className="schedule-actions">
          {isAdmin && (
            <button className="preset-button" onClick={() => openEditor('create', firstOfMonth)} disabled={!employeeId}>
              + Añadir fichaje
            </button>
          )}
          <button
            className="preset-button"
            onClick={exportSheet}
            disabled={!data || hasIssues}
            title={hasIssues ? 'Corrige los días marcados antes de exportar.' : undefined}
          >
            Exportar registro
          </button>
        </div>
      </div>

      {error && <div className="feedback feedback-error">{error}</div>}
      {hasIssues && (
        <div className="feedback feedback-error">
          Hay días que el registro de jornada no puede representar (marcados abajo).{' '}
          {isAdmin ? 'Corrígelos para poder exportar.' : 'Pide a un administrador que los corrija para poder exportar.'}
        </div>
      )}

      {loading ? (
        <p>Cargando...</p>
      ) : !data || data.days.length === 0 ? (
        <p className="hint">No hay fichajes en este mes.</p>
      ) : (
        <div className="table-scroll">
          <table className="stats-table time-entries-table">
            <thead>
              <tr>
                <th>Día</th>
                <th>Tramos</th>
                <th>Total</th>
                {isAdmin && <th></th>}
              </tr>
            </thead>
            <tbody>
              {data.days.map((day) => (
                <tr key={day.date} className={day.issues.length > 0 ? 'has-issues' : undefined}>
                  <td className="time-entries-day">{dayLabel(day.date)}</td>
                  <td>
                    <ul className="time-entries-list">
                      {day.entries.map((entry) => (
                        <li key={entry.id}>
                          <span className="time-entries-block">{BLOCK_LABELS[entry.block]}</span>
                          <span className="time-entries-range">
                            {entry.start}–{entry.end ?? '…'}
                          </span>
                          {entry.minutes != null && (
                            <span className="time-entries-minutes">{formatHoursMinutes(entry.minutes)}</span>
                          )}
                          {entry.corrected && <span className="time-entries-badge">Corregido</span>}
                          {entry.pendingCorrection && (
                            <span className="time-entries-badge pending">Pendiente de corregir</span>
                          )}
                          {isAdmin && (
                            <span className="time-entries-actions">
                              <button
                                className="icon-button"
                                onClick={() => openEditor('edit', day.date, entry)}
                                aria-label="Editar fichaje"
                              >
                                <EditIcon />
                              </button>
                              <button
                                className="icon-button icon-button-danger"
                                onClick={() => openEditor('delete', day.date, entry)}
                                aria-label="Borrar fichaje"
                              >
                                <TrashIcon />
                              </button>
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                    {day.issues.map((issue) => (
                      <p key={issue} className="time-entries-issue">
                        {issue}
                      </p>
                    ))}
                  </td>
                  <td className="time-entries-total">{formatHoursMinutes(day.totalMinutes)}</td>
                  {isAdmin && (
                    <td>
                      <button className="schedule-template-add" onClick={() => openEditor('create', day.date)}>
                        + tramo
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th colSpan={2}>Total del mes</th>
                <th className="time-entries-total">{formatHoursMinutes(data.totalMinutes)}</th>
                {isAdmin && <th></th>}
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {editor && (
        <div className="modal-overlay" onClick={closeEditor}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {editor.mode === 'create' ? 'Añadir fichaje' : editor.mode === 'edit' ? 'Corregir fichaje' : 'Borrar fichaje'}
              </h3>
              <button className="modal-close" onClick={closeEditor} aria-label="Cerrar">
                <CloseIcon />
              </button>
            </div>
            <div className="modal-body">
              {editor.mode === 'delete' && editor.entry ? (
                <p>
                  Se borrará el tramo {editor.entry.start}–{editor.entry.end ?? '…'} del {dayLabel(editor.date)}. Quedará
                  constancia en el historial.
                </p>
              ) : (
                <div className="schedule-shift-form">
                  <label className="modal-field">
                    Día
                    <input type="date" value={editor.date} onChange={(e) => setEditor({ ...editor, date: e.target.value })} />
                  </label>
                  <label className="modal-field">
                    Entrada
                    <input
                      type="time"
                      value={editor.clockIn}
                      onChange={(e) => setEditor({ ...editor, clockIn: e.target.value })}
                    />
                  </label>
                  <label className="modal-field">
                    Salida (vacío = sin salida)
                    <input
                      type="time"
                      value={editor.clockOut}
                      onChange={(e) => setEditor({ ...editor, clockOut: e.target.value })}
                    />
                  </label>
                </div>
              )}
              <label className="modal-field">
                Motivo
                <input
                  type="text"
                  maxLength={300}
                  value={editor.reason}
                  placeholder="Ej.: olvidó fichar la salida"
                  onChange={(e) => setEditor({ ...editor, reason: e.target.value })}
                />
              </label>

              {history.length > 0 && (
                <div className="time-entries-history">
                  <h4>Historial de cambios</h4>
                  <ul>
                    {history.map((edit) => (
                      <li key={edit.id}>
                        <strong>{ACTION_LABELS[edit.action]}</strong> {editDateFormatter.format(new Date(edit.createdAt))}
                        {edit.editedBy && ` por ${edit.editedBy}`}
                        {edit.previous && edit.next && `: ${edit.previous} → ${edit.next}`}
                        {!edit.previous && edit.next && `: ${edit.next}`}
                        <span className="time-entries-history-reason"> — {edit.reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {editorError && <div className="feedback feedback-error">{editorError}</div>}

            <div className="modal-actions">
              <div className="modal-actions-spacer" />
              <button className="modal-cancel" onClick={closeEditor}>
                Cancelar
              </button>
              <button
                className={editor.mode === 'delete' ? 'modal-save modal-danger' : 'modal-save'}
                disabled={
                  saving || editor.reason.trim() === '' || (editor.mode !== 'delete' && (!editor.date || !editor.clockIn))
                }
                onClick={saveEditor}
              >
                {saving ? 'Guardando...' : editor.mode === 'delete' ? 'Borrar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
