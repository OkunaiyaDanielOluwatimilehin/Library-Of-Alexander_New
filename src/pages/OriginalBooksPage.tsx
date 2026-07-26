import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShareMenu } from '../components/ShareMenu';
import { useOriginalBooks } from '../hooks/useOriginalBooks';
import { fetchEntries } from '../api';
import { HomepageConfig } from '../types';
import { getImageUrl } from '../utils';
import { ChevronLeft, ChevronRight, X, BookOpen } from 'lucide-react';
import Markdown from 'react-markdown';
import { ChapterNotificationBanner } from '../components/ChapterNotificationBanner';

function BookCard({ book }: { book: any }) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const coverUrl = getImageUrl(book.fields.coverImage || book.fields.coverUrl);
  const slug = book.fields.slug || book.sys.id;
  const chapters = book.fields.chapters || [];
  
  // Extract text from the first chapter for preview
  const firstChapterStr = Array.isArray(chapters) && chapters.length > 0 
    ? (typeof chapters[0] === 'string' ? chapters[0] : chapters[0]?.fields?.content || chapters[0]?.fields?.text || '') 
    : '';
  const previewText = String(firstChapterStr).substring(0, 1000) + (firstChapterStr.length > 1000 ? '...' : '');

  return (
    <>
      <div className="flex flex-row bg-[#FDFBF7] border border-[#E8E3DC] hover:shadow-md transition-shadow group min-h-[160px] sm:min-h-[190px] overflow-hidden">
        {/* Left image container */}
        <div 
          className="w-[105px] sm:w-[150px] md:w-[180px] shrink-0 border-r border-[#E8E3DC] bg-white flex items-center justify-center p-2.5 sm:p-4 cursor-pointer"
          onClick={() => window.location.href = `/originals/${slug}`}
        >
          {coverUrl ? (
            <img src={coverUrl} alt={book.fields.title} className="w-full h-full object-cover object-center shadow-xs" />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[10px] uppercase text-gray-400 p-2 text-center">No Image</div>
          )}
        </div>

        {/* Right details container */}
        <div className="p-3.5 sm:p-5 md:p-6 flex flex-col flex-1 bg-[#FDFBF7] min-w-0 justify-between">
          <div>
            <div className="text-[8px] sm:text-[10px] font-bold text-[#C8885B] bg-[#F5F1EB] px-2 py-0.5 uppercase tracking-widest mb-1.5 sm:mb-2.5 self-start inline-block">
              {book.fields.genre || 'ROMANCE'}
            </div>
            
            <div className="flex items-start justify-between gap-2">
              <Link to={`/originals/${slug}`} className="font-display font-black text-sm sm:text-xl md:text-2xl uppercase mb-0.5 sm:mb-1 text-[#1A1A1A] hover:text-[#C8885B] transition-colors leading-tight line-clamp-2">
                {book.fields.title}
              </Link>
              <ShareMenu 
                title={String(book.fields.title)} 
                url={window.location.origin + '/originals/' + slug} 
                author={book.fields.author ? String(book.fields.author) : undefined}
                description={book.fields.synopsis ? String(book.fields.synopsis).substring(0, 150) + '...' : undefined}
                imageUrl={coverUrl || undefined}
              />
            </div>

            <div className="text-[11px] sm:text-[13px] text-[#666666] italic mb-2 sm:mb-3 font-serif line-clamp-1">
              by {book.fields.author || 'Alexander Timilehin-Daniels'}
            </div>

            <p className="text-[#666666] text-xs sm:text-sm line-clamp-2 sm:line-clamp-3 mb-3 sm:mb-4 font-[Open_Sans] leading-snug sm:leading-[1.7]">
              "{book.fields.synopsis || 'No synopsis available.'}"
            </p>
          </div>

          <div className="flex items-center justify-between pt-2.5 sm:pt-4 border-t border-[#E8E3DC] mt-auto">
            <span className="text-[9px] sm:text-[11px] font-mono text-gray-400 uppercase tracking-widest">
              {chapters.length} {chapters.length === 1 ? 'Chapter' : 'Chapters'}
            </span>
            <div className="flex items-center gap-2.5 sm:gap-4">
              <Link to={`/originals/${slug}`} className="text-[#C8885B] text-[9px] sm:text-[11px] font-bold uppercase tracking-widest flex items-center hover:text-[#1A1A1A] transition-colors">
                Read <ChevronRight className="w-3 h-3 ml-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function OriginalBooksPage() {
  const { books, loading } = useOriginalBooks();
  const [config, setConfig] = useState<HomepageConfig | null>(null);

  useEffect(() => {
    fetchEntries<HomepageConfig>('homepageConfig', { limit: 1 }).then(res => {
      if (res && res.length > 0) setConfig(res[0]);
    });
  }, []);
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 4;
  const totalPages = Math.ceil(books.length / itemsPerPage);
  const paginatedBooks = books.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F1EB] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#C8885B] border-t-transparent rounded-full animate-spin mb-4"></div>
          <span className="font-display font-bold text-[10px] uppercase tracking-widest text-gray-400">Loading Manuscripts</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen bg-[#F5F1EB]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-12 md:py-16">
        
        <Link to="/" className="inline-flex items-center text-[#C8885B] font-display font-bold text-[10px] sm:text-[11px] uppercase tracking-widest hover:text-[#1A1A1A] transition-colors mb-6 sm:mb-12">
          <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" /> BACK TO HOME
        </Link>
        
        <div className="mb-8 sm:mb-12">
          <h4 className="text-[#C8885B] font-display font-bold text-[10px] sm:text-[11px] uppercase tracking-widest mb-2 sm:mb-4">{config?.fields.scriptoriumTitle || "ORIGINAL WORKS"}</h4>
          <h1 className="font-display font-black text-3xl sm:text-5xl md:text-7xl lg:text-8xl uppercase tracking-tighter text-[#1A1A1A] mb-4 sm:mb-8 leading-none" dangerouslySetInnerHTML={{ __html: config?.fields.scriptoriumSubtitle || "STORIES FROM MY<br/>DESK" }} />
          <p className="text-sm sm:text-lg md:text-[20px] text-[#4A4A4A] font-[Open_Sans] italic max-w-3xl leading-relaxed sm:leading-[35.2px] mb-4 sm:mb-[20px]">
            {config?.fields.scriptoriumDescription || "A collection of original stories, manuscripts, and creative projects I've written. This is where I share the worlds, characters, and ideas born from my own imagination."}
          </p>
          <div className="flex items-center gap-3 sm:gap-4 border-b border-[#E8E3DC] pb-6 sm:pb-12 mb-6 sm:mb-12">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-300 overflow-hidden shrink-0">
              <img src={config?.fields.heroImage?.fields?.file?.url || "/avatar.jpg"} alt="Author" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'; }} />
            </div>
            <span className="text-xs sm:text-[15px] text-[#666666] font-sans">{config?.fields.scriptoriumAuthor || "Written and curated by Alexander Olaoluwakintan Timilehin-Daniels"}</span>
          </div>
        </div>
        
        {books.length === 0 ? (
          <div className="bg-[#FDFBF7] p-6 border border-[#E8E3DC] text-center py-20 shadow-sm max-w-3xl">
            <p className="text-[#999999] font-sans">No original manuscripts currently on display.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {paginatedBooks.map((book) => (
              <BookCard key={book.sys.id} book={book} />
            ))}
          </div>
        )}
        
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-16 border-t border-[#E8E3DC] pt-8">
            <button 
              disabled={currentPage === 1}
              onClick={() => { setCurrentPage(p => p - 1); window.scrollTo(0,0); }}
              className="text-[#C8885B] disabled:text-gray-300 font-display font-bold uppercase tracking-widest text-[11px] flex items-center transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> PREV
            </button>
            <span className="text-[11px] font-mono text-[#666666] uppercase tracking-widest">
              {currentPage} / {totalPages}
            </span>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => { setCurrentPage(p => p + 1); window.scrollTo(0,0); }}
              className="text-[#C8885B] disabled:text-gray-300 font-display font-bold uppercase tracking-widest text-[11px] flex items-center transition-colors"
            >
              NEXT <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}
        <ChapterNotificationBanner />
      </div>
    </motion.div>
  );
}
