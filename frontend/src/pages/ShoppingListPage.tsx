import { useEffect, useMemo, useState } from 'react';
import {
  addToShoppingList,
  Consumable,
  fetchConsumables,
  fetchPurchaseLogs,
  fetchShoppingList,
  markAsPurchased,
  Market,
  MARKETS,
  PurchaseLog,
  removeFromShoppingList,
  setShoppingItemMarket,
  ShoppingListItem,
} from '../api/client';
import { CheckIcon, TrashIcon } from '../components/icons';
import { exportShoppingListPdf } from '../utils/shoppingListPdf';
import './ShoppingListPage.css';

type Tab = Market | 'none';

const NONE_LABEL = 'Sin supermercado';

const purchaseDateFormatter = new Intl.DateTimeFormat('es-ES', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function tabLabel(tab: Tab) {
  return tab === 'none' ? NONE_LABEL : tab;
}

export default function ShoppingListPage() {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [consumables, setConsumables] = useState<Consumable[]>([]);
  const [purchases, setPurchases] = useState<PurchaseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('Mercadona');
  const [selectedConsumableId, setSelectedConsumableId] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    const [listData, consumablesData, purchasesData] = await Promise.all([
      fetchShoppingList(),
      fetchConsumables(),
      fetchPurchaseLogs(),
    ]);
    setItems(listData);
    setConsumables(consumablesData);
    setPurchases(purchasesData);
  };

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const result = new Map<Tab, number>();
    for (const item of items) {
      const key: Tab = item.market ?? 'none';
      result.set(key, (result.get(key) ?? 0) + 1);
    }
    return result;
  }, [items]);

  const visibleTabs: Tab[] = useMemo(
    () => (counts.get('none') ? [...MARKETS, 'none'] : [...MARKETS]),
    [counts],
  );

  const tabItems = useMemo(
    () => items.filter((item) => (item.market ?? 'none') === activeTab),
    [items, activeTab],
  );

  const addableByCategory = useMemo(() => {
    const inCart = new Set(items.map((item) => item.consumableId));
    const groups = new Map<string, Consumable[]>();
    for (const c of consumables) {
      if (!c.active || inCart.has(c.id)) continue;
      const key = c.category?.name ?? 'Otros';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(c);
    }
    return [...groups.entries()];
  }, [consumables, items]);

  const run = async (consumableId: string, action: () => Promise<unknown>) => {
    setPendingId(consumableId);
    setError(null);
    try {
      await action();
      await reload();
    } catch {
      setError('No se pudo guardar el cambio. Inténtalo de nuevo.');
    } finally {
      setPendingId(null);
    }
  };

  const handleAdd = async () => {
    if (!selectedConsumableId) return;
    const market = activeTab === 'none' ? null : activeTab;
    await run(selectedConsumableId, () => addToShoppingList(selectedConsumableId, market));
    setSelectedConsumableId('');
  };

  const handleMove = (item: ShoppingListItem, value: string) => {
    const market = value === 'none' ? null : (value as Market);
    run(item.consumableId, () => setShoppingItemMarket(item.consumableId, market));
  };

  const handleRemove = (item: ShoppingListItem) => {
    run(item.consumableId, () => removeFromShoppingList(item.consumableId));
  };

  const handleMarkPurchased = (item: ShoppingListItem) => {
    run(item.consumableId, () => markAsPurchased(item.consumableId));
  };

  const handleExport = () => {
    exportShoppingListPdf(tabLabel(activeTab), tabItems);
  };

  if (loading) {
    return <p>Cargando...</p>;
  }

  return (
    <div className="shopping-page">
      <h2>Cesta de la compra</h2>
      <p className="hint">
        Cada consumo añade una unidad a la lista de su supermercado. Al comprar un producto,
        pulsa el check: pasará al histórico de compras con la fecha.
      </p>

      <div className="market-tabs" role="tablist" aria-label="Supermercados">
        {visibleTabs.map((tab) => {
          const count = counts.get(tab) ?? 0;
          const selected = tab === activeTab;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={selected}
              className={selected ? 'market-tab active' : 'market-tab'}
              onClick={() => setActiveTab(tab)}
            >
              {tabLabel(tab)}
              <span className="market-tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="shopping-toolbar">
        <div className="shopping-add">
          <select
            value={selectedConsumableId}
            onChange={(e) => setSelectedConsumableId(e.target.value)}
            aria-label="Producto a añadir"
          >
            <option value="">Añadir producto…</option>
            {addableByCategory.map(([categoryName, list]) => (
              <optgroup key={categoryName} label={categoryName}>
                {list.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <button type="button" onClick={handleAdd} disabled={!selectedConsumableId || pendingId !== null}>
            Añadir a {tabLabel(activeTab)}
          </button>
        </div>
        <button type="button" className="shopping-export" onClick={handleExport}>
          Exportar PDF
        </button>
      </div>

      {error && <div className="feedback feedback-error">{error}</div>}

      <ul className="shopping-list">
        {tabItems.map((item) => (
          <li key={item.id} className="shopping-item">
            <div className="shopping-item-info">
              <span className="shopping-item-name">
                {item.consumable.name}
                {item.quantity > 1 && <span className="shopping-item-qty"> ×{item.quantity}</span>}
              </span>
              <span className="shopping-item-meta">
                {item.consumable.category?.name ?? 'Sin categoría'} · stock {item.consumable.stock}
                {item.consumable.minStock > 0 && ` · mínimo ${item.consumable.minStock}`}
              </span>
            </div>
            <div className="shopping-item-actions">
              <select
                value={item.market ?? 'none'}
                onChange={(e) => handleMove(item, e.target.value)}
                disabled={pendingId === item.consumableId}
                aria-label={`Supermercado de ${item.consumable.name}`}
              >
                <option value="none">{NONE_LABEL}</option>
                {MARKETS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <button
                className="icon-button shopping-check"
                onClick={() => handleMarkPurchased(item)}
                disabled={pendingId === item.consumableId}
                aria-label={`Marcar ${item.consumable.name} como comprado`}
                title="Comprado"
              >
                <CheckIcon />
              </button>
              <button
                className="icon-button icon-button-danger"
                onClick={() => handleRemove(item)}
                disabled={pendingId === item.consumableId}
                aria-label={`Quitar ${item.consumable.name} de la lista`}
                title="Quitar"
              >
                <TrashIcon />
              </button>
            </div>
          </li>
        ))}
        {tabItems.length === 0 && <li className="empty">No hay productos en esta lista.</li>}
      </ul>

      <section className="purchase-history">
        <h3>Compras realizadas</h3>
        <ul className="purchase-list">
          {purchases.map((purchase) => (
            <li key={purchase.id} className="purchase-item">
              <span className="purchase-name">
                {purchase.consumableName}
                {purchase.quantity > 1 && <span className="shopping-item-qty"> ×{purchase.quantity}</span>}
              </span>
              <span className="purchase-meta">
                {purchase.market ?? NONE_LABEL} · {purchaseDateFormatter.format(new Date(purchase.purchasedAt))}
              </span>
            </li>
          ))}
          {purchases.length === 0 && <li className="empty">Aún no hay compras registradas.</li>}
        </ul>
      </section>
    </div>
  );
}
