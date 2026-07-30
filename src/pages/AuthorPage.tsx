import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchEntries } from '../api';
import { Author, Book } from '../types';
import { getImageUrl, getBookUrl, contentToMarkdown } from '../utils';
import { Globe, Twitter, Instagram, Linkedin, Facebook, Lightbulb, BookOpen, ChevronLeft, ChevronRight, Sparkles, Share2 } from 'lucide-react';
import Markdown from 'react-markdown';
import { ShareMenu } from '../components/ShareMenu';

export default function AuthorPage() {
  const { name } = useParams<{ name: string }>();
  const isDirectoryPage = !name;

  const [authors, setAuthors] = useState<Author[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Sort state
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<'a-z' | 'z-a' | 'default'>('a-z');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [name]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const authorsPerPage = isMobile ? 6 : 9;

  useEffect(() => {
    async function loadData() {
      try {
        const [authorsData, booksData] = await Promise.all([
          fetchEntries<Author>('author', { limit: 100 }),
          fetchEntries<Book>('book', { limit: 200 })
        ]);
        setAuthors(authorsData);
        setBooks(booksData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F1EB] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#C8885B] border-t-transparent rounded-full animate-spin mb-4"></div>
          <span className="font-display font-bold text-[10px] uppercase tracking-widest text-gray-400">Loading Authors</span>
        </div>
      </div>
    );
  }

  // Find spotlight author
  const spotlightAuthor = authors.find(a => a.fields.isSpotlight) || authors[0];
  
  if (isDirectoryPage) {
    // Sort logic
    const sortedAuthors = [...authors].sort((a, b) => {
      if (sortOrder === 'a-z') {
        return (a.fields.name || '').localeCompare(b.fields.name || '');
      }
      if (sortOrder === 'z-a') {
        return (b.fields.name || '').localeCompare(a.fields.name || '');
      }
      return 0;
    });

    const totalPages = Math.ceil(sortedAuthors.length / authorsPerPage) || 1;
    const paginatedAuthors = sortedAuthors.slice((currentPage - 1) * authorsPerPage, currentPage * authorsPerPage);

    return (
      <div className="min-h-screen bg-[#F5F1EB] pt-8 sm:pt-12 pb-24 flex flex-col items-center w-full">
        <div className="w-full px-3 sm:px-6 md:px-12 xl:px-0 max-w-[1920px] mx-auto">
          
          <div className="max-w-7xl mx-auto px-2 sm:px-4">
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl md:text-6xl uppercase font-black text-[#1A1A1A] mb-2 sm:mb-3">
              AUTHOR'S PAGE
            </h1>
            <p className="font-[Open_Sans] text-xs sm:text-base md:text-lg text-gray-600 mb-6 sm:mb-10 max-w-4xl font-medium leading-relaxed">
              Explore our directory of renowned writers, essayists, and literary scholars. Discover comprehensive biographies, personal inspirations, and curated collections of notable works across every genre.
            </p>
          </div>
          
          {/* Spotlight Section - Full 1920px max width */}
          {spotlightAuthor && (
            <div className="mb-12 sm:mb-16 bg-[#165691] text-white overflow-hidden relative shadow-md max-w-[1920px] w-full mx-auto rounded-none">
              <div className="flex flex-col md:flex-row min-h-[320px] sm:min-h-[380px] lg:min-h-[420px]">
                {/* Mobile Author Image Block */}
                <div className="w-full md:hidden h-56 relative overflow-hidden bg-[#0D3860]">
                  {getImageUrl(spotlightAuthor.fields.image || spotlightAuthor.fields.imageUrl) ? (
                    <img 
                      src={getImageUrl(spotlightAuthor.fields.image || spotlightAuthor.fields.imageUrl)} 
                      alt={spotlightAuthor.fields.name} 
                      className="w-full h-full object-cover object-top" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-blue-200 font-display font-bold text-sm">
                      {spotlightAuthor.fields.name}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#165691] via-transparent to-transparent" />
                </div>

                <div className="flex-1 p-5 sm:p-8 md:p-12 lg:p-16 xl:p-20 flex flex-col justify-center relative z-10 bg-[#165691] md:bg-gradient-to-r md:from-[#165691] md:via-[#165691]/95 md:to-[#165691]/70 max-w-4xl">
                  <span className="text-[#3AC9B0] font-display font-bold text-xs sm:text-xl uppercase tracking-[0.2em] mb-1 sm:mb-2">
                    FEATURED SCHOLAR
                  </span>
                  <h2 className="font-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl uppercase tracking-tight font-black mb-3 sm:mb-6 text-white leading-tight">
                    {spotlightAuthor.fields.name}
                  </h2>
                  {spotlightAuthor.fields.bio && (
                    <div className="mb-4 sm:mb-8 max-w-2xl">
                      <p className="text-blue-100/90 font-[Open_Sans] text-xs sm:text-base md:text-lg line-clamp-3 sm:line-clamp-4 leading-relaxed sm:leading-relaxed mb-2">
                        {spotlightAuthor.fields.bio}
                      </p>
                    </div>
                  )}
                  <div>
                    <Link to={`/authors/${spotlightAuthor.fields.slug || spotlightAuthor.sys.id}`} className="bg-[#FAED26] text-black font-display font-bold text-xs sm:text-sm uppercase tracking-widest py-2.5 sm:py-3.5 px-6 sm:px-8 transition-all hover:bg-yellow-300 inline-flex items-center rounded-none shadow-md hover:scale-[1.02]">
                      READ BIOGRAPHY <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1" />
                    </Link>
                  </div>
                </div>
                <div className="hidden md:block absolute top-0 right-0 w-full md:w-[55%] lg:w-[60%] h-full">
                  {getImageUrl(spotlightAuthor.fields.image || spotlightAuthor.fields.imageUrl) && (
                    <img 
                      src={getImageUrl(spotlightAuthor.fields.image || spotlightAuthor.fields.imageUrl)} 
                      alt={spotlightAuthor.fields.name} 
                      className="w-full h-full object-cover object-top md:object-center opacity-60" 
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#165691] via-[#165691]/50 to-transparent" />
                </div>
              </div>
            </div>
          )}

          {/* Authors Grid Section */}
          <div className="mb-4 sm:mb-6 max-w-7xl mx-auto px-2 sm:px-4 flex flex-wrap items-center justify-between gap-4">
            <h3 className="font-display font-bold text-xs text-gray-500 uppercase tracking-widest">
              ALL ENROLLED WRITERS
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">SORT:</span>
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value as 'a-z' | 'z-a' | 'default');
                  setCurrentPage(1);
                }}
                className="bg-white border border-[#E8E3DC] text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded shadow-xs text-[#1A1A1A] focus:outline-none focus:border-[#C8885B]"
              >
                <option value="a-z">Alphabetical (A - Z)</option>
                <option value="z-a">Alphabetical (Z - A)</option>
                <option value="default">Default Order</option>
              </select>
            </div>
          </div>

          <div className="max-w-7xl mx-auto w-full px-2 sm:px-4 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-8 sm:mb-12">
            {paginatedAuthors.map((author) => {
              const coverUrl = getImageUrl(author.fields.image || author.fields.imageUrl);
              const slug = author.fields.slug || author.sys.id;
              
              // Count works
              let worksCount = 0;
              if (author.fields.notableWorks) {
                worksCount = Array.isArray(author.fields.notableWorks) ? author.fields.notableWorks.length : 1;
              } else {
                worksCount = books.filter(b => b.fields.author && b.fields.author.toLowerCase().includes(author.fields.name.toLowerCase())).length;
              }

              return (
                <React.Fragment key={author.sys.id}>
                  {/* Mobile Library Book Collection Card Style */}
                  <Link 
                    to={`/authors/${slug}`}
                    className="group sm:hidden relative w-full aspect-[3/4] flex-shrink-0 overflow-hidden shadow-md block rounded-none bg-gray-200 border border-[#E8E3DC]"
                  >
                    <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 text-[8px] font-bold tracking-widest uppercase rounded-none shadow bg-[#165691] text-white z-20">
                      {worksCount} {worksCount === 1 ? 'WORK' : 'WORKS'}
                    </div>
                    {coverUrl ? (
                      <img src={coverUrl} alt={author.fields.name} className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full bg-[#165691] flex items-center justify-center p-2 text-center">
                        <span className="font-display font-bold text-white text-xs">{author.fields.name}</span>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex flex-col justify-end p-2.5 z-10">
                      <h4 className="text-white font-display font-black text-xs leading-tight mb-0.5 line-clamp-2 uppercase group-hover:text-[#FAED26] transition-colors">
                        {author.fields.name}
                      </h4>
                      <span className="text-[#3AC9B0] font-mono text-[8px] uppercase tracking-widest font-bold flex items-center">
                        BIO <span className="ml-1">→</span>
                      </span>
                    </div>
                  </Link>

                  {/* Desktop & Tablet Layout */}
                  <Link 
                    to={`/authors/${slug}`}
                    className="hidden sm:flex bg-[#F7F4F0] border border-[#E8E3DC] rounded-none overflow-hidden transition-all hover:shadow-md group min-h-[140px] sm:min-h-[160px] md:min-h-[170px]"
                  >
                    <div className="w-[100px] sm:w-[110px] md:w-[130px] shrink-0 overflow-hidden bg-gray-200">
                      {coverUrl ? (
                        <img src={coverUrl} alt={author.fields.name} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center p-2">No Image</div>
                      )}
                    </div>
                    <div className="flex-1 p-3 sm:p-4 md:p-5 flex flex-col justify-between min-w-0">
                      <div>
                        <h4 className="font-display font-black uppercase text-sm sm:text-base md:text-xl text-[#1A1A1A] truncate mb-1 group-hover:text-[#C8885B] transition-colors">
                          {author.fields.name}
                        </h4>
                        {author.fields.bio && (
                          <p className="font-[Open_Sans] text-xs md:text-sm text-[#4A4A4A] line-clamp-2 sm:line-clamp-3 leading-relaxed">
                            {author.fields.bio}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2 sm:mt-3 pt-2 border-t border-gray-200/50">
                        <span className="font-mono text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wider">{worksCount} Works</span>
                        <span className="font-mono text-[9px] sm:text-[10px] text-[#E07A46] uppercase tracking-widest flex items-center font-bold">
                          Bio <span className="ml-1">→</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                </React.Fragment>
              );
            })}
          </div>

          <div className="max-w-7xl mx-auto w-full">
            {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 sm:gap-6 mt-8 sm:mt-16">
              <button 
                onClick={() => {
                  setCurrentPage(p => Math.max(1, p - 1));
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }}
                disabled={currentPage === 1}
                className={`flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded font-display font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-colors ${currentPage === 1 ? 'text-gray-400 border-gray-200 cursor-not-allowed bg-gray-100/50' : 'text-[#1A1A1A] hover:bg-white bg-white/50'}`}
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" /> PREV
              </button>
              <span className="font-display font-bold text-[10px] sm:text-xs text-[#1A1A1A] uppercase tracking-widest">
                PAGE {currentPage} OF {totalPages}
              </span>
              <button 
                onClick={() => {
                  setCurrentPage(p => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }}
                disabled={currentPage === totalPages}
                className={`flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded font-display font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-colors ${currentPage === totalPages ? 'text-gray-400 border-gray-200 cursor-not-allowed bg-gray-100/50' : 'text-[#1A1A1A] hover:bg-white bg-white/50'}`}
              >
                NEXT <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1" />
              </button>
            </div>
          )}

        </div>
      </div>
      </div>
    );
  }

  // Individual View
  const author = authors.find(a => (a.fields.slug || a.sys.id) === name);
  if (!author) {
    return (
      <div className="min-h-screen bg-[#F5F1EB] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-display font-black text-black uppercase mb-4">Author Not Found</h1>
        <p className="text-gray-600 font-sans mb-8">The author profile you are looking for does not exist.</p>
        <Link to="/authors" className="bg-[#C8885B] text-white px-6 py-3 font-display font-bold text-xs uppercase tracking-widest hover:bg-black transition-colors">
          Return to Directory
        </Link>
      </div>
    );
  }

  const coverUrl = getImageUrl(author.fields.image || author.fields.imageUrl);
  
  // Find notable works
  let notableWorksBooks: Book[] = [];
  if (author.fields.notableWorks) {
    if (Array.isArray(author.fields.notableWorks)) {
      const ids = author.fields.notableWorks.map(w => w?.sys?.id || w).filter(Boolean);
      notableWorksBooks = books.filter(b => ids.includes(b.sys.id));
    }
  } else {
    notableWorksBooks = books.filter(b => b.fields.author && b.fields.author.toLowerCase().includes(author.fields.name.toLowerCase()));
  }

  return (
    <div className="min-h-screen bg-[#F5F1EB] pb-16 sm:pb-24">
      <div className="max-w-[1920px] mx-auto w-full px-4 sm:px-6 md:px-12 lg:px-24 pt-6 sm:pt-12 pb-6 sm:pb-8">
        <Link to="/authors" className="inline-flex items-center text-[#C8885B] font-display font-bold text-[10px] sm:text-xs uppercase tracking-widest hover:text-[#A66F47] transition-colors group mb-6 sm:mb-12">
          <span className="mr-2">&larr;</span>
          BACK TO AUTHORS LIST
        </Link>

        {/* Top Section: Image & Bio */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-12 lg:gap-20 mb-12 sm:mb-20">
          {/* Left Column - Image, Share & Links */}
          <div className="md:col-span-4 lg:col-span-3 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="w-[220px] sm:w-[260px] md:w-full mx-auto md:mx-0 aspect-[3/4] bg-gray-200 overflow-hidden shadow-sm mb-4 sm:mb-6 rounded-none">
              {coverUrl ? (
                <img src={coverUrl} alt={author.fields.name} className="w-full h-full object-cover object-top" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
              )}
            </div>

            {/* Share Button beside/under image - Icon only on mobile */}
            <div className="flex justify-center md:justify-start w-full mb-6 sm:mb-10">
              <ShareMenu 
                title={String(author.fields.name)} 
                url={window.location.href} 
                description={author.fields.bio ? String(author.fields.bio).substring(0, 150) + '...' : undefined}
                imageUrl={coverUrl || undefined}
                className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 border border-[#E8E3DC] text-[10px] font-display font-bold uppercase tracking-widest text-[#C8885B] hover:border-[#C8885B] transition-colors bg-white cursor-pointer rounded-none shadow-xs"
              >
                <i className="fa-solid fa-share-nodes text-xs sm:mr-2"></i>
                <span className="hidden sm:inline">SHARE AUTHOR</span>
              </ShareMenu>
            </div>

            {/* Links & Buy Books Centralized on Mobile */}
            <div className="w-full flex flex-col gap-6 sm:gap-10 items-center md:items-start">
              <div className="w-full max-w-[240px] md:max-w-none">
                 <h3 className="font-display font-bold text-xs text-gray-500 uppercase tracking-widest mb-3 sm:mb-6 border-b border-[#E8E3DC] pb-2 text-center md:text-left">Buy Books</h3>
                 {author.fields.buyBooksUrl ? (
                   <a href={author.fields.buyBooksUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center border border-[#C8885B] bg-[#C8885B] text-white font-display font-bold text-xs uppercase tracking-widest py-3 sm:py-4 px-6 sm:px-8 hover:bg-black hover:border-black transition-colors w-full rounded-none">
                     Get Books
                   </a>
                 ) : (
                   <div className="inline-flex items-center justify-center border border-[#E8E3DC] bg-transparent text-[#1A1A1A] font-display font-bold text-xs uppercase tracking-widest py-3 sm:py-4 px-6 sm:px-8 w-full cursor-not-allowed opacity-50 rounded-none">
                     Not Available
                   </div>
                 )}
              </div>
              <div className="w-full">
                <h3 className="font-display font-bold text-xs text-gray-500 uppercase tracking-widest mb-3 sm:mb-6 border-b border-[#E8E3DC] pb-2 text-center md:text-left">Links & Socials</h3>
                <div className="flex flex-wrap justify-center md:justify-start md:flex-col gap-3 sm:gap-4">
                  {author.fields.websiteUrl && (
                    <a href={author.fields.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#4A4A4A] hover:text-[#C8885B] transition-colors font-sans text-xs sm:text-sm">
                      <Globe className="w-4 h-4 text-gray-400 shrink-0" /> Website
                    </a>
                  )}
                  {author.fields.socialsUrl && (
                    <a href={author.fields.socialsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#4A4A4A] hover:text-[#C8885B] transition-colors font-sans text-xs sm:text-sm">
                      <Share2 className="w-4 h-4 text-gray-400 shrink-0" /> Socials
                    </a>
                  )}
                  {author.fields.twitterUrl && (
                    <a href={author.fields.twitterUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#4A4A4A] hover:text-[#C8885B] transition-colors font-sans text-xs sm:text-sm">
                      <Twitter className="w-4 h-4 text-gray-400 shrink-0" /> Twitter
                    </a>
                  )}
                  {author.fields.facebookUrl && (
                    <a href={author.fields.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#4A4A4A] hover:text-[#C8885B] transition-colors font-sans text-xs sm:text-sm">
                      <Facebook className="w-4 h-4 text-gray-400 shrink-0" /> Facebook
                    </a>
                  )}
                  {author.fields.instagramUrl && (
                    <a href={author.fields.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#4A4A4A] hover:text-[#C8885B] transition-colors font-sans text-xs sm:text-sm">
                      <Instagram className="w-4 h-4 text-gray-400 shrink-0" /> Instagram
                    </a>
                  )}
                  {author.fields.linkedinUrl && (
                    <a href={author.fields.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#4A4A4A] hover:text-[#C8885B] transition-colors font-sans text-xs sm:text-sm">
                      <Linkedin className="w-4 h-4 text-gray-400 shrink-0" /> LinkedIn
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Bio & Facts */}
          <div className="md:col-span-8 lg:col-span-9">
            <h1 className="font-display text-3xl sm:text-5xl md:text-6xl text-[#1A1A1A] uppercase font-black tracking-tight leading-tight mb-4 sm:mb-6 text-left">
              {author.fields.name}
            </h1>

            {author.fields.bio && (
              <div className="prose prose-neutral sm:prose-lg max-w-none text-[#2B2B2B] font-[Open_Sans] text-sm sm:text-base leading-relaxed sm:leading-loose mb-8 sm:mb-12 space-y-4 [&>p]:mb-4 [&>p]:leading-relaxed text-left">
                <Markdown>{contentToMarkdown(author.fields.bio)}</Markdown>
              </div>
            )}

            {/* Fun Facts & Did You Know */}
            {(author.fields.funFacts || author.fields.didYouKnow) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-12 mt-8 sm:mt-12 border-t border-[#E8E3DC] pt-6 sm:pt-12">
                {author.fields.funFacts && (
                  <div>
                    <div className="flex items-center gap-2 mb-4 sm:mb-6">
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#C8885B]" />
                      <h3 className="font-display font-bold text-sm sm:text-lg uppercase tracking-widest text-[#C8885B]">Literary Fun Facts</h3>
                    </div>
                    <ul className="space-y-3 sm:space-y-4 font-sans text-xs sm:text-sm text-[#4A4A4A]">
                      {(Array.isArray(author.fields.funFacts) ? author.fields.funFacts : [author.fields.funFacts]).map((fact: any, i: number) => (
                        <li key={i} className="flex gap-3 sm:gap-4 items-start">
                          <span className="leading-relaxed">{fact}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {author.fields.didYouKnow && (
                  <div>
                    <div className="flex items-center gap-2 mb-4 sm:mb-6">
                      <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-[#C8885B]" />
                      <h3 className="font-display font-bold text-sm sm:text-lg uppercase tracking-widest text-[#C8885B]">Did You Know?</h3>
                    </div>
                    <p className="font-sans text-xs sm:text-sm text-[#4A4A4A] leading-relaxed italic">
                      "{author.fields.didYouKnow}"
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Notable Works */}
        {notableWorksBooks.length > 0 && (
          <div className="mb-12 sm:mb-20">
            <div className="border-b border-black pb-2 sm:pb-4 mb-6 sm:mb-8 flex items-center justify-between">
              <h2 className="font-display font-black text-xl sm:text-3xl uppercase tracking-tight text-[#1A1A1A]">Notable Works</h2>
              <span className="font-mono text-xs text-[#C8885B] uppercase font-bold tracking-wider">
                {notableWorksBooks.length} {notableWorksBooks.length === 1 ? 'Book' : 'Books'}
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-4">
              {notableWorksBooks.map((book, index) => {
                const bookCover = getImageUrl(book.fields.coverImage || book.fields.imageUrl);
                const bookSlug = book.fields.slug || book.sys.id;
                const cat = book.fields.category;
                const displayCat = Array.isArray(cat) && cat.length > 0 ? String(cat[0]) : typeof cat === 'string' ? cat : 'FANTASY';
                
                // Hide books beyond 4 on mobile, beyond 7 on desktop
                if (index >= 7) return null;
                const isMobileHidden = index >= 4;

                return (
                  <Link 
                    key={book.sys.id} 
                    to={getBookUrl(book)} 
                    className={`group flex flex-col h-full bg-[#F5F1EB] border border-[#E8E3DC] p-1.5 sm:p-2.5 rounded-none hover:border-[#C8885B] transition-all relative ${isMobileHidden ? 'hidden sm:flex' : ''}`}
                  >
                    <div className="w-full aspect-[2/3] bg-gray-200 overflow-hidden relative mb-1 sm:mb-2">
                      {bookCover ? (
                        <img src={bookCover} alt={book.fields.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-[9px] text-center p-1">No Image</div>
                      )}
                    </div>
                    <div className="flex flex-col flex-1 justify-between">
                      <div>
                        <span className="font-mono text-[7px] sm:text-[9px] text-[#C8885B] uppercase tracking-wider block font-semibold mb-0.5 line-clamp-1">{displayCat}</span>
                        <h4 className="font-display font-bold text-[9px] sm:text-xs text-[#1A1A1A] uppercase leading-tight group-hover:text-[#C8885B] transition-colors line-clamp-2">
                          {book.fields.title}
                        </h4>
                      </div>
                      {book.fields.author && (
                        <p className="font-sans text-[8px] sm:text-[10px] text-gray-500 uppercase tracking-wider mt-0.5 truncate">
                          BY {book.fields.author}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}

              {/* Read More card on Mobile if > 4 */}
              {notableWorksBooks.length > 4 && (
                <Link 
                  to="/collection" 
                  className="sm:hidden group flex flex-col items-center justify-center bg-[#111111] text-white p-2 text-center border border-black hover:bg-[#C8885B] transition-colors rounded-none cursor-pointer aspect-[2/3] h-full"
                >
                  <i className="fa-solid fa-arrow-right-long text-base mb-1 text-[#C8885B] group-hover:text-white transition-colors"></i>
                  <span className="font-display font-bold text-[9px] uppercase tracking-widest text-center">READ MORE</span>
                  <span className="font-mono text-[8px] text-gray-400 mt-0.5 uppercase">+{notableWorksBooks.length - 4} MORE</span>
                </Link>
              )}

              {/* Read More card on Desktop if > 7 */}
              {notableWorksBooks.length > 7 && (
                <Link 
                  to="/collection" 
                  className="hidden sm:flex group flex-col items-center justify-center bg-[#111111] text-white p-3 text-center border border-black hover:bg-[#C8885B] transition-colors rounded-none cursor-pointer h-full"
                >
                  <i className="fa-solid fa-arrow-right-long text-xl mb-2 text-[#C8885B] group-hover:text-white transition-colors"></i>
                  <span className="font-display font-bold text-xs uppercase tracking-widest text-center">READ MORE</span>
                  <span className="font-mono text-[9px] text-gray-400 mt-1 uppercase">+{notableWorksBooks.length - 7} MORE</span>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Relatable Authors */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center justify-between border-b border-gray-300 pb-2 sm:pb-4 mb-4 sm:mb-8">
             <h2 className="font-display font-black text-xl sm:text-3xl text-[#1A1A1A]">Relatable Authors</h2>
             <div className="flex gap-2 hidden md:flex">
               <button className="w-8 h-8 rounded-none border border-gray-300 flex items-center justify-center hover:bg-white transition-colors">
                 <ChevronLeft className="w-4 h-4 text-gray-600" />
               </button>
               <button className="w-8 h-8 rounded-none border border-gray-300 flex items-center justify-center hover:bg-white transition-colors">
                 <ChevronRight className="w-4 h-4 text-gray-600" />
               </button>
             </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {authors.filter(a => a.sys.id !== author.sys.id).slice(0, 3).map((relAuthor) => {
              const relCoverUrl = getImageUrl(relAuthor.fields.image || relAuthor.fields.imageUrl);
              const slug = relAuthor.fields.slug || relAuthor.sys.id;
              
              let worksCount = 0;
              if (relAuthor.fields.notableWorks) {
                worksCount = Array.isArray(relAuthor.fields.notableWorks) ? relAuthor.fields.notableWorks.length : 1;
              } else {
                worksCount = books.filter(b => b.fields.author && b.fields.author.toLowerCase().includes(relAuthor.fields.name.toLowerCase())).length;
              }

              return (
                <React.Fragment key={relAuthor.sys.id}>
                  {/* Mobile Preview Card */}
                  <Link 
                    to={`/authors/${slug}`}
                    className="group sm:hidden relative w-full aspect-[3/4] flex-shrink-0 overflow-hidden shadow-md block rounded-none bg-gray-200 border border-[#E8E3DC]"
                  >
                    <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 text-[8px] font-bold tracking-widest uppercase rounded-none shadow bg-[#165691] text-white z-20">
                      {worksCount} {worksCount === 1 ? 'WORK' : 'WORKS'}
                    </div>
                    {relCoverUrl ? (
                      <img src={relCoverUrl} alt={relAuthor.fields.name} className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full bg-[#165691] flex items-center justify-center p-2 text-center">
                        <span className="font-display font-bold text-white text-xs">{relAuthor.fields.name}</span>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex flex-col justify-end p-2.5 z-10">
                      <h4 className="text-white font-display font-black text-xs leading-tight mb-0.5 line-clamp-2 uppercase group-hover:text-[#FAED26] transition-colors">
                        {relAuthor.fields.name}
                      </h4>
                      <span className="text-[#3AC9B0] font-mono text-[8px] uppercase tracking-widest font-bold flex items-center">
                        BIO <span className="ml-1">→</span>
                      </span>
                    </div>
                  </Link>

                  {/* Desktop & Tablet Preview Card */}
                  <Link 
                    to={`/authors/${slug}`}
                    className="hidden sm:flex bg-[#F7F4F0] border border-[#E8E3DC] rounded-none overflow-hidden transition-all hover:shadow-md group min-h-[140px] sm:min-h-[160px]"
                  >
                    <div className="w-[100px] sm:w-[110px] md:w-[120px] shrink-0 overflow-hidden bg-gray-200">
                      {relCoverUrl ? (
                        <img src={relCoverUrl} alt={relAuthor.fields.name} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center p-2">No Image</div>
                      )}
                    </div>
                    <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
                      <div>
                        <h4 className="font-display font-black uppercase text-sm sm:text-base text-[#1A1A1A] truncate mb-1 group-hover:text-[#C8885B] transition-colors">
                          {relAuthor.fields.name}
                        </h4>
                        {relAuthor.fields.bio && (
                          <p className="font-[Open_Sans] text-xs text-[#4A4A4A] line-clamp-2 sm:line-clamp-3 leading-relaxed">
                            {relAuthor.fields.bio}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200/50">
                        <span className="font-mono text-[9px] text-gray-400 uppercase tracking-wider">{worksCount} Works</span>
                        <span className="font-mono text-[9px] text-[#E07A46] uppercase tracking-widest flex items-center font-bold">
                          Bio <span className="ml-1">→</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                </React.Fragment>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
