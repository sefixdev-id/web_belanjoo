import { useEffect, useMemo, useState } from 'react';
import { apiClient, orderStatusOptions } from '../api/apiClient.js';
import EmptyState from '../components/EmptyState.jsx';
import ImageBox from '../components/ImageBox.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatCurrency, formatDate } from '../utils/format.js';

export default function AdminPage({ user, products, onLogin, onLogout }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [orders, setOrders] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState('');

  const isAdmin = user && ['admin', 'super_admin'].includes(user.role);

  const dashboardCards = useMemo(
    () => [
      ['Hari ini', dashboard?.pendapatan_hari_ini],
      ['Bulan ini', dashboard?.pendapatan_bulan_ini],
      ['Tahun ini', dashboard?.pendapatan_tahun_ini],
    ],
    [dashboard],
  );

  const refreshAdmin = async () => {
    if (!isAdmin || !user.adminToken) return;
    setLoadingAdmin(true);
    setMessage('');
    try {
      const [nextOrders, nextDashboard] = await Promise.all([
        apiClient.listOrders(user.adminToken),
        apiClient.dashboard(user.adminToken),
      ]);
      setOrders(nextOrders);
      setDashboard(nextDashboard);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoadingAdmin(false);
    }
  };

  useEffect(() => {
    refreshAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.adminToken]);

  const submitLogin = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const nextUser = await apiClient.login({ email, password });
      if (!['admin', 'super_admin'].includes(nextUser.role)) {
        setMessage('Akun ini belum memiliki akses admin.');
        return;
      }
      onLogin(nextUser);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (orderId, status) => {
    if (updatingOrderId) return;
    setMessage('');
    setUpdatingOrderId(orderId);
    try {
      await apiClient.updateOrderStatus({
        adminToken: user.adminToken,
        id: orderId,
        status,
      });
      setOrders((current) => current.map((order) => (order.id === orderId ? { ...order, status } : order)));
    } catch (error) {
      setMessage(error.message);
    } finally {
      setUpdatingOrderId('');
    }
  };

  if (!isAdmin) {
    return (
      <main className="page-shell admin-page">
        <section className="auth-card">
          <span className="eyebrow">Admin BELANJOO</span>
          <h1>Masuk panel admin</h1>
          <p>Gunakan akun dan role admin dari backend yang sama dengan aplikasi Flutter.</p>
          <form onSubmit={submitLogin}>
            <label>
              Email
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
            </label>
            <label>
              Password
              <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
            </label>
            {message && <p className="form-message">{message}</p>}
            <button className="button button--primary button--block" type="submit" disabled={busy}>
              {busy ? 'Masuk...' : 'Login admin'}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell admin-page">
      <section className="admin-header">
        <div>
          <span className="eyebrow">Dashboard</span>
          <h1>Kelola toko dan pantau aktivitas</h1>
          <p>Data diambil dari endpoint Apps Script existing.</p>
        </div>
        <div className="button-row">
          <button className="button button--ghost" type="button" onClick={refreshAdmin} disabled={loadingAdmin}>
            Refresh
          </button>
          <button className="button button--soft" type="button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </section>
      {message && <p className="form-message">{message}</p>}

      <section className="metric-grid">
        {dashboardCards.map(([label, value]) => (
          <div className="metric-card" key={label}>
            <span>{label}</span>
            <strong>{formatCurrency(value || 0)}</strong>
          </div>
        ))}
      </section>

      <section className="section">
        <div className="section__header">
          <div>
            <span className="eyebrow">Produk</span>
            <h2>List produk</h2>
          </div>
        </div>
        <div className="admin-product-list">
          {products.slice(0, 12).map((product) => (
            <article className="admin-product-item" key={product.id}>
              <ImageBox src={product.imageUrl} alt={product.name} />
              <div>
                <strong>{product.name}</strong>
                <span>{product.category || 'Produk'} - Stok {product.stock}</span>
              </div>
              <b>{formatCurrency(product.price)}</b>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section__header">
          <div>
            <span className="eyebrow">Order</span>
            <h2>List order</h2>
          </div>
        </div>
        {orders.length === 0 ? (
          <EmptyState title="Order belum tersedia" description="Order akan tampil setelah tersedia dari backend." />
        ) : (
          <div className="order-list">
            {orders.map((order) => (
              <article className="order-card" key={order.id}>
                <div className="order-card__top">
                  <div>
                    <strong>#{order.id}</strong>
                    <span>{order.userName || order.userEmail || 'Customer'} - {formatDate(order.createdAt)}</span>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <div className="order-card__items">
                  {order.items.slice(0, 3).map((item) => (
                    <span key={`${order.id}-${item.productId}-${item.productName}`}>
                      {item.productName} x{item.quantity}
                    </span>
                  ))}
                </div>
                <div className="order-card__bottom">
                  <strong>{formatCurrency(order.total)}</strong>
                  <select
                    value={order.status}
                    disabled={updatingOrderId === order.id}
                    onChange={(event) => changeStatus(order.id, event.target.value)}
                  >
                    {orderStatusOptions.map((option) => (
                      <option value={option.value} key={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
