import { getImageUrl } from '../utils';
import React, { useEffect, useState, ReactNode } from 'react';

import { fetchEntries } from '../api';
import { getBookUrl } from "../utils";
import { Book, Category, Author, HomepageConfig } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Minus, Settings2, X, Filter } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { GridSkeleton } from '../components/GridSkeleton';

function BannerCarousel({ items, bgColor, renderItem, hideDots = false }: { items: any[], bgColor: string, renderItem: (item: any, index: number) => ReactNode, hideDots?: boolean }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (!items || items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 12000);
    return () => clearInterval(interval);
  }, [items]);

  if (!items || items.length === 0) return null;

  const item = items[currentIndex];

  return (
    <div className={`relative w-full ${bgColor} overflow-hidden group`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="w-full h-full"
        >
          {renderItem(item, currentIndex)}
        </motion.div>
      </AnimatePresence>
      
      {!hideDots && items.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
          {items.map((_, i) => (
            <button 
              key={i} 
              onClick={() => setCurrentIndex(i)} 
              className={`w-2 h-2 rounded-full transition-colors ${i === currentIndex ? 'bg-white' : 'bg-white/30'}`} 
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CategoryRowData {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  subtitle?: string;
  books: Book[];
}

function BookCard({ book }: { book: Book; key?: React.Key }) {
  const coverUrl = getImageUrl(book.fields.coverImage || book.fields.imageUrl) || book.fields.imageUrl;
  const rawGenre = book.fields.genre || book.fields.category;
  const displayGenre = rawGenre ? String(rawGenre).split(',')[0].trim() : '';

  let badgeUI = null;
  const rank = book.fields.rank || book.fields.topPickOrder;

  if (book.fields.isTopPick && rank) {
    if (rank >= 1 && rank <= 5) {
      badgeUI = (
        <div className="absolute top-1 sm:top-2 right-1 sm:right-2 px-1.5 sm:px-2 py-0.5 text-[7px] sm:text-[9px] font-extrabold tracking-widest uppercase rounded shadow bg-[#121212] border border-[#FFD700] text-[#FFD700] z-20 flex items-center gap-1">
          <i className="fa-solid fa-medal text-[#FFD700]"></i> #{rank}
        </div>
      );
    } else if (rank >= 6 && rank <= 15) {
      badgeUI = (
        <div className="absolute top-1 sm:top-2 right-1 sm:right-2 px-1.5 sm:px-2 py-0.5 text-[7px] sm:text-[9px] font-extrabold tracking-widest uppercase rounded shadow bg-[#121212] border border-slate-300 text-slate-200 z-20 flex items-center gap-1">
          <i className="fa-solid fa-medal text-slate-300"></i> #{rank}
        </div>
      );
    } else if (rank >= 16 && rank <= 20) {
      badgeUI = (
        <div className="absolute top-1 sm:top-2 right-1 sm:right-2 px-1.5 sm:px-2 py-0.5 text-[7px] sm:text-[9px] font-extrabold tracking-widest uppercase rounded shadow bg-[#121212] border border-[#CD7F32] text-[#CD7F32] z-20 flex items-center gap-1">
          <i className="fa-solid fa-medal text-[#CD7F32]"></i> #{rank}
        </div>
      );
    }
  } else if (book.fields.isDiscovery) {
    badgeUI = (
      <div className="absolute top-1 sm:top-2 right-1 sm:right-2 px-1.5 sm:px-2 py-0.5 text-[7px] sm:text-[9px] font-bold tracking-widest uppercase rounded shadow bg-[#521344] text-white z-20 flex items-center gap-1">
        <span className="relative inline-flex items-center justify-center">
          <i className="fa-solid fa-certificate text-[9px] sm:text-[11px] text-white"></i>
          <i className="fa-solid fa-check text-[5px] sm:text-[6px] absolute text-[#521344] font-bold"></i>
        </span>
        DISCOVERY
      </div>
    );
  } else if (book.fields.isBottomShelf) {
    badgeUI = (
      <div className="absolute top-1 sm:top-2 right-1 sm:right-2 px-1 sm:px-2 py-0.5 text-[7px] sm:text-[9px] font-bold tracking-widest uppercase rounded shadow bg-[#180C27] border border-purple-500/40 text-purple-200 z-20 flex items-center gap-1">
        <i className="fa-solid fa-box-archive text-purple-300 text-[8px] sm:text-[10px]"></i>
        BOTTOM SHELF
      </div>
    );
  }

  return (
    <Link to={getBookUrl(book)} className="group relative w-[100px] sm:w-[180px] h-[145px] sm:h-[270px] flex-shrink-0 overflow-hidden shadow-md block rounded">
      {badgeUI}
      {coverUrl ? (
        <img src={coverUrl} alt={book.fields.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
      ) : (
        <div className="w-full h-full bg-dusk-blue flex items-center justify-center p-2 sm:p-4 text-center">
          <span className="font-display font-bold text-white text-[10px] sm:text-sm">{book.fields.title}</span>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0F1319] via-[#0F1319]/80 to-transparent opacity-100 flex flex-col justify-end p-2 sm:p-4">
        {displayGenre && (
          <span className="text-primary-teal font-display text-[8px] sm:text-[10px] font-bold uppercase tracking-widest mb-0.5 sm:mb-1 line-clamp-1">
            {displayGenre}
          </span>
        )}
        <h4 className="text-white font-display font-bold text-[10px] sm:text-sm leading-snug sm:leading-tight mb-0.5 sm:mb-1 line-clamp-2 uppercase">
          {book.fields.title}
        </h4>
        {book.fields.author && (
          <p className="text-gray-300 font-sans text-[9px] sm:text-[11px] line-clamp-1">
            {book.fields.author}
          </p>
        )}
      </div>
    </Link>
  );
}

const genreDescriptions: Record<string, string> = {
  'Science Fiction': 'Science Fiction is a genre of speculative fiction that typically deals with imaginative and futuristic concepts such as advanced science and technology, space exploration, and time travel.',
  'Sci-Fi': 'Science Fiction is a genre of speculative fiction that typically deals with imaginative and futuristic concepts such as advanced science and technology, space exploration, and time travel.',
  'Fantasy': 'Fantasy explores magical realms, mythical creatures, epic quests, and heroic characters set in imaginative worlds beyond ordinary reality.',
  'Mystery': 'Mystery features suspenseful stories of crime, investigation, secrets, and unraveling complex puzzles.',
  'Thriller': 'Thrillers deliver fast-paced, high-stakes narratives filled with tension, excitement, and unexpected twists.',
  'Romance': 'Romance focuses on emotional connections, interpersonal relationships, passion, and personal growth.',
  'Non-Fiction': 'Non-Fiction offers insightful perspectives, real-world knowledge, biographies, history, and factual explorations.',
  'Historical Fiction': 'Historical fiction brings past eras to life through compelling characters and rich historical backdrops.',
  'Horror': 'Horror explores dark themes, psychological suspense, and eerie occurrences that challenge human courage.',
};

const getCategoryDescription = (title: string, rawDesc?: string) => {
  if (rawDesc && !rawDesc.includes('A selection of books categorized under') && !rawDesc.includes('Explore our handpicked selection')) {
    return rawDesc;
  }
  for (const [key, desc] of Object.entries(genreDescriptions)) {
    if (title.toLowerCase().includes(key.toLowerCase())) {
      return desc;
    }
  }
  return `A curated collection of captivating books, stories, and literary works in ${title}.`;
};

function CategoryRow({ category }: { category: CategoryRowData; key?: React.Key }) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  if (!category.books || category.books.length === 0) return null;
  
  const targetUrl = category.id.startsWith('author-')
    ? `/author/${category.title.replace('Books by ', '').toLowerCase().trim().replace(/\s+/g, '-')}`
    : `/category/${category.slug || category.title.toLowerCase().trim().replace(/\s+/g, '-')}`;

  return (
    <div className="border-t border-gray-200 py-6 sm:py-12">
      <div className="flex justify-between items-start mb-3 sm:mb-4 gap-4">
        <div>
          <h2 className="text-xl sm:text-3xl font-display font-bold uppercase tracking-widest text-black mb-1 sm:mb-2">
            <Link to={targetUrl} className="hover:text-[#C8885B] transition-colors">
              {category.title}
            </Link>
          </h2>
          {category.description && (
            <p className="text-gray-600 font-sans text-xs sm:text-base max-w-3xl leading-relaxed mt-1">
              {category.description}
            </p>
          )}
        </div>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 sm:p-2 border border-gray-200 rounded-full hover:bg-gray-100 transition-colors shrink-0"
          aria-label={isExpanded ? "Collapse section" : "Expand section"}
        >
          {isExpanded ? <Minus className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" /> : <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />}
        </button>
      </div>
      
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2.5 sm:gap-6 overflow-x-auto pb-4 sm:pb-6 pt-2 sm:pt-4 scrollbar-hide">
              {category.books.slice(0, 4).map((book) => (
                <BookCard key={book.sys.id} book={book} />
              ))}
              {category.books.length > 4 && (
                <Link to={targetUrl} className="flex-shrink-0 w-[100px] sm:w-[180px] h-[145px] sm:h-[270px] border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center hover:bg-gray-50 transition-colors group">
                  <div className="w-7 h-7 sm:w-12 sm:h-12 bg-white rounded-full border border-gray-200 flex items-center justify-center mb-1.5 sm:mb-3 shadow-sm group-hover:scale-110 transition-transform">
                    <Plus className="w-3.5 h-3.5 sm:w-6 sm:h-6 text-gray-500" />
                  </div>
                  <span className="font-display font-bold text-[9px] sm:text-xs uppercase tracking-widest text-gray-500">View More</span>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LibraryCollectionPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<HomepageConfig | null>(null);
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<CategoryRowData[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [filter, setFilter] = useState('ALL');
  const [subFilter, setSubFilter] = useState('ALL');
  const [sort, setSort] = useState('DEFAULT');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const authorOptions = React.useMemo(() => {
    const authors = new Set<string>();
    allBooks.forEach(b => {
      if (b.fields.author) authors.add(b.fields.author.trim());
    });
    return Array.from(authors).sort();
  }, [allBooks]);

  const genreOptions = React.useMemo(() => {
    const genres = new Set<string>();
    allBooks.forEach(b => {
      const g = b.fields.genre || b.fields.category;
      if (g) String(g).split(',').forEach(x => genres.add(x.trim()));
    });
    return Array.from(genres).sort();
  }, [allBooks]);

  const processedCategories = React.useMemo(() => {
    let cats = [...categories];
    if (filter === 'AUTHORS') {
      cats = authorOptions.map(a => ({
        id: `author-${a}`,
        title: a,
        subtitle: 'AUTHOR SPOTLIGHT',
        description: `A curated collection of captivating books, stories, and literary works in Books by ${a}.`,
        books: allBooks.filter(b => b.fields.author && b.fields.author.trim() === a)
      }));
      if (subFilter !== 'ALL') cats = cats.filter(c => c.title === subFilter);
    }
    if (filter === 'GENRES') {
      cats = genreOptions.map(g => ({
        id: `genre-${g}`,
        title: g,
        subtitle: 'GENRE / CATEGORY',
        description: getCategoryDescription(g),
        books: allBooks.filter(b => {
          const bg = b.fields.genre || b.fields.category;
          return bg && String(bg).includes(g);
        })
      }));
      if (subFilter !== 'ALL') cats = cats.filter(c => c.title === subFilter);
    }
    
    if (sort === 'A-Z') cats.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === 'Z-A') cats.sort((a, b) => b.title.localeCompare(a.title));
    return cats;
  }, [categories, filter, subFilter, sort, allBooks, authorOptions, genreOptions]);

  const filterSortLabel = React.useMemo(() => {
    let fText = 'ALL BOOKS';
    if (filter === 'AUTHORS') {
      fText = subFilter !== 'ALL' ? `AUTHOR: ${subFilter}` : 'AUTHORS';
    } else if (filter === 'GENRES') {
      fText = subFilter !== 'ALL' ? `GENRE: ${subFilter}` : 'GENRES';
    }
    let sText = sort === 'DEFAULT' ? 'DEFAULT' : sort;
    return `${fText} • ${sText}`;
  }, [filter, subFilter, sort]);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    async function loadData() {
      const [configData, booksData, authorsData, categoriesData] = await Promise.all([
        fetchEntries<HomepageConfig>('homepageConfig', { limit: 1 }),
        fetchEntries<Book>('book', { limit: 1000 }),
        fetchEntries<Author>('author', { limit: 100, include: 2 }),
        fetchEntries<Category>('category', { limit: 100, include: 2 })
      ]);

      const conf = configData[0] || null;
      setConfig(conf);

      const sortByRank = (a: Book, b: Book) => {
        const rankA = a.fields.rank || a.fields.topPickOrder || 999;
        const rankB = b.fields.rank || b.fields.topPickOrder || 999;
        return rankA - rankB;
      };

      const allBooks = booksData;
      setAllBooks(booksData);
      
      const topPicks = allBooks.filter(b => b.fields.isTopPick).sort(sortByRank);
      const discovery = allBooks.filter(b => b.fields.isDiscovery).sort(sortByRank);
      const bottomShelf = allBooks.filter(b => b.fields.isBottomShelf).sort(sortByRank);

      const featured = [
        ...topPicks.slice(0, 5),
        ...discovery,
        ...bottomShelf.slice(0, 5)
      ];
      setFeaturedBooks(featured);

      // Build categories list
      const cats: CategoryRowData[] = [];

      // Authors with notable works
      const authorCats: CategoryRowData[] = [];
      authorsData.forEach(author => {
        if (author.fields.notableWorks && Array.isArray(author.fields.notableWorks) && author.fields.notableWorks.length > 0) {
          // Verify they are actual books
          const books = author.fields.notableWorks.filter(w => w?.sys?.contentType?.sys?.id === 'book' || w?.fields?.title) as Book[];
          if (books.length > 0) {
            authorCats.push({
              id: `author-${author.sys.id}`,
              title: `Books by ${author.fields.name}`,
              subtitle: 'AUTHOR SPOTLIGHT',
              description: `A curated collection of captivating books, stories, and literary works in Books by ${author.fields.name}.`,
              books: books
            });
          }
        }
      });

      // Contentful Categories
      const contentfulCats: CategoryRowData[] = [];
      categoriesData.forEach(c => {
        if (c.fields.books && c.fields.books.length > 0) {
          contentfulCats.push({
            id: `category-${c.sys.id}`,
            title: c.fields.title,
            slug: c.fields.slug || c.fields.title.toLowerCase().trim().replace(/\s+/g, '-'),
            subtitle: 'GENRE / CATEGORY',
            description: getCategoryDescription(c.fields.title, c.fields.description),
            books: c.fields.books as Book[]
          });
        }
      });

      // Sort authorCats and contentfulCats alphabetically
      const combinedAlpha = [...authorCats, ...contentfulCats].sort((a, b) => a.title.localeCompare(b.title));

      // Append to cats
      cats.push(...combinedAlpha);
      
      // Deduplicate by title just in case (e.g. if Contentful Category has same name as Author Category)
      const uniqueCats = Array.from(new Map(cats.map(c => [c.title, c])).values());

      setCategories(uniqueCats);
      setLoading(false);
    }
    
    loadData();
  }, []);

  // Pagination logic & refs
  const loadMoreRef = React.useRef<HTMLDivElement>(null);

  const getVisibleCategories = () => {
    const cats = processedCategories || categories;
    if (isDesktop) {
      if (page === 1) {
        return cats.slice(0, 4);
      } else {
        const start = 4 + (page - 2) * 5;
        const end = start + 5;
        return cats.slice(start, end);
      }
    } else {
      let visible = [];
      if (page >= 1) {
        visible.push(...cats.slice(0, 4));
      }
      if (page >= 2) {
        for (let i = 2; i <= page; i++) {
          const start = 4 + (i - 2) * 5;
          const end = start + 5;
          visible.push(...cats.slice(start, end));
        }
      }
      return visible;
    }
  };
  
  const visibleCategories = getVisibleCategories();
  const totalPages = 1 + Math.ceil(Math.max(0, (processedCategories?.length || categories.length) - 4) / 5);
  const hasMore = (processedCategories?.length || categories.length) > visibleCategories.length;

  useEffect(() => {
    if (loading || isDesktop || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [loading, isDesktop, hasMore, page]);

  if (loading) {
    return <GridSkeleton />;
  }

  return (
    <div className="min-h-screen bg-parchment-50">
      
      {/* Header Section */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 pt-6 sm:pt-12 pb-6 sm:pb-8">
        <button onClick={() => navigate('/')} className="inline-flex items-center text-[#C8885B] font-display font-bold text-[10px] uppercase tracking-widest hover:text-[#A66F47] transition-colors mb-6 sm:mb-12 group">
          <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          BACK TO HOME
        </button>
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 sm:gap-6 border-b border-gray-200 pb-6 sm:pb-8">
          <div className="max-w-2xl">
            <span className="text-[#C8885B] font-display font-bold text-[10px] uppercase tracking-[0.2em] mb-2 sm:mb-3 block">
              {config?.fields.reviewsTitle || 'Books, Stories & Reading Journeys'}
            </span>
            <h1 className="text-3xl sm:text-5xl md:text-[56px] font-display font-bold text-black mb-3 sm:mb-4 tracking-tight leading-none">
              {config?.fields.reviewsSubtitle || 'Library Collection'}
            </h1>
            <p className="text-gray-600 font-[Open_Sans] text-sm sm:text-base leading-relaxed md:leading-[35.2px]">
              {config?.fields.reviewsDescription || "A collection of books and series I've read over the years, along with reviews, reflections, and recommendations. Whether you're looking for your next adventure or simply exploring new stories, I hope you find something worth adding to your reading list."}
            </p>

          </div>
          
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            {/* Desktop Filter Dropdown */}
            <div className="hidden sm:block relative">
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm hover:border-[#C8885B] active:bg-gray-50 transition-colors font-sans text-sm font-bold text-black"
              >
                <Settings2 className="w-4 h-4 text-[#C8885B]" />
                <span>Filters & Sort</span>
                <span className="bg-gray-100 rounded-full px-3 py-1 text-gray-900 ml-1 text-[10px] uppercase tracking-widest font-display font-bold whitespace-nowrap">{filterSortLabel}</span>
              </button>
              
              {isFilterOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-gray-100">
                    <div className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-3">Filter By</div>
                    <div className="flex flex-col gap-2">
                      {['ALL', 'AUTHORS', 'GENRES'].map(f => (
                        <label key={f} className="flex items-center gap-2 text-sm cursor-pointer hover:text-[#C8885B]">
                          <input type="radio" name="filter-desktop" checked={filter === f} onChange={() => { setFilter(f); setSubFilter('ALL'); }} className="accent-[#C8885B]" />
                          {f === 'ALL' ? 'ALL BOOKS' : f}
                        </label>
                      ))}
                    </div>
                  </div>
                  {filter !== 'ALL' && (
                    <div className="p-4 border-b border-gray-100 max-h-48 overflow-y-auto">
                      <div className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-3">
                        {filter === 'AUTHORS' ? 'Select Author' : 'Select Genre'}
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-[#C8885B]">
                          <input type="radio" name="subfilter-desktop" checked={subFilter === 'ALL'} onChange={() => setSubFilter('ALL')} className="accent-[#C8885B]" />
                          All {filter === 'AUTHORS' ? 'Authors' : 'Genres'}
                        </label>
                        {(filter === 'AUTHORS' ? authorOptions : genreOptions).map(opt => (
                          <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer hover:text-[#C8885B]">
                            <input type="radio" name="subfilter-desktop" checked={subFilter === opt} onChange={() => setSubFilter(opt)} className="accent-[#C8885B]" />
                            {opt}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="p-4">
                    <div className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-3">Sort By</div>
                    <div className="flex flex-col gap-2">
                      {['DEFAULT', 'A-Z', 'Z-A'].map(s => (
                        <label key={s} className="flex items-center gap-2 text-sm cursor-pointer hover:text-[#C8885B]">
                          <input type="radio" name="sort-desktop" checked={sort === s} onChange={() => setSort(s)} className="accent-[#C8885B]" />
                          {s}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Filter Icon & Trigger Button */}
            <div className="sm:hidden w-full">
              <button 
                onClick={() => setIsMobileDrawerOpen(true)}
                className="flex items-center justify-between gap-2 w-full px-4 py-2.5 bg-white border border-gray-200 rounded-full shadow-sm active:bg-gray-50 transition-colors font-sans text-xs font-bold text-black"
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#C8885B]" />
                  <span>Filters & Sort</span>
                </div>
                <span className="bg-gray-100 rounded-full px-2.5 py-1 text-gray-900 text-[9px] uppercase tracking-widest font-display font-bold truncate max-w-[150px]">{filterSortLabel}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sliding Filter Sidebar Drawer */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileDrawerOpen(false)}
              className="fixed inset-0 bg-black z-50 sm:hidden"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-4/5 max-w-xs bg-white z-50 shadow-2xl flex flex-col sm:hidden overflow-hidden"
            >
              <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-parchment-50">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#C8885B]" />
                  <h3 className="font-display font-bold text-sm uppercase tracking-widest text-black">Filter & Sort</h3>
                </div>
                <button 
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1 text-gray-500 hover:text-black rounded-full"
                  aria-label="Close filters"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 flex-1 overflow-y-auto space-y-6">
                <div>
                  <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-3">Filter Category</div>
                  <div className="flex flex-col gap-2">
                    {['ALL', 'AUTHORS', 'GENRES'].map(f => (
                      <label key={f} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer text-xs font-bold text-gray-800">
                        <span>{f === 'ALL' ? 'All Books' : f}</span>
                        <input 
                          type="radio" 
                          name="mobile-filter" 
                          checked={filter === f} 
                          onChange={() => { setFilter(f); setSubFilter('ALL'); }} 
                          className="accent-[#C8885B]" 
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {filter !== 'ALL' && (
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-3">
                      {filter === 'AUTHORS' ? 'Select Author' : 'Select Genre'}
                    </div>
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                      <label className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer text-xs font-medium text-gray-800">
                        <span>All {filter === 'AUTHORS' ? 'Authors' : 'Genres'}</span>
                        <input 
                          type="radio" 
                          name="mobile-subfilter" 
                          checked={subFilter === 'ALL'} 
                          onChange={() => setSubFilter('ALL')} 
                          className="accent-[#C8885B]" 
                        />
                      </label>
                      {(filter === 'AUTHORS' ? authorOptions : genreOptions).map(opt => (
                        <label key={opt} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer text-xs font-medium text-gray-800">
                          <span className="truncate pr-2">{opt}</span>
                          <input 
                            type="radio" 
                            name="mobile-subfilter" 
                            checked={subFilter === opt} 
                            onChange={() => setSubFilter(opt)} 
                            className="accent-[#C8885B]" 
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-3">Sort Order</div>
                  <div className="flex flex-col gap-2">
                    {[
                      { id: 'DEFAULT', label: 'Default Order' },
                      { id: 'A-Z', label: 'Alphabetical (A - Z)' },
                      { id: 'Z-A', label: 'Alphabetical (Z - A)' }
                    ].map(s => (
                      <label key={s.id} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer text-xs font-medium text-gray-800">
                        <span>{s.label}</span>
                        <input 
                          type="radio" 
                          name="mobile-sort" 
                          checked={sort === s.id} 
                          onChange={() => setSort(s.id)} 
                          className="accent-[#C8885B]" 
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <button 
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="w-full bg-[#C8885B] text-white py-2.5 font-display font-bold text-xs uppercase tracking-widest rounded-lg shadow-sm hover:bg-[#A66F47] transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      

      
      {/* Categories UI */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        {visibleCategories.map((category) => (
          <CategoryRow key={category.id} category={category} />
        ))}
        
        {isDesktop ? (
          <div className="flex justify-center items-center gap-2 pt-8">
            <button 
              onClick={() => {
                setPage(p => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={page === 1}
              className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => {
                  setPage(p);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`w-10 h-10 flex items-center justify-center rounded font-display font-bold transition-colors ${page === p ? 'bg-primary-orange text-black' : 'border border-gray-200 hover:bg-gray-100 text-gray-600'}`}
              >
                {p}
              </button>
            ))}
            <button 
              onClick={() => {
                setPage(p => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={page === totalPages}
              className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          hasMore && (
            <div ref={loadMoreRef} className="py-8 text-center flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-[#C8885B] border-t-transparent rounded-full animate-spin" />
            </div>
          )
        )}
      </div>

    </div>
  );
}
