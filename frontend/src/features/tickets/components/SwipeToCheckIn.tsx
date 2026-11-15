import React, { useState, useRef, useEffect, useCallback } from 'react';

interface SwipeToCheckInProps {
  onComplete: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  label?: string;
  completeLabel?: string;
}

const SwipeToCheckIn: React.FC<SwipeToCheckInProps> = ({
  onComplete,
  isLoading = false,
  disabled = false,
  label = 'Swipe to Check-in',
  completeLabel = 'Checking in...',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0); // 0 to 1
  const [maxTravel, setMaxTravel] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number>(0);

  // Update dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current && handleRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const handleWidth = handleRef.current.clientWidth;
        setMaxTravel(containerWidth - handleWidth - 12); // 12px for padding/gap
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleStart = (clientX: number) => {
    if (disabled || isLoading) return;
    setIsDragging(true);
    startX.current = clientX;
  };

  const handleMove = useCallback(
    (clientX: number) => {
      if (!isDragging || maxTravel <= 0) return;

      const deltaX = clientX - startX.current;

      let progress = deltaX / maxTravel;
      progress = Math.max(0, Math.min(1, progress));

      setDragProgress(progress);

      if (progress >= 1) {
        setIsDragging(false);
        onComplete();
      }
    },
    [isDragging, maxTravel, onComplete],
  );

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragProgress < 1) {
      setDragProgress(0); // Snap back if not complete
    }
  }, [isDragging, dragProgress]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        handleMove(e.touches[0].clientX);
      }
    };
    const onEnd = () => handleEnd();

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchend', onEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[64px] bg-surface-container-high rounded-full p-1.5 flex items-center shadow-inner overflow-hidden transition-all duration-300 ${
        disabled ? 'opacity-50 grayscale' : 'opacity-100'
      }`}
    >
      {/* Background Track Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none text-center px-12">
        <span
          className={`text-[10px] font-black uppercase tracking-widest transition-opacity duration-300 ${
            dragProgress > 0.5 ? 'opacity-0' : 'opacity-40'
          }`}
        >
          {isLoading ? completeLabel : label}
        </span>
      </div>

      {/* Progress Fill */}
      <div
        className="absolute left-0 top-0 bottom-0 bg-primary opacity-20 pointer-events-none transition-all duration-75"
        style={{ width: `${Math.max(10, dragProgress * 100)}%` }}
      />

      {/* Draggable Handle */}
      <div
        ref={handleRef}
        onMouseDown={(e) => handleStart(e.clientX)}
        onTouchStart={(e) => {
          if (e.touches && e.touches[0]) {
            handleStart(e.touches[0].clientX);
          }
        }}
        className={`relative z-20 h-full aspect-square bg-primary rounded-full flex items-center justify-center text-on-primary shadow-lg cursor-grab active:cursor-grabbing transition-transform duration-75 select-none ${
          isLoading ? 'animate-pulse' : ''
        }`}
        style={{ transform: `translateX(${dragProgress * maxTravel}px)` }}
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"></div>
        ) : (
          <span
            className={`material-symbols-outlined transition-transform duration-300 ${
              dragProgress >= 1 ? 'rotate-360 scale-125' : ''
            }`}
            style={{ fontVariationSettings: "'FILL' 1, 'wght' 700" }}
          >
            {dragProgress >= 1 ? 'check' : 'east'}
          </span>
        )}
      </div>

      {/* Hint Icon at the end */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20 text-on-surface pointer-events-none">
        <span className="material-symbols-outlined animate-bounce-x">
          keyboard_double_arrow_right
        </span>
      </div>
    </div>
  );
};

export default SwipeToCheckIn;
