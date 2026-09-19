import { useState, useEffect, useCallback, useRef } from 'react';

interface PaginatedSelectOptions<T> {
  fetchFunction: (page: number, limit: number) => Promise<{ success: boolean; data: T[]; pagination?: { total: number; page: number; limit: number; pages: number } }>;
  limit?: number;
  initialPage?: number;
}

interface UsePaginatedSelectReturn<T> {
  items: T[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  reset: () => void;
  total: number;
}

export function usePaginatedSelect<T>({
  fetchFunction,
  limit = 10,
  initialPage = 1,
}: PaginatedSelectOptions<T>): UsePaginatedSelectReturn<T> {
  const [items, setItems] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  
  // Use ref to store the latest fetchFunction to avoid dependency issues
  const fetchFunctionRef = useRef(fetchFunction);
  useEffect(() => {
    fetchFunctionRef.current = fetchFunction;
  }, [fetchFunction]);

  const loadData = useCallback(async (page: number, append = false) => {
    try {
      setLoading(true);
      const response = await fetchFunctionRef.current(page, limit);
      
      if (response.success) {
        if (append) {
          setItems(prev => [...prev, ...response.data]);
        } else {
          setItems(response.data);
        }
        
        if (response.pagination) {
          setTotal(response.pagination.total);
          setHasMore(response.pagination.page < response.pagination.pages);
        } else {
          setTotal(response.data.length);
          setHasMore(response.data.length === limit);
        }
      }
    } catch (error) {
      console.error('Error loading paginated data:', error);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  // Only load initial data once on mount
  useEffect(() => {
    loadData(initialPage, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  const loadMore = useCallback(async () => {
    if (!loading && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      await loadData(nextPage, true);
    }
  }, [currentPage, loading, hasMore, loadData]);

  const reset = useCallback(() => {
    setItems([]);
    setCurrentPage(initialPage);
    setHasMore(true);
    setTotal(0);
    loadData(initialPage, false);
  }, [initialPage, loadData]);

  return {
    items,
    loading,
    hasMore,
    loadMore,
    reset,
    total,
  };
}

