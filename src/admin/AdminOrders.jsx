import { useState } from 'react';
import EmptyState from '../components/EmptyState.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { orderStatusOptions } from '../api/apiClient.js';
import { formatCurrency, formatDate } from '../utils/format.js';

export default function AdminOrders({ orders, onUpdateStatus, updatingOrderId }) {
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const filtered = filter ? orders.filter((order) => order.status === filter) : orders;

  return (
    <section className="admin-stack">
      <div className="toolbar">
        <div>
          <span className="eyebrow">Order</span>
          <h2>Manajemen pesanan</h2>
          <p>{filtered.length} order ditampilkan</p>
        </div>
        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="">Semua status</option>
          {orderStatusOptions.map((option) => (
            <option value={option.value} key={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Order belum tersedia" description="Order akan tampil setelah masuk dari checkout." />
      ) : (
        <div className="order-list">
          {filtered.map((order) => (
            <article className="order-card" key={order.id}>
              <div className="order-card__top">
                <div>
                  <strong>#{order.id}</strong>
                  <span>{order.userName || order.userEmail || 'Customer'} - {formatDate(order.createdAt)}</span>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <div className="order-card__items">
                {order.items.slice(0, 4).map((item) => (
                  <span key={`${order.id}-${item.id}-${item.productName}`}>{item.productName} x{item.quantity}</span>
                ))}
              </div>
              <div className="order-card__bottom">
                <strong className="order-card__total">{formatCurrency(order.total)}</strong>
                <button className="button button--ghost" type="button" onClick={() => setSelected(order)}>
                  Detail
                </button>
                <select
                  value={order.status}
                  disabled={updatingOrderId === order.id}
                  onChange={(event) => onUpdateStatus(order.id, event.target.value)}
                >
                  {orderStatusOptions.map((option) => (
                    <option value={option.value} key={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              {order.paymentStatus && <span>Payment: {order.paymentStatus}</span>}
            </article>
          ))}
        </div>
      )}

      {selected && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelected(null)}>
          <section className="modal auth-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <button className="icon-button modal__close" type="button" onClick={() => setSelected(null)} aria-label="Tutup">x</button>
            <span className="eyebrow">Detail order</span>
            <h2>#{selected.id}</h2>
            <p>{selected.userName || selected.userEmail} - {formatDate(selected.createdAt)}</p>
            <div className="order-card__items order-card__items--stack">
              {selected.items.map((item) => (
                <span key={`${selected.id}-detail-${item.id}`}>{item.productName} x{item.quantity} - {formatCurrency(item.subtotal || item.price * item.quantity)}</span>
              ))}
            </div>
            <div className="total-row">
              <span>Total</span>
              <strong>{formatCurrency(selected.total)}</strong>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
