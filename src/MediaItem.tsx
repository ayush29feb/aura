import { useRef, useEffect, useState } from 'react';
import './MediaItem.css';
import { MediaItem as MediaItemType } from './types';
import { fetchAuthenticatedImage } from './services/mediaService';

interface MediaItemProps {
  item: MediaItemType;
  isActive: boolean;
}

function MediaItem({ item, isActive }: MediaItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageLoading, setImageLoading] = useState(true);

  // Fetch authenticated image for image types
  useEffect(() => {
    let blobUrl: string | null = null;

    const loadImage = async () => {
      if (item.type === 'image') {
        setImageLoading(true);
        try {
          // Check if URL is from Supabase storage (user images)
          const isSupabaseStorage = item.url.includes('supabase.co/storage');

          if (isSupabaseStorage) {
            // Fetch with authentication
            const authenticatedUrl = await fetchAuthenticatedImage(item.url);
            blobUrl = authenticatedUrl;
            setImageSrc(authenticatedUrl);
          } else {
            // External URL (like A&F products), use directly
            setImageSrc(item.url);
          }
        } catch (error) {
          console.error('Error loading image:', error);
          // Fallback to original URL
          setImageSrc(item.url);
        } finally {
          setImageLoading(false);
        }
      }
    };

    loadImage();

    // Cleanup blob URL on unmount
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [item.url, item.type]);

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
        <>
          {imageLoading && (
            <div className="media-content loading-placeholder">
              <div className="spinner"></div>
            </div>
          )}
          {imageSrc && (
            <img
              src={imageSrc}
              alt={`Media ${item.id}`}
              className="media-content"
              style={{ display: imageLoading ? 'none' : 'block' }}
            />
          )}
        </>
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
