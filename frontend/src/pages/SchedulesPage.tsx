import { useEffect, useMemo, useState } from 'react';
import {
  applyShiftTemplate,
  copyShiftWeek,
  createShift,
  deleteShift,
  fetchShiftTemplates,
  fetchShifts,
  fetchUsers,
  replaceShiftTemplates,
  Shift,
  updateShift,
  User,
} from '../api/client';
import ScheduleMonthGrid from '../components/ScheduleMonthGrid';
import { CloseIcon, EditIcon, TrashIcon } from '../components/icons';
import {
  addDays,
  formatMinutes,
  getMonthRange,
  getWeekStart,
  monthLabel,
  toISODate,
  weekdayLabel,
} from '../utils/scheduleDates';
import './schedule-shared.css';

function minutesBetween(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  return eh * 60 + em - (sh * 60 + sm);
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

  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateDraft, setTemplateDraft] = useState<{ weekday: number; startTime: string; endTime: string }[]>([]);
  const [savingTemplate, setSavingTemplate] = useState(false);

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

  const openEmployee = (userId: string) => {
    setSelectedUserId(userId);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    loadMonth(userId, today.getFullYear(), today.getMonth());
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

  const openTemplateModal = async () => {
    if (!selectedUserId) return;
    const rows = await fetchShiftTemplates(selectedUserId);
    setTemplateDraft(rows.map((r) => ({ weekday: r.weekday, startTime: r.startTime, endTime: r.endTime })));
    setTemplateModalOpen(true);
  };

  const closeTemplateModal = () => {
    setTemplateModalOpen(false);
    setTemplateDraft([]);
  };

  const addTemplateRow = (weekday: number) => {
    setTemplateDraft((prev) => [...prev, { weekday, startTime: '09:00', endTime: '13:00' }]);
  };

  const updateTemplateRow = (index: number, field: 'startTime' | 'endTime', value: string) => {
    setTemplateDraft((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const removeTemplateRow = (index: number) => {
    setTemplateDraft((prev) => prev.filter((_, i) => i !== index));
  };

  const saveTemplate = async () => {
    if (!selectedUserId) return;
    setSavingTemplate(true);
    try {
      await replaceShiftTemplates(selectedUserId, templateDraft);
      closeTemplateModal();
      showFeedback('success', 'Semana tipo guardada.');
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message ?? 'No se pudo guardar la semana tipo.');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleApplyTemplate = async () => {
    if (!selectedUserId) return;
    const { start, end } = getMonthRange(viewYear, viewMonth);
    try {
      const result = await applyShiftTemplate(selectedUserId, start, end);
      await loadMonth(selectedUserId, viewYear, viewMonth);
      await loadEmployeesAndWeek();
      showFeedback(
        'success',
        `Semana tipo aplicada: ${result.datesCreated.length} día(s) creados, ${result.datesSkipped.length} con turnos ya existentes.`,
      );
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message ?? 'No se pudo aplicar la semana tipo.');
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
          <button className="preset-button" onClick={handleApplyTemplate}>
            Aplicar semana tipo al mes
          </button>
          <button className="preset-button" onClick={openCopyWeek}>
            Copiar semana anterior
          </button>
          <button className="preset-button" onClick={openTemplateModal}>
            Editar semana tipo
          </button>
        </div>
      </div>

      {feedback && <div className={`feedback ${feedback.type === 'error' ? 'feedback-error' : ''}`}>{feedback.text}</div>}

      {monthLoading ? (
        <p>Cargando mes...</p>
      ) : (
        <ScheduleMonthGrid year={viewYear} month={viewMonth} shiftsByDate={shiftsByDate} onDayClick={openDayModal} />
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

      {templateModalOpen && (
        <div className="modal-overlay" onClick={closeTemplateModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Semana tipo de {selectedEmployee.name}</h3>
              <button className="modal-close" onClick={closeTemplateModal} aria-label="Cerrar">
                <CloseIcon />
              </button>
            </div>
            <div className="modal-body">
              {[0, 1, 2, 3, 4, 5, 6].map((weekday) => (
                <div className="schedule-template-day" key={weekday}>
                  <span className="schedule-template-day-label">{weekdayLabel(weekday)}</span>
                  <div className="schedule-template-rows">
                    {templateDraft
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
            <div className="modal-actions">
              <div className="modal-actions-spacer" />
              <button className="modal-cancel" onClick={closeTemplateModal}>
                Cancelar
              </button>
              <button className="modal-save" disabled={savingTemplate} onClick={saveTemplate}>
                {savingTemplate ? 'Guardando...' : 'Guardar'}
              </button>
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
