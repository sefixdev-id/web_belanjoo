import EmptyState from '../components/EmptyState.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { BannerSkeleton, ProductGridSkeleton } from '../components/Skeleton.jsx';

export default function Storefront({
  banners,
  categories,
  products,
  loading,
  query,
  category,
  onQueryChange,
  onCategoryChange,
  onOpenProduct,
  onAddToCart,
}) {
  const visibleBanner = banners[0];

  return (
    <main className="page-shell">
      <section className="hero-section">
        <div className="hero-section__copy">
          <span className="eyebrow">Marketplace BELANJOO</span>
          <h1>Belanja praktis dengan katalog yang ringan dan responsif.</h1>
          <p>Temukan produk, cek stok, lalu checkout langsung dari website BELANJOO.</p>
          <div className="search-bar">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Cari produk..."
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
            />
          </div>
        </div>
        <div className="hero-section__banner">
          {loading.banners ? (
            <BannerSkeleton />
          ) : visibleBanner ? (
            <img src={visibleBanner.imageUrl} alt={visibleBanner.title || 'Banner BELANJOO'} />
          ) : (
            <div className="banner banner--empty" />
          )}
        </div>
      </section>

      <section className="section">
        <div className="section__header">
          <div>
            <span className="eyebrow">Kategori</span>
            <h2>Pilih kebutuhanmu</h2>
          </div>
        </div>
        <div className="category-row">
          <button
            className={`chip ${category === '' ? 'chip--active' : ''}`}
            type="button"
            onClick={() => onCategoryChange('')}
          >
            Semua
          </button>
          {categories.map((item) => (
            <button
              className={`chip ${category === item ? 'chip--active' : ''}`}
              type="button"
              key={item}
              onClick={() => onCategoryChange(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section__header">
          <div>
            <span className="eyebrow">Produk</span>
            <h2>Katalog produk</h2>
          </div>
        </div>
        {loading.products ? (
          <ProductGridSkeleton />
        ) : products.length === 0 ? (
          <EmptyState title="Produk belum tersedia" description="Produk akan tampil setelah tersedia dari backend." />
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpen={onOpenProduct}
                onAdd={onAddToCart}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
