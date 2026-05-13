import BrandLogo from './BrandLogo.jsx';

const getInitial = (user) => {
  const value = user?.name || user?.email || 'Menu';
  return String(value).trim().slice(0, 1).toUpperCase() || 'M';
};

export default function SiteHeader({
  page,
  user,
  cartCount,
  userIsAdmin,
  canShop,
  activeAdminTab,
  onNavigate,
  onAdminNavigate,
  onOpenCart,
  onLoginUser,
  onLoginAdmin,
  onRequestLogout,
}) {
  const runMenuAction = (event, action) => {
    event.currentTarget.closest('details')?.removeAttribute('open');
    action();
  };

  const navItems = userIsAdmin
    ? [
        { id: 'dashboard', label: 'Dashboard', active: page === 'admin' && activeAdminTab === 'dashboard', onClick: () => onAdminNavigate('dashboard') },
        { id: 'orders', label: 'Order', active: page === 'admin' && activeAdminTab === 'orders', onClick: () => onAdminNavigate('orders') },
        { id: 'products', label: 'Produk', active: page === 'admin' && activeAdminTab === 'products', onClick: () => onAdminNavigate('products') },
        { id: 'chat', label: 'Chat', active: page === 'chat', onClick: () => onNavigate('chat') },
      ]
    : [
        { id: 'store', label: 'Store', active: page === 'store', onClick: () => onNavigate('store') },
        { id: 'orders', label: 'Pesanan', active: page === 'orders', onClick: () => onNavigate('orders') },
        { id: 'chat', label: 'Chat', active: page === 'chat', onClick: () => onNavigate('chat') },
        ...(!user ? [{ id: 'admin', label: 'Admin', active: page === 'admin', onClick: () => onNavigate('admin') }] : []),
      ];

  return (
    <header className="site-header">
      <button className="brand-button" type="button" onClick={() => onNavigate(userIsAdmin ? 'admin' : 'store')}>
        <BrandLogo />
      </button>

      <nav className="site-nav" aria-label="Navigasi utama">
        {navItems.map((item) => (
          <button className={item.active ? 'is-active' : ''} type="button" key={item.id} onClick={item.onClick}>
            {item.label}
          </button>
        ))}
      </nav>

      <details className="profile-menu">
        <summary className="profile-menu__trigger" aria-label="Buka menu akun">
          <span className="profile-menu__avatar">{user ? getInitial(user) : 'Menu'}</span>
          <span className="profile-menu__label">{user ? user.name || user.email : 'Menu'}</span>
        </summary>
        <div className="profile-menu__panel">
          {!user && (
            <>
              <button type="button" onClick={(event) => runMenuAction(event, onLoginUser)}>Login User</button>
              <button type="button" onClick={(event) => runMenuAction(event, onLoginAdmin)}>Login Admin</button>
              {canShop && <button type="button" onClick={(event) => runMenuAction(event, onOpenCart)}>Keranjang {cartCount > 0 ? `(${cartCount})` : ''}</button>}
            </>
          )}

          {user && !userIsAdmin && (
            <>
              <div className="profile-menu__identity">
                <strong>{user.name || 'User BELANJOO'}</strong>
                <span>{user.email}</span>
              </div>
              <button type="button" onClick={(event) => runMenuAction(event, () => onNavigate('orders'))}>Pesanan</button>
              <button type="button" onClick={(event) => runMenuAction(event, () => onNavigate('chat'))}>Chat</button>
              <button type="button" onClick={(event) => runMenuAction(event, onOpenCart)}>Keranjang {cartCount > 0 ? `(${cartCount})` : ''}</button>
              <button type="button" onClick={(event) => runMenuAction(event, onRequestLogout)}>Logout</button>
            </>
          )}

          {userIsAdmin && (
            <>
              <div className="profile-menu__identity">
                <strong>{user.name || 'Admin BELANJOO'}</strong>
                <span>{user.email}</span>
              </div>
              <button type="button" onClick={(event) => runMenuAction(event, () => onAdminNavigate('dashboard'))}>Dashboard Admin</button>
              <button type="button" onClick={(event) => runMenuAction(event, () => onAdminNavigate('products'))}>Produk</button>
              <button type="button" onClick={(event) => runMenuAction(event, () => onAdminNavigate('orders'))}>Order</button>
              <button type="button" onClick={(event) => runMenuAction(event, () => onNavigate('chat'))}>Chat Admin</button>
              <button type="button" onClick={(event) => runMenuAction(event, onRequestLogout)}>Logout</button>
            </>
          )}
        </div>
      </details>
    </header>
  );
}
