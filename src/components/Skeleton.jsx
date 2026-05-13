export function ProductGridSkeleton() {
  return (
    <div className="product-grid">
      {Array.from({ length: 8 }).map((_, index) => (
        <div className="product-card product-card--skeleton" key={index}>
          <div className="skeleton product-card__media" />
          <div className="product-card__body">
            <div className="skeleton skeleton-line skeleton-line--wide" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line skeleton-line--short" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function BannerSkeleton() {
  return <div className="banner banner--placeholder skeleton" />;
}
