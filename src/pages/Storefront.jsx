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
  canShop = true,
}) {
  const visibleBanner = banners[0];
  const featured = products.filter((product) => product.isBestSeller || product.soldCount > 0).slice(0, 6);
  const categoryStats = categories.map((item) => ({
    ...item,
    count: products.filter((product) => product.category === item.name).length,
  }));

  return (
    <main className="page-shell">
      <section className="hero-section">
        <div className="hero-section__copy">
          <span className="eyebrow">Marketplace BELANJOO</span>
          <h1>Belanja praktis dengan katalog yang ringan dan responsif.</h1>
          <p>Temukan produk, cek stok, lalu checkout langsung dari website BELANJOO.</p>
          <div className="search-bar">
            <span aria-hidden="true">Search</span>
            <input
              type="search"
              placeholder="Cari HP, charger, aksesoris..."
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
            />
          </div>
          <div className="hero-perks" aria-label="Keunggulan BELANJOO">
            <span>Produk siap cek</span>
            <span>Checkout cepat</span>
            <span>Admin responsif</span>
          </div>
        </div>
        <div className="hero-section__banner banner-carousel">
          {loading.banners ? (
            <BannerSkeleton />
          ) : visibleBanner ? (
            <>
              <img src={visibleBanner.imageUrl} alt={visibleBanner.title || 'Banner BELANJOO'} />
              <div className="banner-carousel__overlay">
                <span>Promo pilihan</span>
                <strong>{visibleBanner.title || 'Belanja lebih hemat hari ini'}</strong>
              </div>
              {banners.length > 1 && (
                <div className="banner-carousel__dots">
                  {banners.slice(0, 5).map((banner, index) => (
                    <span className={index === 0 ? 'is-active' : ''} key={banner.id || index} />
                  ))}
                </div>
              )}
            </>
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
            <p>Filter katalog berdasarkan jenis produk yang kamu cari.</p>
          </div>
        </div>
        <div className="category-row category-row--visual">
          <button
            className={`category-tile ${category === '' ? 'chip--active' : ''}`}
            type="button"
            onClick={() => onCategoryChange('')}
          >
            <span>All</span>
            <strong>Semua</strong>
            <small>{products.length} produk</small>
          </button>
          {categoryStats.map((item) => (
            <button
              className={`category-tile ${category === item.name ? 'chip--active' : ''}`}
              type="button"
              key={item.id || item.name}
              onClick={() => onCategoryChange(item.name)}
            >
              <span>{(item.name || 'Produk').slice(0, 2).toUpperCase()}</span>
              <strong>{item.name}</strong>
              <small>{item.count} produk</small>
            </button>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="section">
          <div className="section__header">
            <div>
              <span className="eyebrow">Terlaris</span>
              <h2>Produk yang sering dibeli</h2>
              <p>Pilihan populer dari transaksi yang sudah masuk.</p>
            </div>
          </div>
          <div className="horizontal-products">
            {featured.map((product) => (
              <ProductCard
                key={`featured-${product.id}`}
                product={product}
                onOpen={onOpenProduct}
                onAdd={onAddToCart}
                canShop={canShop}
              />
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section__header">
          <div>
            <span className="eyebrow">Produk</span>
            <h2>Katalog produk</h2>
            <p>Semua produk dari backend existing, siap dicari dan difilter.</p>
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
                canShop={canShop}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
