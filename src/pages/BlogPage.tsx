import { getImageUrl, getPostCategories, extractCategoryNames } from '../utils';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchEntries } from '../api';
import { BlogPost, Category } from '../types';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { GridSkeleton } from '../components/GridSkeleton';
import { Search, SlidersHorizontal, ArrowUpDown, X, BookOpen, Filter, ChevronRight, ChevronDown, Menu } from 'lucide-react';
import { BlogNotificationBanner } from '../components/BlogNotificationBanner';

function BlogPostCard({
  post,
  getPostCategories,
  handleSelectCategory,
}: {
  post: BlogPost;
  getPostCategories: (p: BlogPost) => string[];
  handleSelectCategory: (cat: string) => void;
}) {
  // @ts-ignore
  const coverUrl = getImageUrl(post.fields.coverImage || post.fields.imageUrl);
  // @ts-ignore
  const slug = post.fields.slug || post.sys.id;

  return (
    <div className="bg-[#FDFBF7] border border-[#E8E3DC] hover:border-[#C8885B] hover:shadow-md flex flex-col transition-all group overflow-hidden pb-3 justify-between h-full">
      <div>
        <div className="w-full h-[140px] sm:h-[160px] bg-[#F4F4F4] overflow-hidden relative">
          {coverUrl ? (
            <img src={coverUrl} alt={post.fields.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
              <BookOpen className="w-8 h-8 opacity-30" />
            </div>
          )}
        </div>
        <div className="p-3 sm:p-4">
          <h3 className="font-sans font-bold text-xs sm:text-sm text-gray-900 leading-snug line-clamp-2 group-hover:text-[#C8885B] transition-colors">
            {post.fields.title}
          </h3>
        </div>
      </div>

      <div className="px-3 sm:px-4 mt-auto pt-2">
        <Link to={`/blog/${slug}`} className="block w-full text-center bg-[#F4A62A] hover:bg-[#D98E1A] text-black font-display font-bold text-[10px] uppercase tracking-widest py-2 transition-colors">
          READ ARTICLE
        </Link>
      </div>
    </div>
  );
}

export default function BlogPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAllArticlesCollapsed, setIsAllArticlesCollapsed] = useState(false);
  const [showCategoriesView, setShowCategoriesView] = useState(false);

  const urlCategory = searchParams.get('category') || 'ALL';
  const selectedCategory = urlCategory;

  const handleSelectCategory = (cat: string) => {
    setShowCategoriesView(false);
    if (cat === 'ALL') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', cat);
    }
    setSearchParams(searchParams);
  };

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const postsData = await fetchEntries<BlogPost>('blogPost', { limit: 100, include: 5 });
        setPosts(postsData || []);
      } catch (e) {
        console.error("Failed to load blog page data:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Extract unique categories from all posts
  const postCategories: string[] = Array.from(new Set(posts.flatMap(getPostCategories)))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const categoriesList = ['ALL', ...postCategories];

  // Featured Post
  const featuredPosts = posts.filter(p => Boolean(p.fields.is_featured || p.fields.isFeatured || p.fields.featured));
  const mainFeatured = featuredPosts.length > 0 ? featuredPosts[0] : null;

  // Top Articles (explicit reference/flag or fallback to top 4 latest)
  const explicitTop = posts.filter(p => {
    const f = (p?.fields || {}) as any;
    return Boolean(f.isTopArticle || f.is_top_article || f.topArticle || f.topArticles || f.isTop || f.isRecent || f.top_article);
  });
  const topArticles = explicitTop.length > 0 ? explicitTop.slice(0, 4) : posts.slice(0, 4);

  // Filter & Search
  const filteredPosts = posts.filter(p => {
    const matchesCategory = selectedCategory === 'ALL' || (() => {
      const displayCats = getPostCategories(p);
      return displayCats.some(c => c.toUpperCase() === selectedCategory.toUpperCase());
    })();

    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || (() => {
      const title = (p.fields.title || '').toLowerCase();
      const summary = (p.fields.summary || p.fields.excerpt || '').toLowerCase();
      const author = (p.fields.author || '').toLowerCase();
      return title.includes(query) || summary.includes(query) || author.includes(query);
    })();

    return matchesCategory && matchesSearch;
  });

  // Sort
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'title') {
      return (a.fields.title || '').localeCompare(b.fields.title || '');
    }
    const dateA = new Date(a.fields.date || 0).getTime();
    const dateB = new Date(b.fields.date || 0).getTime();
    return sortBy === 'oldest' ? dateA - dateB : dateB - dateA;
  });

  if (loading) {
    return <GridSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Page Title Header */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-4 border-b border-gray-200/80 mb-6">
        <div className="flex flex-row items-end justify-between gap-4">
          <div>
            <span className="font-mono text-[10px] sm:text-xs text-[#C8885B] uppercase tracking-widest font-bold">
              EDITORIAL & ARCHIVES
            </span>
            <div className="flex items-center gap-3 mt-1">
              <h1 className="text-2xl sm:text-4xl font-display font-black text-[#1A1A1A] uppercase tracking-tight">
                BLOG
              </h1>
              {/* Mobile Filter Toggle Icon Button */}
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden relative bg-transparent hover:bg-gray-200/60 text-[#1A1A1A] w-[30px] h-[30px] p-0 flex items-center justify-center transition-colors group cursor-pointer shrink-0 ml-[230px]"
                aria-label="Filter and Search"
              >
                <Menu className="w-5 h-5 text-[#1A1A1A] group-hover:text-[#C8885B] transition-colors" />
                {(searchQuery || selectedCategory !== 'ALL') && (
                  <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[#F4A62A] border-2 border-[#FAF8F5]" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>



      {/* Main Content Layout with Desktop Sidebar */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 pb-12 sm:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Desktop Sidebar Column */}
          <aside className="hidden lg:block lg:col-span-1 space-y-6">
            <div className="bg-[#F7F4F0] border border-[#E8E3DC] p-5 shadow-xs sticky top-24">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E3DC] mb-5">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#C8885B]" />
                  <h3 className="font-display font-black text-xs uppercase tracking-wider text-[#1A1A1A]">
                    FILTERS & SEARCH
                  </h3>
                </div>
                {(searchQuery || selectedCategory !== 'ALL') && (
                  <button
                    onClick={() => {
                      handleSelectCategory('ALL');
                      setSearchQuery('');
                    }}
                    className="text-[10px] font-mono text-[#C8885B] hover:underline"
                  >
                    RESET
                  </button>
                )}
              </div>

              {/* Search Field */}
              <div className="mb-6">
                <label className="block font-display font-bold text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                  SEARCH ARTICLES
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Keywords, title, author..."
                    className="w-full pl-9 pr-8 py-2 bg-white border border-[#E8E3DC] text-xs font-sans text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#C8885B]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Sort Dropdown */}
              <div className="mb-6">
                <label className="block font-display font-bold text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                  SORT ORDER
                </label>
                <div className="flex items-center gap-2 bg-white border border-[#E8E3DC] px-3 py-2 text-xs">
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#C8885B] shrink-0" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'title')}
                    className="w-full bg-transparent font-display font-bold text-xs uppercase text-gray-800 focus:outline-none cursor-pointer"
                  >
                    <option value="newest">NEWEST FIRST</option>
                    <option value="oldest">OLDEST FIRST</option>
                    <option value="title">TITLE (A-Z)</option>
                  </select>
                </div>
              </div>

              {/* Category List */}
              <div>
                <label className="block font-display font-bold text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                  CATEGORIES ({categoriesList.length - 1})
                </label>
                <div className="space-y-1 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
                  {categoriesList.map((cat) => {
                    const isSelected = selectedCategory.toUpperCase() === cat.toUpperCase();
                    const count = cat === 'ALL'
                      ? posts.length
                      : posts.filter(p => {
                          const displayCats = getPostCategories(p);
                          return displayCats.some(c => c.toUpperCase() === cat.toUpperCase());
                        }).length;

                    return (
                      <button
                        key={cat}
                        onClick={() => handleSelectCategory(cat)}
                        className={`w-full text-left px-3 py-2 text-xs font-display font-bold uppercase tracking-wider flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-[#1A1A1A] text-white'
                            : 'bg-white hover:bg-gray-100 text-gray-700 border border-[#E8E3DC]'
                        }`}
                      >
                        <span className="truncate pr-2">{cat}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 ${isSelected ? 'bg-[#C8885B] text-white' : 'bg-gray-100 text-gray-500'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* Posts Grid Container */}
          <main className="lg:col-span-3">
            {/* Active Filters Bar (Desktop & Mobile) */}
            {(searchQuery || selectedCategory !== 'ALL') && (
              <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-[#F7F4F0] border border-[#E8E3DC] text-xs">
                <span className="text-gray-500 font-mono text-[11px] uppercase font-bold">ACTIVE FILTERS:</span>
                {selectedCategory !== 'ALL' && (
                  <span className="bg-[#C8885B] text-white font-display font-bold text-[10px] uppercase px-2 py-0.5 flex items-center gap-1">
                    {selectedCategory}
                    <X className="w-3 h-3 cursor-pointer hover:opacity-80" onClick={() => handleSelectCategory('ALL')} />
                  </span>
                )}
                {searchQuery && (
                  <span className="bg-[#1A1A1A] text-white font-mono text-[10px] px-2 py-0.5 flex items-center gap-1">
                    "{searchQuery}"
                    <X className="w-3 h-3 cursor-pointer hover:opacity-80" onClick={() => setSearchQuery('')} />
                  </span>
                )}
                <button
                  onClick={() => {
                    handleSelectCategory('ALL');
                    setSearchQuery('');
                  }}
                  className="text-[10px] font-mono underline text-gray-500 hover:text-black ml-auto"
                >
                  CLEAR ALL
                </button>
              </div>
            )}

            {/* Results Count & Title */}
            {selectedCategory !== 'ALL' && (
              <div className="border-b border-black pb-2 sm:pb-3 mb-4 sm:mb-6 flex items-center justify-between">
                <h2 className="text-xl sm:text-3xl font-display font-black text-black uppercase tracking-tight pl-2 sm:pl-3">
                  {`${selectedCategory} ARTICLES`}
                </h2>
              </div>
            )}

            {sortedPosts.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-gray-300 bg-[#F7F4F0] my-6">
                <BookOpen className="w-10 h-10 mx-auto text-gray-400 mb-3 opacity-40" />
                <h3 className="font-display font-black text-lg text-gray-800 uppercase tracking-wide mb-2">
                  NO ARTICLES FOUND
                </h3>
                <p className="font-[Open_Sans] text-xs text-gray-500 max-w-md mx-auto mb-6">
                  No blog posts match your current search or category filter.
                </p>
                <button
                  onClick={() => {
                    handleSelectCategory('ALL');
                    setSearchQuery('');
                  }}
                  className="bg-[#C8885B] hover:bg-[#a66e47] text-white font-display font-bold text-xs uppercase tracking-widest py-2.5 px-6 transition-colors"
                >
                  RESET FILTERS
                </button>
              </div>
            ) : selectedCategory === 'ALL' && !searchQuery ? (
              <div className="space-y-8">
                {!showCategoriesView ? (
                  /* TOP ARTICLES ONLY */
                  topArticles.length > 0 ? (
                    <div>
                      <div className="border-b border-black pb-2 sm:pb-3 mb-4 sm:mb-6 flex items-center justify-between">
                        <h2 className="text-xl sm:text-2xl font-display font-black text-black uppercase tracking-tight pl-2 sm:pl-3 border-l-4 border-[#C8885B]">
                          TOP ARTICLES
                        </h2>
                        <button
                          onClick={() => setShowCategoriesView(true)}
                          className="ml-auto bg-transparent text-[#1A1A1A] hover:text-[#C8885B] font-display font-bold text-xs sm:text-sm uppercase tracking-wider p-0 flex items-center gap-1.5 transition-colors cursor-pointer group shrink-0"
                        >
                          <span>VIEW MORE</span>
                          <span className="hidden sm:inline">BY CATEGORY</span>
                          <span className="font-mono text-[#C8885B] group-hover:text-[#1A1A1A] transition-transform group-hover:translate-x-0.5">&rarr;</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
                        {topArticles.slice(0, 8).map((post, idx) => (
                          <div key={post.sys.id} className={idx >= 6 ? "hidden md:block" : ""}>
                            <BlogPostCard post={post} getPostCategories={getPostCategories} handleSelectCategory={handleSelectCategory} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null
                ) : (
                  /* CATEGORIES BREAKDOWN VIEW */
                  <div>
                    <div className="border-b border-black pb-3 mb-6 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl sm:text-2xl font-display font-black text-black uppercase tracking-tight pl-2 sm:pl-3 border-l-4 border-[#1A1A1A]">
                          ARTICLES BY CATEGORY
                        </h2>
                        <span className="bg-[#1A1A1A] text-white font-mono text-[10px] px-2 py-0.5 font-bold">
                          {posts.length}
                        </span>
                      </div>
                      <button
                        onClick={() => setShowCategoriesView(false)}
                        className="bg-[#1A1A1A] hover:bg-[#C8885B] text-white font-display font-bold text-xs uppercase tracking-wider px-3.5 py-1.5 transition-colors"
                      >
                        &larr; BACK TO TOP ARTICLES
                      </button>
                    </div>

                    <div className="space-y-8">
                      {postCategories.map((cat, idx) => {
                        const catPosts = sortedPosts.filter(p => {
                          const displayCats = getPostCategories(p);
                          return displayCats.some(c => c.toUpperCase() === cat.toUpperCase());
                        });
                        if (catPosts.length === 0) return null;

                        return (
                          <div key={cat} className={idx === 0 ? "pt-0" : "pt-6 border-t border-[#E8E3DC]"}>
                            <div className="pb-2 sm:pb-3 mb-4 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <h3 className="text-base sm:text-xl font-display font-bold text-black uppercase tracking-tight pl-2 border-l-2 border-[#C8885B]">
                                  {cat}
                                </h3>
                                <span className="bg-gray-100 text-gray-700 font-mono text-[10px] px-2 py-0.5 font-bold">
                                  {catPosts.length}
                                </span>
                              </div>
                              <button
                                onClick={() => handleSelectCategory(cat)}
                                className="inline-flex items-center text-[#C8885B] hover:text-black font-display font-bold text-[10px] uppercase tracking-widest gap-1 transition-colors"
                              >
                                <span>VIEW ALL</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-6">
                              {catPosts.slice(0, 4).map((post) => (
                                <BlogPostCard key={post.sys.id} post={post} getPostCategories={getPostCategories} handleSelectCategory={handleSelectCategory} />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="border-b border-black pb-2 sm:pb-3 mb-4 sm:mb-6 flex items-center justify-between">
                  <h2 className="text-xl sm:text-3xl font-display font-black text-black uppercase tracking-tight pl-2 sm:pl-3">
                    {selectedCategory === 'ALL' ? 'ALL ARTICLES' : `${selectedCategory} ARTICLES`}
                  </h2>
                  <span className="font-mono text-xs text-gray-500 font-bold">
                    {sortedPosts.length} ARTICLES
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-6">
                  {sortedPosts.map((post) => (
                    <BlogPostCard key={post.sys.id} post={post} getPostCategories={getPostCategories} handleSelectCategory={handleSelectCategory} />
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative w-full max-w-xs bg-[#FDFBF7] h-full shadow-2xl z-10 flex flex-col justify-between overflow-y-auto"
            >
              <div>
                <div className="p-4 bg-[#1A1A1A] text-white flex items-center justify-between border-b border-gray-800">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-[#F4A62A]" />
                    <h3 className="font-display font-black text-xs uppercase tracking-wider text-white">
                      FILTER & SEARCH
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 space-y-6">
                  {/* Search */}
                  <div>
                    <label className="block font-display font-bold text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                      SEARCH ARTICLES
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Title, keywords, author..."
                        className="w-full pl-9 pr-8 py-2 bg-white border border-[#E8E3DC] text-xs font-sans text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#C8885B]"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sort */}
                  <div>
                    <label className="block font-display font-bold text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                      SORT BY
                    </label>
                    <div className="flex items-center gap-2 bg-white border border-[#E8E3DC] px-3 py-2 text-xs">
                      <ArrowUpDown className="w-3.5 h-3.5 text-[#C8885B] shrink-0" />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'title')}
                        className="w-full bg-transparent font-display font-bold text-xs uppercase text-gray-800 focus:outline-none cursor-pointer"
                      >
                        <option value="newest">NEWEST FIRST</option>
                        <option value="oldest">OLDEST FIRST</option>
                        <option value="title">TITLE (A-Z)</option>
                      </select>
                    </div>
                  </div>

                  {/* Categories */}
                  <div>
                    <label className="block font-display font-bold text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                      CATEGORIES ({categoriesList.length - 1})
                    </label>
                    <div className="space-y-1 max-h-[280px] overflow-y-auto custom-scrollbar">
                      {categoriesList.map((cat) => {
                        const isSelected = selectedCategory.toUpperCase() === cat.toUpperCase();
                        const count = cat === 'ALL'
                          ? posts.length
                          : posts.filter(p => {
                              const displayCats = getPostCategories(p);
                              return displayCats.some(c => c.toUpperCase() === cat.toUpperCase());
                            }).length;

                        return (
                          <button
                            key={cat}
                            onClick={() => {
                              handleSelectCategory(cat);
                              setIsMobileSidebarOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs font-display font-bold uppercase tracking-wider flex items-center justify-between transition-colors ${
                              isSelected
                                ? 'bg-[#1A1A1A] text-white'
                                : 'bg-white hover:bg-gray-100 text-gray-700 border border-[#E8E3DC]'
                            }`}
                          >
                            <span className="truncate pr-2">{cat}</span>
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 ${isSelected ? 'bg-[#C8885B] text-white' : 'bg-gray-100 text-gray-500'}`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 bg-[#F7F4F0] border-t border-[#E8E3DC] flex items-center gap-3">
                <button
                  onClick={() => {
                    handleSelectCategory('ALL');
                    setSearchQuery('');
                  }}
                  className="flex-1 py-2 text-xs font-display font-bold uppercase border border-gray-300 text-gray-700 hover:bg-gray-200 transition-colors text-center"
                >
                  RESET
                </button>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="flex-1 py-2 text-xs font-display font-bold uppercase bg-[#C8885B] text-white hover:bg-[#a66e47] transition-colors text-center"
                >
                  APPLY
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <BlogNotificationBanner />
    </div>
  );
}


