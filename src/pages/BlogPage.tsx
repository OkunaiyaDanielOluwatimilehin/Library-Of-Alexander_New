import { getImageUrl } from '../utils';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchEntries } from '../api';
import { BlogPost } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { GridSkeleton } from '../components/GridSkeleton';
import { ChevronLeft } from 'lucide-react';

export default function BlogPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchEntries<BlogPost>('blogPost', { limit: 100 });
        setPosts(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  
  const allCategories: string[] = Array.from(new Set(posts.flatMap(p => {
    const cat = p.fields.category;
    if (!cat) return [];
    return Array.isArray(cat) ? cat.map(String) : [String(cat)];
  })));
  const filters = ['ALL', ...allCategories].map(c => c.toUpperCase());

  const filteredPosts = activeCategory === 'ALL'
    ? posts
    : posts.filter(p => {
        const cat = p.fields.category;
        if (!cat) return false;
        const displayCats = Array.isArray(cat) ? cat.map(String) : [String(cat)];
        return displayCats.some(c => c.toUpperCase() === activeCategory.toUpperCase());
      });

  const featuredPosts = filteredPosts.filter(p => p.fields.isFeatured || p.fields.featured);
  const mainFeatured = featuredPosts.length > 0 ? featuredPosts[0] : filteredPosts.length > 0 ? filteredPosts[0] : null;

  const sortedByDate = [...filteredPosts].filter(p => p.sys.id !== mainFeatured?.sys.id).sort((a, b) => {
    const dateA = new Date(a.fields.date || 0).getTime();
    const dateB = new Date(b.fields.date || 0).getTime();
    return dateB - dateA;
  });

  const recentStories = activeCategory === 'ALL' ? sortedByDate.slice(0, 6) : [];
  const remainingPosts = activeCategory === 'ALL' ? sortedByDate.slice(6) : [];

  const categories = Array.from(new Set(remainingPosts.flatMap(p => {
    const cat = p.fields.category;
    return Array.isArray(cat) ? cat.map(String) : [typeof cat === 'string' ? cat : 'GENERAL'];
  }))).slice(0, 4);


  if (loading) {
     return <GridSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Header */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 pt-6 sm:pt-12 pb-4 sm:pb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-gray-200 pb-4 sm:pb-6 gap-4">
          <button onClick={() => navigate(-1)} className="inline-flex items-center text-[#C8885B] font-display font-bold text-[10px] uppercase tracking-widest hover:text-[#A66F47] transition-colors group">
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            BACK
          </button>

          <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto scrollbar-hide py-1 -mx-4 px-4 sm:mx-0 sm:px-0">
            {filters.map((f, i) => (
              <button key={i} onClick={() => setActiveCategory(f)} className={`font-display font-bold text-[10px] uppercase tracking-widest whitespace-nowrap ${activeCategory === f ? 'text-[#F4A62A] border-b-2 border-[#F4A62A] pb-1' : 'text-gray-500 hover:text-gray-900 pb-1'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Banner */}
      {mainFeatured && (
        <div className="w-full max-w-[1920px] mx-auto relative h-[280px] sm:h-[400px] md:h-[550px] mb-8 sm:mb-16 overflow-hidden">
          {(() => {
            // @ts-ignore
            const coverUrl = getImageUrl(mainFeatured.fields.coverImage || mainFeatured.fields.imageUrl);
            const cat = mainFeatured.fields.category;
            const displayCat = Array.isArray(cat) && cat.length > 0 ? String(cat[0]) : typeof cat === 'string' ? cat : 'GENERAL';
            // @ts-ignore
            const slug = mainFeatured.fields.slug || mainFeatured.sys.id;
            return (
              <Link to={`/blog/${slug}`} className="block w-full h-full relative group">
                {coverUrl && (
                  <img src={coverUrl} alt={mainFeatured.fields.title} className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F1319]/90 via-[#0F1319]/50 to-[#0F1319]/30" />
                
                <div className="absolute inset-0 flex flex-col justify-center items-start sm:items-center text-left sm:text-center px-6 sm:px-12 max-w-4xl mx-auto z-10">
                  <div className="flex items-center gap-2 mb-2 sm:mb-4">
                    <span className="text-[#F4A62A] font-display font-bold text-[9px] sm:text-[10px] uppercase tracking-widest">FEATURED</span>
                    <span className="text-[#F4A62A] text-[10px]">•</span>
                    <span className="text-[#F4A62A] font-display font-bold text-[9px] sm:text-[10px] uppercase tracking-widest">{displayCat}</span>
                  </div>
                  <h1 className="text-xl sm:text-3xl md:text-4xl md:text-[52px] font-display font-black text-white uppercase tracking-tight leading-tight sm:leading-tight mb-2 sm:mb-4 group-hover:text-gray-200 transition-colors line-clamp-3">
                    {mainFeatured.fields.title}
                  </h1>
                </div>
              </Link>
            );
          })()}
        </div>
      )}

      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 pb-12 sm:pb-20">
        {/* Recent Stories */}
        {recentStories.length > 0 && (
          <div className="mb-12 sm:mb-20">
            <div className="border-b border-black pb-2 sm:pb-4 mb-4 sm:mb-8 flex items-center justify-between">
              <h2 className="text-lg sm:text-[28px] font-display font-black text-black uppercase tracking-tight">RECENT STORIES</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-2.5 sm:gap-6">
              {recentStories.map((post) => {
                // @ts-ignore
                const coverUrl = getImageUrl(post.fields.coverImage || post.fields.imageUrl);
                // @ts-ignore
                const slug = post.fields.slug || post.sys.id;
                return (
                  <div key={post.sys.id} className="bg-[#FDFBF7] border border-[#E8E3DC] rounded-none hover:border-[#C8885B] hover:shadow-md flex flex-col transition-all group overflow-hidden pb-2.5 sm:pb-4">
                    <div className="w-full h-[110px] sm:h-[180px] bg-[#F4F4F4] overflow-hidden p-0 mb-2 sm:mb-3 relative">
                      {coverUrl && (
                        <img src={coverUrl} alt={post.fields.title} className="w-full h-full object-cover rounded-none group-hover:scale-105 transition-transform duration-700" />
                      )}
                    </div>
                    <div className="px-2.5 sm:px-5 flex flex-col flex-grow justify-between">
                      <div>
                        <h3 className="font-sans font-bold text-xs sm:text-[15px] text-gray-900 leading-snug mb-1 sm:mb-2 line-clamp-2 group-hover:text-[#C8885B] transition-colors">{post.fields.title}</h3>
                      </div>
                      <Link to={`/blog/${slug}`} className="block w-full text-center bg-[#F4A62A] hover:bg-[#D98E1A] text-black font-display font-bold text-[9px] sm:text-[10px] uppercase tracking-widest py-1.5 sm:py-2.5 rounded-none transition-colors mt-2 sm:mt-auto">
                        READ
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeCategory !== 'ALL' && sortedByDate.length > 0 && (
          <div className="mb-12 sm:mb-20">
            <div className="border-b border-black pb-2 sm:pb-4 mb-4 sm:mb-8 flex items-center justify-between">
              <h2 className="text-lg sm:text-[28px] font-display font-black text-black uppercase tracking-tight">{activeCategory} ARTICLES</h2>
              <span className="font-mono text-xs text-[#C8885B] uppercase font-bold tracking-wider">{sortedByDate.length} Articles</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2.5 sm:gap-6">
              {sortedByDate.map((post) => {
                // @ts-ignore
                const coverUrl = getImageUrl(post.fields.coverImage || post.fields.imageUrl);
                // @ts-ignore
                const slug = post.fields.slug || post.sys.id;
                return (
                  <div key={post.sys.id} className="bg-[#FDFBF7] border border-[#E8E3DC] rounded-none hover:border-[#C8885B] hover:shadow-md flex flex-col transition-all group overflow-hidden pb-2.5 sm:pb-4">
                    <div className="w-full h-[110px] sm:h-[180px] bg-[#F4F4F4] overflow-hidden p-0 mb-2 sm:mb-3 relative">
                      {coverUrl && (
                        <img src={coverUrl} alt={post.fields.title} className="w-full h-full object-cover rounded-none group-hover:scale-105 transition-transform duration-700" />
                      )}
                    </div>
                    <div className="px-2.5 sm:px-5 flex flex-col flex-grow justify-between">
                      <div>
                        <h3 className="font-sans font-bold text-xs sm:text-[15px] text-gray-900 leading-snug mb-1 sm:mb-2 line-clamp-2 group-hover:text-[#C8885B] transition-colors">{post.fields.title}</h3>
                      </div>
                      <Link to={`/blog/${slug}`} className="block w-full text-center bg-[#F4A62A] hover:bg-[#D98E1A] text-black font-display font-bold text-[9px] sm:text-[10px] uppercase tracking-widest py-1.5 sm:py-2.5 rounded-none transition-colors mt-2 sm:mt-auto">
                        READ
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Other Categories */}
        {activeCategory === 'ALL' && categories.map(category => {
          const categoryPosts = remainingPosts.filter(p => {
            const cat = p.fields.category;
            const displayCats = Array.isArray(cat) ? cat.map(String) : [typeof cat === 'string' ? cat : 'GENERAL'];
            return displayCats.some(c => c.toUpperCase() === category.toUpperCase());
          }).slice(0, 4);
          if (categoryPosts.length === 0) return null;

          return (
            <div key={category} className="mb-10 sm:mb-16">
              <div className="border-b border-black pb-2 sm:pb-4 mb-4 sm:mb-8 flex items-center justify-between">
                <h2 className="text-lg sm:text-[28px] font-display font-black text-black uppercase tracking-tight">{category}</h2>
                <span className="font-mono text-xs text-[#C8885B] uppercase font-bold tracking-wider">{categoryPosts.length} Articles</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2.5 sm:gap-6">
                {categoryPosts.map((post) => {
                  // @ts-ignore
                  const coverUrl = getImageUrl(post.fields.coverImage || post.fields.imageUrl);
                  // @ts-ignore
                  const slug = post.fields.slug || post.sys.id;
                  return (
                    <div key={post.sys.id} className="bg-[#FDFBF7] border border-[#E8E3DC] rounded-none hover:border-[#C8885B] hover:shadow-md flex flex-col transition-all group overflow-hidden pb-2.5 sm:pb-4">
                      <div className="w-full h-[110px] sm:h-[180px] bg-[#F4F4F4] overflow-hidden p-0 mb-2 sm:mb-3 relative">
                        {coverUrl && (
                          <img src={coverUrl} alt={post.fields.title} className="w-full h-full object-cover rounded-none group-hover:scale-105 transition-transform duration-700" />
                        )}
                      </div>
                      <div className="px-2.5 sm:px-5 flex flex-col flex-grow justify-between">
                        <div>
                          <h3 className="font-sans font-bold text-xs sm:text-[15px] text-gray-900 leading-snug mb-1 sm:mb-2 line-clamp-2 group-hover:text-[#C8885B] transition-colors">{post.fields.title}</h3>
                        </div>
                        <Link to={`/blog/${slug}`} className="block w-full text-center bg-[#F4A62A] hover:bg-[#D98E1A] text-black font-display font-bold text-[10px] uppercase tracking-widest py-1.5 sm:py-2.5 rounded-none transition-colors mt-2 sm:mt-auto">
                          READ
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
