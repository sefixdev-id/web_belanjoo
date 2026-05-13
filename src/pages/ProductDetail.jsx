import ImageBox from '../components/ImageBox.jsx';
import { formatCurrency } from '../utils/format.js';

const whatsappNumber = '6282385414776';

export default function ProductDetail({ product, onClose, onAddToCart, canShop = true }) {
  if (!product) return null;

  const message = encodeURIComponent(
    `Halo BELANJOO, saya ingin tanya produk ${product.name} seharga ${formatCurrency(product.price)}.`,
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <article className="modal product-detail" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <button className="icon-button modal__close" type="button" onClick={onClose} aria-label="Tutup">
          x
        </button>
        <ImageBox className="product-detail__image" src={product.imageUrl} alt={product.name} />
        <div className="product-detail__content">
          <span className="eyebrow">{product.category || 'Produk'}</span>
          <h2>{product.name}</h2>
          <strong className="product-detail__price">{formatCurrency(product.price)}</strong>
          <div className="product-detail__meta">
            <span>Stok {product.stock}</span>
            {product.soldCount > 0 && <span>Terjual {product.soldCount}</span>}
          </div>
          <div className="product-detail__summary">
            <div>
              <span>Kategori</span>
              <strong>{product.category || 'Produk'}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{product.stock > 0 ? 'Siap dibeli' : 'Stok habis'}</strong>
            </div>
          </div>
          <p>{product.description || 'Deskripsi produk belum tersedia.'}</p>
          <div className="button-row">
            {canShop && (
              <button className="button button--primary" type="button" onClick={() => onAddToCart(product)} disabled={product.stock <= 0}>
                Tambah ke keranjang
              </button>
            )}
            <a className="button button--ghost" href={whatsappUrl} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          </div>
        </div>
      </article>
    </div>
  );
}
