import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchEntries } from '../api';
import { BlogPost } from '../types';
import { getImageUrl } from '../utils';
import { ChevronLeft, Calendar, User, Heart } from 'lucide-react';
import Markdown from 'react-markdown';
import { ShareMenu } from '../components/ShareMenu';
import { format } from 'date-fns';
import { Comments } from '../components/Comments';
import useReactions from '../hooks/useReactions';
import { motion } from 'framer-motion';

export default function BlogPostPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReactionHovered, setIsReactionHovered] = useState(false);
  const [hoveredReactionType, setHoveredReactionType] = useState<string | null>(null);

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
    async function loadPost() {
      if (!slug) return;
      try {
        let results = await fetchEntries<BlogPost>('blogPost', { 'fields.slug': slug, limit: 1 });
        if (!results || results.length === 0) {
          results = await fetchEntries<BlogPost>('blogPost', { 'sys.id': slug, limit: 1 });
        }
        if (results && results.length > 0) {
          setPost(results[0]);
        }
      } catch (e) {
        console.error("Failed to load blog post", e);
      } finally {
        setLoading(false);
      }
    }
    loadPost();
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


  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-16 sm:pb-24">
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
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-neutral sm:prose-lg md:prose-xl prose-headings:font-display prose-headings:font-bold prose-headings:uppercase prose-headings:tracking-tight prose-a:text-[#C8885B] prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl max-w-4xl mx-auto text-[#2B2B2B] font-sans prose-p:text-base sm:prose-p:text-lg md:prose-p:text-xl prose-p:leading-relaxed sm:prose-p:leading-loose [&_p]:mb-8 sm:[&_p]:mb-12 [&_p]:mt-2 [&_p]:text-base sm:[&_p]:text-lg md:[&_p]:text-xl [&_p]:leading-relaxed sm:[&_p]:leading-loose">
          <Markdown>
            {String(post.fields.content || '')}
          </Markdown>
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

        {/* Footer */}
        <div className="mt-12 sm:mt-16 pt-8 sm:pt-12 border-t border-[#EBE3D5] max-w-4xl mx-auto">
          <button onClick={() => navigate('/blog')} className="text-[#C8885B] font-display font-bold text-xs uppercase tracking-widest hover:text-[#1A1A1A] transition-colors flex items-center">
            <ChevronLeft className="w-4 h-4 mr-1" />
            More Articles
          </button>
        </div>
      </div>
    </div>
  );
}
