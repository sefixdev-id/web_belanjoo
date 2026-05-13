import { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';

export default function ImageCropModal({
  imageSrc,
  title = 'Crop gambar',
  aspect = 1,
  busy = false,
  onCancel,
  onConfirm,
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const handleCropComplete = useCallback((_, nextCroppedAreaPixels) => {
    setCroppedAreaPixels(nextCroppedAreaPixels);
  }, []);

  return (
    <div className="modal-backdrop" role="presentation" onClick={busy ? undefined : onCancel}>
      <section className="modal crop-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <button className="icon-button modal__close" type="button" onClick={onCancel} aria-label="Tutup" disabled={busy}>
          x
        </button>
        <span className="eyebrow">Preview crop</span>
        <h2>{title}</h2>
        <div className="crop-modal__stage">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
            showGrid={false}
          />
        </div>
        <label className="crop-modal__zoom">
          Zoom
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            disabled={busy}
          />
        </label>
        <div className="button-row crop-modal__actions">
          <button className="button button--ghost" type="button" onClick={onCancel} disabled={busy}>
            Batal
          </button>
          <button
            className="button button--primary"
            type="button"
            disabled={busy}
            onClick={() => onConfirm(croppedAreaPixels)}
          >
            {busy ? 'Mengupload...' : 'Pakai hasil crop'}
          </button>
        </div>
      </section>
    </div>
  );
}
