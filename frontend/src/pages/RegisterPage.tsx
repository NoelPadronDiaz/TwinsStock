import { useEffect, useMemo, useState } from 'react';
import {
  Consumable,
  ConsumptionLog,
  fetchConsumables,
  fetchRecentLogs,
  registerConsumption,
} from '../api/client';

const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function groupByCategory(consumables: Consumable[]) {
  const groups = new Map<string, { name: string; items: Consumable[] }>();
  for (const consumable of consumables) {
    const key = consumable.categoryId ?? 'none';
    const name = consumable.category?.name ?? 'Otros';
    if (!groups.has(key)) {
      groups.set(key, { name, items: [] });
    }
    groups.get(key)!.items.push(consumable);
  }
  return [...groups.values()];
}

export default function RegisterPage() {
  const [consumables, setConsumables] = useState<Consumable[]>([]);
  const [recentLogs, setRecentLogs] = useState<ConsumptionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadData = async () => {
    const [consumablesData, logsData] = await Promise.all([fetchConsumables(), fetchRecentLogs(8)]);
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
      const logsData = await fetchRecentLogs(8);
      setRecentLogs(logsData);
    } finally {
      setRegisteringId(null);
      setTimeout(() => setFeedback(null), 3000);
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
            <h3 className="category-title">{group.name}</h3>
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
        <h2>Últimos registros</h2>
        <ul className="recent-list">
          {recentLogs.map((log) => (
            <li key={log.id}>
              <span className="recent-name">{log.consumable?.name}</span>
              <span className="recent-date">{dateFormatter.format(new Date(log.consumedAt))}</span>
            </li>
          ))}
          {recentLogs.length === 0 && <li className="empty">Aún no hay registros.</li>}
        </ul>
      </section>
    </div>
  );
}
