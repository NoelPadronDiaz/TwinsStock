import { useEffect, useMemo, useState } from 'react';
import {
  applyWeekTemplate,
  copyShiftWeek,
  createShift,
  createWeekTemplate,
  deleteShift,
  deleteWeekTemplate,
  fetchShifts,
  fetchUsers,
  fetchWeekTemplates,
  Shift,
  updateShift,
  updateWeekTemplate,
  User,
  WeekTemplate,
  WeekTemplateRow,
} from '../api/client';
import ScheduleMonthGrid from '../components/ScheduleMonthGrid';
import { CloseIcon, EditIcon, TrashIcon } from '../components/icons';
import {
  addDays,
  formatMinutes,
  formatShortDate,
  getMonthRange,
  getWeekStart,
  monthLabel,
  toISODate,
  WEEKDAY_SHORT_LABELS,
  weekdayLabel,
} from '../utils/scheduleDates';
import './schedule-shared.css';

interface TemplateEditorState {
  id: string | null; // null = new template
  name: string;
  rows: WeekTemplateRow[];
}

function minutesBetween(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

function summarizeTemplate(template: WeekTemplate): string {
  if (template.rows.length === 0) return 'Sin tramos';
  const days = [...new Set(template.rows.map((row) => row.weekday))]
    .sort((a, b) => a - b)
    .map((weekday) => WEEKDAY_SHORT_LABELS[weekday])
    .join(', ');
  const minutes = template.rows.reduce((sum, row) => sum + minutesBetween(row.startTime, row.endTime), 0);
  return `${days} · ${formatMinutes(minutes)}`;
}

// Validation errors come back from class-validator as an array of messages.
function apiErrorMessage(err: any, fallback: string): string {
  const message = err?.response?.data?.message;
  if (Array.isArray(message)) return message.join(' ');
  return message ?? fallback;
}

function groupByDate(shifts: Shift[]): Map<string, Shift[]> {
  const map = new Map<string, Shift[]>();
  for (const shift of shifts) {
    const list = map.get(shift.date) ?? [];
    list.push(shift);
    map.set(shift.date, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }
  return map;
}

const emptyShiftForm = { startTime: '', endTime: '', note: '' };

export default function SchedulesPage() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [weekShifts, setWeekShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [monthShifts, setMonthShifts] = useState<Shift[]>([]);
  const [monthLoading, setMonthLoading] = useState(false);

  const [dayModalDate, setDayModalDate] = useState<string | null>(null);
  const [shiftForm, setShiftForm] = useState(emptyShiftForm);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [savingShift, setSavingShift] = useState(false);

  const [weekTemplates, setWeekTemplates] = useState<WeekTemplate[]>([]);
  const [templateEditor, setTemplateEditor] = useState<TemplateEditorState | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);

  const [applyWeekStart, setApplyWeekStart] = useState<string | null>(null);
  const [applyTemplateId, setApplyTemplateId] = useState<string | null>(null);
  const [applyingTemplate, setApplyingTemplate] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const [copyWeekOpen, setCopyWeekOpen] = useState(false);
  const [copySource, setCopySource] = useState('');
  const [copyTarget, setCopyTarget] = useState('');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const thisWeekStart = useMemo(() => getWeekStart(toISODate(today)), [today]);
  const thisWeekEnd = useMemo(() => addDays(thisWeekStart, 6), [thisWeekStart]);

  const loadEmployeesAndWeek = async () => {
    const [users, shifts] = await Promise.all([
      fetchUsers(),
      fetchShifts({ from: thisWeekStart, to: thisWeekEnd }),
    ]);
    setEmployees(users.filter((u) => u.active));
    setWeekShifts(shifts);
  };

  useEffect(() => {
    loadEmployeesAndWeek().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const plannedMinutesByUser = useMemo(() => {
    const map = new Map<string, number>();
    for (const shift of weekShifts) {
      map.set(shift.userId, (map.get(shift.userId) ?? 0) + minutesBetween(shift.startTime, shift.endTime));
    }
    return map;
  }, [weekShifts]);

  const loadMonth = async (userId: string, year: number, month: number) => {
    setMonthLoading(true);
    const { start, end } = getMonthRange(year, month);
    try {
      const shifts = await fetchShifts({ userId, from: start, to: end });
      setMonthShifts(shifts);
    } finally {
      setMonthLoading(false);
    }
  };

  const loadTemplates = async (userId: string) => {
    setWeekTemplates(await fetchWeekTemplates(userId));
  };

  const openEmployee = (userId: string) => {
    setSelectedUserId(userId);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setWeekTemplates([]);
    loadMonth(userId, today.getFullYear(), today.getMonth());
    loadTemplates(userId);
  };

  const changeMonth = (delta: number) => {
    if (!selectedUserId) return;
    let year = viewYear;
    let month = viewMonth + delta;
    if (month < 0) {
      month = 11;
      year -= 1;
    } else if (month > 11) {
      month = 0;
      year += 1;
    }
    setViewYear(year);
    setViewMonth(month);
    loadMonth(selectedUserId, year, month);
  };

  const shiftsByDate = useMemo(() => groupByDate(monthShifts), [monthShifts]);
  const selectedEmployee = employees.find((e) => e.id === selectedUserId) ?? null;

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const openDayModal = (date: string) => {
    setDayModalDate(date);
    setShiftForm(emptyShiftForm);
    setEditingShiftId(null);
    setError(null);
  };

  const closeDayModal = () => {
    setDayModalDate(null);
    setShiftForm(emptyShiftForm);
    setEditingShiftId(null);
    setError(null);
  };

  const handleEditShift = (shift: Shift) => {
    setEditingShiftId(shift.id);
    setShiftForm({ startTime: shift.startTime, endTime: shift.endTime, note: shift.note ?? '' });
  };

  const handleSubmitShift = async () => {
    if (!selectedUserId || !dayModalDate) return;
    setError(null);
    setSavingShift(true);
    try {
      if (editingShiftId) {
        await updateShift(editingShiftId, {
          startTime: shiftForm.startTime,
          endTime: shiftForm.endTime,
          note: shiftForm.note || undefined,
        });
      } else {
        await createShift({
          userId: selectedUserId,
          date: dayModalDate,
          startTime: shiftForm.startTime,
          endTime: shiftForm.endTime,
          note: shiftForm.note || undefined,
        });
      }
      setShiftForm(emptyShiftForm);
      setEditingShiftId(null);
      await loadMonth(selectedUserId, viewYear, viewMonth);
      await loadEmployeesAndWeek();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'No se pudo guardar el tramo.');
    } finally {
      setSavingShift(false);
    }
  };

  const handleDeleteShift = async (id: string) => {
    if (!selectedUserId) return;
    await deleteShift(id);
    await loadMonth(selectedUserId, viewYear, viewMonth);
    await loadEmployeesAndWeek();
  };

  const openNewTemplate = () => {
    setTemplateEditor({ id: null, name: '', rows: [] });
    setTemplateError(null);
  };

  const openEditTemplate = (template: WeekTemplate) => {
    setTemplateEditor({ id: template.id, name: template.name, rows: template.rows.map((row) => ({ ...row })) });
    setTemplateError(null);
  };

  const closeTemplateEditor = () => {
    setTemplateEditor(null);
    setTemplateError(null);
  };

  const addTemplateRow = (weekday: number) => {
    setTemplateEditor((prev) =>
      prev && { ...prev, rows: [...prev.rows, { weekday, startTime: '09:15', endTime: '14:15' }] },
    );
  };

  const updateTemplateRow = (index: number, field: 'startTime' | 'endTime', value: string) => {
    setTemplateEditor((prev) =>
      prev && { ...prev, rows: prev.rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)) },
    );
  };

  const removeTemplateRow = (index: number) => {
    setTemplateEditor((prev) => prev && { ...prev, rows: prev.rows.filter((_, i) => i !== index) });
  };

  const saveTemplate = async () => {
    if (!selectedUserId || !templateEditor) return;
    setSavingTemplate(true);
    setTemplateError(null);
    try {
      const input = { name: templateEditor.name.trim(), rows: templateEditor.rows };
      if (templateEditor.id) {
        await updateWeekTemplate(templateEditor.id, input);
      } else {
        await createWeekTemplate(selectedUserId, input);
      }
      await loadTemplates(selectedUserId);
      closeTemplateEditor();
      showFeedback('success', 'Plantilla guardada.');
    } catch (err) {
      setTemplateError(apiErrorMessage(err, 'No se pudo guardar la plantilla.'));
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (template: WeekTemplate) => {
    if (!selectedUserId) return;
    if (!window.confirm(`¿Borrar la plantilla «${template.name}»? Los turnos ya aplicados no se tocan.`)) return;
    try {
      await deleteWeekTemplate(template.id);
      await loadTemplates(selectedUserId);
      showFeedback('success', 'Plantilla borrada.');
    } catch (err) {
      showFeedback('error', apiErrorMessage(err, 'No se pudo borrar la plantilla.'));
    }
  };

  const openApplyWeek = (weekStart: string) => {
    setApplyWeekStart(weekStart);
    setApplyTemplateId(weekTemplates.length === 1 ? weekTemplates[0].id : null);
    setApplyError(null);
  };

  const closeApplyWeek = () => {
    setApplyWeekStart(null);
    setApplyTemplateId(null);
    setApplyError(null);
  };

  const handleApplyWeek = async () => {
    if (!selectedUserId || !applyWeekStart || !applyTemplateId) return;
    setApplyingTemplate(true);
    setApplyError(null);
    try {
      const result = await applyWeekTemplate(applyTemplateId, applyWeekStart);
      const name = weekTemplates.find((t) => t.id === applyTemplateId)?.name ?? '';
      await loadMonth(selectedUserId, viewYear, viewMonth);
      await loadEmployeesAndWeek();
      closeApplyWeek();
      showFeedback(
        'success',
        `Plantilla «${name}» aplicada a la semana del ${formatShortDate(result.weekStart)} al ${formatShortDate(result.weekEnd)}.`,
      );
    } catch (err) {
      setApplyError(apiErrorMessage(err, 'No se pudo aplicar la plantilla.'));
    } finally {
      setApplyingTemplate(false);
    }
  };

  const openCopyWeek = () => {
    const target = getWeekStart(toISODate(new Date(Date.UTC(viewYear, viewMonth, 15))));
    setCopyTarget(target);
    setCopySource(addDays(target, -7));
    setCopyWeekOpen(true);
  };

  const handleCopyWeek = async () => {
    if (!selectedUserId) return;
    try {
      const result = await copyShiftWeek(selectedUserId, copySource, copyTarget);
      await loadMonth(selectedUserId, viewYear, viewMonth);
      await loadEmployeesAndWeek();
      setCopyWeekOpen(false);
      showFeedback(
        'success',
        `Semana copiada: ${result.datesCreated.length} día(s) creados, ${result.datesSkipped.length} con turnos ya existentes.`,
      );
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message ?? 'No se pudo copiar la semana.');
    }
  };

  if (loading) {
    return <p>Cargando...</p>;
  }

  if (!selectedUserId || !selectedEmployee) {
    return (
      <div className="schedules-page">
        <h2>Horarios</h2>
        <p className="hint">Elige un empleado para ver y editar su calendario.</p>
        <ul className="schedule-employee-list">
          {employees.map((employee) => {
            const planned = plannedMinutesByUser.get(employee.id) ?? 0;
            const contract = employee.weeklyHours != null ? employee.weeklyHours * 60 : null;
            let statusClass = '';
            let statusLabel = '—';
            if (contract != null) {
              if (planned === contract) {
                statusClass = 'ok';
                statusLabel = 'Igual';
              } else if (planned < contract) {
                statusClass = 'under';
                statusLabel = 'Por debajo';
              } else {
                statusClass = 'over';
                statusLabel = 'Por encima';
              }
            }
            return (
              <li key={employee.id} className="schedule-employee-row" onClick={() => openEmployee(employee.id)}>
                <span className="schedule-employee-name">{employee.name}</span>
                <span className="schedule-employee-hours">
                  {formatMinutes(planned)}
                  {contract != null && ` / ${formatMinutes(contract)}`}
                </span>
                <span className={`schedule-status-pill ${statusClass}`}>{statusLabel}</span>
              </li>
            );
          })}
          {employees.length === 0 && <li className="empty">No hay empleados activos.</li>}
        </ul>
      </div>
    );
  }

  return (
    <div className="schedules-page">
      <div className="schedule-header">
        <button className="preset-button" onClick={() => setSelectedUserId(null)}>
          ← Empleados
        </button>
        <h2>{selectedEmployee.name}</h2>
      </div>

      <div className="schedule-toolbar">
        <div className="schedule-month-nav">
          <button className="preset-button" onClick={() => changeMonth(-1)}>
            ←
          </button>
          <span>
            {monthLabel(viewMonth)} {viewYear}
          </span>
          <button className="preset-button" onClick={() => changeMonth(1)}>
            →
          </button>
        </div>
        <div className="schedule-actions">
          <button className="preset-button" onClick={openCopyWeek}>
            Copiar semana anterior
          </button>
        </div>
      </div>

      {feedback && <div className={`feedback ${feedback.type === 'error' ? 'feedback-error' : ''}`}>{feedback.text}</div>}

      <section className="schedule-templates">
        <div className="schedule-templates-header">
          <h3>Plantillas de semana</h3>
          <button className="preset-button" onClick={openNewTemplate}>
            + Nueva plantilla
          </button>
        </div>
        {weekTemplates.length === 0 ? (
          <p className="hint">
            Aún no hay plantillas. Crea una y aplícala a cualquier semana con «Aplicar semana».
          </p>
        ) : (
          <ul className="schedule-template-list">
            {weekTemplates.map((template) => (
              <li key={template.id} className="schedule-template-item">
                <div className="schedule-template-info">
                  <span className="schedule-template-name">{template.name}</span>
                  <span className="schedule-template-summary">{summarizeTemplate(template)}</span>
                </div>
                <div className="schedule-shift-row-actions">
                  <button
                    className="icon-button"
                    onClick={() => openEditTemplate(template)}
                    aria-label={`Editar plantilla ${template.name}`}
                  >
                    <EditIcon />
                  </button>
                  <button
                    className="icon-button icon-button-danger"
                    onClick={() => handleDeleteTemplate(template)}
                    aria-label={`Borrar plantilla ${template.name}`}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {monthLoading ? (
        <p>Cargando mes...</p>
      ) : (
        <ScheduleMonthGrid
          year={viewYear}
          month={viewMonth}
          shiftsByDate={shiftsByDate}
          onDayClick={openDayModal}
          onApplyWeek={openApplyWeek}
        />
      )}

      {dayModalDate && (
        <div className="modal-overlay" onClick={closeDayModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{dayModalDate}</h3>
              <button className="modal-close" onClick={closeDayModal} aria-label="Cerrar">
                <CloseIcon />
              </button>
            </div>
            <div className="modal-body">
              <ul className="schedule-shift-list">
                {(shiftsByDate.get(dayModalDate) ?? []).map((shift) => (
                  <li key={shift.id} className="schedule-shift-row">
                    <span>
                      {shift.startTime}–{shift.endTime}
                      {shift.note && <span className="schedule-shift-note"> · {shift.note}</span>}
                    </span>
                    <div className="schedule-shift-row-actions">
                      <button className="icon-button" onClick={() => handleEditShift(shift)} aria-label="Editar tramo">
                        <EditIcon />
                      </button>
                      <button
                        className="icon-button icon-button-danger"
                        onClick={() => handleDeleteShift(shift.id)}
                        aria-label="Borrar tramo"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </li>
                ))}
                {(shiftsByDate.get(dayModalDate) ?? []).length === 0 && (
                  <li className="empty">Sin tramos este día.</li>
                )}
              </ul>

              <div className="schedule-shift-form">
                <label className="modal-field">
                  Inicio
                  <input
                    type="time"
                    value={shiftForm.startTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                  />
                </label>
                <label className="modal-field">
                  Fin
                  <input
                    type="time"
                    value={shiftForm.endTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                  />
                </label>
                <label className="modal-field">
                  Nota (opcional)
                  <input
                    type="text"
                    value={shiftForm.note}
                    onChange={(e) => setShiftForm({ ...shiftForm, note: e.target.value })}
                  />
                </label>
              </div>
            </div>

            {error && <div className="feedback feedback-error">{error}</div>}

            <div className="modal-actions">
              <div className="modal-actions-spacer" />
              {editingShiftId && (
                <button
                  className="modal-cancel"
                  onClick={() => {
                    setEditingShiftId(null);
                    setShiftForm(emptyShiftForm);
                  }}
                >
                  Cancelar edición
                </button>
              )}
              <button
                className="modal-save"
                disabled={savingShift || !shiftForm.startTime || !shiftForm.endTime}
                onClick={handleSubmitShift}
              >
                {savingShift ? 'Guardando...' : editingShiftId ? 'Guardar cambios' : 'Añadir tramo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {templateEditor && (
        <div className="modal-overlay" onClick={closeTemplateEditor}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{templateEditor.id ? 'Editar plantilla' : 'Nueva plantilla'}</h3>
              <button className="modal-close" onClick={closeTemplateEditor} aria-label="Cerrar">
                <CloseIcon />
              </button>
            </div>
            <div className="modal-body">
              <label className="modal-field">
                Nombre
                <input
                  type="text"
                  value={templateEditor.name}
                  placeholder="Ej.: Mañana, Tarde, Fin de semana…"
                  maxLength={60}
                  autoFocus
                  onChange={(e) => setTemplateEditor({ ...templateEditor, name: e.target.value })}
                />
              </label>
              {[0, 1, 2, 3, 4, 5, 6].map((weekday) => (
                <div className="schedule-template-day" key={weekday}>
                  <span className="schedule-template-day-label">{weekdayLabel(weekday)}</span>
                  <div className="schedule-template-rows">
                    {templateEditor.rows
                      .map((row, index) => ({ row, index }))
                      .filter(({ row }) => row.weekday === weekday)
                      .map(({ row, index }) => (
                        <div className="schedule-template-row" key={index}>
                          <input
                            type="time"
                            value={row.startTime}
                            onChange={(e) => updateTemplateRow(index, 'startTime', e.target.value)}
                          />
                          <input
                            type="time"
                            value={row.endTime}
                            onChange={(e) => updateTemplateRow(index, 'endTime', e.target.value)}
                          />
                          <button className="icon-button icon-button-danger" onClick={() => removeTemplateRow(index)}>
                            <TrashIcon />
                          </button>
                        </div>
                      ))}
                    <button className="schedule-template-add" onClick={() => addTemplateRow(weekday)}>
                      + tramo
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {templateError && <div className="feedback feedback-error">{templateError}</div>}

            <div className="modal-actions">
              <div className="modal-actions-spacer" />
              <button className="modal-cancel" onClick={closeTemplateEditor}>
                Cancelar
              </button>
              <button
                className="modal-save"
                disabled={savingTemplate || templateEditor.name.trim() === ''}
                onClick={saveTemplate}
              >
                {savingTemplate ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {applyWeekStart && (
        <div className="modal-overlay" onClick={closeApplyWeek}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                Aplicar semana del {formatShortDate(applyWeekStart)} al {formatShortDate(addDays(applyWeekStart, 6))}
              </h3>
              <button className="modal-close" onClick={closeApplyWeek} aria-label="Cerrar">
                <CloseIcon />
              </button>
            </div>
            <div className="modal-body">
              {weekTemplates.length === 0 ? (
                <>
                  <p className="hint">{selectedEmployee.name} todavía no tiene plantillas de semana.</p>
                  <button
                    className="preset-button"
                    onClick={() => {
                      closeApplyWeek();
                      openNewTemplate();
                    }}
                  >
                    + Crear plantilla
                  </button>
                </>
              ) : (
                <>
                  <p className="hint">
                    Los turnos de esa semana (de lunes a domingo) se sustituyen por los de la plantilla; los días que
                    la plantilla no tiene quedan libres. Después puedes retocar cualquier día.
                  </p>
                  <ul className="schedule-template-list">
                    {weekTemplates.map((template) => (
                      <li key={template.id}>
                        <button
                          type="button"
                          className={
                            applyTemplateId === template.id ? 'schedule-template-option selected' : 'schedule-template-option'
                          }
                          aria-pressed={applyTemplateId === template.id}
                          onClick={() => setApplyTemplateId(template.id)}
                        >
                          <span className="schedule-template-name">{template.name}</span>
                          <span className="schedule-template-summary">{summarizeTemplate(template)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            {applyError && <div className="feedback feedback-error">{applyError}</div>}

            <div className="modal-actions">
              <div className="modal-actions-spacer" />
              <button className="modal-cancel" onClick={closeApplyWeek}>
                Cancelar
              </button>
              {weekTemplates.length > 0 && (
                <button className="modal-save" disabled={applyingTemplate || !applyTemplateId} onClick={handleApplyWeek}>
                  {applyingTemplate ? 'Aplicando...' : 'Aplicar'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {copyWeekOpen && (
        <div className="modal-overlay" onClick={() => setCopyWeekOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Copiar semana</h3>
              <button className="modal-close" onClick={() => setCopyWeekOpen(false)} aria-label="Cerrar">
                <CloseIcon />
              </button>
            </div>
            <div className="modal-body">
              <label className="modal-field">
                Semana de origen (lunes)
                <input type="date" value={copySource} onChange={(e) => setCopySource(e.target.value)} />
              </label>
              <label className="modal-field">
                Semana de destino (lunes)
                <input type="date" value={copyTarget} onChange={(e) => setCopyTarget(e.target.value)} />
              </label>
            </div>
            <div className="modal-actions">
              <div className="modal-actions-spacer" />
              <button className="modal-cancel" onClick={() => setCopyWeekOpen(false)}>
                Cancelar
              </button>
              <button className="modal-save" onClick={handleCopyWeek}>
                Copiar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
