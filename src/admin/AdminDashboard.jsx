import EmptyState from '../components/EmptyState.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatCurrency } from '../utils/format.js';

export default function AdminDashboard({ dashboard, orders, products, loading }) {
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});
  const totalSold = products.reduce((sum, product) => sum + Number(product.soldCount || 0), 0);
  const topProducts = dashboard?.barang_paling_laris || dashboard?.topProducts || [];

  return (
    <section className="admin-stack">
      <div className="metric-grid metric-grid--four">
        <MetricCard title="Hari ini" value={formatCurrency(dashboard?.pendapatan_hari_ini || 0)} icon="H" />
        <MetricCard title="Bulan ini" value={formatCurrency(dashboard?.pendapatan_bulan_ini || 0)} icon="B" />
        <MetricCard title="Tahun ini" value={formatCurrency(dashboard?.pendapatan_tahun_ini || 0)} icon="T" />
        <MetricCard title="Produk terjual" value={totalSold} icon="P" />
      </div>

      <div className="admin-grid">
        <section className="panel">
          <div className="section__header">
            <div>
              <span className="eyebrow">Produk Terlaris</span>
              <h2>Sales counter</h2>
            </div>
          </div>
          {loading ? (
            <div className="skeleton panel-skeleton" />
          ) : topProducts.length === 0 ? (
            <EmptyState title="Belum ada data sales" description="Produk terlaris akan muncul setelah ada pesanan selesai." />
          ) : (
            <div className="rank-list">
              {topProducts.map((item, index) => (
                <div className="rank-item" key={`${item.product_id || item.produk_id || index}`}>
                  <span>{index + 1}</span>
                  <strong>{item.nama_produk || item.product_name || item.productName}</strong>
                  <b>{item.jumlah_terjual || item.quantity_sold || item.terjual || 0}</b>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="section__header">
            <div>
              <span className="eyebrow">Order</span>
              <h2>Overview status</h2>
            </div>
          </div>
          <div className="status-overview">
            {['pending', 'diproses', 'dikirim', 'selesai', 'dibatalkan'].map((status) => (
              <div className="status-row" key={status}>
                <StatusBadge status={status} />
                <strong>{statusCounts[status] || 0}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function MetricCard({ title, value, icon }) {
  return (
    <div className="metric-card">
      <div className="metric-card__icon" aria-hidden="true">{icon}</div>
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}
