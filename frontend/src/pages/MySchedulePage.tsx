import { useEffect, useMemo, useState } from 'react';
import { fetchMyShifts, Shift } from '../api/client';
import ScheduleMonthGrid from '../components/ScheduleMonthGrid';
import {
  addDays,
  getMonthRange,
  getWeekDays,
  getWeekStart,
  monthLabel,
  toISODate,
  weekdayLabel,
} from '../utils/scheduleDates';
import './schedule-shared.css';

type Tab = 'week' | 'month';

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

export default function MySchedulePage() {
  const [tab, setTab] = useState<Tab>('week');
  const today = useMemo(() => toISODate(new Date()), []);

  const [weekStart, setWeekStart] = useState(() => getWeekStart(today));
  const [weekShifts, setWeekShifts] = useState<Shift[]>([]);
  const [weekLoading, setWeekLoading] = useState(true);

  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [monthShifts, setMonthShifts] = useState<Shift[]>([]);
  const [monthLoading, setMonthLoading] = useState(false);

  useEffect(() => {
    setWeekLoading(true);
    fetchMyShifts(weekStart, addDays(weekStart, 6))
      .then(setWeekShifts)
      .finally(() => setWeekLoading(false));
  }, [weekStart]);

  useEffect(() => {
    if (tab !== 'month') return;
    setMonthLoading(true);
    const { start, end } = getMonthRange(viewYear, viewMonth);
    fetchMyShifts(start, end)
      .then(setMonthShifts)
      .finally(() => setMonthLoading(false));
  }, [tab, viewYear, viewMonth]);

  const weekByDate = useMemo(() => groupByDate(weekShifts), [weekShifts]);
  const monthByDate = useMemo(() => groupByDate(monthShifts), [monthShifts]);

  const changeMonth = (delta: number) => {
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
  };

  return (
    <div className="my-schedule-page">
      <h2>Mi horario</h2>

      <div className="market-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'week'}
          className={tab === 'week' ? 'market-tab active' : 'market-tab'}
          onClick={() => setTab('week')}
        >
          Semana
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'month'}
          className={tab === 'month' ? 'market-tab active' : 'market-tab'}
          onClick={() => setTab('month')}
        >
          Mes
        </button>
      </div>

      {tab === 'week' ? (
        <>
          <div className="schedule-month-nav">
            <button className="preset-button" onClick={() => setWeekStart(addDays(weekStart, -7))}>
              ← Semana anterior
            </button>
            <span>
              {weekStart} – {addDays(weekStart, 6)}
            </span>
            <button className="preset-button" onClick={() => setWeekStart(addDays(weekStart, 7))}>
              Semana siguiente →
            </button>
          </div>
          {weekLoading ? (
            <p>Cargando...</p>
          ) : (
            <ul className="schedule-week-list">
              {getWeekDays(weekStart).map((date, index) => {
                const dayShifts = weekByDate.get(date) ?? [];
                return (
                  <li key={date} className="schedule-week-row">
                    <span className="schedule-week-day">
                      {weekdayLabel(index)} <span className="schedule-week-date">{date}</span>
                    </span>
                    <span className="schedule-week-shifts">
                      {dayShifts.length === 0
                        ? 'Libre'
                        : dayShifts.map((shift) => `${shift.startTime}–${shift.endTime}`).join(', ')}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      ) : (
        <>
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
          {monthLoading ? (
            <p>Cargando...</p>
          ) : (
            <ScheduleMonthGrid year={viewYear} month={viewMonth} shiftsByDate={monthByDate} />
          )}
        </>
      )}
    </div>
  );
}
