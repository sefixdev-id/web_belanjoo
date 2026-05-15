/*
 * BELANJOO website footer.
 * Developed by Sefriwal - github.com/sefixdev-id
 * Copyright (c) 2026
 */

import BrandLogo from './BrandLogo.jsx';

export default function SiteFooter({ onNavigate }) {
  return (
    <footer className="site-footer">
      <div className="site-footer__brand">
        <BrandLogo />
        <p>Marketplace ringan untuk belanja kebutuhan harian dengan katalog yang rapi, checkout praktis, dan layanan toko yang responsif.</p>
      </div>
      <div className="site-footer__links">
        <div>
          <strong>Belanja</strong>
          <button type="button" onClick={() => onNavigate('store')}>Katalog</button>
          <button type="button" onClick={() => onNavigate('orders')}>Pesanan</button>
          <button type="button" onClick={() => onNavigate('chat')}>Chat</button>
        </div>
        <div>
          <strong>Kontak</strong>
          <span>WhatsApp: 6282385414776</span>
          <span>Email: support@belanjoo.local</span>
          <span>Instagram: @belanjoo</span>
        </div>
      </div>
      <div className="site-footer__bottom">
        <span>© 2026 BELANJOO • Developed by Sefriwal</span>
        <a href="https://github.com/sefixdev-id" target="_blank" rel="noreferrer">github.com/sefixdev-id</a>
      </div>
    </footer>
  );
}
