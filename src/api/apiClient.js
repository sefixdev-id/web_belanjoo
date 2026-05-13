const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const toNumber = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (value === null || value === undefined) return 0;
  const parsed = Number(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const toBool = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'aktif'].includes(normalized)) return true;
    if (['false', '0', 'no', 'nonaktif'].includes(normalized)) return false;
  }
  return fallback;
};

const asArray = (data, keys = []) => {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  for (const key of keys) {
    if (Array.isArray(data[key])) return data[key];
  }
  return [];
};

const normalizeImageUrl = (value) => {
  const rawUrl = String(value ?? '').trim();
  if (!rawUrl) return '';

  try {
    const url = new URL(rawUrl);
    if (!url.hostname.includes('drive.google.com')) return rawUrl;

    const idFromQuery = url.searchParams.get('id');
    const idFromPath = url.pathname.match(/\/(?:file\/d|d)\/([^/]+)/)?.[1];
    const fileId = idFromQuery || idFromPath;
    return fileId
      ? `https://drive.usercontent.google.com/download?id=${fileId}&export=view`
      : rawUrl;
  } catch {
    return rawUrl;
  }
};

const unwrap = (payload) => {
  if (payload && typeof payload === 'object' && 'ok' in payload) {
    if (payload.ok === true) return payload.data;
    throw new Error(payload.error || payload.message || 'Request gagal.');
  }
  return payload;
};

const parseResponse = async (response) => {
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    throw new Error('Response API tidak valid.');
  }

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || 'Request gagal.');
  }

  return unwrap(payload);
};

const requireBaseUrl = () => {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL belum diatur.');
  }
};

const buildUrl = (action, params = {}) => {
  requireBaseUrl();
  const url = new URL(API_BASE_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
};

const getJson = async (action, params) => {
  const response = await fetch(buildUrl(action, params), {
    headers: { Accept: 'application/json' },
  });
  return parseResponse(response);
};

const postJson = async (body) => {
  requireBaseUrl();
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(body),
  });
  return parseResponse(response);
};

export const mapProduct = (raw = {}) => ({
  id: String(raw.id ?? ''),
  name: String(raw.nama ?? raw.name ?? '').trim(),
  category: String(raw.kategori ?? raw.category ?? '').trim(),
  price: toNumber(raw.harga ?? raw.price),
  description: String(raw.deskripsi ?? raw.description ?? '').trim(),
  imageUrl: normalizeImageUrl(raw.gambar_url ?? raw.imageUrl ?? raw.image_url),
  stock: toNumber(raw.stok ?? raw.stock),
  isBestSeller: toBool(raw.is_best_seller ?? raw.isBestSeller),
  soldCount: toNumber(raw.terjual ?? raw.sold_count ?? raw.soldCount ?? raw.jumlah_terjual),
});

const mapOrderItem = (raw = {}) => ({
  id: String(raw.id ?? ''),
  orderId: String(raw.pesanan_id ?? raw.order_id ?? ''),
  productId: String(raw.product_id ?? raw.produk_id ?? ''),
  productName: String(raw.nama_produk ?? raw.product_name ?? '').trim(),
  price: toNumber(raw.harga ?? raw.price),
  quantity: toNumber(raw.jumlah ?? raw.quantity),
  subtotal: toNumber(raw.subtotal),
});

export const mapOrder = (raw = {}) => ({
  id: String(raw.id ?? ''),
  userId: String(raw.user_id ?? ''),
  userName: String(raw.nama_user ?? raw.user_name ?? '').trim(),
  userEmail: String(raw.email_user ?? raw.user_email ?? '').trim(),
  total: toNumber(raw.total),
  status: String(raw.status ?? 'pending').trim() || 'pending',
  source: String(raw.sumber ?? raw.source ?? 'app').trim(),
  createdAt: String(raw.created_at ?? '').trim(),
  updatedAt: String(raw.updated_at ?? '').trim(),
  items: asArray(raw.items, ['items']).map(mapOrderItem),
});

export const mapBanner = (raw = {}) => ({
  id: String(raw.id ?? ''),
  imageUrl: normalizeImageUrl(raw.image_url ?? raw.gambar_url ?? raw.imageUrl),
  title: String(raw.title ?? raw.judul ?? '').trim(),
  isActive: toBool(raw.is_active ?? raw.aktif ?? raw.active, true),
});

export const mapUser = (raw = {}) => ({
  id: String(raw.id ?? ''),
  name: String(raw.nama ?? raw.name ?? '').trim(),
  email: String(raw.email ?? '').trim(),
  role: String(raw.role ?? 'user').trim(),
  adminToken: String(raw.admin_token ?? raw.adminToken ?? '').trim(),
});

export const orderStatusOptions = [
  { value: 'pending', label: 'Pesanan Masuk' },
  { value: 'diproses', label: 'Diproses' },
  { value: 'diterima_admin', label: 'Diterima Admin' },
  { value: 'dikirim', label: 'Dikirim' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'dibatalkan', label: 'Dibatalkan' },
];

export const statusLabel = (status) => {
  const normalized = String(status || '').toLowerCase();
  return orderStatusOptions.find((item) => item.value === normalized)?.label || status || 'Pending';
};

export const apiClient = {
  get apiBaseUrl() {
    return API_BASE_URL;
  },
  async health() {
    return getJson('health');
  },
  async listProducts({ category, search } = {}) {
    const data = await getJson('products', { kategori: category, search });
    return asArray(data, ['products', 'items', 'data']).map(mapProduct);
  },
  async listCategories() {
    const data = await getJson('categories');
    return asArray(data, ['categories', 'items', 'data'])
      .map((item) => String(item.nama ?? item.name ?? item).trim())
      .filter(Boolean);
  },
  async listBanners({ activeOnly = true } = {}) {
    const data = await getJson('banners', { active_only: activeOnly ? 'true' : 'false' });
    return asArray(data, ['banners', 'items', 'data'])
      .map(mapBanner)
      .filter((item) => item.imageUrl);
  },
  async login({ email, password }) {
    const data = await postJson({ action: 'login', email, password });
    return mapUser(data);
  },
  async createOrder({ user, items, source = 'app' }) {
    return postJson({
      action: 'createOrder',
      user: {
        id: user.id,
        nama: user.name,
        email: user.email,
      },
      sumber: source,
      items: items.map((item) => ({
        product_id: item.product.id,
        nama_produk: item.product.name,
        harga: item.product.price,
        jumlah: item.quantity,
      })),
    });
  },
  async listOrders(adminToken) {
    const data = await postJson({ action: 'listOrders', admin_token: adminToken });
    return asArray(data, ['orders', 'items', 'data']).map(mapOrder);
  },
  async updateOrderStatus({ adminToken, id, status }) {
    return postJson({
      action: 'updateOrderStatus',
      admin_token: adminToken,
      id,
      status,
    });
  },
  async dashboard(adminToken) {
    return postJson({ action: 'dashboard', admin_token: adminToken });
  },
};
