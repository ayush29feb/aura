import React, { useRef, useEffect, useState } from 'react';
import './MediaItem.css';
import { MediaItem as MediaItemType } from './types';

interface MediaItemProps {
  item: MediaItemType;
  isActive: boolean;
}

function MediaItem({ item, isActive }: MediaItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const video = videoRef.current;

    if (item.type === 'video' && video) {
      if (isActive) {
        // Play video when it becomes active
        video.play().catch((err: unknown) => {
          console.log('Autoplay prevented:', err);
          // If autoplay fails, it's usually due to browser policy
          // The user will need to interact with the page first
        });
      } else {
        // Pause and reset when not active
        video.pause();
        video.currentTime = 0;
      }
    }
  }, [isActive, item.type]);

  const handleVideoClick = () => {
    if (item.type === 'video' && videoRef.current) {
      if (isPaused) {
        videoRef.current.play();
        setIsPaused(false);
      } else {
        videoRef.current.pause();
        setIsPaused(true);
      }
    }
  };

  return (
    <div className="media-item">
      {item.type === 'video' ? (
        <video
          ref={videoRef}
          src={item.url}
          className="media-content"
          loop
          playsInline
          muted
          onClick={handleVideoClick}
          poster={item.thumbnail}
        />
      ) : (
        <img
          src={item.url}
          alt={`Media ${item.id}`}
          className="media-content"
        />
      )}

      {item.type === 'video' && isPaused && (
        <div className="play-pause-indicator">
          <div className="pause-icon">❚❚</div>
        </div>
      )}
    </div>
  );
}

export default MediaItem;
