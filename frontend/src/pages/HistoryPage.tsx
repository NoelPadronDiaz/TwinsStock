import { useEffect, useMemo, useState } from 'react';
import {
  Consumable,
  ConsumptionLog,
  deleteConsumptionLog,
  fetchConsumables,
  fetchConsumptionLogs,
} from '../api/client';
import { TrashIcon } from '../components/icons';

type RangePreset = '7d' | '30d' | '90d' | 'all';

const RANGE_PRESETS: { value: RangePreset; label: string; days: number | null }[] = [
  { value: '7d', label: 'Últimos 7 días', days: 7 },
  { value: '30d', label: 'Últimos 30 días', days: 30 },
  { value: '90d', label: 'Últimos 90 días', days: 90 },
  { value: 'all', label: 'Todo', days: null },
];

const PAGE_SIZE = 50;

const dateFormatter = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' });

export default function HistoryPage() {
  const [logs, setLogs] = useState<ConsumptionLog[]>([]);
  const [consumables, setConsumables] = useState<Consumable[]>([]);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState<RangePreset>('30d');
  const [consumableFilter, setConsumableFilter] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchConsumables({ includeInactive: true }).then(setConsumables);
  }, []);

  const { from, to } = useMemo(() => {
    const option = RANGE_PRESETS.find((p) => p.value === preset)!;
    if (option.days === null) return { from: undefined, to: undefined };
    const toDate = new Date();
    toDate.setHours(23, 59, 59, 999);
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - option.days + 1);
    fromDate.setHours(0, 0, 0, 0);
    return { from: fromDate.toISOString(), to: toDate.toISOString() };
  }, [preset]);

  const loadLogs = (currentLimit: number) =>
    fetchConsumptionLogs({
      from,
      to,
      consumableId: consumableFilter || undefined,
      limit: currentLimit,
    }).then(setLogs);

  useEffect(() => {
    setLoading(true);
    setLimit(PAGE_SIZE);
    loadLogs(PAGE_SIZE).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, consumableFilter]);

  const handleLoadMore = async () => {
    const nextLimit = limit + PAGE_SIZE;
    setLimit(nextLimit);
    await loadLogs(nextLimit);
  };

  const handleDelete = async (log: ConsumptionLog) => {
    const confirmed = window.confirm(
      `¿Eliminar el registro de "${log.consumable?.name ?? 'este producto'}"? Se devolverá 1 unidad al stock.`,
    );
    if (!confirmed) return;
    setDeletingId(log.id);
    try {
      await deleteConsumptionLog(log.id);
      await loadLogs(limit);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && logs.length === 0) {
    return <p>Cargando...</p>;
  }

  return (
    <div className="history-page">
      <h2>Historial de consumos</h2>
      <p className="hint">Consulta el registro completo de consumos y corrige errores.</p>

      <div className="filters-row">
        <div className="preset-group">
          {RANGE_PRESETS.map((option) => (
            <button
              key={option.value}
              className={preset === option.value ? 'preset-button active' : 'preset-button'}
              onClick={() => setPreset(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <label className="groupby-select">
          Producto
          <select value={consumableFilter} onChange={(e) => setConsumableFilter(e.target.value)}>
            <option value="">Todos</option>
            {consumables.map((consumable) => (
              <option key={consumable.id} value={consumable.id}>
                {consumable.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="table-scroll">
        <table className="stats-table">
          <thead>
            <tr>
              <th></th>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Fecha y hora</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="table-actions">
                  <button
                    className="icon-button icon-button-danger"
                    disabled={deletingId === log.id}
                    onClick={() => handleDelete(log)}
                    aria-label={`Eliminar registro de ${log.consumable?.name ?? ''}`}
                    title="Eliminar"
                  >
                    <TrashIcon />
                  </button>
                </td>
                <td>{log.consumable?.name ?? '—'}</td>
                <td>{log.consumable?.category?.name ?? 'Sin categoría'}</td>
                <td>{dateFormatter.format(new Date(log.consumedAt))}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="empty">
                  Sin registros para estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {logs.length > 0 && logs.length >= limit && (
        <button className="load-more-button" onClick={handleLoadMore}>
          Cargar más
        </button>
      )}
    </div>
  );
}
