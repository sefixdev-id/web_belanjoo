import { useEffect, useMemo, useState } from 'react';
import { apiClient, isAdminRole } from '../api/apiClient.js';
import AdminBanners from '../admin/AdminBanners.jsx';
import AdminCategories from '../admin/AdminCategories.jsx';
import AdminDashboard from '../admin/AdminDashboard.jsx';
import AdminOrders from '../admin/AdminOrders.jsx';
import AdminProducts from '../admin/AdminProducts.jsx';
import BrandLogo from '../components/BrandLogo.jsx';

const adminTabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'orders', label: 'Order' },
  { id: 'products', label: 'Produk' },
  { id: 'categories', label: 'Kategori' },
  { id: 'banners', label: 'Banner' },
];

export default function AdminPage({
  user,
  products,
  categories,
  banners,
  onLogin,
  onLogout,
  activeTab = 'dashboard',
  onTabChange,
  onRefreshProducts,
  onRefreshCategories,
  onRefreshBanners,
  notify,
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [orders, setOrders] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState('');

  const isAdmin = user && isAdminRole(user.role);
  const setAdminTab = onTabChange || (() => {});

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
    if (user?.adminToken) {
      onRefreshBanners({ activeOnly: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.adminToken]);

  const submitLogin = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const nextUser = await apiClient.login({ email, password });
      if (!isAdminRole(nextUser.role)) {
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
    setUpdatingOrderId(orderId);
    try {
      await apiClient.updateOrderStatus({
        adminToken: user.adminToken,
        id: orderId,
        status,
      });
      setOrders((current) => current.map((order) => (order.id === orderId ? { ...order, status } : order)));
      notify('Status order diperbarui.');
      refreshAdmin();
    } catch (error) {
      notify(error.message);
    } finally {
      setUpdatingOrderId('');
    }
  };

  const refreshProducts = async () => {
    await onRefreshProducts();
    await refreshAdmin();
  };
  const refreshCategories = async () => {
    await onRefreshCategories();
    await onRefreshProducts();
  };
  const refreshBanners = async () => {
    await onRefreshBanners({ activeOnly: false });
  };

  const title = useMemo(() => adminTabs.find((tab) => tab.id === activeTab)?.label || 'Dashboard', [activeTab]);

  if (!isAdmin) {
    return (
      <main className="page-shell admin-page">
        <section className="auth-card">
          <span className="eyebrow">Admin BELANJOO</span>
          <h1>Masuk panel admin</h1>
          <p>Gunakan akun admin atau super admin dari backend existing.</p>
          <form onSubmit={submitLogin}>
            <label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required /></label>
            <label>Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required /></label>
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
    <main className="admin-layout">
      <aside className="admin-sidebar">
        <BrandLogo compact />
        <span className="eyebrow">Panel Admin</span>
        <h2>{title}</h2>
        <nav>
          {adminTabs.map((tab) => (
            <button className={activeTab === tab.id ? 'is-active' : ''} type="button" key={tab.id} onClick={() => setAdminTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </nav>
        <button className="button button--soft button--block" type="button" onClick={onLogout}>Logout</button>
      </aside>

      <section className="admin-content">
        <section className="admin-header">
          <div>
            <span className="eyebrow">Dashboard</span>
            <h1>Kelola toko dan pantau aktivitas</h1>
            <p>Semua data memakai endpoint Apps Script existing.</p>
          </div>
          <div className="admin-header__actions">
            <span>{user.name || user.email}</span>
            <button className="button button--ghost" type="button" onClick={refreshAdmin} disabled={loadingAdmin}>
              Refresh
            </button>
          </div>
        </section>
        {message && <p className="form-message">{message}</p>}

        {activeTab === 'dashboard' && (
          <AdminDashboard dashboard={dashboard} orders={orders} products={products} loading={loadingAdmin} />
        )}
        {activeTab === 'orders' && (
          <AdminOrders orders={orders} onUpdateStatus={changeStatus} updatingOrderId={updatingOrderId} />
        )}
        {activeTab === 'products' && (
          <AdminProducts user={user} products={products} categories={categories} onSaved={refreshProducts} notify={notify} />
        )}
        {activeTab === 'categories' && (
          <AdminCategories user={user} categories={categories} onSaved={refreshCategories} notify={notify} />
        )}
        {activeTab === 'banners' && (
          <AdminBanners user={user} banners={banners} onSaved={refreshBanners} notify={notify} />
        )}
        <p className="admin-signature">© 2026 BELANJOO • Developed by Sefriwal</p>
      </section>
    </main>
  );
}
