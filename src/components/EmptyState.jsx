export default function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon" aria-hidden="true" />
      <strong>{title}</strong>
      {description && <p>{description}</p>}
    </div>
  );
}
