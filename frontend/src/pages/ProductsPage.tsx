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
import { CloseIcon, EditIcon, PowerIcon, TrashIcon } from '../components/icons';

type StockFilter = 'all' | StockStatus;
type ActiveFilter = 'all' | 'active' | 'inactive';

const STOCK_FILTERS: { value: StockFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'in', label: 'En stock' },
  { value: 'out', label: 'Sin stock' },
];

const ACTIVE_FILTERS: { value: ActiveFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
];

const emptyForm = { name: '', categoryId: '' };

export default function ProductsPage() {
  const [products, setProducts] = useState<Consumable[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');

  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalProduct, setModalProduct] = useState<Consumable | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [modalError, setModalError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  const loadProducts = () =>
    fetchConsumables({
      includeInactive: true,
      active: activeFilter === 'all' ? undefined : activeFilter === 'active',
      categoryId: categoryFilter || undefined,
      stockStatus: stockFilter === 'all' ? undefined : stockFilter,
    }).then(setProducts);

  useEffect(() => {
    setLoading(true);
    loadProducts().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, stockFilter, activeFilter]);

  useEffect(() => {
    if (!modalProduct) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalProduct]);

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

  const openModal = (product: Consumable) => {
    setModalProduct(product);
    setEditForm({ name: product.name, categoryId: product.categoryId ?? '' });
    setModalError(null);
  };

  const closeModal = () => {
    setModalProduct(null);
    setEditForm(emptyForm);
    setModalError(null);
  };

  const handleSave = async () => {
    if (!modalProduct) return;
    setModalError(null);
    setActionPending(true);
    try {
      await updateConsumable(modalProduct.id, { name: editForm.name, categoryId: editForm.categoryId });
      await loadProducts();
      closeModal();
    } catch (err: any) {
      setModalError(err.response?.data?.message ?? 'No se ha podido guardar el producto.');
    } finally {
      setActionPending(false);
    }
  };

  const handleToggleActive = async () => {
    if (!modalProduct) return;
    setActionPending(true);
    try {
      const updated = await updateConsumable(modalProduct.id, { active: !modalProduct.active });
      setModalProduct(updated);
      await loadProducts();
    } finally {
      setActionPending(false);
    }
  };

  const handleDelete = async () => {
    if (!modalProduct) return;
    const confirmed = window.confirm(
      `¿Borrar "${modalProduct.name}" definitivamente? Se perderá también su historial de consumos. Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;
    setActionPending(true);
    try {
      await deleteConsumable(modalProduct.id);
      await loadProducts();
      closeModal();
    } finally {
      setActionPending(false);
    }
  };

  if (loading && products.length === 0) {
    return <p>Cargando...</p>;
  }

  return (
    <div className="products-page">
      <h2>Gestión de productos</h2>
      <p className="hint">Crea productos y toca el icono de editar para gestionarlos.</p>

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
        <div className="preset-group">
          {ACTIVE_FILTERS.map((option) => (
            <button
              key={option.value}
              className={activeFilter === option.value ? 'preset-button active' : 'preset-button'}
              onClick={() => setActiveFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="table-scroll">
        <table className="stats-table">
          <thead>
            <tr>
              <th></th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td className="table-actions">
                  <button className="icon-button" onClick={() => openModal(product)} aria-label={`Editar ${product.name}`} title="Editar">
                    <EditIcon />
                  </button>
                </td>
                <td>{product.name}</td>
                <td>{product.category?.name ?? 'Sin categoría'}</td>
                <td>{product.stock}</td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={4} className="empty">
                  Sin productos para estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalProduct && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar producto</h3>
              <button className="modal-close" onClick={closeModal} aria-label="Cerrar">
                <CloseIcon />
              </button>
            </div>

            <div className="modal-body">
              <label className="modal-field">
                Nombre
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </label>
              <label className="modal-field">
                Categoría
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
              </label>
              <div className="modal-info-row">
                <span>Stock actual</span>
                <strong>{modalProduct.stock}</strong>
              </div>
              <div className="modal-info-row">
                <span>Estado</span>
                <strong>{modalProduct.active ? 'Activo' : 'Inactivo'}</strong>
              </div>
            </div>

            {modalError && <div className="feedback feedback-error">{modalError}</div>}

            <div className="modal-actions">
              <button
                className="icon-button"
                disabled={actionPending}
                onClick={handleToggleActive}
                aria-label={modalProduct.active ? 'Desactivar' : 'Activar'}
                title={modalProduct.active ? 'Desactivar' : 'Activar'}
              >
                <PowerIcon />
              </button>
              <button
                className="icon-button icon-button-danger"
                disabled={actionPending}
                onClick={handleDelete}
                aria-label="Borrar"
                title="Borrar"
              >
                <TrashIcon />
              </button>
              <div className="modal-actions-spacer" />
              <button className="modal-cancel" disabled={actionPending} onClick={closeModal}>
                Cancelar
              </button>
              <button className="modal-save" disabled={actionPending} onClick={handleSave}>
                {actionPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
