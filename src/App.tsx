import { NotificationProvider } from './contexts/NotificationContext';
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { Search, Menu, X, ChevronUp } from 'lucide-react';

import HomePage from './pages/HomePage';
import BookPage from './pages/BookPage';
import ReviewPage from './pages/ReviewPage';
import AuthorPage from './pages/AuthorPage';
import OriginalBooksPage from './pages/OriginalBooksPage';
import ReadOriginalBookPage from './pages/ReadOriginalBookPage';
import CategoryDetailPage from './pages/CategoryDetailPage';
import GenrePage from './pages/GenrePage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import DisclaimerPage from './pages/DisclaimerPage';
import LibraryCollectionPage from './pages/LibraryCollectionPage';

function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 250) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-6 right-6 z-50 p-3 bg-[#C8885B] text-white rounded-none shadow-xl hover:bg-[#A66F47] transition-all duration-300 items-center justify-center border border-[#DF9C6E]/30 ${
        isVisible ? 'opacity-100 translate-y-0 flex' : 'opacity-0 translate-y-4 pointer-events-none hidden'
      }`}
      aria-label="Scroll to top"
    >
      <ChevronUp className="w-5 h-5" />
    </button>
  );
}

function Navigation() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => {
    if (path.startsWith('/#')) {
      return location.pathname === '/' && location.hash === path.substring(1);
    }
    return location.pathname === path;
  };
  
  const navItemClass = (path: string) => 
    `font-mono whitespace-nowrap uppercase tracking-widest text-[10px] font-bold transition-all hover:-translate-y-0.5 inline-flex items-center gap-1.5 ${
      isActive(path) 
        ? "text-black border-b-[3px] border-primary-orange pb-1" 
        : "text-gray-600 hover:text-black"
    }`;

  const mobileNavItemClass = (path: string) => 
    `py-3 font-mono uppercase tracking-widest text-[12px] font-bold flex items-center gap-2.5 ${
      isActive(path) 
        ? "text-black border-l-4 border-primary-orange pl-3 bg-gray-50" 
        : "text-gray-600 pl-4 hover:bg-gray-50 hover:text-black"
    }`;

  const handleScrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    if (location.pathname === '/') {
      e.preventDefault();
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        window.history.pushState(null, '', `/#${sectionId}`);
        setIsOpen(false);
      }
    } else {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden xl:flex items-center justify-between gap-5">
        <Link to="/" className={navItemClass('/')}>
          <i className="fa-solid fa-house text-[#C8885B]"></i> Home
        </Link>
        <Link to="/category/top-picks" className={navItemClass('/category/top-picks')}>
          <i className="fa-solid fa-medal text-[#FFD700]"></i> Top Picks
        </Link>
        <Link to="/category/discovery" className={navItemClass('/category/discovery')}>
          <span className="relative inline-flex items-center justify-center">
            <i className="fa-solid fa-certificate text-[#521344] text-xs"></i>
            <i className="fa-solid fa-check text-[5px] absolute text-white font-bold"></i>
          </span> Discovery
        </Link>
        <Link to="/category/bottom-shelf" className={navItemClass('/category/bottom-shelf')}>
          <i className="fa-solid fa-box-archive text-gray-600"></i> Bottom Shelf
        </Link>
        <Link to="/originals" className="bg-[#111111] whitespace-nowrap text-white font-mono uppercase tracking-widest text-[10px] font-bold px-3.5 h-[30.5px] flex items-center justify-center rounded hover:bg-primary-orange hover:text-black transition-all hover:-translate-y-0.5 shadow-sm gap-1.5">
          <i className="fa-solid fa-scroll text-amber-400"></i> Original Books
        </Link>
        <Link to="/blog" className={navItemClass('/blog')}>
          <i className="fa-solid fa-newspaper text-[#C8885B]"></i> Blog
        </Link>
        <Link to="/collection" className={navItemClass('/collection')}>
          <i className="fa-solid fa-layer-group text-[#C8885B]"></i> Library Collection
        </Link>
        <Link to="/authors" className={navItemClass('/authors')}>
          <i className="fa-solid fa-feather-pointed text-[#845739]"></i> Authors
        </Link>
        
        <div className="relative ml-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="pl-9 pr-3 py-1.5 bg-white rounded-full text-[10px] font-sans w-32 border border-gray-200 focus:border-primary-orange focus:outline-none focus:ring-1 focus:ring-primary-orange shadow-sm transition-all"
          />
        </div>
      </nav>

      {/* Mobile Menu Toggle */}
      <div className="xl:hidden flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="pl-9 pr-3 py-1.5 bg-white rounded-full text-[10px] font-sans w-32 border border-gray-200 focus:outline-none"
          />
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="text-black p-2">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="absolute top-[73px] left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-50 xl:hidden">
          <div className="py-2 flex flex-col">
            <Link to="/" onClick={() => setIsOpen(false)} className={mobileNavItemClass('/')}>
              <i className="fa-solid fa-house text-[#C8885B] w-5 text-center"></i> Home
            </Link>
            <Link to="/category/top-picks" onClick={() => setIsOpen(false)} className={mobileNavItemClass('/category/top-picks')}>
              <i className="fa-solid fa-medal text-[#FFD700] w-5 text-center"></i> Top Picks
            </Link>
            <Link to="/category/discovery" onClick={() => setIsOpen(false)} className={mobileNavItemClass('/category/discovery')}>
              <span className="w-5 flex items-center justify-center">
                <span className="relative inline-flex items-center justify-center">
                  <i className="fa-solid fa-certificate text-[#521344] text-sm"></i>
                  <i className="fa-solid fa-check text-[6px] absolute text-white font-bold"></i>
                </span>
              </span> Discovery
            </Link>
            <Link to="/category/bottom-shelf" onClick={() => setIsOpen(false)} className={mobileNavItemClass('/category/bottom-shelf')}>
              <i className="fa-solid fa-box-archive text-gray-600 w-5 text-center"></i> Bottom Shelf
            </Link>
            <Link to="/originals" onClick={() => setIsOpen(false)} className={mobileNavItemClass('/originals')}>
              <i className="fa-solid fa-scroll text-amber-500 w-5 text-center"></i> Original Books
            </Link>
            <Link to="/blog" onClick={() => setIsOpen(false)} className={mobileNavItemClass('/blog')}>
              <i className="fa-solid fa-newspaper text-[#C8885B] w-5 text-center"></i> Blog
            </Link>
            <Link to="/collection" onClick={() => setIsOpen(false)} className={mobileNavItemClass('/collection')}>
              <i className="fa-solid fa-layer-group text-[#C8885B] w-5 text-center"></i> Library Collection
            </Link>
            <Link to="/authors" onClick={() => setIsOpen(false)} className={mobileNavItemClass('/authors')}>
              <i className="fa-solid fa-feather-pointed text-[#845739] w-5 text-center"></i> Authors
            </Link>
            
            <div className="p-4 md:hidden">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="pl-9 pr-3 py-2 w-full bg-gray-50 rounded-full text-[12px] font-sans border border-gray-200 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(false);
  const location = useLocation();

  if (dismissed || location.pathname !== '/') return null;

  const disclaimerText = "DISCLAIMER & NOTICE: Library of Alexander DOES NOT host, share, distribute, or pirate copyrighted books or digital files. We strictly DO NOT support book piracy in any form. All content is for reviews, summaries, and educational commentary.";

  return (
    <div className="bg-[#2d0d0d] text-[#fef3c7] py-2 overflow-hidden border-b border-[#7f1d1d] text-[10px] sm:text-[11px] font-mono font-bold tracking-widest uppercase select-none z-50 relative pr-10">
      <div className="animate-marquee whitespace-nowrap flex items-center">
        <span className="inline-block px-8 flex items-center gap-2">
          <i className="fa-solid fa-triangle-exclamation text-rose-400"></i>
          <span>{disclaimerText}</span>
        </span>
        <span className="inline-block px-8 flex items-center gap-2">
          <i className="fa-solid fa-triangle-exclamation text-rose-400"></i>
          <span>{disclaimerText}</span>
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#4c1d1d] hover:bg-[#6b2626] text-amber-200 p-1 rounded-full border border-rose-900/50 transition-colors z-10 flex items-center justify-center cursor-pointer"
        title="Dismiss notice"
        aria-label="Dismiss notice"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Helmet>
          <title>Library of Alexander | Modern Digital Library</title>
          <meta name="description" content="A modern digital library for timeless ideas, book reviews, summaries, and original manuscripts." />
          <meta property="og:title" content="Library of Alexander" />
          <meta property="og:description" content="A modern digital library for timeless ideas, book reviews, summaries, and original manuscripts." />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary_large_image" />
        </Helmet>
        <NotificationProvider>
          <div className="min-h-screen flex flex-col font-sans">
            <DisclaimerBanner />
            <header className="bg-parchment-50 border-b border-gray-200 relative">
              <div className="max-w-[1920px] mx-auto px-4 md:px-6 py-4 sm:py-6 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2.5 z-10 group">
                  <i className="fa-solid fa-book-open-reader text-2xl text-[#C8885B] group-hover:scale-110 transition-transform"></i>
                  <span className="hidden sm:inline text-[16px] md:text-[18px] font-display font-bold uppercase tracking-widest text-black">
                    Library of Alexander
                  </span>
                </Link>
                <Navigation />
              </div>
            </header>

            <main className="flex-1 max-w-[1920px] w-full mx-auto">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/collection" element={<LibraryCollectionPage />} />
                <Route path="/books/:slug" element={<BookPage />} />
                <Route path="/reviews/:slug" element={<ReviewPage />} />
                <Route path="/authors" element={<AuthorPage />} />
                <Route path="/authors/:name" element={<AuthorPage />} />
                <Route path="/author/:name" element={<AuthorPage />} />
                <Route path="/originals" element={<OriginalBooksPage />} />
                <Route path="/originals/:slug/:chapterId?" element={<ReadOriginalBookPage />} />
                <Route path="/category/:slug" element={<CategoryDetailPage />} />
                <Route path="/genre/:slug" element={<GenrePage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:slug" element={<BlogPostPage />} />
                <Route path="/disclaimer" element={<DisclaimerPage />} />
              </Routes>
            </main>

            <footer className="bg-[#1C1815] text-[#A6998C] py-8 sm:py-12 border-t border-[#2C2722] relative">
              <div className="max-w-[1920px] mx-auto px-4 sm:px-6">
                <div className="flex flex-col sm:grid sm:grid-cols-4 gap-6 sm:gap-10 mb-8 sm:mb-12">
                  <div className="sm:col-span-2">
                    <div className="flex items-center gap-2.5 mb-2 sm:mb-3">
                      <i className="fa-solid fa-book-open-reader text-xl sm:text-2xl text-[#C8885B]"></i>
                      <h3 className="font-display font-bold uppercase tracking-widest text-sm sm:text-lg text-[#F5EFE6]">Library of Alexander</h3>
                    </div>
                    <p className="font-sans text-xs italic leading-snug sm:leading-relaxed max-w-md text-[#8C7F72]">
                      "Reading is a sacred act of guided dreaming." — A modern digital library for timeless ideas, reviews, and original manuscripts.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 sm:contents">
                    <div>
                      <h3 className="font-display font-bold uppercase tracking-widest text-[10px] sm:text-xs mb-2 sm:mb-3 text-[#C8885B]">Directory</h3>
                      <ul className="space-y-1.5 text-xs font-sans">
                        <li><Link to="/" className="text-[#B3A596] hover:text-[#F5EFE6] transition-colors">Home</Link></li>
                        <li><Link to="/collection" className="text-[#B3A596] hover:text-[#F5EFE6] transition-colors">Collection</Link></li>
                        <li><Link to="/authors" className="text-[#B3A596] hover:text-[#F5EFE6] transition-colors">Authors</Link></li>
                        <li><Link to="/originals" className="text-[#B3A596] hover:text-[#F5EFE6] transition-colors">Originals</Link></li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-display font-bold uppercase tracking-widest text-[10px] sm:text-xs mb-2 sm:mb-3 text-[#C8885B]">Quick Links</h3>
                      <ul className="space-y-1.5 text-xs font-sans">
                        <li><Link to="/#top-picks" className="text-[#B3A596] hover:text-[#F5EFE6] transition-colors">Top Picks</Link></li>
                        <li><Link to="/blog" className="text-[#B3A596] hover:text-[#F5EFE6] transition-colors">Blog</Link></li>
                        <li><Link to="/disclaimer" className="text-[#B3A596] hover:text-[#F5EFE6] transition-colors">Disclaimer</Link></li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-[#2C2722] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[9px] sm:text-xs font-display uppercase tracking-widest text-[#7A6E63]">
                  <div>© {new Date().getFullYear()} Library of Alexander. All rights reserved.</div>
                  <button 
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
                    className="inline-flex items-center gap-1.5 text-[#C8885B] hover:text-[#F5EFE6] transition-colors cursor-pointer"
                  >
                    <span>Back to top</span>
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </footer>
            <ScrollToTopButton />
          </div>
        </NotificationProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}
