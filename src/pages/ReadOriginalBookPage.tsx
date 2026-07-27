import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useOriginalBooks } from '../hooks/useOriginalBooks';
import { ChevronLeft, ChevronRight, Share2, Clock, Calendar } from 'lucide-react';
import Markdown from 'react-markdown';
import { ShareMenu } from '../components/ShareMenu';
import { Comments } from '../components/Comments';
import useReactions from '../hooks/useReactions';
import { getImageUrl } from '../utils';
import { ChapterNotificationBanner } from '../components/ChapterNotificationBanner';

const REACTIONS = [
  { type: 'like', icon: '👍' },
  { type: 'love', icon: '❤️' },
  { type: 'fire', icon: '🔥' },
  { type: 'clap', icon: '👏' }
];

function ReactionSection({ contentKey }: { contentKey: string }) {
  const { reactions, userReaction, react } = useReactions(contentKey);
  
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-4 justify-center py-4 sm:py-8 border-t border-b border-[#E8E3DC] my-8 sm:my-16">
      {REACTIONS.map(r => (
        <button
          key={r.type}
          onClick={() => react(r.type)}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full border transition-all ${userReaction === r.type ? 'border-[#C8885B] bg-[#C8885B]/10' : 'border-[#E8E3DC] hover:bg-white bg-[#FDFBF7]'}`}
        >
          <span className="text-base sm:text-xl">{r.icon}</span>
          <span className="text-xs sm:text-sm font-bold text-[#666666]">{reactions[r.type as keyof typeof reactions] || 0}</span>
        </button>
      ))}
    </div>
  );
}

export default function ReadOriginalBookPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { books, loading } = useOriginalBooks();
  
  const [progress, setProgress] = useState(0);
  const [currentTOCPage, setCurrentTOCPage] = useState(1);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Strict Copy & Inspection Protection for Original Book content
  useEffect(() => {
    const preventCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };
    const preventKey = (e: KeyboardEvent) => {
      // Block Ctrl+C, Cmd+C, Ctrl+A, Cmd+A, Ctrl+U, Cmd+U, Ctrl+S, Cmd+S, Ctrl+P, Cmd+P
      if (
        (e.ctrlKey || e.metaKey) &&
        ['c', 'a', 'u', 's', 'p', 'x', 'i'].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('copy', preventCopy);
    document.addEventListener('cut', preventCopy);
    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('keydown', preventKey);

    return () => {
      document.removeEventListener('copy', preventCopy);
      document.removeEventListener('cut', preventCopy);
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('keydown', preventKey);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F1EB] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#C8885B] border-t-transparent rounded-full animate-spin mb-4"></div>
          <span className="font-display font-bold text-[10px] uppercase tracking-widest text-gray-400">Loading Manuscript</span>
        </div>
      </div>
    );
  }

  const book = books.find(b => b.fields.slug === slug || b.sys.id === slug);

  if (!book) {
    return (
      <div className="min-h-screen bg-[#F5F1EB] flex flex-col items-center justify-center p-4">
        <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl uppercase mb-4 text-[#1A1A1A]">Manuscript Not Found</h1>
        <button onClick={() => navigate('/originals')} className="text-[#C8885B] font-display font-bold text-xs uppercase tracking-widest hover:text-[#1A1A1A] transition-colors">Return to Collection</button>
      </div>
    );
  }

  const chapterQuery = searchParams.get('chapter');
  const activeChapterIndex = chapterQuery ? parseInt(chapterQuery, 10) : -1;
  const chapters = book.fields.chapters || [];
  const tocItemsPerPage = 4;
  const totalTOCPages = Math.ceil(chapters.length / tocItemsPerPage);
  const paginatedChapters = chapters.slice((currentTOCPage - 1) * tocItemsPerPage, currentTOCPage * tocItemsPerPage);
  
  const contentKey = `${book.sys.id}_chapter_${activeChapterIndex}`;

  const renderTopNav = () => (
    <div className="max-w-[1920px] mx-auto px-4 sm:px-6 h-14 sm:h-24 flex items-center justify-between border-b border-[#E8E3DC] sticky top-0 bg-[#F5F1EB] z-40">
      <button 
        onClick={() => {
          if (activeChapterIndex >= 0) {
            setSearchParams({});
            window.scrollTo(0,0);
          } else {
            navigate('/originals');
          }
        }}
        className="inline-flex items-center text-[#C8885B] font-display font-bold text-[10px] sm:text-[11px] uppercase tracking-widest hover:text-[#1A1A1A] transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" /> {activeChapterIndex === -1 ? 'BACK TO HOME' : 'TABLE OF CONTENTS'}
      </button>
      <ShareMenu 
        title={String(book.fields.title)} 
        url={window.location.href} 
        author={book.fields.author ? String(book.fields.author) : undefined}
        description={book.fields.synopsis ? String(book.fields.synopsis).substring(0, 150) + '...' : undefined}
        imageUrl={getImageUrl(book.fields.coverImage) || undefined}
        className="inline-flex items-center px-2.5 py-1.5 sm:px-4 sm:py-2 border border-[#E8E3DC] text-[9px] sm:text-[10px] font-display font-bold uppercase tracking-widest text-[#C8885B] hover:border-[#C8885B] transition-colors bg-white cursor-pointer rounded-xs"
      >
         <i className="fa-solid fa-share-nodes mr-1.5 sm:mr-2 text-xs"></i> SHARE BOOK
      </ShareMenu>
    </div>
  );

  const renderTOC = () => (
    <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
        {chapters.length === 0 && (
           <div className="col-span-full text-center py-12 text-gray-500 italic font-sans">No chapters available yet.</div>
        )}
        {paginatedChapters.map((chap: any, pIdx: number) => {
           const idx = (currentTOCPage - 1) * tocItemsPerPage + pIdx;
           const chapTitle = chap.fields?.title || chap.title || `CHAPTER ${idx + 1}`;
           const minRead = chap.fields?.readTime || chap.readTime || '4 MIN READ';
           const dateStr = chap.fields?.date || chap.date || 'JUN 5, 2026';
           
           const rawContent = chap.fields?.content || chap.content || chap.fields?.text || chap.text || chap.fields?.synopsis || chap.synopsis || '';
           const cleanContent = String(rawContent).replace(/[#*`_>]/g, '').replace(/\s+/g, ' ').trim();
           const firstParagraph = cleanContent.split(/\n+/)[0] || cleanContent;
           const synopsis = cleanContent ? (cleanContent.length > 280 ? cleanContent.substring(0, 280).trim() + '...' : cleanContent) : 'No preview content available.';
           const coverUrl = getImageUrl(book.fields.coverImage || book.fields.coverUrl);
           
           return (
             <button 
               key={idx} 
               onClick={() => { setSearchParams({ chapter: idx.toString() }); window.scrollTo(0,0); }}
               className="bg-[#FDFBF7] border border-[#E8E3DC] flex flex-row hover:shadow-md transition-shadow group text-left overflow-hidden min-h-[150px] sm:min-h-[180px]"
             >
               <div className="w-[105px] sm:w-[150px] md:w-[170px] shrink-0 border-r border-[#E8E3DC] flex flex-col bg-white p-2.5 sm:p-4 justify-between">
                 <div className="w-full h-full flex-1 flex items-center justify-center overflow-hidden mb-2">
                   {coverUrl ? (
                     <img src={coverUrl} alt="Cover" className="w-full h-full object-cover object-center shadow-xs" />
                   ) : (
                     <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[10px] uppercase text-gray-400 p-2 text-center">No Image</div>
                   )}
                 </div>
                 <div className="w-[calc(100%+1.25rem)] sm:w-[calc(100%+2rem)] -ml-2.5 sm:-ml-4 -mb-2.5 sm:-mb-4 bg-[#666666] text-white text-center py-1 sm:py-2 font-display font-bold text-[9px] sm:text-[11px] uppercase tracking-widest">
                   CHAPTER {idx + 1}
                 </div>
               </div>
               <div className="p-3.5 sm:p-5 md:p-6 flex flex-col flex-1 bg-[#FDFBF7] min-w-0 justify-between">
                 <div>
                   <h3 className="font-display font-black text-sm sm:text-xl uppercase mb-1 sm:mb-2 text-[#1A1A1A] group-hover:text-[#C8885B] transition-colors leading-tight line-clamp-2">{chapTitle}</h3>
                   <p className="text-[#666666] text-xs sm:text-sm line-clamp-3 sm:line-clamp-4 min-h-[72px] sm:min-h-[90px] mb-2 sm:mb-4 flex-1 font-sans leading-snug sm:leading-relaxed">
                     {synopsis}
                   </p>
                 </div>
                 <div className="flex justify-between items-center mt-auto pt-2 border-t border-[#E8E3DC]">
                   <span className="text-[9px] sm:text-[10px] font-mono text-gray-400 uppercase tracking-widest">{minRead}</span>
                   <span className="text-[#C8885B] text-[9px] sm:text-[11px] font-bold uppercase tracking-widest flex items-center group-hover:text-[#1A1A1A] transition-colors">
                     Read <ChevronRight className="w-3 h-3 ml-0.5" />
                   </span>
                 </div>
               </div>
             </button>
           );
        })}
      </div>
      
      {totalTOCPages > 1 && (
        <div className="flex justify-between items-center mt-8 sm:mt-16 border-t border-[#E8E3DC] pt-6 sm:pt-8">
          <button 
            disabled={currentTOCPage === 1}
            onClick={() => { setCurrentTOCPage(p => p - 1); window.scrollTo(0,0); }}
            className="text-[#C8885B] disabled:text-gray-300 font-display font-bold uppercase tracking-widest text-[10px] sm:text-[11px] flex items-center transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" /> PREV
          </button>
          <span className="text-[10px] sm:text-[11px] font-mono text-[#666666] uppercase tracking-widest">
            {currentTOCPage} / {totalTOCPages}
          </span>
          <button 
            disabled={currentTOCPage === totalTOCPages}
            onClick={() => { setCurrentTOCPage(p => p + 1); window.scrollTo(0,0); }}
            className="text-[#C8885B] disabled:text-gray-300 font-display font-bold uppercase tracking-widest text-[10px] sm:text-[11px] flex items-center transition-colors"
          >
            NEXT <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1" />
          </button>
        </div>
      )}
    </div>
  );

  const renderReader = () => {
    const activeChapter = chapters[activeChapterIndex];
    if (!activeChapter) return <div className="text-center py-20 font-sans">Chapter not found</div>;

    const minRead = activeChapter.fields?.readTime || activeChapter.readTime || '4 MIN READ';
    const dateStr = activeChapter.fields?.date || activeChapter.date || '6/5/2026';
    const chapTitle = activeChapter.fields?.title || activeChapter.title || `CHAPTER ${activeChapterIndex + 1}`;
    const content = activeChapter.fields?.content || activeChapter.content || activeChapter.fields?.text || activeChapter.text || "Chapter content missing.";

    return (
      <div 
        className="min-h-screen select-none"
        style={{
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          userSelect: 'none'
        }}
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      >
        {/* Progress Bar */}
        <div className="fixed top-0 left-0 h-1.5 bg-[#C8885B] z-[100] transition-all duration-150" style={{ width: `${progress}%` }} />

        {/* Header */}
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 pt-10 sm:pt-20 pb-8 sm:pb-16 text-center border-b border-[#E8E3DC] mb-8 sm:mb-16">
          <div className="max-w-4xl mx-auto">
            <h4 className="text-[10px] sm:text-[11px] font-bold text-[#C8885B] uppercase tracking-widest mb-2 sm:mb-4">
              {book.fields.genre || 'ROMANCE'}
            </h4>
            <h1 className="font-display font-black text-2xl sm:text-5xl md:text-7xl text-[#1A1A1A] mb-3 sm:mb-6 tracking-tight uppercase leading-tight sm:leading-none">
              {book.fields.title}
            </h1>
            <p className="text-[11px] sm:text-[13px] font-bold text-[#666666] uppercase tracking-widest">
              BY {book.fields.author || 'ALEXANDER TIMILEHIN-DANIELS'}
            </p>
          </div>
        </div>

        {/* Chapter Content */}
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 pb-16 sm:pb-24">
          <div className="text-center mb-8 sm:mb-12 max-w-4xl mx-auto">
             <h2 className="font-display font-black text-xl sm:text-3xl md:text-5xl uppercase tracking-tighter text-[#1A1A1A] mb-3 sm:mb-6">
               {chapTitle}
             </h2>
             <div className="flex items-center justify-center gap-3 sm:gap-4 text-[10px] sm:text-[11px] font-bold text-[#999999] uppercase tracking-widest">
               <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {minRead}</span>
               &bull;
               <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {dateStr}</span>
             </div>
          </div>

          <div className="border-t border-[#1A1A1A] w-full max-w-4xl mx-auto mb-8 sm:mb-16"></div>

          <div 
            className="prose prose-neutral sm:prose-xl max-w-3xl lg:max-w-4xl mx-auto text-[#2D2D2D] font-[Open_Sans] text-base sm:text-lg md:text-xl leading-relaxed sm:leading-loose md:leading-[2] prose-p:mb-6 sm:prose-p:mb-8 prose-p:leading-relaxed sm:prose-p:leading-loose md:prose-p:leading-[2]
              prose-p:first-of-type:first-letter:float-left prose-p:first-of-type:first-letter:text-5xl sm:prose-p:first-of-type:first-letter:text-7xl md:prose-p:first-of-type:first-letter:text-8xl prose-p:first-of-type:first-letter:font-black prose-p:first-of-type:first-letter:pr-3 sm:prose-p:first-of-type:first-letter:pr-4 prose-p:first-of-type:first-letter:pt-0.5 sm:prose-p:first-of-type:first-letter:pt-1 prose-p:first-of-type:first-letter:font-display select-none
              [&>p]:mb-6 sm:[&>p]:mb-8 [&>p]:text-[#222222] [&>blockquote]:border-l-2 [&>blockquote]:border-[#C8885B] [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:my-6 [&>h2]:font-display [&>h2]:font-bold [&>h2]:text-xl sm:[&>h2]:text-2xl [&>h2]:mt-8 [&>h2]:mb-4
            "
            style={{
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
              userSelect: 'none'
            }}
          >
             <Markdown>{String(content)}</Markdown>
          </div>
          
          <div className="max-w-4xl mx-auto"><ReactionSection contentKey={contentKey} /></div>
          
          <div className="border-t border-[#E8E3DC] pt-8 sm:pt-12 mt-10 sm:mt-16 mb-12 sm:mb-20 flex justify-between items-center max-w-4xl mx-auto">
            {activeChapterIndex > 0 ? (
              <button onClick={() => { setSearchParams({ chapter: (activeChapterIndex - 1).toString() }); window.scrollTo(0,0); }} className="text-[10px] sm:text-[11px] font-display font-bold uppercase tracking-widest text-[#C8885B] hover:text-[#1A1A1A] flex items-center transition-colors">
                 <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" /> PREV CHAPTER
              </button>
            ) : <div />}
            {activeChapterIndex < chapters.length - 1 ? (
              <button onClick={() => { setSearchParams({ chapter: (activeChapterIndex + 1).toString() }); window.scrollTo(0,0); }} className="text-[10px] sm:text-[11px] font-display font-bold uppercase tracking-widest text-[#C8885B] hover:text-[#1A1A1A] flex items-center transition-colors">
                 NEXT CHAPTER <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1" />
              </button>
            ) : <span className="text-[10px] sm:text-[11px] font-display font-bold uppercase tracking-widest text-[#999999]">END OF BOOK</span>}
          </div>

          <div className="bg-[#FDFBF7] border border-[#E8E3DC] p-4 sm:p-8 shadow-xs rounded-lg sm:rounded-none w-full max-w-[1920px] mx-auto">
             <h3 className="font-display font-black text-xl sm:text-2xl uppercase border-b border-[#E8E3DC] pb-3 sm:pb-4 mb-2 text-[#1A1A1A]">Discussion</h3>
             <Comments content_key={contentKey} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#F5F1EB]">
      {renderTopNav()}
      {activeChapterIndex === -1 ? renderTOC() : renderReader()}
      <ChapterNotificationBanner />
    </motion.div>
  );
}
