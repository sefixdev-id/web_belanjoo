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
VITE_FIREBASE_API_KEY=YOUR_FIREBASE_WEB_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_FIREBASE_WEB_APP_ID
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
- `register`
- `createOrder`
- `listMyOrders`
- `listOrders`
- `updateOrderStatus`
- `dashboard`
- `createProduct`
- `updateProduct`
- `deleteProduct`
- `createCategory`
- `updateCategory`
- `deleteCategory`
- `uploadImage`
- `createBanner`
- `updateBanner`
- `deleteBanner`

## Firebase Chat

Website memakai Firebase Web config yang sama dengan Flutter. Koleksi yang digunakan:

- `users`
- `chat_rooms`
- `chat_rooms/{roomId}/messages`

Struktur field mengikuti implementasi Flutter di `chat_service.dart`.

## Catatan Backend

Website ini tidak mengubah Google Apps Script, struktur Google Spreadsheet, Firebase, ataupun endpoint API. Jika ada fitur website yang membutuhkan endpoint tambahan, tambahkan sebagai rekomendasi dulu sebelum mengubah backend.
