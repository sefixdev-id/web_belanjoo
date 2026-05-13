import { useEffect, useState } from 'react';
import { apiClient } from '../api/apiClient.js';
import EmptyState from '../components/EmptyState.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatCurrency, formatDate } from '../utils/format.js';

export default function UserOrders({ user, notify }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!user || user.role !== 'user') return;
      setLoading(true);
      try {
        const nextOrders = await apiClient.listMyOrders(user);
        if (active) setOrders(nextOrders);
      } catch (error) {
        if (active) notify(error.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [notify, user]);

  return (
    <main className="page-shell">
      <section className="section section--top">
        <div className="section__header">
          <div>
            <span className="eyebrow">Tracking</span>
            <h1>Riwayat pesanan</h1>
            <p>Pantau status pesanan yang dibuat lewat checkout aplikasi.</p>
          </div>
        </div>
        {!user ? (
          <EmptyState title="Login diperlukan" description="Masuk sebagai user untuk melihat riwayat pesanan." />
        ) : user.role !== 'user' ? (
          <EmptyState title="Akun admin tidak dapat order" description="Gunakan akun user untuk melihat riwayat belanja." />
        ) : loading ? (
          <div className="order-list">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="order-card skeleton" key={index} />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState title="Belum ada pesanan" description="Pesanan yang kamu checkout akan tampil di sini." />
        ) : (
          <div className="order-list">
            {orders.map((order) => (
              <article className="order-card" key={order.id}>
                <div className="order-card__top">
                  <div>
                    <strong>#{order.id}</strong>
                    <span>{formatDate(order.createdAt)} - {order.source}</span>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <div className="order-card__items">
                  {order.items.map((item) => (
                    <span key={`${order.id}-${item.id}-${item.productName}`}>
                      {item.productName} x{item.quantity}
                    </span>
                  ))}
                </div>
                <div className="order-card__bottom">
                  <strong>{formatCurrency(order.total)}</strong>
                  {order.paymentStatus && <span>Payment: {order.paymentStatus}</span>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
