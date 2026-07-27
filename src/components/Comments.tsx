import { useNotification } from '../contexts/NotificationContext';
import React, { useState, useEffect } from 'react';
import { getReviews, submitReview } from '../lib/supabase';

interface Comment {
  id: string;
  name: string;
  comment: string;
  created_at: string;
}

export function Comments({ content_key }: { content_key: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  const fetchComments = async () => {
    try {
      const data = await getReviews(content_key);
      const mapped = (data || []).map((item: any) => ({
        id: item.id || String(Math.random()),
        name: item.author_name || item.name || 'Anonymous',
        comment: item.content || item.comment || '',
        created_at: item.created_at || new Date().toISOString()
      }));
      setComments(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (content_key) {
      fetchComments();
    }
  }, [content_key]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    try {
      const author = name.trim() || 'Anonymous';
      const text = commentText.trim();
      const res = await submitReview(content_key, author, text);
      if (res) {
        showNotification('Comment posted successfully', 'success');
        const newC: Comment = {
          id: res.id || String(Date.now()),
          name: res.author_name || res.name || author,
          comment: res.content || res.comment || text,
          created_at: res.created_at || new Date().toISOString()
        };
        setComments([newC, ...comments]);
        setName('');
        setCommentText('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-gray-500 text-sm py-4">Loading comments...</div>;
  }

  return (
    <div className="mt-12 mb-8">
      <div className="border-b border-[#EBE3D5] flex justify-between items-end pb-2 mb-6">
        <h3 className="text-[10px] font-bold text-[#C8885B] tracking-widest uppercase">ADD YOUR REVIEW THOUGHTS</h3>
        <span className="text-[10px] text-gray-500">posted publicly on community reviews</span>
      </div>
      
      <form onSubmit={handleSubmit} className="mb-12">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <input 
            type="text" 
            placeholder="Your name (e.g. Sofia G.)" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            className="w-full md:w-1/3 border border-[#EBE3D5] p-3 text-sm focus:outline-none focus:border-[#C8885B]" 
          />
          <input 
            type="text" 
            placeholder="Enter your observations or comments about this book..." 
            value={commentText} 
            onChange={e => setCommentText(e.target.value)} 
            className="w-full md:w-2/3 border border-[#EBE3D5] p-3 text-sm focus:outline-none focus:border-[#C8885B]" 
          />
        </div>
        <div className="flex justify-end">
          <button 
            type="submit" 
            disabled={!commentText.trim()} 
            className="bg-[#1E714A] disabled:bg-gray-400 text-white px-6 py-3 text-[10px] font-bold tracking-widest uppercase hover:bg-[#1E714A]/90 transition-colors"
          >
            POST REVIEW
          </button>
        </div>
      </form>

      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="border border-[#EBE3D5] py-12 text-center text-sm text-gray-600 italic bg-[#FCFAF8]">
            No reviews found. Be the first to post yours below!
          </div>
        ) : (
          comments.map(c => (
            <div key={c.id} className="border-b border-[#EBE3D5] pb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-sm">{c.name}</div>
                <div className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString()}</div>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
