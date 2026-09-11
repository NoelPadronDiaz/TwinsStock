import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  StatsSummaryRow,
  StatsTimeseriesRow,
  fetchStatsSummary,
  fetchStatsTimeseries,
} from '../api/client';

type RangePreset = '7d' | '30d' | '90d';
type GroupBy = 'day' | 'week' | 'month';

const RANGE_PRESETS: { value: RangePreset; label: string; days: number }[] = [
  { value: '7d', label: 'Últimos 7 días', days: 7 },
  { value: '30d', label: 'Últimos 30 días', days: 30 },
  { value: '90d', label: 'Últimos 90 días', days: 90 },
];

// Fixed categorical order (never re-assigned when the filtered set changes).
const CONSUMABLE_COLORS: Record<string, string> = {
  Granola: '#2a78d6',
  'Leche en polvo': '#eb6834',
  'Crema de lotus': '#1baf7a',
  'Crema de pistacho': '#eda100',
  'Crema de cacahuete': '#e87ba4',
};
const FALLBACK_COLORS = ['#008300', '#4a3aa7', '#e34948'];

function colorForConsumable(name: string, index: number) {
  return CONSUMABLE_COLORS[name] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

const dateFormatter = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit' });

export default function DashboardPage() {
  const [preset, setPreset] = useState<RangePreset>('30d');
  const [groupBy, setGroupBy] = useState<GroupBy>('day');
  const [summary, setSummary] = useState<StatsSummaryRow[]>([]);
  const [timeseries, setTimeseries] = useState<StatsTimeseriesRow[]>([]);
  const [loading, setLoading] = useState(true);

  const { from, to } = useMemo(() => {
    const days = RANGE_PRESETS.find((p) => p.value === preset)!.days;
    const toDate = new Date();
    toDate.setHours(23, 59, 59, 999);
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days + 1);
    fromDate.setHours(0, 0, 0, 0);
    return { from: fromDate.toISOString(), to: toDate.toISOString() };
  }, [preset]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchStatsSummary(from, to), fetchStatsTimeseries(from, to, groupBy)]).then(
      ([summaryData, timeseriesData]) => {
        setSummary(summaryData);
        setTimeseries(timeseriesData);
        setLoading(false);
      },
    );
  }, [from, to, groupBy]);

  const consumableNames = useMemo(
    () => [...new Set(summary.map((row) => row.consumableName))].sort(),
    [summary],
  );

  const chartData = useMemo(() => {
    const byPeriod = new Map<string, Record<string, string | number>>();
    for (const row of timeseries) {
      const key = row.period;
      if (!byPeriod.has(key)) {
        byPeriod.set(key, { period: key });
      }
      byPeriod.get(key)![row.consumableName] = row.count;
    }
    return [...byPeriod.values()].sort((a, b) => String(a.period).localeCompare(String(b.period)));
  }, [timeseries]);

  const totalUnits = summary.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="dashboard-page">
      <div className="filters-row">
        <div className="preset-group">
          {RANGE_PRESETS.map((p) => (
            <button
              key={p.value}
              className={preset === p.value ? 'preset-button active' : 'preset-button'}
              onClick={() => setPreset(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <label className="groupby-select">
          Agrupar por
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)}>
            <option value="day">Día</option>
            <option value="week">Semana</option>
            <option value="month">Mes</option>
          </select>
        </label>
      </div>

      {loading ? (
        <p>Cargando estadísticas...</p>
      ) : (
        <>
          <section className="stat-tiles">
            <div className="stat-tile">
              <span className="stat-tile-label">Unidades consumidas</span>
              <span className="stat-tile-value">{totalUnits}</span>
            </div>
            {summary.slice(0, 3).map((row, index) => (
              <div className="stat-tile" key={row.consumableId}>
                <span
                  className="stat-tile-dot"
                  style={{ background: colorForConsumable(row.consumableName, index) }}
                />
                <span className="stat-tile-label">{row.consumableName}</span>
                <span className="stat-tile-value">{row.count}</span>
              </div>
            ))}
          </section>

          <section className="chart-card">
            <h2>Totales por producto</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={summary} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid vertical={false} stroke="var(--gridline)" />
                <XAxis
                  dataKey="consumableName"
                  tick={{ fill: 'var(--muted-ink)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--baseline)' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: 'var(--muted-ink)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--chart-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                  cursor={{ fill: 'var(--page-plane)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {summary.map((row, index) => (
                    <Cell key={row.consumableId} fill={colorForConsumable(row.consumableName, index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </section>

          <section className="chart-card">
            <h2>Tendencia en el tiempo</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid vertical={false} stroke="var(--gridline)" />
                <XAxis
                  dataKey="period"
                  tickFormatter={(value) => dateFormatter.format(new Date(value))}
                  tick={{ fill: 'var(--muted-ink)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--baseline)' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: 'var(--muted-ink)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip
                  labelFormatter={(value) => dateFormatter.format(new Date(value))}
                  contentStyle={{
                    background: 'var(--chart-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--secondary-ink)' }} />
                {consumableNames.map((name, index) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={colorForConsumable(name, index)}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </section>

          <section className="chart-card">
            <h2>Tabla de datos</h2>
            <div className="table-scroll">
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Unidades</th>
                    <th>Último consumo</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((row) => (
                    <tr key={row.consumableId}>
                      <td>{row.consumableName}</td>
                      <td>{row.count}</td>
                      <td>
                        {row.lastConsumedAt
                          ? new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(
                              new Date(row.lastConsumedAt),
                            )
                          : '—'}
                      </td>
                    </tr>
                  ))}
                  {summary.length === 0 && (
                    <tr>
                      <td colSpan={3} className="empty">
                        Sin datos en este rango.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
