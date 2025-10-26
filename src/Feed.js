import React, { useState, useRef, useEffect } from 'react';
import MediaItem from './MediaItem';
import './Feed.css';

function Feed({ media }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [touchOffset, setTouchOffset] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const containerRef = useRef(null);
  const prefetchedIndices = useRef(new Set());

  // Minimum swipe distance (in px) to trigger a swipe
  const minSwipeDistance = 50;

  const handleTouchStart = (e) => {
    setTouchEnd(0);
    setTouchOffset(0);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e) => {
    const currentTouch = e.targetTouches[0].clientY;
    setTouchEnd(currentTouch);

    // Calculate offset for real-time feedback
    if (touchStart) {
      const offset = currentTouch - touchStart;
      setTouchOffset(offset);
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isSwipeUp = distance > minSwipeDistance;
    const isSwipeDown = distance < -minSwipeDistance;

    if (isSwipeUp && currentIndex < media.length - 1 && !transitioning) {
      // Swipe up - next item
      setTransitioning(true);
      setCurrentIndex(prev => prev + 1);
      setTimeout(() => setTransitioning(false), 300);
    } else if (isSwipeDown && currentIndex > 0 && !transitioning) {
      // Swipe down - previous item
      setTransitioning(true);
      setCurrentIndex(prev => prev - 1);
      setTimeout(() => setTransitioning(false), 300);
    }

    // Reset offset
    setTouchOffset(0);
  };

  // Preload next and previous videos
  useEffect(() => {
    const preloadIndices = [currentIndex - 1, currentIndex + 1];
    preloadIndices.forEach(index => {
      if (index >= 0 && index < media.length && media[index].type === 'video') {
        const video = document.createElement('video');
        video.src = media[index].url;
        video.preload = 'metadata';
      }
    });
  }, [currentIndex, media]);

  // Prefetch next N=10 images for smoother scrolling
  useEffect(() => {
    const prefetchCount = 10;

    for (let i = currentIndex; i < Math.min(currentIndex + prefetchCount, media.length); i++) {
      // Only prefetch if not already prefetched and is an image
      if (!prefetchedIndices.current.has(i) && media[i] && media[i].type === 'image') {
        const img = new Image();
        img.src = media[i].url;
        prefetchedIndices.current.add(i);
      }
    }
  }, [currentIndex, media]);

  // Calculate transform based on current index and touch offset
  const getTransform = () => {
    const baseTransform = -currentIndex * 100;
    const offsetPercent = (touchOffset / window.innerHeight) * 100;
    return baseTransform + offsetPercent;
  };

  // Render adjacent items for smooth transitions
  const renderItems = () => {
    const items = [];
    const indicesToRender = [currentIndex - 1, currentIndex, currentIndex + 1];

    indicesToRender.forEach(index => {
      if (index >= 0 && index < media.length) {
        items.push(
          <div
            key={media[index].id}
            style={{
              position: 'absolute',
              top: `${index * 100}vh`,
              left: 0,
              width: '100%',
              height: '100vh'
            }}
          >
            <MediaItem
              item={media[index]}
              isActive={index === currentIndex}
            />
          </div>
        );
      }
    });

    return items;
  };

  return (
    <div
      className="feed-container"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="feed-wrapper"
        style={{
          transform: `translateY(${getTransform()}vh)`,
          transition: transitioning || touchOffset === 0 ? 'transform 0.3s ease-out' : 'none'
        }}
      >
        {renderItems()}
      </div>
    </div>
  );
}

export default Feed;
