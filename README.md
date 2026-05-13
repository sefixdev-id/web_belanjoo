# BELANJOO Website

Website storefront/admin ringan untuk BELANJOO. Folder ini berdiri terpisah dari aplikasi Flutter dan memakai endpoint Google Apps Script yang sudah ada.

## Install

```bash
npm install
```

## Environment

Buat file `.env` dari contoh:

```bash
cp .env.example .env
```

Isi endpoint Apps Script existing:

```env
VITE_API_BASE_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

Jangan simpan secret atau key private di frontend.

## Run Dev

```bash
npm run dev
```

Default dev server:

```text
http://localhost:5174
```

## Build

```bash
npm run build
```

Hasil production build ada di folder `dist/`.

## Endpoint Existing Yang Dipakai

- `products`
- `categories`
- `banners`
- `login`
- `createOrder`
- `listOrders`
- `updateOrderStatus`
- `dashboard`

## Catatan Backend

Website ini tidak mengubah Google Apps Script, struktur Google Spreadsheet, Firebase, ataupun endpoint API. Jika ada fitur website yang membutuhkan endpoint tambahan, tambahkan sebagai rekomendasi dulu sebelum mengubah backend.
