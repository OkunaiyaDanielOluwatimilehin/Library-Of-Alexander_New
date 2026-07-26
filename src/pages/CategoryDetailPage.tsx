import { getImageUrl } from '../utils';
import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ArrowUp, ArrowDown, Minus, Sparkles, ChevronDown } from 'lucide-react';

import { fetchEntries } from '../api';
import { getBookUrl } from "../utils";
import { Book, Category, Author } from '../types';
import { GridSkeleton } from '../components/GridSkeleton';
import { DiscoveryNotificationBanner } from '../components/DiscoveryNotificationBanner';

// Deterministic or Contentful-driven chart stat generator for Top Picks leaderboard
function getLeaderboardStats(rank: number, book: Book) {
  const { firstListedAt, previousRank } = book.fields;

  // Calculate weeks spent on list
  let weeks = 1;
  if (firstListedAt) {
    const firstDate = new Date(firstListedAt).getTime();
    if (!isNaN(firstDate)) {
      const diffMs = Math.max(0, Date.now() - firstDate);
      weeks = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7)));
    }
  } else {
    // Fallback calculation based on rank & ID
    let charCodeSum = 0;
    for (let i = 0; i < book.sys.id.length; i++) charCodeSum += book.sys.id.charCodeAt(i);
    weeks = Math.max(1, (charCodeSum % 12) + Math.floor(rank / 2));
  }

  // Calculate movement from previousRank
  if (previousRank !== undefined && previousRank !== null) {
    if (previousRank === 0 || previousRank < 0) {
      return { type: 'debut', diff: 0, weeks, label: 'DEBUT', color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30' };
    }
    const diff = previousRank - rank;
    if (diff > 0) {
      return { type: 'up', diff, weeks, label: `UP ${diff}`, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' };
    } else if (diff < 0) {
      const drop = Math.abs(diff);
      return { type: 'down', diff: drop, weeks, label: `DROP ${drop}`, color: 'text-rose-600 bg-rose-500/10 border-rose-500/20' };
    } else {
      return rank === 1
        ? { type: 'same', diff: 0, weeks, label: 'NO. 1 SPOT', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' }
        : { type: 'same', diff: 0, weeks, label: 'STEADY', color: 'text-gray-500 bg-gray-100 border-gray-200' };
    }
  }

  // Fallback if previousRank is not defined in Contentful
  let charCodeSum = 0;
  for (let i = 0; i < book.sys.id.length; i++) charCodeSum += book.sys.id.charCodeAt(i);
  const mod = (charCodeSum + rank) % 5;

  if (rank === 1) {
    return { type: 'same', diff: 0, weeks, label: 'NO. 1 SPOT', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
  } else if (rank === 2) {
    return { type: 'down', diff: 1, weeks, label: 'DROP 1', color: 'text-red-500 bg-red-500/10 border-red-500/20' };
  } else if (rank === 3 || mod === 0) {
    return { type: 'debut', diff: 0, weeks, label: 'DEBUT', color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30' };
  } else if (mod === 1 || mod === 3) {
    const diff = (rank % 3) + 1;
    return { type: 'up', diff, weeks, label: `UP ${diff}`, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' };
  } else if (mod === 2) {
    const diff = (rank % 2) + 1;
    return { type: 'down', diff, weeks, label: `DROP ${diff}`, color: 'text-rose-600 bg-rose-500/10 border-rose-500/20' };
  } else {
    return { type: 'same', diff: 0, weeks, label: 'STEADY', color: 'text-gray-500 bg-gray-100 border-gray-200' };
  }
}

function BookCard({ book, currentSlug }: { book: Book; currentSlug?: string; key?: React.Key }) {
  const coverUrl = getImageUrl(book.fields.coverImage || book.fields.imageUrl) || book.fields.imageUrl;
  const rawGenre = book.fields.genre || book.fields.category;
  const displayGenre = rawGenre ? String(rawGenre).split(',')[0].trim() : '';

  let badgeUI = null;
  const rank = book.fields.rank || book.fields.topPickOrder;

  const showDiscovery = currentSlug === 'discovery' || (book.fields.isDiscovery && currentSlug !== 'top-picks');
  const showTopPick = currentSlug === 'top-picks' || (book.fields.isTopPick && rank && currentSlug !== 'discovery');
  const showBottomShelf = currentSlug === 'bottom-shelf' || book.fields.isBottomShelf;

  if (currentSlug === 'discovery' || (showDiscovery && !showTopPick)) {
    badgeUI = (
      <div className="absolute top-2 right-2 px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold tracking-widest uppercase rounded shadow bg-[#521344] text-white z-20 flex items-center gap-1">
        <span className="relative inline-flex items-center justify-center">
          <i className="fa-solid fa-certificate text-[10px] text-white"></i>
          <i className="fa-solid fa-check text-[5px] absolute text-[#521344] font-bold"></i>
        </span>
        DISCOVERY
      </div>
    );
  } else if (showTopPick) {
    let medalColor = 'text-[#FFD700]';
    let borderColor = 'border-[#FFD700] text-[#FFD700]';
    if (rank >= 6 && rank <= 15) {
      medalColor = 'text-slate-300';
      borderColor = 'border-slate-300 text-slate-200';
    } else if (rank >= 16) {
      medalColor = 'text-[#CD7F32]';
      borderColor = 'border-[#CD7F32] text-[#CD7F32]';
    }
    badgeUI = (
      <div className={`absolute top-2 right-2 px-1.5 py-0.5 text-[8px] sm:text-[9px] font-extrabold tracking-widest uppercase rounded shadow bg-[#121212] border ${borderColor} z-20 flex items-center gap-1`}>
        <i className={`fa-solid fa-medal ${medalColor}`}></i> #{rank || ''}
      </div>
    );
  } else if (showBottomShelf) {
    badgeUI = (
      <div className="absolute top-2 right-2 px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold tracking-widest uppercase rounded shadow bg-[#180C27] border border-purple-500/40 text-purple-200 z-20 flex items-center gap-1">
        <i className="fa-solid fa-box-archive text-purple-300 text-[10px]"></i>
        BOTTOM SHELF
      </div>
    );
  }

  const fromCategory = currentSlug || (book.fields.isTopPick ? 'top-picks' : book.fields.isDiscovery ? 'discovery' : book.fields.isBottomShelf ? 'bottom-shelf' : '');
  const bookTarget = `${getBookUrl(book)}?from=${fromCategory}`;

  return (
    <Link to={bookTarget} className="group relative w-full max-w-[130px] sm:max-w-[210px] mx-auto aspect-[2/3] overflow-hidden rounded shadow-sm hover:shadow-xl transition-all duration-300 block bg-[#1A1A1A]">
      {badgeUI}
      {coverUrl ? (
        <img src={coverUrl} alt={book.fields.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      ) : (
        <div className="w-full h-full bg-dusk-blue flex items-center justify-center p-2 sm:p-4 text-center">
          <span className="font-display font-bold text-white text-[9px] sm:text-sm">{book.fields.title}</span>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0F1319] via-[#0F1319]/80 to-transparent opacity-100 flex flex-col justify-end p-2 sm:p-4">
        {displayGenre && (
          <span className="text-primary-teal font-display text-[7px] sm:text-[10px] font-bold uppercase tracking-widest mb-0.5 sm:mb-1 line-clamp-1">
            {displayGenre}
          </span>
        )}
        <h4 className="text-white font-display font-bold text-[9px] sm:text-sm leading-tight mb-0.5 sm:mb-1 line-clamp-2 uppercase">
          {book.fields.title}
        </h4>
        {book.fields.author && (
          <p className="text-gray-300 font-sans text-[8px] sm:text-[11px] line-clamp-1">
            {book.fields.author}
          </p>
        )}
      </div>
    </Link>
  );
}

export default function CategoryDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [subText, setSubText] = useState('');
  
  // Desktop Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = slug === 'top-picks' ? 20 : 18; // 3 rows of 6 items on desktop

  // Mobile Top Picks State (1-10 initially, expanded to 20 on View More)
  const [topPicksExpanded, setTopPicksExpanded] = useState(false);
  const rank11Ref = useRef<HTMLAnchorElement | null>(null);

  // Mobile Infinite Scroll State for Discovery & Bottom Shelf
  const [mobileVisibleCount, setMobileVisibleCount] = useState(6);
  const observerTarget = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCurrentPage(1);
    setMobileVisibleCount(6);
    setTopPicksExpanded(false);
  }, [slug]);

  // Infinite scroll observer for mobile
  useEffect(() => {
    if (slug === 'top-picks') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setMobileVisibleCount((prev) => prev + 6);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [slug, books]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const booksData = await fetchEntries<Book>('book', { limit: 1000 });
        
        // Fetch category entries to support subText/description from Contentful
        let catDesc = '';
        try {
          const categoriesData = await fetchEntries<Category>('category', { limit: 100 });
          
          if (slug === 'top-picks') {
            const cat = categoriesData.find(c => c.fields.topPicks || c.fields.slug === 'top-picks' || c.fields.title?.toLowerCase() === 'top picks');
            if (cat) catDesc = cat.fields.topPicks || cat.fields.description || '';
          } else if (slug === 'discovery') {
            const cat = categoriesData.find(c => c.fields.discovery || c.fields.slug === 'discovery' || c.fields.title?.toLowerCase() === 'discovery');
            if (cat) catDesc = cat.fields.discovery || cat.fields.description || '';
          } else if (slug === 'bottom-shelf') {
            const cat = categoriesData.find(c => c.fields.bottomShelf || c.fields.slug === 'bottom-shelf' || c.fields.title?.toLowerCase() === 'bottom shelf');
            if (cat) catDesc = cat.fields.bottomShelf || cat.fields.description || '';
          } else {
            const matchedCat = categoriesData.find(c => {
              const catSlug = c.fields.slug || c.fields.title?.toLowerCase().replace(/\s+/g, '-');
              return catSlug === slug || c.fields.title?.toLowerCase() === slug?.replace(/-/g, ' ').toLowerCase();
            });
            if (matchedCat && matchedCat.fields.description) {
              catDesc = matchedCat.fields.description;
            }
          }
        } catch (e) {
          console.error('Error fetching category metadata', e);
        }

        setSubText(catDesc);

        const sortByRank = (a: Book, b: Book) => {
          const rankA = a.fields.rank || a.fields.topPickOrder || 999;
          const rankB = b.fields.rank || b.fields.topPickOrder || 999;
          return rankA - rankB;
        };

        if (slug === 'top-picks' || slug === 'top_picks') {
          setTitle('TOP PICKS');
          let topPickBooks = booksData.filter(b => b.fields.isTopPick || b.fields.topPickOrder);
          if (topPickBooks.length === 0) {
            const cat = categoriesData.find(c => c.fields.title?.toLowerCase().includes('top pick') || c.fields.slug === 'top-picks');
            if (cat && cat.fields.books && cat.fields.books.length > 0) {
              topPickBooks = cat.fields.books as Book[];
            } else {
              topPickBooks = booksData.slice(0, 20);
            }
          }
          setBooks(topPickBooks.sort(sortByRank));
        } else if (slug === 'discovery') {
          setTitle('DISCOVERY');
          let discBooks = booksData.filter(b => b.fields.isDiscovery);
          if (discBooks.length === 0) {
            const cat = categoriesData.find(c => c.fields.title?.toLowerCase().includes('discovery') || c.fields.slug === 'discovery');
            if (cat && cat.fields.books && cat.fields.books.length > 0) {
              discBooks = cat.fields.books as Book[];
            }
          }
          setBooks(discBooks.sort(sortByRank));
        } else if (slug === 'bottom-shelf' || slug === 'bottom_shelf') {
          setTitle('BOTTOM SHELF');
          let bsBooks = booksData.filter(b => b.fields.isBottomShelf);
          if (bsBooks.length === 0) {
            const cat = categoriesData.find(c => c.fields.title?.toLowerCase().includes('bottom shelf') || c.fields.slug === 'bottom-shelf');
            if (cat && cat.fields.books && cat.fields.books.length > 0) {
              bsBooks = cat.fields.books as Book[];
            }
          }
          setBooks(bsBooks.sort(sortByRank));
        } else if (slug?.startsWith('author-')) {
          const authorId = slug.replace('author-', '');
          const authors = await fetchEntries<Author>('author', { 'sys.id': authorId, include: 2 });
          if (authors.length > 0) {
            setTitle(`BOOKS BY ${authors[0].fields.name.toUpperCase()}`);
            if (authors[0].fields.notableWorks && Array.isArray(authors[0].fields.notableWorks)) {
              setBooks(authors[0].fields.notableWorks.filter((w: any) => w?.sys?.contentType?.sys?.id === 'book' || w?.fields?.title) as Book[]);
            }
          }
        } else if (slug?.startsWith('category-')) {
          const categoryId = slug.replace('category-', '');
          const categories = await fetchEntries<Category>('category', { 'sys.id': categoryId, include: 2 });
          if (categories.length > 0) {
            setTitle(categories[0].fields.title.toUpperCase());
            if (categories[0].fields.description) {
              setSubText(categories[0].fields.description);
            }
            if (categories[0].fields.books) {
              setBooks(categories[0].fields.books as Book[]);
            }
          }
        } else {
          setTitle(slug ? slug.replace(/-/g, ' ').toUpperCase() : 'CATEGORY');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug]);

  const isTopPicks = slug === 'top-picks';

  // Desktop Pagination calculations
  const totalPages = Math.ceil(books.length / itemsPerPage) || 1;
  const paginatedBooks = books.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Mobile Top Picks displayed books (1-10 or 1-20)
  const mobileTopPicksBooks = topPicksExpanded ? books.slice(0, 20) : books.slice(0, 10);

  // Mobile Grid displayed books for Discovery / Bottom Shelf
  const mobileGridBooks = books.slice(0, mobileVisibleCount);

  const handleExpandTopPicks = () => {
    setTopPicksExpanded(true);
    setTimeout(() => {
      if (rank11Ref.current) {
        rank11Ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <button onClick={() => navigate('/collection')} className="inline-flex items-center text-[#C8885B] font-display font-bold text-[10px] uppercase tracking-widest hover:text-[#A66F47] transition-colors mb-6 sm:mb-8 group">
          <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          BACK TO COLLECTION
        </button>
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-display font-black text-[#1A1A1A] tracking-tight uppercase">
              {title}
            </h1>
            <p className="text-[#666666] font-sans text-sm sm:text-base leading-relaxed max-w-2xl mt-2">
              {subText ? subText : <>Browse our curated collection of handpicked releases inside the <strong className="text-black">{title}</strong> archive.</>}
            </p>
          </div>
        </div>

        {slug === 'discovery' && <DiscoveryNotificationBanner />}

        {loading ? (
          <GridSkeleton />
        ) : books.length === 0 ? (
          <div className="py-16 text-center text-gray-500 font-sans">
            No books found in this section.
          </div>
        ) : isTopPicks ? (
          <div>
            {/* DESKTOP TABLE VIEW (md and up) */}
            <div className="hidden md:block bg-white border border-gray-200 shadow-sm rounded overflow-hidden">
              <div className="grid grid-cols-12 gap-4 p-4 sm:p-6 border-b border-gray-200 bg-gray-50/50">
                <div className="col-span-1 text-gray-500 font-display font-bold text-[10px] uppercase tracking-widest text-center">Rank</div>
                <div className="col-span-5 text-gray-500 font-display font-bold text-[10px] uppercase tracking-widest">Book Cover & Title</div>
                <div className="col-span-3 text-gray-500 font-display font-bold text-[10px] uppercase tracking-widest">Author</div>
                <div className="col-span-3 text-gray-500 font-display font-bold text-[10px] uppercase tracking-widest text-right">Chart Movement & Weeks</div>
              </div>
              
              <div className="flex flex-col">
                {paginatedBooks.map((book, index) => {
                  const coverUrl = getImageUrl(book.fields.coverImage || book.fields.imageUrl) || book.fields.imageUrl;
                  const rank = book.fields.rank || book.fields.topPickOrder || ((currentPage - 1) * itemsPerPage + index + 1);
                  const stats = getLeaderboardStats(rank, book);
                  
                  let medalColor = 'text-[#FFD700]';
                  let borderColor = 'border-[#FFD700] text-[#FFD700]';
                  if (rank >= 6 && rank <= 15) {
                    medalColor = 'text-slate-300';
                    borderColor = 'border-slate-300 text-slate-200';
                  } else if (rank >= 16) {
                    medalColor = 'text-[#CD7F32]';
                    borderColor = 'border-[#CD7F32] text-[#CD7F32]';
                  }

                  return (
                    <Link to={`${getBookUrl(book)}?from=top-picks`} key={book.sys.id} className="grid grid-cols-12 gap-4 p-4 sm:p-6 border-b border-gray-100 hover:bg-gray-50 transition-colors group items-center">
                      <div className="col-span-1 flex items-center justify-center">
                        <div className={`px-2 py-1 rounded text-xs font-extrabold flex items-center gap-1 border ${borderColor} bg-[#121212]`}>
                          <i className={`fa-solid fa-medal ${medalColor} text-xs`}></i> #{rank}
                        </div>
                      </div>
                      <div className="col-span-5 flex items-center gap-6">
                        <div className="w-[80px] h-[120px] flex-shrink-0 shadow-md rounded overflow-hidden">
                          {coverUrl ? (
                            <img src={coverUrl} alt={book.fields.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-dusk-blue flex items-center justify-center p-1 text-center">
                              <span className="font-display font-bold text-white text-[7px]">{book.fields.title}</span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-display font-bold text-lg text-black group-hover:text-primary-orange transition-colors uppercase leading-tight line-clamp-2">
                            {book.fields.title}
                            {book.fields.series && ` - ${book.fields.series}`}
                            {(book.fields.seriesNumber || book.fields.bookNumber) && ` #${book.fields.seriesNumber || book.fields.bookNumber}`}
                          </h3>
                          <p className="font-sans text-gray-500 text-xs mt-1">
                            {book.fields.genre ? String(book.fields.genre).split(',')[0].trim() : (book.fields.category ? String(book.fields.category).split(',')[0].trim() : 'Uncategorized')}
                          </p>
                        </div>
                      </div>
                      <div className="col-span-3 flex items-center">
                        <span className="font-sans italic text-gray-700 text-sm font-medium truncate">
                          {book.fields.author || 'Unknown Author'}
                        </span>
                      </div>
                      <div className="col-span-3 flex items-center justify-end gap-3">
                        <div className="text-right">
                          <div className="font-mono text-xs font-bold text-gray-900">{stats.weeks} WEEKS</div>
                          <div className="text-[10px] text-gray-500 font-sans uppercase">ON LEADERBOARD</div>
                        </div>
                        <div className={`px-2.5 py-1 rounded border text-[10px] font-black font-mono tracking-wider flex items-center gap-1 ${stats.color}`}>
                          {stats.type === 'up' && <ArrowUp className="w-3 h-3 stroke-[3]" />}
                          {stats.type === 'down' && <ArrowDown className="w-3 h-3 stroke-[3]" />}
                          {stats.type === 'same' && <Minus className="w-3 h-3 stroke-[3]" />}
                          {stats.type === 'debut' && <Sparkles className="w-3 h-3" />}
                          {stats.label}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* MOBILE TABLE VIEW (under md) */}
            <div className="block md:hidden bg-white border border-gray-200 shadow-xs rounded overflow-hidden">
              <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 bg-gray-50/80">
                <span className="text-gray-500 font-display font-bold text-[9px] uppercase tracking-widest">Book Cover & Rank</span>
                <span className="text-gray-500 font-display font-bold text-[9px] uppercase tracking-widest">Title, Author & Movement</span>
              </div>

              <div className="flex flex-col">
                {mobileTopPicksBooks.map((book, index) => {
                  const coverUrl = getImageUrl(book.fields.coverImage || book.fields.imageUrl) || book.fields.imageUrl;
                  const rank = book.fields.rank || book.fields.topPickOrder || (index + 1);
                  const stats = getLeaderboardStats(rank, book);

                  let medalColor = 'text-[#FFD700]';
                  let borderColor = 'border-[#FFD700] text-[#FFD700]';
                  if (rank >= 6 && rank <= 15) {
                    medalColor = 'text-slate-300';
                    borderColor = 'border-slate-300 text-slate-200';
                  } else if (rank >= 16) {
                    medalColor = 'text-[#CD7F32]';
                    borderColor = 'border-[#CD7F32] text-[#CD7F32]';
                  }

                  const isRank11 = rank === 11;

                  return (
                    <Link
                      to={`${getBookUrl(book)}?from=top-picks`}
                      key={book.sys.id}
                      ref={isRank11 ? rank11Ref : null}
                      className="flex items-center gap-3 p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors group"
                    >
                      {/* Cover with Rank Overlay Badge */}
                      <div className="relative w-[55px] h-[82px] flex-shrink-0 shadow-sm rounded overflow-hidden bg-gray-900">
                        {coverUrl ? (
                          <img src={coverUrl} alt={book.fields.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-dusk-blue flex items-center justify-center p-1 text-center">
                            <span className="font-display font-bold text-white text-[7px]">{book.fields.title}</span>
                          </div>
                        )}
                        <div className={`absolute top-1 left-1 px-1 py-0.5 rounded text-[8px] font-black flex items-center gap-0.5 border ${borderColor} bg-[#121212]/90 backdrop-blur-xs`}>
                          <i className={`fa-solid fa-medal ${medalColor} text-[8px]`}></i> #{rank}
                        </div>
                      </div>

                      {/* Details & Movement */}
                      <div className="min-w-0 flex-1 flex flex-col gap-1">
                        <h3 className="font-display font-bold text-xs text-black group-hover:text-primary-orange transition-colors uppercase leading-tight line-clamp-2">
                          {book.fields.title}
                          {book.fields.series && ` - ${book.fields.series}`}
                        </h3>
                        {book.fields.author && (
                          <p className="font-sans italic text-gray-500 text-[11px] truncate">
                            BY {book.fields.author}
                          </p>
                        )}

                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <span className="font-mono text-[9px] text-gray-500 font-medium">
                            {stats.weeks} WEEKS ON LIST
                          </span>

                          <div className={`px-1.5 py-0.5 rounded border text-[8px] font-black font-mono tracking-wider flex items-center gap-0.5 ${stats.color}`}>
                            {stats.type === 'up' && <ArrowUp className="w-2.5 h-2.5 stroke-[3]" />}
                            {stats.type === 'down' && <ArrowDown className="w-2.5 h-2.5 stroke-[3]" />}
                            {stats.type === 'same' && <Minus className="w-2.5 h-2.5 stroke-[3]" />}
                            {stats.type === 'debut' && <Sparkles className="w-2.5 h-2.5" />}
                            {stats.label}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Mobile View More Button for Top Picks (Ranks 11-20) */}
              {!topPicksExpanded && books.length > 10 && (
                <div className="p-4 bg-gray-50 border-t border-gray-200 text-center">
                  <button
                    onClick={handleExpandTopPicks}
                    className="w-full py-3 bg-[#1A1A1A] text-white font-display font-bold text-xs uppercase tracking-widest rounded shadow-md hover:bg-black transition-all flex items-center justify-center gap-2"
                  >
                    VIEW MORE (RANKS 11-20)
                    <ChevronDown className="w-4 h-4 animate-bounce" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* DISCOVERY & BOTTOM SHELF */
          <div>
            {/* Desktop Grid Matrix View (3 rows = 18 items per page) */}
            <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-6 lg:gap-8 xl:gap-10 justify-items-center">
              {paginatedBooks.map(book => (
                <BookCard key={book.sys.id} book={book} currentSlug={slug} />
              ))}
            </div>

            {/* Mobile Grid Matrix View with Infinite Scroll (6 per load) */}
            <div className="block md:hidden">
              <div className="grid grid-cols-2 gap-3 justify-items-center">
                {mobileGridBooks.map(book => (
                  <BookCard key={book.sys.id} book={book} currentSlug={slug} />
                ))}
              </div>

              {/* Infinite scroll target observer */}
              {mobileVisibleCount < books.length && (
                <div ref={observerTarget} className="py-8 text-center flex flex-col items-center justify-center">
                  <div className="w-6 h-6 border-2 border-primary-orange border-t-transparent rounded-full animate-spin mb-2"></div>
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">LOADING MORE TITLES...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Desktop Pagination Controls */}
        {totalPages > 1 && (!isTopPicks || (isTopPicks && books.length > itemsPerPage)) && (
          <div className="hidden md:flex items-center justify-center gap-2 mt-12">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white border border-gray-300 text-xs font-bold font-mono uppercase tracking-wider text-black rounded disabled:opacity-40 hover:bg-gray-50 transition-colors shadow-xs"
            >
              PREV
            </button>
            <div className="flex items-center gap-1 overflow-x-auto max-w-[280px] sm:max-w-none px-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 flex-shrink-0 flex items-center justify-center text-xs font-bold font-mono rounded transition-colors ${
                    currentPage === page
                      ? 'bg-[#1A1A1A] text-white'
                      : 'bg-white border border-gray-300 text-black hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 text-xs font-bold font-mono uppercase tracking-wider text-black rounded disabled:opacity-40 hover:bg-gray-50 transition-colors shadow-xs"
            >
              NEXT
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

