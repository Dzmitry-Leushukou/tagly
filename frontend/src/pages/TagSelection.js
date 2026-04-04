import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tagsAPI } from '../services/api';

function TagSelection() {
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      // TODO: когда бэкендер сделает ручку для получения всех тегов
      // Пока моковые данные
      const mockTags = [
        { id: 1, name: 'technology' },
        { id: 2, name: 'sports' },
        { id: 3, name: 'music' },
        { id: 4, name: 'movies' },
        { id: 5, name: 'gaming' },
        { id: 6, name: 'art' },
        { id: 7, name: 'science' },
        { id: 8, name: 'food' },
        { id: 9, name: 'travel' },
        { id: 10, name: 'fashion' },
      ];
      setAllTags(mockTags);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tags:', error);
      setLoading(false);
    }
  };

  const toggleTag = (tag) => {
    if (selectedTags.find(t => t.id === tag.id)) {
      setSelectedTags(selectedTags.filter(t => t.id !== tag.id));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleContinue = () => {
    // Сохраняем выбранные теги в localStorage или отправляем на бэк
    localStorage.setItem('selected_tags', JSON.stringify(selectedTags));
    navigate('/');
  };

  if (loading) return <div style={styles.container}>Loading tags...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>Select your interests</h1>
        <p>Choose tags that interest you (click to select)</p>
        <div style={styles.tagsContainer}>
          {allTags.map(tag => (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag)}
              style={{
                ...styles.tag,
                background: selectedTags.find(t => t.id === tag.id) ? '#92A9E0' : '#f0f0f0',
                color: selectedTags.find(t => t.id === tag.id) ? 'white' : '#333',
              }}
            >
              #{tag.name}
            </button>
          ))}
        </div>
        <button onClick={handleContinue} style={styles.button}>
          Continue ({selectedTags.length} selected)
        </button>
        <button onClick={() => navigate('/')} style={styles.skipButton}>
          Skip for now
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #FFE6FB 5%, #DDE9FF 100%)',
    padding: '20px',
  },
  card: {
    background: 'white',
    padding: '40px',
    borderRadius: '20px',
    maxWidth: '800px',
    textAlign: 'center',
  },
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    justifyContent: 'center',
    margin: '20px 0',
  },
  tag: {
    padding: '10px 20px',
    borderRadius: '25px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.3s ease',
  },
  button: {
    padding: '12px 30px',
    background: '#92A9E0',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    marginTop: '20px',
  },
  skipButton: {
    padding: '12px 30px',
    background: 'none',
    color: '#92A9E0',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    marginTop: '10px',
  },
};

export default TagSelection;