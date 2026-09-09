import { useEffect, useMemo, useState } from 'react';
import { adjustStock, Consumable, fetchConsumables } from '../api/client';
import { groupByCategory } from '../utils/groupByCategory';

export default function StockPage() {
  const [consumables, setConsumables] = useState<Consumable[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    fetchConsumables().then((data) => {
      setConsumables(data);
      setLoading(false);
    });
  }, []);

  const handleAdjust = async (consumable: Consumable, delta: number) => {
    setPendingId(consumable.id);
    try {
      const updated = await adjustStock(consumable.id, delta);
      setConsumables((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } finally {
      setPendingId(null);
    }
  };

  const categoryGroups = useMemo(() => groupByCategory(consumables), [consumables]);

  if (loading) {
    return <p>Cargando...</p>;
  }

  return (
    <div className="stock-page">
      <h2>Control de stock</h2>
      <p className="hint">
        Usa + y − para ajustar las unidades que hay ahora mismo. Restar aquí no cuenta como
        consumo; para eso usa "Registrar consumo".
      </p>
      {categoryGroups.map((group) => (
        <div className="category-group" key={group.name}>
          <h3 className="category-title">{group.name}</h3>
          <div className="stock-grid">
            {group.items.map((consumable) => (
              <div className="stock-card" key={consumable.id}>
                <span className="stock-card-name">{consumable.name}</span>
                <div className="stock-card-controls">
                  <button
                    className="stock-step-button"
                    disabled={pendingId === consumable.id || consumable.stock <= 0}
                    onClick={() => handleAdjust(consumable, -1)}
                    aria-label={`Restar unidad de ${consumable.name}`}
                  >
                    −
                  </button>
                  <span className="stock-card-count">{consumable.stock}</span>
                  <button
                    className="stock-step-button"
                    disabled={pendingId === consumable.id}
                    onClick={() => handleAdjust(consumable, 1)}
                    aria-label={`Añadir unidad de ${consumable.name}`}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
