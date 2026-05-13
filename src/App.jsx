import { useEffect, useMemo, useState } from 'react';
import { apiClient } from './api/apiClient.js';
import BrandLogo from './components/BrandLogo.jsx';
import CartPage from './pages/CartPage.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Storefront from './pages/Storefront.jsx';
import AdminPage from './pages/AdminPage.jsx';

const storageKeys = {
  cart: 'belanjoo:web:cart',
  user: 'belanjoo:web:user',
};

const loadStored = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export default function App() {
  const [page, setPage] = useState('store');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [cartItems, setCartItems] = useState(() => loadStored(storageKeys.cart, []));
  const [user, setUser] = useState(() => loadStored(storageKeys.user, null));
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState({
    products: true,
    categories: true,
    banners: true,
  });

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  );

  useEffect(() => {
    localStorage.setItem(storageKeys.cart, JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(storageKeys.user, JSON.stringify(user));
    } else {
      localStorage.removeItem(storageKeys.user);
    }
  }, [user]);

  useEffect(() => {
    let active = true;

    const loadBaseData = async () => {
      setLoading((current) => ({ ...current, categories: true, banners: true }));
      try {
        const [nextCategories, nextBanners] = await Promise.all([
          apiClient.listCategories(),
          apiClient.listBanners({ activeOnly: true }),
        ]);
        if (!active) return;
        setCategories(nextCategories);
        setBanners(nextBanners);
      } catch (error) {
        if (active) setNotice(error.message);
      } finally {
        if (active) {
          setLoading((current) => ({ ...current, categories: false, banners: false }));
        }
      }
    };

    loadBaseData();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading((current) => ({ ...current, products: true }));
      try {
        const nextProducts = await apiClient.listProducts({
          category,
          search: query,
        });
        if (active) setProducts(nextProducts);
      } catch (error) {
        if (active) setNotice(error.message);
      } finally {
        if (active) {
          setLoading((current) => ({ ...current, products: false }));
        }
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [category, query]);

  const addToCart = (product) => {
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
    setNotice('Produk ditambahkan ke keranjang.');
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

  const checkout = async () => {
    if (cartItems.length === 0) {
      setNotice('Keranjang masih kosong.');
      return;
    }
    if (!user) {
      setLoginOpen(true);
      return;
    }
    setCheckoutBusy(true);
    setNotice('');
    try {
      await apiClient.createOrder({ user, items: cartItems, source: 'app' });
      setCartItems([]);
      setCartOpen(false);
      setNotice('Order berhasil dibuat.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setCheckoutBusy(false);
    }
  };

  const logout = () => {
    setUser(null);
    setPage('store');
  };

  return (
    <>
      <header className="site-header">
        <button className="brand-button" type="button" onClick={() => setPage('store')}>
          <BrandLogo compact />
        </button>
        <nav className="site-nav" aria-label="Navigasi utama">
          <button className={page === 'store' ? 'is-active' : ''} type="button" onClick={() => setPage('store')}>
            Store
          </button>
          <button className={page === 'admin' ? 'is-active' : ''} type="button" onClick={() => setPage('admin')}>
            Admin
          </button>
        </nav>
        <div className="header-actions">
          {user ? (
            <button className="button button--soft" type="button" onClick={logout}>
              {user.name || user.email}
            </button>
          ) : (
            <button className="button button--soft" type="button" onClick={() => setLoginOpen(true)}>
              Login
            </button>
          )}
          <button className="cart-button" type="button" onClick={() => setCartOpen(true)} aria-label="Buka keranjang">
            Keranjang
            {cartCount > 0 && <span>{cartCount}</span>}
          </button>
        </div>
      </header>

      {notice && (
        <div className="toast" role="status">
          {notice}
          <button type="button" onClick={() => setNotice('')} aria-label="Tutup">
            x
          </button>
        </div>
      )}

      {page === 'store' ? (
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
        />
      ) : (
        <AdminPage user={user} products={products} onLogin={setUser} onLogout={logout} />
      )}

      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
        />
      )}

      {cartOpen && (
        <CartPage
          cartItems={cartItems}
          user={user}
          checkoutBusy={checkoutBusy}
          onClose={() => setCartOpen(false)}
          onQtyChange={changeQty}
          onRemove={removeItem}
          onCheckout={checkout}
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
            setUser(nextUser);
            setLoginOpen(false);
          }}
        />
      )}
    </>
  );
}

function LoginModal({ onClose, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const nextUser = await apiClient.login({ email, password });
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
        <button className="icon-button modal__close" type="button" onClick={onClose} aria-label="Tutup">
          x
        </button>
        <span className="eyebrow">BELANJOO</span>
        <h2>Masuk akun</h2>
        <p>Login memakai endpoint dan role existing dari backend.</p>
        <form onSubmit={submit}>
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
            {busy ? 'Masuk...' : 'Login'}
          </button>
        </form>
      </section>
    </div>
  );
}
