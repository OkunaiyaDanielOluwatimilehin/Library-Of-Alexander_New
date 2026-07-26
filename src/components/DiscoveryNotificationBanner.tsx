import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Check, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function DiscoveryNotificationBanner() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [subscribed, setSubscribed] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isSub = localStorage.getItem('discovery_notifications_enabled') === 'true';
      setSubscribed(isSub);
      const dismissedSession = sessionStorage.getItem('discovery_banner_dismissed') === 'true';
      if (dismissedSession) setIsDismissed(true);
    }
  }, []);

  const requestNotificationPermission = async () => {
    localStorage.setItem('discovery_notifications_enabled', 'true');
    setSubscribed(true);

    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const result = await Notification.requestPermission();
        setPermission(result);

        if (result === 'granted') {
          new Notification('🔔 Discovery Book Alerts Active!', {
            body: 'You will now receive instant notifications when new handpicked discovery titles are added!',
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
      localStorage.setItem('discovery_notifications_enabled', 'false');
      setSubscribed(false);
    } else {
      requestNotificationPermission();
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('discovery_banner_dismissed', 'true');
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
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-[#1e0718] text-white p-4 sm:p-5 rounded-2xl shadow-2xl border border-[#7A1D65]/50 backdrop-blur-md"
      >
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-white/50 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          title="Close slider"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5 pr-6">
          <div className="p-2.5 bg-amber-400/10 border border-amber-400/20 rounded-xl flex-shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 className="font-display font-bold text-xs sm:text-sm uppercase tracking-wide text-white">
                Discovery Book Alerts
              </h4>
              {subscribed && (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                  <Check className="w-2.5 h-2.5" /> ACTIVE
                </span>
              )}
            </div>
            <p className="text-xs text-purple-200/90 leading-relaxed">
              Get browser notifications whenever new curated discovery titles drop!
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
          <span className="text-[10px] text-white/50 font-mono uppercase tracking-wider">
            {subscribed ? 'Subscribed' : 'Browser Alert'}
          </span>
          <button
            onClick={toggleSubscription}
            className={`px-4 py-2 rounded-xl text-xs font-display font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm ${
              subscribed
                ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                : 'bg-amber-400 text-black hover:bg-amber-300 shadow-amber-400/20 hover:scale-[1.02]'
            }`}
          >
            {subscribed ? (
              <>
                <BellOff className="w-3.5 h-3.5" /> Mute Alerts
              </>
            ) : (
              <>
                <Bell className="w-3.5 h-3.5" /> Enable Notifications
              </>
            )}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
