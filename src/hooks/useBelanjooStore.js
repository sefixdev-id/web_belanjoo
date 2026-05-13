import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../api/apiClient.js';

export function useBelanjooStore({ category, query, notify }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState({
    products: true,
    categories: true,
    banners: true,
  });

  const refreshProducts = useCallback(async () => {
    setLoading((current) => ({ ...current, products: true }));
    try {
      const nextProducts = await apiClient.listProducts({ category, search: query });
      setProducts(nextProducts);
    } catch (error) {
      notify(error.message);
    } finally {
      setLoading((current) => ({ ...current, products: false }));
    }
  }, [category, notify, query]);

  const refreshCategories = useCallback(async () => {
    setLoading((current) => ({ ...current, categories: true }));
    try {
      setCategories(await apiClient.listCategories());
    } catch (error) {
      notify(error.message);
    } finally {
      setLoading((current) => ({ ...current, categories: false }));
    }
  }, [notify]);

  const refreshBanners = useCallback(
    async ({ activeOnly = true } = {}) => {
      setLoading((current) => ({ ...current, banners: true }));
      try {
        setBanners(await apiClient.listBanners({ activeOnly }));
      } catch (error) {
        notify(error.message);
      } finally {
        setLoading((current) => ({ ...current, banners: false }));
      }
    },
    [notify],
  );

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshCategories(), refreshBanners(), refreshProducts()]);
  }, [refreshBanners, refreshCategories, refreshProducts]);

  useEffect(() => {
    refreshCategories();
    refreshBanners();
  }, [refreshBanners, refreshCategories]);

  useEffect(() => {
    const timer = window.setTimeout(refreshProducts, 220);
    return () => window.clearTimeout(timer);
  }, [refreshProducts]);

  return {
    products,
    setProducts,
    categories,
    setCategories,
    banners,
    setBanners,
    loading,
    refreshProducts,
    refreshCategories,
    refreshBanners,
    refreshAll,
  };
}
