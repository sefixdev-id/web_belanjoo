import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient, isAdminRole } from './api/apiClient.js';
import CartPage from './pages/CartPage.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import SiteFooter from './components/SiteFooter.jsx';
import SiteHeader from './components/SiteHeader.jsx';
import Storefront from './pages/Storefront.jsx';
import AdminPage from './pages/AdminPage.jsx';
import UserOrders from './user/UserOrders.jsx';
import { useBelanjooStore } from './hooks/useBelanjooStore.js';
import { useLocalStorageState } from './hooks/useLocalStorageState.js';

const storageKeys = {
  cart: 'belanjoo:web:cart',
  user: 'belanjoo:web:user',
};

const whatsappNumber = '6282385414776';
const ChatPanel = lazy(() => import('./chat/ChatPanel.jsx'));

const syncChatUser = async (nextUser, options) => {
  try {
    const service = await import('./chat/chatService.js');
    await service.syncCurrentUser(nextUser, options);
  } catch {
    // Chat sync should never block storefront/auth.
  }
};

export default function App() {
  const [page, setPage] = useState('store');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeAdminTab, setActiveAdminTab] = useState('dashboard');
  const [cartOpen, setCartOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [cartItems, setCartItems] = useLocalStorageState(storageKeys.cart, []);
  const [user, setUser] = useLocalStorageState(storageKeys.user, null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const userIsAdmin = isAdminRole(user?.role);
  const canShop = !userIsAdmin;

  const notify = useCallback((message) => {
    if (message) setNotice(message);
  }, []);

  const {
    products,
    categories,
    banners,
    loading,
    refreshProducts,
    refreshCategories,
    refreshBanners,
  } = useBelanjooStore({ category, query, notify });

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  );

  useEffect(() => {
    if (!userIsAdmin) return;
    if (cartOpen) setCartOpen(false);
    if (selectedProduct) setSelectedProduct(null);
    if (page === 'orders' || page === 'store') setPage('admin');
    if (cartItems.length > 0) setCartItems([]);
  }, [cartItems.length, cartOpen, page, selectedProduct, setCartItems, userIsAdmin]);

  const addToCart = (product) => {
    if (userIsAdmin) {
      notify('Akun admin tidak dapat membuat pesanan.');
      return;
    }
    if (product.stock <= 0) return;
    setCartItems((current) => {
      const found = current.find((item) => item.product.id === product.id);
      if (found) {
        return current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, Math.max(product.stock, 1)) }
            : item,
        );
      }
      return [...current, { product, quantity: 1 }];
    });
    notify('Produk ditambahkan ke keranjang.');
  };

  const changeQty = (productId, quantity) => {
    setCartItems((current) =>
      current
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.max(0, Math.min(quantity, Math.max(item.product.stock, 1))) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const removeItem = (productId) => {
    setCartItems((current) => current.filter((item) => item.product.id !== productId));
  };

  const navigate = (nextPage) => {
    if (userIsAdmin && (nextPage === 'store' || nextPage === 'orders')) {
      setPage('admin');
      return;
    }
    setPage(nextPage);
  };

  const navigateAdmin = (tab = 'dashboard') => {
    setActiveAdminTab(tab);
    setPage('admin');
  };

  const openCart = () => {
    if (userIsAdmin) {
      setCartOpen(false);
      setPage('admin');
      notify('Akun admin tidak dapat mengakses keranjang.');
      return;
    }
    setCartOpen(true);
  };

  const ensureUserCanCheckout = () => {
    if (cartItems.length === 0) {
      notify('Keranjang masih kosong.');
      return false;
    }
    if (!user) {
      setLoginOpen(true);
      return false;
    }
    if (user.role !== 'user') {
      notify('Akun admin tidak dapat membuat pesanan.');
      return false;
    }
    return true;
  };

  const checkout = async () => {
    if (!ensureUserCanCheckout()) return;
    setCheckoutBusy(true);
    try {
      await apiClient.createOrder({ user, items: cartItems, source: 'app' });
      setCartItems([]);
      setCartOpen(false);
      notify('Order berhasil dibuat.');
      setPage('orders');
    } catch (error) {
      notify(error.message);
    } finally {
      setCheckoutBusy(false);
    }
  };

  const checkoutWhatsApp = async () => {
    if (!ensureUserCanCheckout()) return;
    setCheckoutBusy(true);
    try {
      await apiClient.createOrder({ user, items: cartItems, source: 'whatsapp' });
      const lines = [
        'Halo BELANJOO, saya ingin checkout pesanan:',
        ...cartItems.map((item) => `- ${item.product.name} x${item.quantity}`),
        '',
        `Total: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0))}`,
        `Nama: ${user.name}`,
        `Email: ${user.email}`,
      ];
      window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener,noreferrer');
      setCartItems([]);
      setCartOpen(false);
      notify('Order WhatsApp dibuat.');
    } catch (error) {
      notify(error.message);
    } finally {
      setCheckoutBusy(false);
    }
  };

  const logout = () => {
    if (user) syncChatUser(user, { isOnline: false });
    setUser(null);
    setLogoutConfirmOpen(false);
    setPage('store');
  };

  const handleLogin = (nextUser) => {
    setUser(nextUser);
    if (isAdminRole(nextUser?.role)) {
      setCartOpen(false);
      setSelectedProduct(null);
      setCartItems([]);
      setActiveAdminTab('dashboard');
      setPage('admin');
    }
    syncChatUser(nextUser);
  };

  return (
    <>
      <SiteHeader
        page={page}
        user={user}
        cartCount={cartCount}
        userIsAdmin={userIsAdmin}
        canShop={canShop}
        activeAdminTab={activeAdminTab}
        onNavigate={navigate}
        onAdminNavigate={navigateAdmin}
        onOpenCart={openCart}
        onLoginUser={() => setLoginOpen(true)}
        onLoginAdmin={() => setPage('admin')}
        onRequestLogout={() => setLogoutConfirmOpen(true)}
      />

      {notice && (
        <div className="toast" role="status">
          {notice}
          <button type="button" onClick={() => setNotice('')} aria-label="Tutup">x</button>
        </div>
      )}

      {page === 'store' && canShop && (
        <Storefront
          banners={banners}
          categories={categories}
          products={products}
          loading={loading}
          query={query}
          category={category}
          onQueryChange={setQuery}
          onCategoryChange={setCategory}
          onOpenProduct={setSelectedProduct}
          onAddToCart={addToCart}
          canShop={canShop}
        />
      )}
      {page === 'orders' && canShop && <UserOrders user={user} notify={notify} />}
      {(page === 'store' || (page === 'orders' && canShop)) && canShop && <SiteFooter onNavigate={setPage} />}
      {page === 'chat' && (
        <Suspense fallback={<main className="page-shell"><div className="skeleton panel-skeleton" /></main>}>
          <ChatPanel user={user} notify={notify} />
        </Suspense>
      )}
      {page === 'admin' && (
        <AdminPage
          user={user}
          products={products}
          categories={categories}
          banners={banners}
          onLogin={handleLogin}
          onLogout={() => setLogoutConfirmOpen(true)}
          activeTab={activeAdminTab}
          onTabChange={setActiveAdminTab}
          onRefreshProducts={refreshProducts}
          onRefreshCategories={refreshCategories}
          onRefreshBanners={refreshBanners}
          notify={notify}
        />
      )}

      {selectedProduct && (
        <ProductDetail product={selectedProduct} onClose={() => setSelectedProduct(null)} onAddToCart={addToCart} canShop={canShop} />
      )}

      {cartOpen && canShop && (
        <CartPage
          cartItems={cartItems}
          user={user}
          checkoutBusy={checkoutBusy}
          onClose={() => setCartOpen(false)}
          onQtyChange={changeQty}
          onRemove={removeItem}
          onCheckout={checkout}
          onCheckoutWhatsApp={checkoutWhatsApp}
          onGoLogin={() => {
            setCartOpen(false);
            setLoginOpen(true);
          }}
        />
      )}

      {loginOpen && (
        <LoginModal
          onClose={() => setLoginOpen(false)}
          onLogin={(nextUser) => {
            handleLogin(nextUser);
            setLoginOpen(false);
          }}
        />
      )}

      {logoutConfirmOpen && (
        <ConfirmLogoutModal
          onCancel={() => setLogoutConfirmOpen(false)}
          onConfirm={logout}
        />
      )}
    </>
  );
}

function ConfirmLogoutModal({ onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <section className="modal confirm-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <span className="eyebrow">Logout</span>
        <h2>Yakin ingin logout?</h2>
        <p>Sesi akun akan ditutup dari website BELANJOO.</p>
        <div className="button-row confirm-modal__actions">
          <button className="button button--ghost" type="button" onClick={onCancel}>Batal</button>
          <button className="button button--primary" type="button" onClick={onConfirm}>Logout</button>
        </div>
      </section>
    </div>
  );
}

function LoginModal({ onClose, onLogin }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const nextUser =
        mode === 'register'
          ? await apiClient.register({ name, email, password })
          : await apiClient.login({ email, password });
      onLogin(nextUser);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="modal auth-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <button className="icon-button modal__close" type="button" onClick={onClose} aria-label="Tutup">x</button>
        <span className="eyebrow">BELANJOO</span>
        <h2>{mode === 'register' ? 'Daftar akun' : 'Masuk akun'}</h2>
        <p>Login dan role memakai endpoint backend existing.</p>
        <form onSubmit={submit}>
          {mode === 'register' && <label>Nama<input value={name} onChange={(event) => setName(event.target.value)} required /></label>}
          <label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required /></label>
          <label>Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required /></label>
          {message && <p className="form-message">{message}</p>}
          <button className="button button--primary button--block" type="submit" disabled={busy}>{busy ? 'Memproses...' : mode === 'register' ? 'Daftar' : 'Login'}</button>
          <button className="link-button" type="button" onClick={() => setMode(mode === 'register' ? 'login' : 'register')}>
            {mode === 'register' ? 'Sudah punya akun? Login' : 'Belum punya akun? Daftar'}
          </button>
        </form>
      </section>
    </div>
  );
}
