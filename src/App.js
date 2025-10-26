import React, { useState, useEffect } from 'react';
import './App.css';
import Feed from './Feed';

function App() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fisher-Yates shuffle algorithm
    const shuffleArray = (array) => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    // Load media from JSON file
    fetch(`${process.env.PUBLIC_URL}/media.json`)
      .then(response => response.json())
      .then(data => {
        // Filter to only include products with model1 images
        const filteredData = data.filter(item => item.images && item.images.model1);
        setMedia(shuffleArray(filteredData));
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading media:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="App">
      <Feed media={media} />
    </div>
  );
}

export default App;
