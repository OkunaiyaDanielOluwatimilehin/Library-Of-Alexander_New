import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchEntries } from '../api';
import { BlogPost } from '../types';
import { getImageUrl, contentToMarkdown, getPostCategories } from '../utils';
import { ChevronLeft, Calendar, User, Heart, X, Newspaper, ArrowRight, Search, BookOpen, Clock, Twitter, Linkedin, Facebook, Share2, Link2, Check } from 'lucide-react';
import Markdown from 'react-markdown';
import { ShareMenu } from '../components/ShareMenu';
import { format } from 'date-fns';
import { Comments } from '../components/Comments';
import useReactions from '../hooks/useReactions';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';

export default function BlogPostPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReactionHovered, setIsReactionHovered] = useState(false);
  const [hoveredReactionType, setHoveredReactionType] = useState<string | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [isMoreModalOpen, setIsMoreModalOpen] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const contentKey = post ? `blog_${post.sys.id}` : '';
  const { reactions, userReaction, react } = useReactions(contentKey);

  const handleReact = (type: string) => {
    react(type);
  };

  const emojiMap: Record<string, string> = {
    like: '👍',
    love: '❤️',
    fire: '🔥',
    clap: '👏'
  };

  useEffect(() => {
    async function loadPostAndRelated() {
      if (!slug) return;
      try {
        setLoading(true);
        let results = await fetchEntries<BlogPost>('blogPost', { 'fields.slug': slug, limit: 1, include: 5 });
        if (!results || results.length === 0) {
          results = await fetchEntries<BlogPost>('blogPost', { 'sys.id': slug, limit: 1, include: 5 });
        }
        if (results && results.length > 0) {
          const current = results[0];
          setPost(current);

          // Fetch related posts
          const allPosts = await fetchEntries<BlogPost>('blogPost', { limit: 15, include: 5 });
          if (allPosts && allPosts.length > 0) {
            const filtered = allPosts.filter(p => p.sys.id !== current.sys.id && p.fields.slug !== slug);
            setRelatedPosts(filtered);
          }
        }
      } catch (e) {
        console.error("Failed to load blog post", e);
      } finally {
        setLoading(false);
      }
    }
    loadPostAndRelated();
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#C8885B] border-t-transparent rounded-full animate-spin mb-4"></div>
          <span className="font-display font-bold text-[10px] uppercase tracking-widest text-gray-400">Loading Article</span>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-display font-black text-black uppercase mb-4">Article Not Found</h1>
        <p className="text-gray-600 font-sans mb-8">The article you are looking for does not exist or has been removed.</p>
        <button onClick={() => navigate('/blog')} className="bg-[#C8885B] text-white px-6 py-3 font-display font-bold text-xs uppercase tracking-widest hover:bg-black transition-colors">
          Return to Blog
        </button>
      </div>
    );
  }

  // @ts-ignore
  const coverUrl = getImageUrl(post.fields.coverImage || post.fields.imageUrl);
  const cat = post.fields.category;
  const displayCat = Array.isArray(cat) && cat.length > 0 ? String(cat[0]) : typeof cat === 'string' ? cat : 'GENERAL';

  // Calculate estimated reading time based on content length
  const contentText = String(post.fields.content || '');
  const wordCount = contentText.trim().split(/\s+/).filter(Boolean).length;
  const estimatedMin = Math.max(1, Math.ceil(wordCount / 200));
  const readTimeDisplay = post.fields.readTime || `${estimatedMin} min read`;

  const filteredModalPosts = relatedPosts.filter(p => {
    if (!modalSearchQuery.trim()) return true;
    const q = modalSearchQuery.toLowerCase();
    const title = (p.fields.title || '').toLowerCase();
    const summary = (p.fields.summary || p.fields.excerpt || '').toLowerCase();
    const author = (p.fields.author || '').toLowerCase();
    return title.includes(q) || summary.includes(q) || author.includes(q);
  });

  const shareDescription = String(post.fields.summary || post.fields.excerpt || contentText.substring(0, 160));

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-16 sm:pb-24">
      <Helmet>
        <title>{`${post.fields.title} | Library of Alexander`}</title>
        <meta name="description" content={shareDescription} />
        <meta property="og:title" content={String(post.fields.title)} />
        <meta property="og:description" content={shareDescription} />
        {coverUrl && <meta property="og:image" content={coverUrl} />}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={window.location.href} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={String(post.fields.title)} />
        <meta name="twitter:description" content={shareDescription} />
        {coverUrl && <meta name="twitter:image" content={coverUrl} />}
      </Helmet>

      {/* Header */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 pt-6 sm:pt-12 pb-4 sm:pb-8 flex items-center justify-between gap-4">
        <button onClick={() => navigate('/blog')} className="inline-flex items-center text-[#C8885B] font-display font-bold text-[10px] uppercase tracking-widest hover:text-[#A66F47] transition-colors group">
          <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          BACK TO BLOG
        </button>
        <ShareMenu 
          title={String(post.fields.title)} 
          url={window.location.href} 
          author={post.fields.author ? String(post.fields.author) : undefined}
          description={post.fields.content ? String(post.fields.content).substring(0, 150) + '...' : undefined}
          imageUrl={coverUrl || undefined}
        />
      </div>

      {/* Featured Banner */}
      {coverUrl && (
        <div className="w-full max-w-[1920px] mx-auto relative h-[220px] sm:h-[360px] md:h-[480px] mb-6 sm:mb-12 overflow-hidden bg-gray-100">
          <img src={coverUrl} alt={post.fields.title} className="w-full h-full object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
      )}

      {/* Article Container */}
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-12 lg:px-32 xl:px-64">
        <div className="pt-4 sm:pt-8 mb-8 sm:mb-12 max-w-4xl mx-auto">
          {/* Category Tags */}
          {(() => {
            const categories = getPostCategories(post);
            if (categories.length === 0) return null;

            return (
              <div className="flex flex-wrap gap-2 mb-4">
                {categories.map((cat, idx) => (
                  <Link
                    key={idx}
                    to={`/blog?category=${encodeURIComponent(cat)}`}
                    className="bg-[#1A1A1A] hover:bg-[#C8885B] text-white font-display font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-xs transition-colors"
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            );
          })()}

          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-black text-[#1A1A1A] uppercase tracking-tight leading-tight sm:leading-tight mb-6 sm:mb-8">
            {post.fields.title}
          </h1>
          
          <div className="flex flex-row items-center justify-between gap-4 w-full font-sans text-xs sm:text-sm text-[#4A4A4A] border-y border-gray-200/80 py-3 sm:py-4">
            <div className="flex flex-wrap items-center gap-4 sm:gap-8">
              {post.fields.author && (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C8885B]" />
                  <span className="font-medium tracking-wide">{post.fields.author}</span>
                </div>
              )}
              {post.fields.date && (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C8885B]" />
                  <span className="font-medium tracking-wide">{format(new Date(post.fields.date), 'MMMM d, yyyy')}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C8885B]" />
                <span className="font-medium tracking-wide">{readTimeDisplay}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="prose markdown-body max-w-4xl mx-auto text-[#2D2723]">
          <Markdown>
            {contentToMarkdown(post.fields.content)}
          </Markdown>
        </div>

        {/* Social Media Share Section */}
        <div className="mt-12 sm:mt-16 pt-8 border-t border-[#E8E3DC] max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center shrink-0">
              <Share2 className="w-3.5 h-3.5 text-[#F4A62A]" />
            </div>
            <div>
              <p className="font-display font-black text-xs uppercase tracking-wider text-[#1A1A1A]">
                SHARE ARTICLE
              </p>
              <p className="font-mono text-[10px] text-gray-500 uppercase">
                SPREAD THE KNOWLEDGE
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
            <button
              onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.fields.title)}&url=${encodeURIComponent(window.location.href)}`, '_blank')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 bg-[#FDFBF7] border border-[#E8E3DC] hover:border-[#1DA1F2] hover:bg-[#1DA1F2]/5 text-[#1A1A1A] hover:text-[#1DA1F2] text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer shadow-2xs"
              title="Share on Twitter"
            >
              <Twitter className="w-3.5 h-3.5 text-[#1DA1F2]" />
              <span>TWITTER</span>
            </button>

            <button
              onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 bg-[#FDFBF7] border border-[#E8E3DC] hover:border-[#0077b5] hover:bg-[#0077b5]/5 text-[#1A1A1A] hover:text-[#0077b5] text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer shadow-2xs"
              title="Share on LinkedIn"
            >
              <Linkedin className="w-3.5 h-3.5 text-[#0077b5]" />
              <span>LINKEDIN</span>
            </button>

            <button
              onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 bg-[#FDFBF7] border border-[#E8E3DC] hover:border-[#4267B2] hover:bg-[#4267B2]/5 text-[#1A1A1A] hover:text-[#4267B2] text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer shadow-2xs"
              title="Share on Facebook"
            >
              <Facebook className="w-3.5 h-3.5 text-[#4267B2]" />
              <span>FACEBOOK</span>
            </button>

            <button
              onClick={handleCopyLink}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 border text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer shadow-2xs ${
                copiedLink
                  ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                  : 'bg-[#FDFBF7] border-[#E8E3DC] text-[#1A1A1A] hover:border-[#C8885B] hover:text-[#C8885B]'
              }`}
              title="Copy Article Link"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#F4A62A]" />
                  <span>COPIED!</span>
                </>
              ) : (
                <>
                  <Link2 className="w-3.5 h-3.5 text-[#C8885B]" />
                  <span>LINK</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Reactions */}
        <div className="mt-12 sm:mt-16 border-t border-[#EBE3D5] pt-8 sm:pt-12 max-w-4xl mx-auto">
          <div className="flex flex-col gap-4 w-full">
            <span className="text-[#C8885B] font-display font-black text-xs sm:text-sm uppercase tracking-widest text-left">REACTIONS</span>
            <div className="flex justify-center sm:justify-start w-full">
              <div 
                className="relative flex items-center justify-start h-14 sm:h-16 transition-all duration-300 ease-out" 
                style={{ 
                  width: isReactionHovered 
                    ? "212px" 
                    : (userReaction ? "48px" : "96px") 
                }}
                onMouseEnter={() => setIsReactionHovered(true)}
                onMouseLeave={() => {
                  setIsReactionHovered(false);
                  setHoveredReactionType(null);
                }}
                onClick={() => setIsReactionHovered(prev => !prev)}
              >
                {(['like', 'love', 'fire', 'clap'] as const).map((type, index) => {
                  const isSelected = userReaction === type;
                  let animateX = 0;
                  let animateScale = 1;
                  let animateOpacity = 1;
                  let pointerEvents: "auto" | "none" = "auto";

                  if (isReactionHovered) {
                    animateX = index * 52;
                    animateScale = hoveredReactionType === type ? 1.35 : 1.0;
                    animateOpacity = 1;
                  } else {
                    if (!userReaction) {
                      animateX = index * 16;
                      animateScale = 1.0;
                      animateOpacity = 0.5 + (index * 0.12);
                    } else {
                      if (isSelected) {
                        animateX = 0;
                        animateScale = 1.15;
                        animateOpacity = 1;
                      } else {
                        animateX = 0;
                        animateScale = 0.5;
                        animateOpacity = 0;
                        pointerEvents = "none";
                      }
                    }
                  }

                  return (
                    <motion.button
                      key={type}
                      type="button"
                      style={{ pointerEvents, originX: 0.5, originY: 0.5 }}
                      animate={{ x: animateX, scale: animateScale, opacity: animateOpacity }}
                      transition={{ type: "spring", stiffness: 320, damping: 24 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReact(type);
                      }}
                      onMouseEnter={() => setHoveredReactionType(type)}
                      className={`absolute left-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl sm:text-2xl cursor-pointer bg-white border shadow-xs transition-colors duration-150 select-none ${
                        isSelected 
                          ? "border-[#C8885B] bg-[#FDFBF7] shadow-md z-20" 
                          : "border-gray-200 hover:border-gray-300 z-10"
                      }`}
                      title={type}
                    >
                      <span className="relative z-10">{emojiMap[type]}</span>
                      {isSelected && (
                        <span className="absolute -top-1 -right-1 bg-[#C8885B] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                          {reactions[type as keyof typeof reactions] || 1}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="mt-6 sm:mt-8 max-w-4xl mx-auto">
          <Comments content_key={contentKey} />
        </div>

        {/* Related Articles Inline Grid */}
        {relatedPosts.length > 0 && (
          <div className="mt-12 sm:mt-16 pt-8 sm:pt-12 border-t border-[#EBE3D5] max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-black text-lg sm:text-xl text-[#1A1A1A] uppercase tracking-wide">
                RELATED ARTICLES
              </h3>
              <button
                onClick={() => setIsMoreModalOpen(true)}
                className="text-[#C8885B] hover:text-[#a66e47] font-display font-bold text-xs uppercase tracking-widest inline-flex items-center gap-1 transition-colors"
              >
                VIEW ALL ({relatedPosts.length}) <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-6">
              {relatedPosts.slice(0, 3).map((relPost) => {
                // @ts-ignore
                const relCoverUrl = getImageUrl(relPost.fields.coverImage || relPost.fields.imageUrl);
                const relSlug = relPost.fields.slug || relPost.sys.id;
                const relCat = relPost.fields.category;
                const relDisplayCat = Array.isArray(relCat) && relCat.length > 0 ? String(relCat[0]) : typeof relCat === 'string' ? relCat : 'GENERAL';

                return (
                  <div
                    key={relPost.sys.id}
                    onClick={() => {
                      navigate(`/blog/${relSlug}`);
                    }}
                    className="bg-[#F7F4F0] border border-[#E8E3DC] hover:border-[#C8885B]/50 transition-all cursor-pointer group flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md"
                  >
                    <div>
                      <div className="w-full h-28 sm:h-40 overflow-hidden bg-gray-200 relative">
                        {relCoverUrl ? (
                          <img
                            src={relCoverUrl}
                            alt={relPost.fields.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 opacity-40" />
                          </div>
                        )}
                        <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-[#1A1A1A]/80 text-white font-display font-bold text-[8px] sm:text-[9px] uppercase tracking-wider px-1.5 sm:px-2 py-0.5 backdrop-blur-xs">
                          {relDisplayCat}
                        </span>
                      </div>

                      <div className="p-2.5 sm:p-4">
                        <h4 className="font-display font-black text-xs sm:text-sm uppercase text-[#1A1A1A] line-clamp-2 leading-tight mb-1 sm:mb-2 group-hover:text-[#C8885B] transition-colors">
                          {relPost.fields.title}
                        </h4>
                        {(relPost.fields.summary || relPost.fields.excerpt) && (
                          <p className="hidden sm:block font-[Open_Sans] text-xs text-gray-600 line-clamp-2 leading-relaxed mb-3">
                            {relPost.fields.summary || relPost.fields.excerpt}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5 sm:p-4 pt-0">
                      <div className="pt-1.5 sm:pt-2 border-t border-gray-200/60 flex items-center justify-between text-[9px] sm:text-[10px] text-gray-500 font-mono">
                        <span className="truncate max-w-[80px] sm:max-w-none">{relPost.fields.author || 'EDITORIAL'}</span>
                        <span className="text-[#C8885B] font-bold group-hover:translate-x-0.5 transition-transform shrink-0">READ →</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-[#EBE3D5] max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/blog')} className="text-[#C8885B] font-display font-bold text-xs uppercase tracking-widest hover:text-[#1A1A1A] transition-colors flex items-center">
            <ChevronLeft className="w-4 h-4 mr-1" />
            BACK TO ALL BLOGS
          </button>

          <button
            onClick={() => setIsMoreModalOpen(true)}
            className="bg-[#C8885B] text-white hover:bg-[#a66e47] font-display font-bold text-xs uppercase tracking-widest py-2.5 px-5 transition-colors flex items-center gap-2"
          >
            <Newspaper className="w-4 h-4" />
            MORE ARTICLES
          </button>
        </div>
      </div>

      {/* More Articles Modal */}
      <AnimatePresence>
        {isMoreModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreModalOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-4xl bg-[#FDFBF7] border border-[#E8E3DC] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh] my-auto"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-6 bg-[#1A1A1A] text-white flex items-center justify-between border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#C8885B]/20 border border-[#C8885B]/40 rounded-lg">
                    <Newspaper className="w-5 h-5 text-[#C8885B]" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-base sm:text-xl uppercase tracking-wider text-white">
                      EXPLORE MORE ARTICLES
                    </h3>
                    <p className="font-[Open_Sans] text-xs text-gray-400">
                      Discover reviews, essays, and literary commentary from the library
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsMoreModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Filter Bar */}
              <div className="p-4 bg-[#F7F4F0] border-b border-[#E8E3DC] flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={modalSearchQuery}
                    onChange={(e) => setModalSearchQuery(e.target.value)}
                    placeholder="Search articles by title, author, or keyword..."
                    className="w-full pl-9 pr-4 py-2 bg-white border border-[#E8E3DC] text-xs font-sans text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#C8885B]"
                  />
                  {modalSearchQuery && (
                    <button
                      onClick={() => setModalSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <span className="text-[11px] font-mono font-bold text-gray-500 uppercase tracking-wider hidden sm:inline-block">
                  {filteredModalPosts.length} ARTICLES
                </span>
              </div>

              {/* Articles Grid Container */}
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
                {filteredModalPosts.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30 text-gray-400" />
                    <p className="font-display font-bold text-sm uppercase">No articles match your search</p>
                    <p className="text-xs font-sans mt-1">Try searching with different terms</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4">
                    {filteredModalPosts.map((mPost) => {
                      // @ts-ignore
                      const mCoverUrl = getImageUrl(mPost.fields.coverImage || mPost.fields.imageUrl);
                      const mSlug = mPost.fields.slug || mPost.sys.id;
                      const mCat = mPost.fields.category;
                      const mDisplayCat = Array.isArray(mCat) && mCat.length > 0 ? String(mCat[0]) : typeof mCat === 'string' ? mCat : 'GENERAL';

                      return (
                        <div
                          key={mPost.sys.id}
                          onClick={() => {
                            setIsMoreModalOpen(false);
                            navigate(`/blog/${mSlug}`);
                          }}
                          className="bg-white border border-[#E8E3DC] hover:border-[#C8885B] p-2.5 sm:p-3 transition-all cursor-pointer group flex flex-col justify-between shadow-xs hover:shadow-md"
                        >
                          <div>
                            <div className="w-full h-24 sm:h-32 shrink-0 overflow-hidden bg-gray-100 mb-2 sm:mb-3 relative">
                              {mCoverUrl ? (
                                <img
                                  src={mCoverUrl}
                                  alt={mPost.fields.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                  <BookOpen className="w-6 h-6 opacity-30" />
                                </div>
                              )}
                              <span className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-[#1A1A1A]/80 text-white font-display font-bold text-[7px] sm:text-[8px] uppercase tracking-wider px-1.5 sm:px-2 py-0.5">
                                {mDisplayCat}
                              </span>
                            </div>

                            <div>
                              <h4 className="font-display font-black text-xs uppercase text-[#1A1A1A] line-clamp-2 leading-snug mb-1 group-hover:text-[#C8885B] transition-colors">
                                {mPost.fields.title}
                              </h4>

                              {(mPost.fields.summary || mPost.fields.excerpt) && (
                                <p className="hidden sm:block font-[Open_Sans] text-[11px] text-gray-500 line-clamp-2 leading-relaxed mb-3">
                                  {mPost.fields.summary || mPost.fields.excerpt}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="pt-1.5 sm:pt-2 border-t border-gray-100 flex items-center justify-between text-[8px] sm:text-[9px] text-gray-400 font-mono uppercase mt-2">
                            <span className="truncate max-w-[70px] sm:max-w-none">{mPost.fields.author || 'LIBRARY'}</span>
                            <span className="text-[#C8885B] font-bold group-hover:translate-x-1 transition-transform shrink-0">READ →</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-[#F7F4F0] border-t border-[#E8E3DC] flex items-center justify-between">
                <button
                  onClick={() => {
                    setIsMoreModalOpen(false);
                    navigate('/blog');
                  }}
                  className="text-xs font-display font-bold uppercase tracking-widest text-gray-600 hover:text-black transition-colors"
                >
                  GO TO MAIN BLOG DIRECTORY
                </button>
                <button
                  onClick={() => setIsMoreModalOpen(false)}
                  className="bg-[#1A1A1A] text-white hover:bg-gray-800 font-display font-bold text-xs uppercase tracking-widest py-2 px-5 transition-colors"
                >
                  CLOSE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
