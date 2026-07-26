import { useState, useEffect } from 'react';
import { fetchEntries } from '../api';

export function useOriginalBooks() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBooks() {
      try {
        const data = await fetchEntries('originalBook', { limit: 100, include: 2 });
        setBooks(data);
      } catch (err) {
        console.error("Failed to fetch original books:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBooks();
  }, []);

  return { books, loading };
}
