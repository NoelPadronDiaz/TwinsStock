import { useEffect, useMemo, useState } from 'react';
import { adjustStock, Consumable, fetchConsumables } from '../api/client';
import { ChevronDownIcon, CloseIcon, ListPlusIcon } from '../components/icons';
import { getCategoryIcon } from '../utils/categoryIcons';
import { groupByCategory } from '../utils/groupByCategory';

export default function StockPage() {
  const [consumables, setConsumables] = useState<Consumable[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const [manualItem, setManualItem] = useState<Consumable | null>(null);
  const [manualQty, setManualQty] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

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

  const toggleCategory = (name: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const openManualModal = (consumable: Consumable) => {
    setManualItem(consumable);
    setManualQty('');
    setManualError(null);
  };

  const closeManualModal = () => {
    setManualItem(null);
    setManualQty('');
    setManualError(null);
  };

  useEffect(() => {
    if (!manualItem) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeManualModal();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualItem]);

  const handleManualSubmit = async () => {
    if (!manualItem) return;
    const qty = Number(manualQty);
    if (!Number.isInteger(qty) || qty <= 0) {
      setManualError('Introduce una cantidad entera mayor que 0.');
      return;
    }
    setManualSubmitting(true);
    setManualError(null);
    try {
      const updated = await adjustStock(manualItem.id, qty);
      setConsumables((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      closeManualModal();
    } catch {
      setManualError('No se pudo guardar. Inténtalo de nuevo.');
    } finally {
      setManualSubmitting(false);
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
        consumo; para eso usa "Registrar consumo". Usa el icono de lista para introducir a mano
        la cantidad que acabas de reponer.
      </p>
      {categoryGroups.map((group) => {
        const isExpanded = expandedCategories.has(group.name);
        return (
          <div className="category-group" key={group.name}>
            <button
              type="button"
              className="category-title category-toggle"
              onClick={() => toggleCategory(group.name)}
              aria-expanded={isExpanded}
            >
              <span className="category-icon" aria-hidden="true">
                {getCategoryIcon(group.name)}
              </span>
              {group.name}
              <span className="category-count">{group.items.length}</span>
              <span className={isExpanded ? 'category-chevron open' : 'category-chevron'} aria-hidden="true">
                <ChevronDownIcon />
              </span>
            </button>
            {isExpanded && (
              <div className="stock-grid">
                {group.items.map((consumable) => (
                  <div className="stock-card" key={consumable.id}>
                    <span className="stock-card-name">{consumable.name}</span>
                    <div className="stock-card-controls">
                      <button
                        className="stock-step-button stock-step-button-subtract"
                        disabled={pendingId === consumable.id || consumable.stock <= 0}
                        onClick={() => handleAdjust(consumable, -1)}
                        aria-label={`Restar unidad de ${consumable.name}`}
                      >
                        −
                      </button>
                      <span className="stock-card-count">{consumable.stock}</span>
                      <button
                        className="stock-step-button stock-step-button-add"
                        disabled={pendingId === consumable.id}
                        onClick={() => handleAdjust(consumable, 1)}
                        aria-label={`Añadir unidad de ${consumable.name}`}
                      >
                        +
                      </button>
                      <button
                        className="icon-button stock-manual-button"
                        disabled={pendingId === consumable.id}
                        onClick={() => openManualModal(consumable)}
                        aria-label={`Ingresar cantidad a mano para ${consumable.name}`}
                        title="Ingresar cantidad a mano"
                      >
                        <ListPlusIcon />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {manualItem && (
        <div className="modal-overlay" onClick={closeManualModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reponer {manualItem.name}</h3>
              <button className="modal-close" onClick={closeManualModal} aria-label="Cerrar">
                <CloseIcon />
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-info-row">
                <span>Stock actual</span>
                <strong>{manualItem.stock}</strong>
              </div>
              <label className="modal-field">
                Unidades a reponer
                <input
                  type="number"
                  min={1}
                  autoFocus
                  value={manualQty}
                  onChange={(e) => setManualQty(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                />
              </label>
            </div>

            {manualError && <div className="feedback feedback-error">{manualError}</div>}

            <div className="modal-actions">
              <div className="modal-actions-spacer" />
              <button className="modal-cancel" disabled={manualSubmitting} onClick={closeManualModal}>
                Cancelar
              </button>
              <button className="modal-save" disabled={manualSubmitting || !manualQty} onClick={handleManualSubmit}>
                {manualSubmitting ? 'Guardando...' : 'Reponer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
