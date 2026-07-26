import React, { createContext, useContext, useState, ReactNode } from 'react';
import { X, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type NotificationType = 'success' | 'info' | 'error';

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  showNotification: (message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = (message: string, type: NotificationType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-4 z-[10000] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="pointer-events-auto w-full sm:w-auto min-w-0 sm:min-w-[300px] max-w-full sm:max-w-md flex items-center justify-between p-3 sm:p-4 bg-white border border-[#E8E3DC] shadow-lg rounded-lg sm:rounded-none"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
                {n.type === 'success' && <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#C8885B] shrink-0" />}
                {n.type === 'info' && <Info className="w-4 h-4 sm:w-5 sm:h-5 text-[#1A1A1A] shrink-0" />}
                {n.type === 'error' && <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 shrink-0" />}
                <span className="font-[Open_Sans] text-xs sm:text-sm text-[#2D2D2D] truncate">{n.message}</span>
              </div>
              <button onClick={() => removeNotification(n.id)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 shrink-0">
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
