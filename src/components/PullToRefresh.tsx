import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
}

export function PullToRefresh({ children, onRefresh }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isPulling = useRef(false);

  const MAX_PULL_DISTANCE = 120;
  const REFRESH_THRESHOLD = 70;

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Only allow pull-to-refresh if we are at the very top of the page
      if (window.scrollY <= 0) {
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || isRefreshing) return;

      currentY.current = e.touches[0].clientY;
      const distance = currentY.current - startY.current;

      // If pulling down
      if (distance > 0 && window.scrollY <= 0) {
        // Prevent default scrolling behavior
        if (e.cancelable) {
          e.preventDefault();
        }
        // Add resistance to the pull
        setPullDistance(Math.min(distance * 0.4, MAX_PULL_DISTANCE));
      } else {
        isPulling.current = false;
        setPullDistance(0);
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling.current) return;
      isPulling.current = false;

      if (pullDistance >= REFRESH_THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(REFRESH_THRESHOLD);
        
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
    };

    // Use passive: false for touchmove to allow preventDefault
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, isRefreshing, onRefresh]);

  return (
    <div className="relative w-full h-full">
      <div 
        className="absolute top-0 left-0 w-full flex justify-center items-center overflow-hidden transition-all duration-200 z-50 pointer-events-none"
        style={{ 
          height: `${pullDistance}px`,
          opacity: Math.min(pullDistance / REFRESH_THRESHOLD, 1)
        }}
      >
        <div className="bg-white shadow-md rounded-full p-2 flex items-center justify-center">
          <RefreshCw 
            className={`w-5 h-5 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} 
            style={{ transform: `rotate(${pullDistance * 4}deg)` }}
          />
        </div>
      </div>
      <div 
        className="transition-transform duration-200 h-full"
        style={{ transform: `translateY(${isRefreshing ? REFRESH_THRESHOLD : pullDistance}px)` }}
      >
        {children}
      </div>
    </div>
  );
}
