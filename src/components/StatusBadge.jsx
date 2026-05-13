import { statusLabel } from '../api/apiClient.js';

export default function StatusBadge({ status }) {
  const normalized = String(status || 'pending').toLowerCase();
  return <span className={`status-badge status-badge--${normalized}`}>{statusLabel(normalized)}</span>;
}
