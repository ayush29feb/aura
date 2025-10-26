import React, { useState, useEffect } from 'react';
import './App.css';
import Feed from './Feed';

function App() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedMode, setFeedMode] = useState('afProducts'); // 'afProducts' or 'myPhotos'

  useEffect(() => {
    setLoading(true);

    // Fisher-Yates shuffle algorithm
    const shuffleArray = (array) => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    // Load media from appropriate JSON file based on feed mode
    const jsonFile = feedMode === 'afProducts' ? 'media.json' : 'user_media.json';

    fetch(`${process.env.PUBLIC_URL}/${jsonFile}`)
      .then(response => response.json())
      .then(data => {
        // Filter to only include products with model1 images (only for A&F products)
        const filteredData = feedMode === 'afProducts'
          ? data.filter(item => item.images && item.images.model1)
          : data;
        setMedia(shuffleArray(filteredData));
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading media:', error);
        setLoading(false);
      });
  }, [feedMode]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
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
      <Feed media={media} />
    </div>
  );
}

export default App;
