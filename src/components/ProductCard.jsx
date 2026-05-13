import ImageBox from './ImageBox.jsx';
import { formatCurrency } from '../utils/format.js';

export default function ProductCard({ product, onOpen, onAdd, canShop = true }) {
  const outOfStock = product.stock <= 0;

  return (
    <article className="product-card">
      <button className="product-card__media" type="button" onClick={() => onOpen(product)}>
        <ImageBox src={product.imageUrl} alt={product.name} />
        <span className={`product-badge ${outOfStock ? 'product-badge--muted' : ''}`}>
          {outOfStock ? 'Habis' : 'Ready'}
        </span>
      </button>
      <div className="product-card__body">
        <span className="product-card__category">{product.category || 'Produk'}</span>
        <button className="product-card__title" type="button" onClick={() => onOpen(product)}>
          {product.name}
        </button>
        <strong className="product-card__price">{formatCurrency(product.price)}</strong>
        <div className="product-card__meta">
          <span>Stok {product.stock}</span>
          {product.soldCount > 0 && <span>Terjual {product.soldCount}</span>}
        </div>
        {canShop && (
          <button
            className="button button--primary button--block"
            type="button"
            disabled={outOfStock}
            onClick={() => onAdd(product)}
          >
            {outOfStock ? 'Stok habis' : 'Tambah'}
          </button>
        )}
      </div>
    </article>
  );
}
