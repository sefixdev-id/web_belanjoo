import { useEffect, useState } from 'react';
import { apiClient } from '../api/apiClient.js';
import EmptyState from '../components/EmptyState.jsx';
import ImageBox from '../components/ImageBox.jsx';
import ImageCropModal from '../components/ImageCropModal.jsx';
import { cropImageFile } from '../utils/cropImage.js';
import { formatCurrency } from '../utils/format.js';

const emptyProduct = {
  id: '',
  name: '',
  category: '',
  price: 0,
  stock: 0,
  description: '',
  imageUrl: '',
  isBestSeller: false,
  soldCount: 0,
};

export default function AdminProducts({ user, products, categories, onSaved, notify }) {
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState('');

  const remove = async (product) => {
    setBusyId(product.id);
    try {
      await apiClient.deleteProduct({ adminToken: user.adminToken, id: product.id });
      notify('Produk dihapus.');
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
          <span className="eyebrow">Produk</span>
          <h2>Kelola katalog</h2>
        </div>
        <button className="button button--primary" type="button" onClick={() => setEditing(emptyProduct)}>
          Tambah produk
        </button>
      </div>

      {products.length === 0 ? (
        <EmptyState title="Produk belum tersedia" description="Tambahkan produk pertama untuk storefront." />
      ) : (
        <div className="admin-product-list">
          {products.map((product) => (
            <article className="admin-product-item" key={product.id}>
              <ImageBox src={product.imageUrl} alt={product.name} />
              <div>
                <strong>{product.name}</strong>
                <span>{product.category || 'Produk'} - Stok {product.stock} - Terjual {product.soldCount}</span>
              </div>
              <b>{formatCurrency(product.price)}</b>
              <div className="table-actions">
                <button className="button button--ghost" type="button" onClick={() => setEditing(product)}>Edit</button>
                <button className="button button--soft" type="button" disabled={busyId === product.id} onClick={() => remove(product)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && (
        <ProductEditor
          user={user}
          product={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            onSaved();
          }}
          notify={notify}
        />
      )}
    </section>
  );
}

function ProductEditor({ user, product, categories, onClose, onSaved, notify }) {
  const [form, setForm] = useState(product);
  const [busy, setBusy] = useState(false);
  const [cropRequest, setCropRequest] = useState(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState('');
  const isNew = !product.id;
  const imagePreview = localPreviewUrl || form.imageUrl;

  useEffect(() => {
    return () => {
      if (cropRequest?.url) URL.revokeObjectURL(cropRequest.url);
    };
  }, [cropRequest?.url]);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    };
  }, [localPreviewUrl]);

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const chooseImage = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setCropRequest({ file, url: URL.createObjectURL(file) });
  };

  const uploadCroppedImage = async (croppedAreaPixels) => {
    if (!cropRequest) return;
    setBusy(true);
    try {
      const file = await cropImageFile(cropRequest.url, croppedAreaPixels, cropRequest.file.name);
      setLocalPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return URL.createObjectURL(file);
      });
      const imageUrl = await apiClient.uploadImage({ adminToken: user.adminToken, file, target: 'product' });
      setField('imageUrl', imageUrl);
      setCropRequest(null);
      notify('Gambar produk berhasil diupload.');
    } catch (error) {
      notify(error.message || 'Crop gambar produk gagal.');
    } finally {
      setBusy(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (isNew) {
        await apiClient.createProduct({ adminToken: user.adminToken, product: form });
      } else {
        await apiClient.updateProduct({ adminToken: user.adminToken, product: form });
      }
      notify(isNew ? 'Produk ditambahkan.' : 'Produk diperbarui.');
      onSaved();
    } catch (error) {
      notify(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="modal editor-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <button className="icon-button modal__close" type="button" onClick={onClose} aria-label="Tutup">x</button>
        <span className="eyebrow">{isNew ? 'Tambah' : 'Edit'} produk</span>
        <h2>{isNew ? 'Produk baru' : form.name}</h2>
        <form onSubmit={submit}>
          <label>Nama produk<input value={form.name} onChange={(event) => setField('name', event.target.value)} required /></label>
          <label>
            Kategori
            <select value={form.category} onChange={(event) => setField('category', event.target.value)} required>
              <option value="">Pilih kategori</option>
              {categories.map((item) => (
                <option value={item.name} key={item.id || item.name}>{item.name}</option>
              ))}
            </select>
          </label>
          <div className="form-grid">
            <label>Harga<input type="number" min="0" value={form.price} onChange={(event) => setField('price', Number(event.target.value))} required /></label>
            <label>Stok<input type="number" min="0" value={form.stock} onChange={(event) => setField('stock', Number(event.target.value))} required /></label>
          </div>
          <label>Deskripsi<textarea value={form.description} onChange={(event) => setField('description', event.target.value)} required /></label>
          <label>URL gambar<input value={form.imageUrl} onChange={(event) => { setLocalPreviewUrl(''); setField('imageUrl', event.target.value); }} /></label>
          <label>Upload gambar<input type="file" accept="image/*" onChange={chooseImage} /></label>
          <label className="check-row"><input type="checkbox" checked={form.isBestSeller} onChange={(event) => setField('isBestSeller', event.target.checked)} /> Best seller</label>
          <div className="editor-preview">{imagePreview && <ImageBox src={imagePreview} alt={form.name} />}</div>
          <button className="button button--primary button--block" type="submit" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan produk'}</button>
        </form>
        {cropRequest && (
          <ImageCropModal
            imageSrc={cropRequest.url}
            title="Crop gambar produk"
            aspect={1}
            busy={busy}
            onCancel={() => setCropRequest(null)}
            onConfirm={uploadCroppedImage}
          />
        )}
      </section>
    </div>
  );
}
