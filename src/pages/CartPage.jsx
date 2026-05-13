import EmptyState from '../components/EmptyState.jsx';
import ImageBox from '../components/ImageBox.jsx';
import { formatCurrency } from '../utils/format.js';

export default function CartPage({
  cartItems,
  user,
  checkoutBusy,
  onClose,
  onQtyChange,
  onRemove,
  onCheckout,
  onGoLogin,
}) {
  const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <div className="drawer-backdrop" role="presentation" onClick={onClose}>
      <aside className="drawer" aria-label="Keranjang" onClick={(event) => event.stopPropagation()}>
        <div className="drawer__header">
          <div>
            <span className="eyebrow">Keranjang</span>
            <h2>Belanjaan kamu</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Tutup">
            x
          </button>
        </div>

        {cartItems.length === 0 ? (
          <EmptyState title="Keranjang kosong" description="Tambahkan produk dari katalog terlebih dahulu." />
        ) : (
          <>
            <div className="cart-list">
              {cartItems.map((item) => (
                <article className="cart-item" key={item.product.id}>
                  <ImageBox src={item.product.imageUrl} alt={item.product.name} />
                  <div>
                    <strong>{item.product.name}</strong>
                    <span>{formatCurrency(item.product.price)}</span>
                    <div className="qty-control">
                      <button type="button" onClick={() => onQtyChange(item.product.id, item.quantity - 1)}>
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => onQtyChange(item.product.id, item.quantity + 1)}>
                        +
                      </button>
                    </div>
                  </div>
                  <button className="link-button" type="button" onClick={() => onRemove(item.product.id)}>
                    Hapus
                  </button>
                </article>
              ))}
            </div>
            <div className="drawer__footer">
              <div className="total-row">
                <span>Total</span>
                <strong>{formatCurrency(total)}</strong>
              </div>
              {user ? (
                <button className="button button--primary button--block" type="button" disabled={checkoutBusy} onClick={onCheckout}>
                  {checkoutBusy ? 'Memproses...' : 'Checkout'}
                </button>
              ) : (
                <button className="button button--primary button--block" type="button" onClick={onGoLogin}>
                  Login untuk checkout
                </button>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
