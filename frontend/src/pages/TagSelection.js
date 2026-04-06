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
    const savedTags = localStorage.getItem('selected_tags');
    if (savedTags) {
      try {
        const parsedTags = JSON.parse(savedTags);
        setSelectedTags(parsedTags);
      } catch (e) {
        console.error('Error parsing saved tags:', e);
      }
    }
  }, []);

  const fetchTags = async () => {
    try {
      const response = await tagsAPI.getAllTags(100, 0);
      let tags = [];
      if (Array.isArray(response.data)) {
        tags = response.data;
      } else if (response.data?.tags && Array.isArray(response.data.tags)) {
        tags = response.data.tags;
      } else {
        tags = Object.values(response.data).find(val => Array.isArray(val)) || [];
      }
      
      if (tags.length > 0 && typeof tags[0] === 'string') {
        tags = tags.map((name, index) => ({
          id: index,
          name: name
        }));
      }
      
      setAllTags(tags);
    } catch (error) {
      console.error('Error fetching tags:', error);
      const mockTags = [
        { id: 1, name: 'technology' }, { id: 2, name: 'sports' },
        { id: 3, name: 'music' }, { id: 4, name: 'movies' },
        { id: 5, name: 'gaming' }, { id: 6, name: 'art' },
        { id: 7, name: 'science' }, { id: 8, name: 'food' },
      ];
      setAllTags(mockTags);
    } finally {
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

  const handleContinue = async () => {
    try {
      const tagIds = selectedTags.map(t => t.id);
      await tagsAPI.saveUserTags(tagIds);
      localStorage.setItem('selected_tags', JSON.stringify(selectedTags));
      navigate('/');
    } catch (error) {
      console.error('Error saving tags:', error);
      navigate('/');
    }
  };

  const handleSkip = () => {
    navigate('/');
  };

  if (loading) return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.blueShape}>
          <span style={styles.title}>Select your interests</span>
        </div>
        <div style={styles.loading}>Loading tags...</div>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.blueShape}>
          <span style={styles.title}>Select your interests</span>
        </div>

        <div style={styles.content}>
          <p style={styles.subtitle}>Choose tags that interest you</p>
          
          <div style={styles.tagsContainer}>
            {allTags.map(tag => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag)}
                style={{
                  ...styles.tag,
                  background: selectedTags.find(t => t.id === tag.id) ? '#92A9E0' : 'white',
                  color: selectedTags.find(t => t.id === tag.id) ? 'white' : '#304069',
                  border: selectedTags.find(t => t.id === tag.id) ? '2px solid #92A9E0' : '2px solid #9EABC3',
                }}
              >
                #{tag.name}
              </button>
            ))}
          </div>

          <div style={styles.buttonGroup}>
            <button onClick={handleSkip} style={styles.skipBtn}>Skip for now</button>
            <button onClick={handleContinue} style={styles.continueBtn}>
              Continue ({selectedTags.length})
            </button>
          </div>
        </div>
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
  },
  card: {
    width: '600px',
    background: '#FFFFFF',
    borderRadius: '50px',
    border: '2px solid #9EABC3',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  blueShape: {
    background: '#92A9E0',
    padding: '20px',
    textAlign: 'center',
  },
  title: {
    fontFamily: "'IM Fell French Canon', serif",
    fontSize: '30px',
    color: '#304069',
    fontWeight: 'bold',
    margin: 0,
  },
  content: {
    padding: '30px',
  },
  subtitle: {
    fontFamily: "'IM Fell French Canon', serif",
    fontSize: '16px',
    color: '#9F9EC3',
    textAlign: 'center',
    marginBottom: '25px',
  },
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    justifyContent: 'center',
    marginBottom: '30px',
  },
  tag: {
    padding: '10px 20px',
    borderRadius: '25px',
    fontSize: '14px',
    fontFamily: "'IM Fell French Canon', serif",
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '15px',
  },
  skipBtn: {
    padding: '10px 25px',
    background: 'white',
    border: '2px solid #9EABC3',
    borderRadius: '20px',
    fontSize: '16px',
    fontFamily: "'IM Fell French Canon', serif",
    fontStyle: 'italic',
    color: '#9F9EC3',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  continueBtn: {
    padding: '10px 25px',
    background: '#92A9E0',
    border: '2px solid #9EABC3',
    borderRadius: '20px',
    fontSize: '16px',
    fontFamily: "'IM Fell French Canon', serif",
    fontStyle: 'italic',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontFamily: "'IM Fell French Canon', serif",
    fontSize: '16px',
    color: '#9F9EC3',
  },
};

export default TagSelection;