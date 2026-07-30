import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Check, Newspaper, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function BlogNotificationBanner() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [subscribed, setSubscribed] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isSub = localStorage.getItem('blog_notifications_enabled') === 'true';
      setSubscribed(isSub);
      const dismissedSession = sessionStorage.getItem('blog_banner_dismissed') === 'true';
      if (dismissedSession) setIsDismissed(true);
    }
  }, []);

  const requestNotificationPermission = async () => {
    localStorage.setItem('blog_notifications_enabled', 'true');
    setSubscribed(true);

    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const result = await Notification.requestPermission();
        setPermission(result);

        if (result === 'granted') {
          new Notification('📰 Blog Post Alerts Active!', {
            body: 'You will receive instant alerts when new blog articles and book reviews drop!',
            icon: '/favicon.ico',
          });
        }
      } catch (e) {
        console.warn('Browser notification request constrained by frame', e);
      }
    }
  };

  const toggleSubscription = () => {
    if (subscribed) {
      localStorage.setItem('blog_notifications_enabled', 'false');
      setSubscribed(false);
    } else {
      requestNotificationPermission();
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('blog_banner_dismissed', 'true');
    }
  };

  if (typeof window === 'undefined' || !('Notification' in window) || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 80, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-[#1A1A1A] text-white p-4 sm:p-5 rounded-2xl shadow-2xl border border-gray-800 backdrop-blur-md"
      >
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-white/50 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          title="Close slider"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5 pr-6">
          <div className="p-2.5 bg-[#C8885B]/20 border border-[#C8885B]/40 rounded-xl flex-shrink-0 mt-0.5">
            <Newspaper className="w-5 h-5 text-[#C8885B] animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 className="font-display font-bold text-xs sm:text-sm uppercase tracking-wide text-white">
                Latest Blog Alerts
              </h4>
              {subscribed && (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                  <Check className="w-2.5 h-2.5" /> ACTIVE
                </span>
              )}
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Get browser notifications whenever new blog entries, reviews, and literary news drop!
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
          <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">
            {subscribed ? 'Subscribed' : 'Blog Entry Alert'}
          </span>
          <button
            onClick={toggleSubscription}
            className={`px-4 py-2 rounded-xl text-xs font-display font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm ${
              subscribed
                ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                : 'bg-[#C8885B] text-white hover:bg-[#b07449] shadow-[#C8885B]/20 hover:scale-[1.02]'
            }`}
          >
            {subscribed ? (
              <>
                <BellOff className="w-3.5 h-3.5" /> Mute Alerts
              </>
            ) : (
              <>
                <Bell className="w-3.5 h-3.5" /> Enable Alerts
              </>
            )}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
