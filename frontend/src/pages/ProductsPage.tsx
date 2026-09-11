import { FormEvent, useEffect, useState } from 'react';
import {
  Category,
  Consumable,
  createConsumable,
  deleteConsumable,
  fetchCategories,
  fetchConsumables,
  StockStatus,
  updateConsumable,
} from '../api/client';

type StockFilter = 'all' | StockStatus;

const STOCK_FILTERS: { value: StockFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'in', label: 'En stock' },
  { value: 'out', label: 'Sin stock' },
];

const emptyForm = { name: '', categoryId: '' };

export default function ProductsPage() {
  const [products, setProducts] = useState<Consumable[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');

  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  const loadProducts = () =>
    fetchConsumables({
      includeInactive: true,
      categoryId: categoryFilter || undefined,
      stockStatus: stockFilter === 'all' ? undefined : stockFilter,
    }).then(setProducts);

  useEffect(() => {
    setLoading(true);
    loadProducts().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, stockFilter]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createConsumable(form);
      setForm(emptyForm);
      await loadProducts();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'No se ha podido crear el producto.');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (product: Consumable) => {
    setEditingId(product.id);
    setEditForm({ name: product.name, categoryId: product.categoryId ?? '' });
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(emptyForm);
  };

  const saveEdit = async (id: string) => {
    setError(null);
    setPendingId(id);
    try {
      await updateConsumable(id, { name: editForm.name, categoryId: editForm.categoryId });
      await loadProducts();
      cancelEdit();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'No se ha podido guardar el producto.');
    } finally {
      setPendingId(null);
    }
  };

  const toggleActive = async (product: Consumable) => {
    setPendingId(product.id);
    try {
      await updateConsumable(product.id, { active: !product.active });
      await loadProducts();
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (product: Consumable) => {
    const confirmed = window.confirm(
      `¿Borrar "${product.name}" definitivamente? Se perderá también su historial de consumos. Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;
    setPendingId(product.id);
    try {
      await deleteConsumable(product.id);
      await loadProducts();
    } finally {
      setPendingId(null);
    }
  };

  if (loading && products.length === 0) {
    return <p>Cargando...</p>;
  }

  return (
    <div className="products-page">
      <h2>Gestión de productos</h2>
      <p className="hint">Crea, edita, desactiva o borra productos del catálogo.</p>

      <form className="user-form" onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="Nombre del producto"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <select
          value={form.categoryId}
          onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          required
        >
          <option value="" disabled>
            Categoría
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Creando...' : 'Crear producto'}
        </button>
      </form>
      {error && <div className="feedback feedback-error">{error}</div>}

      <div className="filters-row">
        <label className="groupby-select">
          Categoría
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">Todas</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <div className="preset-group">
          {STOCK_FILTERS.map((option) => (
            <button
              key={option.value}
              className={stockFilter === option.value ? 'preset-button active' : 'preset-button'}
              onClick={() => setStockFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <table className="stats-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Stock</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              {editingId === product.id ? (
                <>
                  <td>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </td>
                  <td>
                    <select
                      value={editForm.categoryId}
                      onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{product.stock}</td>
                  <td>{product.active ? 'Activo' : 'Inactivo'}</td>
                  <td>
                    <button disabled={pendingId === product.id} onClick={() => saveEdit(product.id)}>
                      Guardar
                    </button>{' '}
                    <button disabled={pendingId === product.id} onClick={cancelEdit}>
                      Cancelar
                    </button>
                  </td>
                </>
              ) : (
                <>
                  <td>{product.name}</td>
                  <td>{product.category?.name ?? 'Sin categoría'}</td>
                  <td>{product.stock}</td>
                  <td>{product.active ? 'Activo' : 'Inactivo'}</td>
                  <td>
                    <button disabled={pendingId === product.id} onClick={() => startEdit(product)}>
                      Editar
                    </button>{' '}
                    <button disabled={pendingId === product.id} onClick={() => toggleActive(product)}>
                      {product.active ? 'Desactivar' : 'Activar'}
                    </button>{' '}
                    <button disabled={pendingId === product.id} onClick={() => handleDelete(product)}>
                      Borrar
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan={5} className="empty">
                Sin productos para estos filtros.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
