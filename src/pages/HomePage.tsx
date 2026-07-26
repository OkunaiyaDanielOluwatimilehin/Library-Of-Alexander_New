import { useEffect, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getBookUrl, getImageUrl } from "../utils";
import { fetchEntries } from '../api';
import { HomepageConfig, Book, Author } from '../types';
import { Link } from 'react-router-dom';
import Markdown from 'react-markdown';
import { HomeSkeleton } from '../components/HomeSkeleton';
import { ArrowUp, ChevronLeft, ChevronRight, X, ArrowRight } from 'lucide-react';

function BannerCarousel({ items, bgColor, renderItem }: { items: any[], bgColor: string, renderItem: (item: any, index: number) => ReactNode }) {
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
    <div className={`relative w-full ${bgColor} overflow-hidden group min-h-[360px] sm:min-h-[450px] md:min-h-[500px] flex items-center`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="w-full h-full flex items-center"
        >
          {renderItem(item, currentIndex)}
        </motion.div>
      </AnimatePresence>
      
      {items.length > 1 && (
        <div className="hidden sm:flex absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 gap-2 sm:gap-3 z-20">
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

export default function HomePage() {
  const [config, setConfig] = useState<HomepageConfig | null>(null);
  const [topPicks, setTopPicks] = useState<Book[]>([]);
  const [discovery, setDiscovery] = useState<Book[]>([]);
  const [bottomShelf, setBottomShelf] = useState<Book[]>([]);
  const [spotlightAuthors, setSpotlightAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [originalBooks, setOriginalBooks] = useState<any[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [showChapterBanner, setShowChapterBanner] = useState(true);
  const [popupBook, setPopupBook] = useState<Book | null>(null);
  
  useEffect(() => {
    if (!loading) {
      const allBooks = [...discovery, ...topPicks, ...bottomShelf];
      const discoveryBook = discovery.find(b => b.fields.isDiscovery) || discovery[0] || allBooks.find(b => b.fields.isDiscovery) || allBooks[0];
      if (discoveryBook) {
        const popupKey = `discoveryPopupShown_${discoveryBook.sys.id}`;
        if (!sessionStorage.getItem(popupKey) && !sessionStorage.getItem('homePopupShown')) {
          setPopupBook(discoveryBook);
          setShowPopup(true);
          sessionStorage.setItem(popupKey, 'true');
          sessionStorage.setItem('homePopupShown', 'true');
        }
      }
    }
  }, [loading, discovery, topPicks, bottomShelf]);

  useEffect(() => {
    if (!loading && window.location.hash) {
      const id = window.location.hash.substring(1);
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [loading]);

  useEffect(() => {
    async function loadData() {
      const [configData, topPicksData, discoveryData, bottomShelfData, authorsData, originalBooksData] = await Promise.all([
        fetchEntries<HomepageConfig>('homepageConfig', { limit: 1 }),
        fetchEntries<Book>('book', { 'fields.isTopPick': true, limit: 5 }),
        fetchEntries<Book>('book', { 'fields.isDiscovery': true, limit: 10 }),
        fetchEntries<Book>('book', { 'fields.isBottomShelf': true, limit: 10 }),
        fetchEntries<Author>('author', { 'fields.isSpotlight': true, limit: 1 }),
        fetchEntries<any>('originalBook', { limit: 5 })
      ]);
      
      const sortByRank = (a: Book, b: Book) => {
        const rankA = a.fields.rank || a.fields.topPickOrder || 999;
        const rankB = b.fields.rank || b.fields.topPickOrder || 999;
        return rankA - rankB;
      };

      setConfig(configData[0] || null);
      setTopPicks(topPicksData.sort(sortByRank));
      setDiscovery(discoveryData.sort(sortByRank));
      setBottomShelf(bottomShelfData.sort(sortByRank));
      setSpotlightAuthors(authorsData || []);
      setOriginalBooks(originalBooksData || []);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return <HomeSkeleton />;
  }

  const heroImage = config?.fields.heroImage?.fields?.file?.url;
  
  let latestChapterInfo = null;
  if (originalBooks.length > 0) {
    const bookWithChapters = originalBooks.find(b => b.fields.chapters && b.fields.chapters.length > 0);
    if (bookWithChapters) {
      const chapterCount = bookWithChapters.fields.chapters.length;
      latestChapterInfo = {
        bookTitle: bookWithChapters.fields.title,
        slug: bookWithChapters.fields.slug || bookWithChapters.sys.id,
        chapterIndex: chapterCount - 1,
        chapterNumber: chapterCount,
        author: bookWithChapters.fields.author || 'Alexander Timilehin-Daniels'
      };
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-12 bg-white flex flex-col items-center">
      
      {/* Latest Chapter Notification Banner */}
      <AnimatePresence>
        {showChapterBanner && latestChapterInfo && (
          <div className="w-full max-w-[1920px] px-3 sm:px-4 md:px-6 mt-2 sm:mt-4 mb-1 overflow-hidden">
            <motion.div 
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-[#0A0A0A] border border-[#2A2A2A] flex flex-col sm:flex-row items-start sm:items-center justify-between p-2.5 sm:p-3.5 md:p-4 gap-2 sm:gap-4 shadow-xl relative"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 md:gap-4 w-full pr-6 sm:pr-0">
                <span className="bg-[#F59E0B] text-[#121212] px-2 py-0.5 sm:px-3 sm:py-1 text-[9px] sm:text-[10px] font-display font-black tracking-widest uppercase flex items-center whitespace-nowrap shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A] mr-1.5 sm:mr-2"></span>
                  NEW
                </span>
                <span className="text-white text-[11px] sm:text-[12px] md:text-[13px] font-[Open_Sans] leading-tight sm:leading-snug">
                  <span className="font-bold">"Chapter {latestChapterInfo.chapterNumber}"</span> from original manuscript <span className="text-[#F59E0B] italic font-bold">"{latestChapterInfo.bookTitle}"</span> by {latestChapterInfo.author} is now available.
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0 self-start sm:self-auto w-full sm:w-auto justify-between sm:justify-start mt-1 sm:mt-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-[#2A2A2A] sm:border-none">
                <Link to={`/originals/${latestChapterInfo.slug}?chapter=${latestChapterInfo.chapterIndex}`} className="bg-gradient-to-r from-[#D49A76] to-[#B37853] text-white px-3 sm:px-5 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-display font-bold tracking-widest uppercase flex items-center hover:opacity-90 transition-opacity whitespace-nowrap justify-center">
                  READ NOW <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-1.5 sm:ml-2" />
                </Link>
                <button onClick={() => setShowChapterBanner(false)} className="text-gray-400 hover:text-white transition-colors p-1 sm:ml-1 absolute sm:relative top-2 right-2 sm:top-auto sm:right-auto" aria-label="Close notification">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Popup Modal */}
      <AnimatePresence>
        {showPopup && popupBook && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#FDFBF7] border border-[#E8E3DC] w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl relative flex flex-col sm:flex-row rounded-lg sm:rounded-none"
            >
              <button 
                onClick={() => setShowPopup(false)}
                className="absolute top-2.5 right-2.5 p-1.5 bg-black/40 text-white rounded-full hover:bg-black/70 transition-colors z-20"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="w-full h-44 sm:h-auto sm:w-2/5 shrink-0 bg-[#E8E3DC] relative overflow-hidden">
                {getImageUrl(popupBook.fields.coverImage || popupBook.fields.imageUrl) ? (
                  <img src={getImageUrl(popupBook.fields.coverImage || popupBook.fields.imageUrl)} alt={popupBook.fields.title} className="w-full h-full object-cover object-top sm:object-center" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase text-gray-400">No Image</div>
                )}
              </div>
              
              <div className="p-4 sm:p-6 md:p-8 flex flex-col flex-1">
                <div className="text-[9px] sm:text-[10px] font-bold text-[#C8885B] bg-[#F5F1EB] px-2 py-0.5 sm:py-1 uppercase tracking-widest mb-2 sm:mb-3 self-start rounded-xs">
                  FEATURED DISCOVERY
                </div>
                <h3 className="font-display font-black text-lg sm:text-2xl uppercase mb-1 text-[#1A1A1A] leading-tight pr-6 sm:pr-0">
                  {popupBook.fields.title}
                </h3>
                {popupBook.fields.author && (
                  <div className="text-xs sm:text-[12px] text-[#666666] italic mb-3 sm:mb-4 font-serif">by {popupBook.fields.author}</div>
                )}
                <p className="text-[#666666] text-xs sm:text-[13px] line-clamp-3 sm:line-clamp-4 mb-4 sm:mb-6 font-[Open_Sans] leading-relaxed">
                  {popupBook.fields.synopsis || popupBook.fields.summary || "Check out this featured book from our collection."}
                </p>
                <div className="mt-auto pt-3 sm:pt-4 border-t border-[#E8E3DC] flex justify-between sm:justify-end items-center gap-2">
                  <button 
                    onClick={() => setShowPopup(false)}
                    className="sm:hidden text-[10px] font-display font-bold uppercase tracking-widest text-gray-500 hover:text-black"
                  >
                    Dismiss
                  </button>
                  <Link 
                    to={getBookUrl(popupBook)} 
                    onClick={() => setShowPopup(false)}
                    className="text-white bg-[#C8885B] px-3.5 py-2 sm:px-4 sm:py-2 text-[10px] font-bold uppercase tracking-widest flex items-center hover:bg-[#A66F47] transition-colors rounded-xs"
                  >
                    View Book <ChevronRight className="w-3 h-3 ml-1" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative w-full max-w-[1920px] mx-auto bg-gradient-to-r from-[#1E508A] to-[#698EAA] overflow-hidden mt-2 md:mt-3 mb-8 sm:mb-16 md:mb-[96px] flex items-center min-h-[360px] sm:min-h-[450px] md:min-h-[500px] py-8 sm:py-12 md:py-16">
        {heroImage && (
          <div className="absolute right-0 top-0 bottom-0 w-full md:w-1/2 opacity-20 md:opacity-30 mix-blend-overlay">
            <img src={heroImage} alt="" className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1E508A] via-[#1E508A]/80 to-transparent md:via-transparent" />
          </div>
        )}
        
        <div className="relative w-full max-w-[1920px] mx-auto px-4 sm:px-6">
          <div className="max-w-3xl text-white">
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight mb-4 sm:mb-6 text-[#fcfcfc] flex flex-wrap items-center gap-x-2 sm:gap-x-3">
              <span>Hi, my name is</span> 
              <span className="inline-flex relative overflow-hidden align-bottom pb-1 sm:pb-2">
                <motion.span 
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
                  className="text-primary-yellow inline-block relative z-10"
                >
                  {config?.fields.curatorName || 'Alexander'}
                </motion.span>
                <span className="absolute bottom-0 left-0 w-full h-1 sm:h-1.5 bg-primary-orange z-0"></span>
              </span>
            </h1>
            
            <div className="space-y-3 sm:space-y-4 font-[Open_Sans] text-sm sm:text-base leading-relaxed md:leading-[35.2px] text-white/90">
              {config?.fields.curatorBio ? (
                <div className="prose prose-p:mb-[16px] md:prose-p:mb-[20px] prose-p:text-white/90 prose-p:font-[Open_Sans] prose-p:leading-relaxed md:prose-p:leading-[35.2px] text-white/90 text-sm sm:text-base">
                  <Markdown>{String(config.fields.curatorBio)}</Markdown>
                </div>
              ) : (
                <>
                  <p className="mb-[16px] md:mb-[20px]">
                    and welcome to my library—a space I created to share my love of books and the stories I've experienced through reading. The goal of this site is simple: to highlight the kinds of books I read, help spark a love for reading in you, and make it easier for you to discover your next great read.
                  </p>
                  <p className="mb-[16px] md:mb-[20px]">
                    You can explore any book that interests you on the Reviews page, and if you'd like, you can also check out my original works on the Original Books page. I hope you find this space helpful as you search for your next read.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic List Sections */}
      <div className="w-full max-w-[1920px] mx-auto space-y-8 sm:space-y-16 md:space-y-[96px]">
        
        {/* Top Picks List Banner */}
        <div id="top-picks">
          <BannerCarousel 
            items={topPicks} 
            bgColor="bg-[#0F1319]"
            renderItem={(book) => {
              const bookTarget = `${getBookUrl(book)}?from=top-picks`;
              return (
                <div className="w-full h-full relative group">
                  {getImageUrl(book.fields.coverImage || book.fields.imageUrl) && (
                    <Link to={bookTarget} className="absolute right-0 top-0 bottom-0 w-full sm:w-3/4 md:w-2/3 opacity-20 sm:opacity-30 transition-transform duration-1000 group-hover:scale-105">
                      <img src={getImageUrl(book.fields.coverImage || book.fields.imageUrl)} alt={book.fields.title} className="w-full h-full object-cover object-center" />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#0F1319] via-[#0F1319]/90 sm:via-[#0F1319]/50 to-transparent" />
                    </Link>
                  )}
                  <div className="relative z-10 p-4 sm:p-8 md:p-12 lg:p-16 pb-10 sm:pb-12 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-3 mb-2 sm:mb-4">
                      <h2>
                        <span className="text-primary-teal font-display font-bold text-xl sm:text-2xl md:text-4xl uppercase tracking-widest flex items-center gap-1.5">
                          {config?.fields.topPicksTitle || 'Top Picks'}
                        </span>
                      </h2>
                    </div>
                    <Link to={bookTarget} className="block group/book">
                      <h3 className="text-2xl sm:text-3xl md:text-5xl font-display font-bold text-white uppercase tracking-wider mb-2 group-hover/book:text-primary-teal transition-colors">
                        {book.fields.title}
                        {book.fields.series && ` - ${book.fields.series}`}
                        {(book.fields.seriesNumber || book.fields.bookNumber) && ` #${book.fields.seriesNumber || book.fields.bookNumber}`}
                      </h3>
                      {book.fields.author && (
                        <p className="text-primary-teal font-display italic text-base sm:text-lg md:text-[24px] mt-2 sm:mt-[20px] uppercase tracking-wider mb-3 sm:mb-6">BY {book.fields.author}</p>
                      )}
                      {book.fields.synopsis && (
                        <p className="text-gray-300 font-sans text-sm sm:text-base md:text-[20px] leading-relaxed md:leading-[40px] mb-4 sm:mb-6 max-w-xl line-clamp-3">
                          {book.fields.synopsis}
                        </p>
                      )}
                    </Link>
                  </div>
                </div>
              );
            }} 
          />
        </div>

        {/* Spotlight Banner */}
        {spotlightAuthors.length > 0 && (
          <div className="relative w-full max-w-[1920px] mx-auto bg-[#1E5B99] overflow-hidden group min-h-[360px] sm:min-h-[450px] md:min-h-[500px] flex items-center">
            {spotlightAuthors[0].fields.image?.fields?.file?.url && (
              <div className="absolute right-0 top-0 bottom-0 w-full sm:w-3/4 md:w-2/3 opacity-20 sm:opacity-30 transition-transform duration-1000 group-hover:scale-105">
                <img src={spotlightAuthors[0].fields.image.fields.file.url} alt={spotlightAuthors[0].fields.name} className="w-full h-full object-cover object-center" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#1E5B99] via-[#1E5B99]/90 sm:via-[#1E5B99]/50 to-transparent" />
              </div>
            )}
            <div className="relative z-10 p-4 sm:p-8 md:p-12 lg:p-16 pb-10 sm:pb-12 max-w-3xl">
              <h2 className="text-white font-display font-bold text-xl sm:text-2xl md:text-4xl uppercase tracking-widest mb-2 sm:mb-4">Spotlight</h2>
              <h3 className="text-2xl sm:text-3xl md:text-5xl font-display font-bold text-white uppercase tracking-wider mb-3 sm:mb-4">{spotlightAuthors[0].fields.name}</h3>
              {spotlightAuthors[0].fields.bio && (
                <div className="mb-4 sm:mb-8 max-w-xl">
                  <p className="text-white/90 font-sans text-sm sm:text-lg md:text-xl leading-relaxed md:leading-[1.8] line-clamp-3 sm:line-clamp-4">
                    {spotlightAuthors[0].fields.bio}
                  </p>
                </div>
              )}
              {spotlightAuthors[0].fields.slug && (
                <Link to={`/author/${spotlightAuthors[0].fields.slug}`} className="inline-flex items-center gap-2 bg-primary-yellow text-black font-display font-bold uppercase tracking-widest text-[10px] sm:text-xs px-3 sm:px-4 py-2 hover:bg-yellow-500 transition-colors">
                  READ BIOGRAPHY <span>→</span>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Discovery Banner */}
        <div id="discovery">
          <BannerCarousel 
            items={discovery} 
            bgColor="bg-[#521344]"
            renderItem={(book) => {
              const bookTarget = `${getBookUrl(book)}?from=discovery`;
              return (
                <div className="w-full h-full relative group">
                  {getImageUrl(book.fields.coverImage || book.fields.imageUrl) && (
                    <Link to={bookTarget} className="absolute right-0 top-0 bottom-0 w-full sm:w-3/4 md:w-2/3 opacity-20 sm:opacity-30 transition-transform duration-1000 group-hover:scale-105">
                      <img src={getImageUrl(book.fields.coverImage || book.fields.imageUrl)} alt={book.fields.title} className="w-full h-full object-cover object-center" />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#521344] via-[#521344]/90 sm:via-[#521344]/50 to-transparent" />
                    </Link>
                  )}
                  <div className="relative z-10 p-4 sm:p-8 md:p-12 lg:p-16 pb-10 sm:pb-12 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-3 mb-2 sm:mb-4">
                      <h2>
                        <span className="text-primary-teal font-display font-bold text-xl sm:text-2xl md:text-4xl uppercase tracking-widest flex items-center gap-1.5">
                          {config?.fields.discoveryTitle || 'Discovery'}
                        </span>
                      </h2>
                    </div>
                    <Link to={bookTarget} className="block group/book">
                      <h3 className="text-2xl sm:text-3xl md:text-5xl font-display font-bold text-white uppercase tracking-wider mb-2 group-hover/book:text-primary-teal transition-colors">
                        {book.fields.title}
                        {book.fields.series && ` - ${book.fields.series}`}
                        {(book.fields.seriesNumber || book.fields.bookNumber) && ` #${book.fields.seriesNumber || book.fields.bookNumber}`}
                      </h3>
                      {book.fields.author && (
                        <p className="text-primary-teal font-display italic text-base sm:text-lg md:text-[24px] mt-2 sm:mt-[20px] uppercase tracking-wider mb-3 sm:mb-6">BY {book.fields.author}</p>
                      )}
                      {book.fields.synopsis && (
                        <p className="text-gray-300 font-sans text-sm sm:text-base md:text-[20px] leading-relaxed md:leading-[40px] mb-4 sm:mb-6 max-w-xl line-clamp-3">
                          {book.fields.synopsis}
                        </p>
                      )}
                    </Link>
                  </div>
                </div>
              );
            }} 
          />
        </div>

        {/* Bottom Shelf Banner */}
        <div id="bottom-shelf">
          <BannerCarousel 
            items={bottomShelf} 
            bgColor="bg-[#180C27]"
            renderItem={(book) => {
              const bookTarget = `${getBookUrl(book)}?from=bottom-shelf`;
              return (
                <div className="w-full h-full relative group">
                  {getImageUrl(book.fields.coverImage || book.fields.imageUrl) && (
                    <Link to={bookTarget} className="absolute right-0 top-0 bottom-0 w-full sm:w-3/4 md:w-2/3 opacity-20 sm:opacity-30 transition-transform duration-1000 group-hover:scale-105">
                      <img src={getImageUrl(book.fields.coverImage || book.fields.imageUrl)} alt={book.fields.title} className="w-full h-full object-cover object-center" />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#180C27] via-[#180C27]/90 sm:via-[#180C27]/50 to-transparent" />
                    </Link>
                  )}
                  <div className="relative z-10 p-4 sm:p-8 md:p-12 lg:p-16 pb-10 sm:pb-12 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-3 mb-2 sm:mb-4">
                      <h2>
                        <span className="text-primary-teal font-display font-bold text-xl sm:text-2xl md:text-4xl uppercase tracking-widest flex items-center gap-1.5">
                          {config?.fields.bottomShelfTitle || 'Bottom Shelf'}
                        </span>
                      </h2>
                    </div>
                    <Link to={bookTarget} className="block group/book">
                      <h3 className="text-2xl sm:text-3xl md:text-5xl font-display font-bold text-white uppercase tracking-wider mb-2 group-hover/book:text-primary-teal transition-colors">
                        {book.fields.title}
                        {book.fields.series && ` - ${book.fields.series}`}
                        {(book.fields.seriesNumber || book.fields.bookNumber) && ` #${book.fields.seriesNumber || book.fields.bookNumber}`}
                      </h3>
                      {book.fields.author && (
                        <p className="text-primary-teal font-display italic text-base sm:text-lg md:text-[24px] mt-2 sm:mt-[20px] uppercase tracking-wider mb-3 sm:mb-6">BY {book.fields.author}</p>
                      )}
                      {book.fields.synopsis && (
                        <p className="text-gray-300 font-sans text-sm sm:text-base md:text-[20px] leading-relaxed md:leading-[40px] mb-4 sm:mb-6 max-w-xl line-clamp-3">
                          {book.fields.synopsis}
                        </p>
                      )}
                    </Link>
                  </div>
                </div>
              );
            }} 
          />
        </div>
      </div>
    </motion.div>
  );
}
