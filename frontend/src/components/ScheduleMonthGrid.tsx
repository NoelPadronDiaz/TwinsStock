import { Shift } from '../api/client';
import { getMonthWeeks, WEEKDAY_SHORT_LABELS } from '../utils/scheduleDates';

interface ScheduleMonthGridProps {
  year: number;
  month: number; // 0-11
  shiftsByDate: Map<string, Shift[]>;
  onDayClick?: (date: string) => void;
}

export default function ScheduleMonthGrid({ year, month, shiftsByDate, onDayClick }: ScheduleMonthGridProps) {
  const weeks = getMonthWeeks(year, month);

  return (
    <div className="schedule-month-grid">
      {WEEKDAY_SHORT_LABELS.map((label) => (
        <div className="schedule-month-grid-header" key={label}>
          {label}
        </div>
      ))}
      {weeks.map((week) =>
        week.map((date) => {
          const inMonth = Number(date.slice(5, 7)) === month + 1;
          const dayShifts = shiftsByDate.get(date) ?? [];
          const Tag = onDayClick ? 'button' : 'div';
          return (
            <Tag
              key={date}
              type={onDayClick ? 'button' : undefined}
              className={inMonth ? 'schedule-day-cell' : 'schedule-day-cell outside'}
              onClick={onDayClick ? () => onDayClick(date) : undefined}
            >
              <span className="schedule-day-number">{Number(date.slice(8, 10))}</span>
              {dayShifts.map((shift) => (
                <span className="schedule-day-chip" key={shift.id}>
                  {shift.startTime}–{shift.endTime}
                </span>
              ))}
            </Tag>
          );
        }),
      )}
    </div>
  );
}
