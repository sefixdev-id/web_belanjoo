import ImageBox from './ImageBox.jsx';
import { formatCurrency } from '../utils/format.js';

export default function ProductCard({ product, onOpen, onAdd }) {
  const outOfStock = product.stock <= 0;

  return (
    <article className="product-card">
      <button className="product-card__media" type="button" onClick={() => onOpen(product)}>
        <ImageBox src={product.imageUrl} alt={product.name} />
      </button>
      <div className="product-card__body">
        <button className="product-card__title" type="button" onClick={() => onOpen(product)}>
          {product.name}
        </button>
        <span className="product-card__category">{product.category || 'Produk'}</span>
        <strong>{formatCurrency(product.price)}</strong>
        <div className="product-card__meta">
          <span>Stok {product.stock}</span>
          {product.soldCount > 0 && <span>Terjual {product.soldCount}</span>}
        </div>
        <button
          className="button button--primary button--block"
          type="button"
          disabled={outOfStock}
          onClick={() => onAdd(product)}
        >
          {outOfStock ? 'Stok habis' : 'Tambah'}
        </button>
      </div>
    </article>
  );
}
