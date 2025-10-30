import { useState, useEffect } from 'react';
import './App.css';
import Feed from './Feed';
import { MediaItem, FeedMode } from './types';
import { onAuthStateChange, ensureUserProfile } from './services/authService';
import { fetchProducts, fetchUserMedia } from './services/mediaService';
import AuthButton from './components/AuthButton';
import UploadButton from './components/UploadButton';
import type { User } from '@supabase/supabase-js';

function App() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedMode, setFeedMode] = useState<FeedMode>('afProducts'); // 'afProducts' or 'myPhotos'
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    const { data: authListener } = onAuthStateChange(async (currentUser) => {
      if (currentUser) {
        // Ensure user profile exists in the users table
        const { error } = await ensureUserProfile(currentUser);
        if (error) {
          console.error('Failed to create user profile:', error);
        }
      }
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Load media based on feed mode
  useEffect(() => {
    // Fisher-Yates shuffle algorithm
    const shuffleArray = (array: MediaItem[]): MediaItem[] => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    const loadMedia = async () => {
      setLoading(true);

      try {
        let data: MediaItem[];

        if (feedMode === 'afProducts') {
          // A&F products - public access
          data = await fetchProducts();
          // Filter to only include products with model1 images
          data = data.filter(item => item.images && item.images.model1);
        } else {
          // User photos - requires authentication
          if (!user) {
            // If not authenticated, show empty or prompt to login
            setMedia([]);
            setLoading(false);
            return;
          }
          data = await fetchUserMedia(user.id);
        }

        setMedia(shuffleArray(data));
      } catch (error) {
        console.error('Error loading media:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      loadMedia();
    }
  }, [feedMode, user, authLoading]);

  const handleUploadComplete = () => {
    // Reload user media after upload
    if (user && feedMode === 'myPhotos') {
      fetchUserMedia(user.id).then(data => {
        setMedia(data);
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  // Show login prompt for My Photos when not authenticated
  if (feedMode === 'myPhotos' && !user) {
    return (
      <div className="App">
        <div className="feed-toggle">
          <button
            className="toggle-btn"
            onClick={() => setFeedMode('afProducts')}
          >
            A&F
          </button>
          <button
            className="toggle-btn active"
            onClick={() => setFeedMode('myPhotos')}
          >
            My Photos
          </button>
        </div>
        <div className="header">
          <AuthButton user={user} />
        </div>
        <div className="login-prompt">
          <h2>Sign in to view your photos</h2>
          <p>Sign in to upload and view your personal photo collection</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="feed-toggle">
        <button
          className={`toggle-btn ${feedMode === 'afProducts' ? 'active' : ''}`}
          onClick={() => setFeedMode('afProducts')}
        >
          A&F
        </button>
        <button
          className={`toggle-btn ${feedMode === 'myPhotos' ? 'active' : ''}`}
          onClick={() => setFeedMode('myPhotos')}
        >
          My Photos
        </button>
      </div>
      <div className="header">
        <AuthButton user={user} />
        {user && feedMode === 'myPhotos' && (
          <UploadButton userId={user.id} onUploadComplete={handleUploadComplete} />
        )}
      </div>
      <Feed media={media} />
    </div>
  );
}

export default App;
