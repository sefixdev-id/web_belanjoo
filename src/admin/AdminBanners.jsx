import { useEffect, useState } from 'react';
import { apiClient } from '../api/apiClient.js';
import EmptyState from '../components/EmptyState.jsx';
import ImageBox from '../components/ImageBox.jsx';
import ImageCropModal from '../components/ImageCropModal.jsx';
import { cropImageFile } from '../utils/cropImage.js';

const emptyBanner = { id: '', title: '', imageUrl: '', isActive: true };

export default function AdminBanners({ user, banners, onSaved, notify }) {
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState('');

  const remove = async (banner) => {
    setBusyId(banner.id);
    try {
      await apiClient.deleteBanner({ adminToken: user.adminToken, id: banner.id });
      notify('Banner dihapus.');
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
          <span className="eyebrow">Banner</span>
          <h2>Promo storefront</h2>
        </div>
        <button className="button button--primary" type="button" onClick={() => setEditing(emptyBanner)}>Tambah banner</button>
      </div>

      {banners.length === 0 ? (
        <EmptyState title="Banner belum tersedia" description="Tambahkan banner promosi untuk home website." />
      ) : (
        <div className="banner-admin-grid">
          {banners.map((banner) => (
            <article className="panel banner-admin-card" key={banner.id}>
              <div className="banner-preview"><ImageBox src={banner.imageUrl} alt={banner.title || 'Banner'} /></div>
              <div>
                <strong>{banner.title || 'Banner'}</strong>
                <span>{banner.isActive ? 'Aktif' : 'Nonaktif'}</span>
              </div>
              <div className="button-row">
                <button className="button button--ghost" type="button" onClick={() => setEditing(banner)}>Edit</button>
                <button className="button button--soft" type="button" disabled={busyId === banner.id} onClick={() => remove(banner)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
      {editing && <BannerEditor user={user} banner={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onSaved(); }} notify={notify} />}
    </section>
  );
}

function BannerEditor({ user, banner, onClose, onSaved, notify }) {
  const [form, setForm] = useState(banner);
  const [busy, setBusy] = useState(false);
  const [cropRequest, setCropRequest] = useState(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState('');
  const isNew = !banner.id;
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
      const imageUrl = await apiClient.uploadImage({ adminToken: user.adminToken, file, target: 'banner' });
      setForm((current) => ({ ...current, imageUrl }));
      setCropRequest(null);
      notify('Gambar banner berhasil diupload.');
    } catch (error) {
      notify(error.message || 'Crop gambar banner gagal.');
    } finally {
      setBusy(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (isNew) {
        await apiClient.createBanner({ adminToken: user.adminToken, banner: form });
      } else {
        await apiClient.updateBanner({ adminToken: user.adminToken, banner: form });
      }
      notify(isNew ? 'Banner ditambahkan.' : 'Banner diperbarui.');
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
        <span className="eyebrow">{isNew ? 'Tambah' : 'Edit'} banner</span>
        <h2>Banner promosi</h2>
        <form onSubmit={submit}>
          <label>Judul<input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /></label>
          <label>URL gambar<input value={form.imageUrl} onChange={(event) => { setLocalPreviewUrl(''); setForm((current) => ({ ...current, imageUrl: event.target.value })); }} required /></label>
          <label>Upload banner<input type="file" accept="image/*" onChange={chooseImage} /></label>
          <label className="check-row"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} /> Banner aktif</label>
          <div className="banner-preview banner-preview--large">{imagePreview && <ImageBox src={imagePreview} alt={form.title || 'Banner'} />}</div>
          <button className="button button--primary button--block" type="submit" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan banner'}</button>
        </form>
        {cropRequest && (
          <ImageCropModal
            imageSrc={cropRequest.url}
            title="Crop banner"
            aspect={16 / 6}
            busy={busy}
            onCancel={() => setCropRequest(null)}
            onConfirm={uploadCroppedImage}
          />
        )}
      </section>
    </div>
  );
}
