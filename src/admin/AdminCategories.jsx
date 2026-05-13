import { useState } from 'react';
import { apiClient } from '../api/apiClient.js';
import EmptyState from '../components/EmptyState.jsx';

const emptyCategory = { id: '', name: '', icon: '', order: 0, active: true };

export default function AdminCategories({ user, categories, onSaved, notify }) {
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState('');

  const remove = async (category) => {
    setBusyId(category.id || category.name);
    try {
      await apiClient.deleteCategory({ adminToken: user.adminToken, id: category.id, name: category.name });
      notify('Kategori dihapus.');
      onSaved();
    } catch (error) {
      notify(error.message);
    } finally {
      setBusyId('');
    }
  };

  return (
    <section className="admin-stack">
      <div className="toolbar">
        <div>
          <span className="eyebrow">Kategori</span>
          <h2>Kelola kategori</h2>
        </div>
        <button className="button button--primary" type="button" onClick={() => setEditing(emptyCategory)}>Tambah kategori</button>
      </div>
      {categories.length === 0 ? (
        <EmptyState title="Kategori belum tersedia" description="Tambahkan kategori sebelum membuat produk." />
      ) : (
        <div className="category-admin-grid">
          {categories.map((category) => (
            <article className="panel category-admin-card" key={category.id || category.name}>
              <span className="category-admin-card__icon">{(category.name || 'K').slice(0, 2).toUpperCase()}</span>
              <div>
                <strong>{category.name}</strong>
                <span>Urutan {category.order} - {category.active ? 'Aktif' : 'Nonaktif'}</span>
              </div>
              <div className="button-row">
                <button className="button button--ghost" type="button" onClick={() => setEditing(category)}>Edit</button>
                <button className="button button--soft" type="button" disabled={busyId === (category.id || category.name)} onClick={() => remove(category)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
      {editing && <CategoryEditor user={user} category={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onSaved(); }} notify={notify} />}
    </section>
  );
}

function CategoryEditor({ user, category, onClose, onSaved, notify }) {
  const [form, setForm] = useState(category);
  const [busy, setBusy] = useState(false);
  const isNew = !category.id;

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (isNew) {
        await apiClient.createCategory({ adminToken: user.adminToken, category: form });
      } else {
        await apiClient.updateCategory({ adminToken: user.adminToken, category: form });
      }
      notify(isNew ? 'Kategori ditambahkan.' : 'Kategori diperbarui.');
      onSaved();
    } catch (error) {
      notify(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="modal auth-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <button className="icon-button modal__close" type="button" onClick={onClose} aria-label="Tutup">x</button>
        <span className="eyebrow">{isNew ? 'Tambah' : 'Edit'} kategori</span>
        <h2>Kategori</h2>
        <form onSubmit={submit}>
          <label>Nama<input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required /></label>
          <label>Urutan<input type="number" value={form.order} onChange={(event) => setForm((current) => ({ ...current, order: Number(event.target.value) }))} /></label>
          <label className="check-row"><input type="checkbox" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} /> Aktif</label>
          <button className="button button--primary button--block" type="submit" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan kategori'}</button>
        </form>
      </section>
    </div>
  );
}
