import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchEntries, fetchEntry } from '../api';
import { Book } from '../types';
import { ChevronDown, ChevronUp, ExternalLink, Share2, Star, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { BookSkeleton } from '../components/BookSkeleton';
import { ShareMenu } from '../components/ShareMenu';
import { Comments } from '../components/Comments';
import { getBookUrl , getImageUrl, extractTextFromRichText } from '../utils';
import { getRatings, submitRating, getReviews, submitReview, getProgress, submitProgress } from '../lib/supabase';

export default function BookPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromCategory = searchParams.get('from');

  const handleBack = () => {
    if (fromCategory && ['top-picks', 'discovery', 'bottom-shelf'].includes(fromCategory)) {
      navigate(`/category/${fromCategory}`);
    } else if (book?.fields?.isTopPick) {
      navigate('/category/top-picks');
    } else if (book?.fields?.isDiscovery) {
      navigate('/category/discovery');
    } else if (book?.fields?.isBottomShelf) {
      navigate('/category/bottom-shelf');
    } else if (fromCategory) {
      navigate(`/category/${fromCategory}`);
    } else {
      navigate('/collection');
    }
  };
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [ratingData, setRatingData] = useState({ average: 0, count: 0, breakdown: { 1:0, 2:0, 3:0, 4:0, 5:0 } });
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewAuthor, setReviewAuthor] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [searchReview, setSearchReview] = useState("");
  const [progressData, setProgressData] = useState({ want_to_read: 0, reading: 0, completed: 0 });
  const [userProgress, setUserProgress] = useState<string>("want_to_read");
  const [isProgressMenuOpen, setIsProgressMenuOpen] = useState(false);
  const relatedScrollRef = useRef<HTMLDivElement>(null);

  const scrollRelated = (direction: 'left' | 'right') => {
    if (relatedScrollRef.current) {
      const amount = direction === 'left' ? -260 : 260;
      relatedScrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };
  
  useEffect(() => {
    if (book?.sys?.id) {
      getRatings(book.sys.id).then(data => {
        if (data && data.average !== undefined) setRatingData(data);
      });
      
      getProgress(book.sys.id).then(data => {
        if (data && data.want_to_read !== undefined) setProgressData(data);
      });
        
      getReviews(book.sys.id).then(data => {
        if (Array.isArray(data)) setReviews(data);
      });
    }
  }, [book?.sys?.id]);
  
  const handleProgress = async (status: string) => {
    if (!book?.sys?.id) return;
    setUserProgress(status);
    setIsProgressMenuOpen(false);
    
    await submitProgress(book.sys.id, status);
    const updated = await getProgress(book.sys.id);
    if (updated) setProgressData(updated);
  };

  const handleReviewSubmit = async () => {
    if (!book?.sys?.id || !reviewAuthor.trim() || !reviewContent.trim()) return;
    await submitReview(book.sys.id, reviewAuthor, reviewContent);
    setReviewAuthor("");
    setReviewContent("");
    const updated = await getReviews(book.sys.id);
    if (Array.isArray(updated)) setReviews(updated);
  };

  const handleRate = async (rating: number) => {
    if (!book?.sys?.id) return;
    setUserRating(rating);
    await submitRating(book.sys.id, rating);
    const updated = await getRatings(book.sys.id);
    if (updated) setRatingData(updated);
  };


  useEffect(() => {
    async function loadBook() {
      if (!slug) return;
      const rawSlug = decodeURIComponent(slug).trim();
      let foundBook: Book | null = null;
      let searchId = rawSlug;
      if (rawSlug.includes('-')) {
        const parts = rawSlug.split('-');
        const possibleId = parts[parts.length - 1];
        if (possibleId.length >= 10) {
          searchId = possibleId;
        }
      }

      const books = await fetchEntries<Book>('book', { 'fields.slug': rawSlug, limit: 1 });
      
      if (books.length > 0) {
        foundBook = books[0];
      } else {
        const booksById = await fetchEntries<Book>('book', { 'sys.id': searchId, limit: 1 });
        if (booksById.length > 0) {
          foundBook = booksById[0];
        } else if (searchId !== rawSlug) {
          const booksById2 = await fetchEntries<Book>('book', { 'sys.id': rawSlug, limit: 1 });
          if (booksById2.length > 0) foundBook = booksById2[0];
        }

        if (!foundBook) {
          const allBooks = await fetchEntries<Book>('book', { limit: 200 });
          const cleanParam = rawSlug.toLowerCase().replace(/[^a-z0-9]+/g, '');
          foundBook = allBooks.find(b => {
            if (b.sys.id === searchId || b.sys.id === rawSlug) return true;
            if (b.fields.slug && String(b.fields.slug).toLowerCase() === rawSlug.toLowerCase()) return true;
            if (b.fields.title) {
              const cleanTitle = String(b.fields.title).toLowerCase().replace(/[^a-z0-9]+/g, '');
              if (cleanTitle === cleanParam) return true;
              if (cleanTitle.length > 5 && cleanParam.includes(cleanTitle)) return true;
              if (cleanParam.length > 5 && cleanTitle.includes(cleanParam)) return true;
            }
            return false;
          }) || null;
        }
      }
      
      setBook(foundBook);
      
      if (foundBook) {
        try {
          const allBooks = await fetchEntries<Book>('book', { limit: 100 });
          
          const currentGenres = (String(foundBook.fields.genre || foundBook.fields.category || ''))
            .split(',')
            .map(g => g.trim().toLowerCase())
            .filter(Boolean);
          const currentAuthor = (foundBook.fields.author || foundBook.fields.authorName || '').trim().toLowerCase();

          const candidates = allBooks.filter(b => b.sys.id !== foundBook.sys.id);

          const scored = candidates.map(candidate => {
            const candGenres = (String(candidate.fields.genre || candidate.fields.category || ''))
              .split(',')
              .map(g => g.trim().toLowerCase())
              .filter(Boolean);
            const candAuthor = (candidate.fields.author || candidate.fields.authorName || '').trim().toLowerCase();

            const sharedGenresCount = candGenres.filter(g => currentGenres.includes(g)).length;
            const sameAuthor = Boolean(currentAuthor && candAuthor && currentAuthor === candAuthor);

            const score = (sameAuthor ? 3 : 0) + Math.min(sharedGenresCount, 3);
            return { book: candidate, score, sharedGenresCount, sameAuthor };
          });

          let matches = scored.filter(c => c.score > 0);
          if (matches.length === 0) {
            matches = scored;
          }

          const shuffle = <T,>(arr: T[]): T[] => {
            const a = [...arr];
            for (let i = a.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
          };

          const highMatch = shuffle(matches.filter(m => m.score >= 2).map(m => m.book));
          const medMatch = shuffle(matches.filter(m => m.score === 1).map(m => m.book));
          const lowMatch = shuffle(matches.filter(m => m.score === 0).map(m => m.book));

          const finalPool = [...highMatch, ...medMatch, ...lowMatch].slice(0, 12);
          setRelatedBooks(finalPool);
        } catch (err) {
          console.error("Error fetching related books:", err);
        }
      }
      
      setLoading(false);
    }
    loadBook();
  }, [slug]);

  if (loading) {
    return <BookSkeleton />;
  }

  if (!book) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-serif text-[#1A1A1A] mb-4">Volume Not Found</h1>
        <Link to="/" className="text-[#111111] font-bold hover:opacity-70 transition-opacity">Return to Library</Link>
      </div>
    );
  }

  const { fields } = book;
  const coverUrl = getImageUrl(fields.coverImage || fields.imageUrl);

  let badgeUI = null;
  const rank = fields.rank || fields.topPickOrder;

  if (fields.isTopPick && rank) {
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
      <div className={`px-2.5 py-1 text-xs font-extrabold tracking-widest uppercase rounded shadow bg-[#121212] border ${borderColor} z-20 inline-flex items-center gap-1.5`}>
        <i className={`fa-solid fa-medal ${medalColor}`}></i> TOP PICK #{rank}
      </div>
    );
  } else if (fields.isDiscovery) {
    badgeUI = (
      <div className="px-2.5 py-1 text-xs font-bold tracking-widest uppercase rounded shadow bg-[#521344] text-white z-20 inline-flex items-center gap-1.5">
        <span className="relative inline-flex items-center justify-center">
          <i className="fa-solid fa-certificate text-xs text-white"></i>
          <i className="fa-solid fa-check text-[6px] absolute text-[#521344] font-bold"></i>
        </span>
        DISCOVERY
      </div>
    );
  } else if (fields.isBottomShelf) {
    badgeUI = (
      <div className="px-2.5 py-1 text-xs font-bold tracking-widest uppercase rounded shadow bg-[#180C27] border border-purple-500/40 text-purple-200 z-20 inline-flex items-center gap-1.5">
        <i className="fa-solid fa-box-archive text-purple-300"></i> BOTTOM SHELF
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-white min-h-screen">
      <div className="w-full max-w-[1920px] mx-auto px-6 py-12">
        <div className="flex items-center justify-between gap-4 mb-8">
          <button onClick={handleBack} className="inline-flex items-center text-[#C8885B] font-display font-bold text-[10px] uppercase tracking-widest hover:text-[#A66F47] transition-colors group">
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            BACK
          </button>
          <ShareMenu 
            title={String(fields.title)} 
            url={window.location.href} 
            author={fields.author ? String(fields.author) : undefined}
            description={fields.synopsis || fields.summary ? String(fields.synopsis || fields.summary) : undefined}
            imageUrl={coverUrl || undefined}
            className="inline-flex items-center px-3 py-1.5 border border-[#E8E3DC] text-[10px] font-display font-bold uppercase tracking-widest text-[#C8885B] hover:border-[#C8885B] transition-colors bg-white cursor-pointer rounded-xs"
          >
            <i className="fa-solid fa-share-nodes mr-1.5 text-xs"></i> SHARE BOOK
          </ShareMenu>
        </div>
        <div className="lg:grid lg:grid-cols-12 lg:gap-12">
          {/* Sidebar Cover */}
          <div className="lg:col-span-3 mb-10 lg:mb-0">
            <div className="bg-white shadow-sm overflow-hidden mb-6 relative">
              {badgeUI && (
                <div className="absolute top-2 right-2 z-10 scale-90 sm:scale-100 origin-top-right">
                  {badgeUI}
                </div>
              )}
              {coverUrl ? (
                <img src={coverUrl} alt={fields.title} className="w-full h-auto object-cover" />
              ) : (
                <div className="w-full aspect-[2/3] flex flex-col items-center justify-center p-6 text-center bg-[#FBFBFB] border border-[#EEEEEE]">
                  <span className="font-serif text-xl text-[#1A1A1A]">{fields.title}</span>
                </div>
              )}
            </div>

            <div className="relative">
              <div onClick={() => setIsProgressMenuOpen(!isProgressMenuOpen)} className="flex bg-[#1E714A] text-white rounded text-[11px] font-bold tracking-widest shadow-sm cursor-pointer hover:bg-[#1E714A]/90 transition-colors">
                <div className="flex-1 text-center py-3">
                  {userProgress === 'want_to_read' ? 'WANT TO READ' : userProgress === 'reading' ? 'READING' : 'COMPLETED'}
                </div>
                <div className="border-l border-white/20 px-3 flex items-center justify-center">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
              
              {isProgressMenuOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#EBE3D5] rounded shadow-lg z-10">
                  <div 
                    onClick={() => handleProgress('want_to_read')}
                    className="py-3 px-4 text-[11px] font-bold tracking-widest hover:bg-gray-50 cursor-pointer border-b border-[#EBE3D5] text-[#1E714A]"
                  >
                    WANT TO READ
                  </div>
                  <div 
                    onClick={() => handleProgress('reading')}
                    className="py-3 px-4 text-[11px] font-bold tracking-widest hover:bg-gray-50 cursor-pointer border-b border-[#EBE3D5] text-[#0066CC]"
                  >
                    READING
                  </div>
                  <div 
                    onClick={() => handleProgress('completed')}
                    className="py-3 px-4 text-[11px] font-bold tracking-widest hover:bg-gray-50 cursor-pointer text-gray-700"
                  >
                    COMPLETED
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 border border-[#EBE3D5] bg-[#FCFAF8]">
              <div className="text-center border-b border-[#EBE3D5] py-2">
                <span className="text-[10px] font-bold text-[#C8885B] tracking-widest uppercase">Shelf Progress Tracker</span>
              </div>
              <div className="grid grid-cols-3 divide-x divide-[#EBE3D5] text-center p-2 bg-white">
                <div className="py-2">
                  <div className="text-sm font-bold text-[#1E714A]">{progressData.want_to_read}</div>
                  <div className="text-[8px] uppercase font-bold tracking-wider text-gray-500 mt-1">Want to read</div>
                </div>
                <div className="py-2">
                  <div className="text-sm font-bold text-[#0066CC]">{progressData.reading}</div>
                  <div className="text-[8px] uppercase font-bold tracking-wider text-gray-500 mt-1">Reading</div>
                </div>
                <div className="py-2">
                  <div className="text-sm font-bold text-[#1E714A]">{progressData.completed}</div>
                  <div className="text-[8px] uppercase font-bold tracking-wider text-gray-500 mt-1">Completed</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9 pl-0 lg:pl-4">
            <div className="mb-3 text-center lg:text-left flex flex-col items-center lg:items-start">
              {badgeUI && (
                <div className="mb-3">
                  {badgeUI}
                </div>
              )}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[#1A1A1A] leading-tight font-sans uppercase text-center lg:text-left">
                {fields.title} {fields.series ? `- ${fields.series} #${fields.seriesNumber}` : ''}
              </h1>
            </div>
            
            <div className="text-lg lg:text-2xl font-bold mb-6 font-sans text-center lg:text-left text-[#1A1A1A]/90">
              by {fields.author}
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-4 text-sm mb-6">
              <div className="flex items-center gap-1 text-gray-300">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className={`w-4 h-4 ${star <= Math.round(ratingData.average) ? 'text-[#FFD700] fill-[#FFD700]' : ''}`} />
                ))}
              </div>
              <div className="font-bold">{ratingData.average.toFixed(2)}</div>
              <div className="text-gray-500 flex items-center gap-2 text-xs">
                <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                {ratingData.count} ratings
                <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                0 reviews
              </div>
            </div>

            {fields.genre && (
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 text-[11px] mb-8 uppercase font-bold">
                <span className="text-gray-700 tracking-wider mr-1">GENRES:</span>
                {String(fields.genre).split(',').map((g, i) => {
                  const cleanG = g.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
                  return (
                    <Link key={i} to={`/category/${cleanG}`} className="text-[#C8885B] border-b border-[#C8885B]/30 hover:border-[#C8885B] cursor-pointer">
                      {g.trim()}
                    </Link>
                  );
                })}
              </div>
            )}

            {(() => {
              const textRaw = fields.synopsis || fields.summary || '';
              const text = typeof textRaw === 'string' ? textRaw : extractTextFromRichText(textRaw);
              const isLong = text.length > 500;
              const displayText = isLong && !isExpanded ? text.slice(0, 500) + '...' : text;
              
              return (
                <>
                  <div className="text-base sm:text-lg md:text-xl leading-relaxed sm:leading-loose text-[#2B2B2B] font-sans mb-8 w-full whitespace-pre-wrap [&_p]:mb-6 sm:[&_p]:mb-8">
                    {displayText}
                  </div>
                  {isLong ? (
                    <button 
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="text-[10px] font-bold text-[#C8885B] tracking-widest uppercase flex items-center gap-1 mb-8 hover:text-[#A66F47]"
                    >
                      {isExpanded ? 'SHOW LESS' : 'SHOW MORE'} 
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  ) : (
                    <div className="mb-8"></div>
                  )}
                </>
              );
            })()}

            {/* Rate This Book */}
            <div className="border-t border-[#EBE3D5] pt-12 pb-8 mb-6 w-full flex flex-col items-center justify-center">
              <div className="text-[14px] font-bold text-[#C8885B] tracking-widest uppercase mb-8 text-center">
                RATE THIS BOOK
              </div>
              <div className="flex items-center justify-between w-full max-w-md px-4 text-gray-300">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    onClick={() => handleRate(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className={`w-14 h-14 sm:w-16 sm:h-16 cursor-pointer transition-all ${(hoverRating || userRating) && star <= (hoverRating || userRating || 0) ? 'text-[#FFD700] fill-[#FFD700] scale-110' : 'text-gray-300'} active:scale-95`} 
                  />
                ))}
              </div>
            </div>

            {/* Community Rating */}
            <div className="border border-[#EBE3D5] flex flex-col md:flex-row mb-12 w-full">
              <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-[#EBE3D5] p-8 flex flex-col items-center justify-center">
                <div className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-2">COMMUNITY RATING</div>
                <div className="text-3xl sm:text-4xl md:text-5xl font-black mb-2">{ratingData.average.toFixed(2)}</div>
                <div className="flex items-center gap-1 text-gray-300 mb-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} className={`w-4 h-4 ${star <= Math.round(ratingData.average) ? 'text-[#FFD700] fill-[#FFD700]' : ''}`} />
                  ))}
                </div>
                <div className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">{ratingData.count} AGGREGATE VOTES</div>
              </div>
              <div className="w-full md:w-2/3 p-8 flex flex-col justify-center gap-2">
                {[5,4,3,2,1].map(star => {
                  const starCount = (ratingData.breakdown as any)[star] || 0;
                  const percentage = ratingData.count > 0 ? (starCount / ratingData.count) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-4 text-xs font-bold text-gray-600">
                      <div className="w-12 text-right">{star} stars</div>
                      <div className="flex-1 h-2 bg-[#F4F4F4] overflow-hidden">
                        <div className="h-full bg-[#1E714A] transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                      </div>
                      <div className="w-12">{starCount} ({Math.round(percentage)}%)</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Comments */}
            <div className="w-full mb-12">
              <Comments content_key={book.sys.id} />
            </div>

            {/* Disclaimer Notice */}
            <div className="p-4 sm:p-5 bg-[#FCFAF8] border border-[#EBE3D5] mb-12 w-full rounded-xs">
              <span className="font-display font-bold text-[#C8885B] uppercase tracking-widest text-[10px] sm:text-[11px] block mb-1">
                Legal & Content Disclaimer
              </span>
              <p className="font-sans text-xs sm:text-sm text-[#666666] leading-relaxed">
                The Library of Alexander provides curated book summaries, analyses, and reviews for commentary and educational purposes. All book covers, titles, and trademarks are property of their respective copyright holders.
              </p>
            </div>
            </div>
            
        {/* Related Books */}
        {relatedBooks.length > 0 && (
          <div className="lg:col-span-12 mt-12 sm:mt-16 pt-8 sm:pt-12 border-t border-[#EBE3D5] w-full">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <span className="text-[#C8885B] font-display font-bold text-[9px] sm:text-xs uppercase tracking-[0.2em] mb-1 block">
                  RECOMMENDED READS
                </span>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-sans text-black">
                  Related Books
                </h2>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => scrollRelated('left')}
                  className="w-9 h-9 rounded-full border border-[#EBE3D5] bg-white flex items-center justify-center hover:bg-[#FCFAF8] active:bg-gray-100 transition-colors shadow-sm"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>
                <button 
                  onClick={() => scrollRelated('right')}
                  className="w-9 h-9 rounded-full border border-[#EBE3D5] bg-white flex items-center justify-center hover:bg-[#FCFAF8] active:bg-gray-100 transition-colors shadow-sm"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            </div>

            <div 
              ref={relatedScrollRef}
              className="flex items-stretch gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 scrollbar-hide snap-x snap-mandatory"
            >
              {relatedBooks.map(b => {
                const rCover = getImageUrl(b.fields.coverImage || b.fields.imageUrl);
                const displayGenre = String(b.fields.genre || b.fields.category || '').split(',')[0]?.trim();
                return (
                  <Link 
                    to={getBookUrl(b)} 
                    key={b.sys.id} 
                    className="group flex-shrink-0 w-[130px] sm:w-[160px] md:w-[180px] lg:w-[200px] snap-start flex flex-col bg-white border border-gray-100 rounded-xl p-2.5 sm:p-3 shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="w-full aspect-[2/3] bg-gray-100 rounded-lg overflow-hidden mb-2.5 relative shadow-xs">
                      {rCover ? (
                        <img 
                          src={rCover} 
                          alt={b.fields.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-2 text-center bg-[#FBFBFB]">
                          <span className="font-serif text-xs text-gray-700">{b.fields.title}</span>
                        </div>
                      )}
                      {displayGenre && (
                        <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/80 backdrop-blur-xs px-2 py-0.5 rounded text-[8px] sm:text-[9px] font-bold text-white uppercase tracking-widest truncate text-center">
                          {displayGenre}
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-xs sm:text-sm text-gray-900 line-clamp-2 leading-tight uppercase tracking-tight mb-1 group-hover:text-[#C8885B] transition-colors">
                      {b.fields.title}
                    </h3>
                    {b.fields.author && (
                      <p className="text-[10px] sm:text-[11px] text-gray-500 line-clamp-1 mt-auto">
                        {b.fields.author}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
      </div>
    </motion.div>
  );
}
