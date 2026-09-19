import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { notificationService, type NotificationCounts } from '@/api/notificationService';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  counts: NotificationCounts;
  loading: boolean;
  refreshCounts: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [counts, setCounts] = useState<NotificationCounts>({
    unreadNotifications: 0,
    pendingRecommendations: 0,
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const refreshCounts = async () => {
    if (!user || user.role === 'guest') return;
    
    // Only call notification counts API for authorized roles
    const authorizedRoles = ['superadmin', 'leadmentor', 'mentor', 'employee'];
    if (!authorizedRoles.includes(user.role)) return;
    
    try {
      setLoading(true);
      const response = await notificationService.getNotificationCounts();
      if (response.success) {
        setCounts(response.data);
      }
    } catch (error) {
      console.error('Error fetching notification counts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role !== 'guest') {
      refreshCounts();
      
      // Refresh counts every 30 seconds
      const interval = setInterval(refreshCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const value = {
    counts,
    loading,
    refreshCounts,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
