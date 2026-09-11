import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Consumable,
  ConsumptionLog,
  deleteConsumptionLog,
  fetchConsumables,
  fetchConsumptionLogs,
  registerConsumption,
} from '../api/client';
import { TrashIcon } from '../components/icons';
import { getCategoryIcon } from '../utils/categoryIcons';
import { groupByCategory } from '../utils/groupByCategory';

const RECENT_LOGS_LIMIT = 8;

const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export default function RegisterPage() {
  const [consumables, setConsumables] = useState<Consumable[]>([]);
  const [recentLogs, setRecentLogs] = useState<ConsumptionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadData = async () => {
    const [consumablesData, logsData] = await Promise.all([
      fetchConsumables(),
      fetchConsumptionLogs({ limit: RECENT_LOGS_LIMIT }),
    ]);
    setConsumables(consumablesData);
    setRecentLogs(logsData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegister = async (consumable: Consumable) => {
    setRegisteringId(consumable.id);
    setFeedback(null);
    try {
      await registerConsumption(consumable.id);
      setFeedback(`${consumable.name} registrado.`);
      const logsData = await fetchConsumptionLogs({ limit: RECENT_LOGS_LIMIT });
      setRecentLogs(logsData);
    } finally {
      setRegisteringId(null);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleDeleteLog = async (log: ConsumptionLog) => {
    const confirmed = window.confirm(
      `¿Eliminar el registro de "${log.consumable?.name ?? 'este producto'}"? Se devolverá 1 unidad al stock.`,
    );
    if (!confirmed) return;
    setDeletingLogId(log.id);
    try {
      await deleteConsumptionLog(log.id);
      const logsData = await fetchConsumptionLogs({ limit: RECENT_LOGS_LIMIT });
      setRecentLogs(logsData);
    } finally {
      setDeletingLogId(null);
    }
  };

  const categoryGroups = useMemo(() => groupByCategory(consumables), [consumables]);

  if (loading) {
    return <p>Cargando...</p>;
  }

  return (
    <div className="register-page">
      <section>
        <h2>¿Qué acabas de abrir?</h2>
        <p className="hint">Toca un producto para registrar que se ha abierto ahora mismo.</p>
        {categoryGroups.map((group) => (
          <div className="category-group" key={group.name}>
            <h3 className="category-title">
              <span className="category-icon" aria-hidden="true">
                {getCategoryIcon(group.name)}
              </span>
              {group.name}
            </h3>
            <div className="consumable-grid">
              {group.items.map((consumable) => (
                <button
                  key={consumable.id}
                  className="consumable-button"
                  disabled={registeringId === consumable.id}
                  onClick={() => handleRegister(consumable)}
                >
                  {registeringId === consumable.id ? 'Guardando...' : consumable.name}
                </button>
              ))}
            </div>
          </div>
        ))}
        {feedback && <div className="feedback">{feedback}</div>}
      </section>

      <section>
        <div className="section-heading">
          <h2>Últimos registros</h2>
          <Link to="/history" className="section-link">
            Ver historial completo
          </Link>
        </div>
        <ul className="recent-list">
          {recentLogs.map((log) => (
            <li key={log.id}>
              <span className="recent-name">{log.consumable?.name}</span>
              <span className="recent-date">{dateFormatter.format(new Date(log.consumedAt))}</span>
              <button
                className="icon-button icon-button-danger"
                disabled={deletingLogId === log.id}
                onClick={() => handleDeleteLog(log)}
                aria-label={`Eliminar registro de ${log.consumable?.name ?? ''}`}
                title="Eliminar"
              >
                <TrashIcon />
              </button>
            </li>
          ))}
          {recentLogs.length === 0 && <li className="empty">Aún no hay registros.</li>}
        </ul>
      </section>
    </div>
  );
}
