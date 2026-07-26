import React, { useState, useRef, useEffect } from 'react';
import { Share2, Twitter, Facebook, Link as LinkIcon, X, Linkedin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNotification } from '../contexts/NotificationContext';

interface ShareMenuProps {
  title: string;
  url: string;
  description?: string;
  imageUrl?: string;
  author?: string;
  className?: string;
  children?: React.ReactNode;
}

export function ShareMenu({ title, url, description, imageUrl, author, className, children }: ShareMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { showNotification } = useNotification();
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      showNotification('Link copied to clipboard!', 'success');
    } catch (err) {
      console.error('Failed to copy link:', err);
      showNotification('Failed to copy link.', 'error');
    }
  };

  const handleTwitterShare = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent('Check out ' + title)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const handleFacebookShare = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };
  
  const handleLinkedinShare = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
  };

  return (
    <>
      {children ? (
        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(true); }} className={className}>
          {children}
        </div>
      ) : (
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(true); }} 
          className={`p-2 border border-[#EBE3D5] rounded-full hover:bg-gray-50 text-[#C8885B] focus:outline-none transition-colors ${className || ''}`}
          title="Share this"
        >
          <i className="fa-solid fa-share-nodes text-sm"></i>
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-[500px] max-h-[90vh] bg-[#FDFBF7] shadow-2xl overflow-y-auto flex flex-col border border-[#E8E3DC] rounded-lg sm:rounded-none"
            >
              <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-[#E8E3DC] sticky top-0 bg-[#FDFBF7] z-10">
                <h3 className="font-display font-bold text-sm sm:text-lg uppercase tracking-widest text-[#1A1A1A]">Share Preview</h3>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-black transition-colors p-1"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-6 md:p-8">
                {/* Social Media Preview Card */}
                <div className="w-full bg-white border border-[#E8E3DC] rounded-md overflow-hidden mb-6 sm:mb-8 shadow-xs">
                  {imageUrl ? (
                    <div className="w-full h-36 sm:h-48 bg-gray-100 border-b border-[#E8E3DC]">
                      <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-full h-28 sm:h-32 bg-[#1A1A1A] flex items-center justify-center border-b border-[#E8E3DC]">
                      <span className="font-display font-black text-lg sm:text-2xl text-white uppercase tracking-widest opacity-80">Library of Alexander</span>
                    </div>
                  )}
                  <div className="p-3 sm:p-4 bg-[#FAFAFA]">
                    <div className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-0.5 sm:mb-1">{new URL(window.location.href).hostname}</div>
                    <h4 className="font-display font-bold text-[#1A1A1A] text-sm sm:text-lg leading-tight mb-1 line-clamp-2">{title}</h4>
                    {(description || author) && (
                      <p className="font-sans text-xs sm:text-[13px] text-gray-600 line-clamp-2">
                        {description ? description : `By ${author}`}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 sm:gap-4">
                  <button onClick={handleTwitterShare} className="flex flex-col items-center gap-1.5 sm:gap-2 group">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white border border-[#E8E3DC] flex items-center justify-center text-[#1A1A1A] group-hover:border-[#1DA1F2] group-hover:text-[#1DA1F2] transition-colors shadow-xs">
                      <Twitter className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-500">Twitter</span>
                  </button>
                  <button onClick={handleFacebookShare} className="flex flex-col items-center gap-1.5 sm:gap-2 group">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white border border-[#E8E3DC] flex items-center justify-center text-[#1A1A1A] group-hover:border-[#4267B2] group-hover:text-[#4267B2] transition-colors shadow-xs">
                      <Facebook className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-500">Facebook</span>
                  </button>
                  <button onClick={handleLinkedinShare} className="flex flex-col items-center gap-1.5 sm:gap-2 group">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white border border-[#E8E3DC] flex items-center justify-center text-[#1A1A1A] group-hover:border-[#0077b5] group-hover:text-[#0077b5] transition-colors shadow-xs">
                      <Linkedin className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-500">LinkedIn</span>
                  </button>
                  <button onClick={handleCopyLink} className="flex flex-col items-center gap-1.5 sm:gap-2 group">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white border border-[#E8E3DC] flex items-center justify-center text-[#1A1A1A] group-hover:border-[#C8885B] group-hover:text-[#C8885B] transition-colors shadow-xs">
                      <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-500">Copy Link</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
