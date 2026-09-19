import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook to detect when an upload completes and the user is on a resources page
 * @param onUploadComplete - Callback function to execute when upload completes
 */
export function useUploadCompletion(onUploadComplete: () => void) {
  const location = useLocation();

  useEffect(() => {
    const handleUploadCompleted = () => {
      // Check if user is on a resources page
      const isOnResourcesPage = location.pathname.includes('/resources') && 
        !location.pathname.includes('/add') && 
        !location.pathname.includes('/edit') &&
        !location.pathname.includes('/view');
      
      if (isOnResourcesPage) {
        onUploadComplete();
      }
    };

    // Listen for upload completion events
    window.addEventListener('uploadCompleted', handleUploadCompleted);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('uploadCompleted', handleUploadCompleted);
    };
  }, [location.pathname, onUploadComplete]);
}
