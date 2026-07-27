/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env && (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL));

const supabaseAnonKey = 
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env && (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY));

export const supabase = (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co')
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export async function getRatings(bookId: string) {
  try {
    const res = await fetch(`/api/ratings/${bookId}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.average !== undefined) return data;
    }
  } catch (e) {}

  if (supabase) {
    try {
      let count = 0;
      let sum = 0;
      const breakdown: Record<number, number> = { 1:0, 2:0, 3:0, 4:0, 5:0 };

      const { data: rData } = await supabase.from('ratings').select('rating').eq('book_id', bookId);
      if (rData && rData.length > 0) {
        rData.forEach((r: any) => {
          const val = Number(r.rating);
          if (val >= 1 && val <= 5) {
            count++;
            sum += val;
            breakdown[val] = (breakdown[val] || 0) + 1;
          }
        });
      } else {
        const { data: cData } = await supabase.from('comments').select('comment').eq('name', 'RATING').eq('content_key', bookId);
        if (cData) {
          cData.forEach((r: any) => {
            const val = parseInt(r.comment);
            if (!isNaN(val) && val >= 1 && val <= 5) {
              count++;
              sum += val;
              breakdown[val] = (breakdown[val] || 0) + 1;
            }
          });
        }
      }
      return { average: count > 0 ? sum / count : 0, count, breakdown };
    } catch (e) {}
  }

  return { average: 0, count: 0, breakdown: { 1:0, 2:0, 3:0, 4:0, 5:0 } };
}

export async function submitRating(bookId: string, rating: number) {
  try {
    const res = await fetch(`/api/ratings/${bookId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating }),
    });
    if (res.ok) return true;
  } catch (e) {}

  if (supabase) {
    try {
      const { error: rErr } = await supabase.from('ratings').insert([{ book_id: bookId, rating: Number(rating) }]);
      if (rErr) {
        await supabase.from('comments').insert([{ content_key: bookId, name: 'RATING', comment: String(rating) }]);
      }
      return true;
    } catch (e) {}
  }
  return false;
}

export async function getReviews(bookId: string) {
  try {
    const res = await fetch(`/api/reviews/${bookId}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {}

  if (supabase) {
    try {
      const { data: rData, error: rErr } = await supabase
        .from('reviews')
        .select('*')
        .eq('book_id', bookId)
        .order('created_at', { ascending: false });

      if (!rErr && rData && rData.length > 0) return rData;

      const { data: cData } = await supabase
        .from('comments')
        .select('*')
        .eq('content_key', bookId)
        .neq('name', 'RATING')
        .order('created_at', { ascending: false });

      if (cData) {
        return cData.map((c: any) => ({
          id: c.id,
          book_id: c.content_key,
          author_name: c.name,
          content: c.comment,
          created_at: c.created_at,
        }));
      }
    } catch (e) {}
  }

  return [];
}

export async function submitReview(bookId: string, authorName: string, content: string) {
  try {
    const res = await fetch(`/api/reviews/${bookId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author_name: authorName, content }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && !data.error) return data;
    }
  } catch (e) {}

  const newReview = {
    id: String(Date.now()),
    book_id: bookId,
    author_name: authorName,
    content: content,
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    try {
      const { data: rData, error: rErr } = await supabase
        .from('reviews')
        .insert([{ book_id: bookId, author_name: authorName, content }])
        .select();

      if (!rErr && rData && rData[0]) return rData[0];

      const { data: cData } = await supabase
        .from('comments')
        .insert([{ content_key: bookId, name: authorName, comment: content }])
        .select();

      if (cData && cData[0]) {
        return {
          id: cData[0].id,
          book_id: cData[0].content_key,
          author_name: cData[0].name,
          content: cData[0].comment,
          created_at: cData[0].created_at,
        };
      }
    } catch (e) {}
  }

  return newReview;
}

export async function getProgress(bookId: string) {
  try {
    const res = await fetch(`/api/progress/${bookId}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.want_to_read !== undefined) return data;
    }
  } catch (e) {}

  if (supabase) {
    try {
      const counts = { want_to_read: 0, reading: 0, completed: 0 };
      const { data: pData, error: pErr } = await supabase.from('shelf_progress').select('status').eq('book_id', bookId);

      if (!pErr && pData && pData.length > 0) {
        pData.forEach((r: any) => {
          if (r.status === 'want_to_read') counts.want_to_read++;
          if (r.status === 'reading') counts.reading++;
          if (r.status === 'completed') counts.completed++;
        });
        return counts;
      }

      const { data: rData } = await supabase.from('reactions').select('reaction_type').eq('content_key', bookId);
      if (rData) {
        rData.forEach((r: any) => {
          if (r.reaction_type === 'like' || r.reaction_type === 'want_to_read') counts.want_to_read++;
          if (r.reaction_type === 'love' || r.reaction_type === 'reading') counts.reading++;
          if (r.reaction_type === 'fire' || r.reaction_type === 'completed') counts.completed++;
        });
      }
      return counts;
    } catch (e) {}
  }

  return { want_to_read: 0, reading: 0, completed: 0 };
}

export async function submitProgress(bookId: string, status: string) {
  try {
    const res = await fetch(`/api/progress/${bookId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) return true;
  } catch (e) {}

  if (supabase) {
    try {
      const { error: pErr } = await supabase.from('shelf_progress').insert([{ book_id: bookId, status }]);
      if (pErr) {
        const mappedStatus = status === 'want_to_read' ? 'like' : status === 'reading' ? 'love' : 'fire';
        await supabase.from('reactions').insert([{ content_key: bookId, reaction_type: mappedStatus, fingerprint: 'anonymous' }]);
      }
      return true;
    } catch (e) {}
  }
  return false;
}

