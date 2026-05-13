import logo from '../assets/belanjoo_logo_purple.png';

export default function BrandLogo({ compact = false }) {
  return (
    <div className={`brand-logo ${compact ? 'brand-logo--compact' : ''}`}>
      <img src={logo} alt="BELANJOO" />
      <div>
        <strong>BELANJOO</strong>
        {!compact && <span>Belanja mudah, hidup lebih praktis</span>}
      </div>
    </div>
  );
}
