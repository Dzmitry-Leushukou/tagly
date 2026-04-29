import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { tagsAPI } from '../services/api';

function TagSelection() {
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLetterGroup, setCurrentLetterGroup] = useState('all');
  const navigate = useNavigate();

  const letterGroups = [
    { label: 'Все', value: 'all' },
    { label: 'A-Д', value: 'a-d' },
    { label: 'Е-К', value: 'e-k' },
    { label: 'Л-П', value: 'l-p' },
    { label: 'Р-Ф', value: 'r-f' },
    { label: 'Х-Я', value: 'h-ya' },
    { label: 'A-Z (англ)', value: 'eng' }
  ];

  const getTagGroup = (tagName) => {
    if (!tagName || tagName.length === 0) return 'all';
    const firstChar = tagName.charAt(0).toLowerCase();
    const rusLower = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
    const engLower = 'abcdefghijklmnopqrstuvwxyz';
    
    if (engLower.includes(firstChar)) {
      return 'eng';
    }
    
    const groups = {
      'a-d': ['а', 'б', 'в', 'г', 'д'],
      'e-k': ['е', 'ё', 'ж', 'з', 'и', 'й', 'к'],
      'l-p': ['л', 'м', 'н', 'о', 'п'],
      'r-f': ['р', 'с', 'т', 'у', 'ф'],
      'h-ya': ['х', 'ц', 'ч', 'ш', 'щ', 'ъ', 'ы', 'ь', 'э', 'ю', 'я']
    };
    
    for (const [group, letters] of Object.entries(groups)) {
      if (letters.includes(firstChar)) {
        return group;
      }
    }
    
    return 'all';
  };

  const fetchAllTags = async () => {
    try {
      let allFetchedTags = [];
      let offset = 0;
      const limit = 100;
      let hasMore = true;
      
      while (hasMore) {
        const response = await tagsAPI.getAllTags(limit, offset);
        const tags = response.data?.tags || [];
        
        if (tags.length === 0) {
          hasMore = false;
        } else {
          const formattedTags = tags.map((name, idx) => ({
            id: response.data?.ids?.[idx] || idx + offset,
            name: name
          }));
          allFetchedTags = [...allFetchedTags, ...formattedTags];
          
          if (tags.length < limit) {
            hasMore = false;
          } else {
            offset += limit;
          }
        }
      }
      
      // Сортируем по алфавиту
      const sortedTags = [...allFetchedTags].sort((a, b) => 
        a.name.localeCompare(b.name, 'ru')
      );
      
      setAllTags(sortedTags);
      return sortedTags;
    } catch (error) {
      console.error('Error fetching tags:', error);
      setAllTags([]);
      return [];
    }
  };

  const loadSelectedTags = async () => {
    try {
      const response = await tagsAPI.getMyFavoriteTags();
      const favoriteTags = response.data.tags || [];
      
      const selected = favoriteTags.map(tag => ({
        id: tag.id,
        name: tag.name,
        weight: tag.weight
      }));
      
      setSelectedTags(selected);
      localStorage.setItem('selected_tags', JSON.stringify(selected));
      console.log('Loaded favorite tags from backend:', selected);
      return selected;
    } catch (error) {
      console.error('Error loading favorite tags:', error);
      
      const savedTags = localStorage.getItem('selected_tags');
      if (savedTags) {
        const parsed = JSON.parse(savedTags);
        setSelectedTags(parsed);
        return parsed;
      }
      return [];
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchAllTags();
      await loadSelectedTags();
      setLoading(false);
    };
    loadData();
  }, []);

  const toggleTag = (tag) => {
    setSelectedTags(prev => {
      const exists = prev.find(t => t.id === tag.id);
      if (exists) {
        return prev.filter(t => t.id !== tag.id);
      } else {
        return [...prev, tag];
      }
    });
  };

  const handleContinue = async () => {
    localStorage.setItem('selected_tags', JSON.stringify(selectedTags));
    
    if (selectedTags.length > 0) {
      try {
        const tagIds = selectedTags.map(t => t.id);
        await tagsAPI.saveUserTags(tagIds);
        console.log('Tags saved to backend:', tagIds);
      } catch (error) {
        console.error('Error saving tags to backend:', error);
      }
    }
    
    navigate('/');
  };

  const handleSkip = () => {
    navigate('/');
  };

  const filteredTags = useMemo(() => {
    let filtered = allTags;
    
    if (currentLetterGroup !== 'all') {
      filtered = filtered.filter(tag => getTagGroup(tag.name) === currentLetterGroup);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(tag => 
        tag.name.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [allTags, searchQuery, currentLetterGroup]);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.blueShape}>
            <span style={styles.title}>Loading tags...</span>
          </div>
          <div style={styles.content}>
            <p style={styles.subtitle}>Please wait while we load your interests</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.blueShape}>
          <span style={styles.title}>Select your interests</span>
        </div>
        <div style={styles.content}>
          <p style={styles.subtitle}>Choose tags that interest you</p>
          
          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="🔍 Search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          
          <div style={styles.letterNav}>
            {letterGroups.map(group => (
              <button
                key={group.value}
                onClick={() => setCurrentLetterGroup(group.value)}
                style={{
                  ...styles.letterButton,
                  background: currentLetterGroup === group.value ? '#92A9E0' : 'white',
                  color: currentLetterGroup === group.value ? 'white' : '#304069',
                  border: currentLetterGroup === group.value ? '2px solid #92A9E0' : '2px solid #9EABC3',
                }}
              >
                {group.label}
              </button>
            ))}
          </div>
          
          {selectedTags.length > 0 && (
            <div style={styles.selectedInfo}>
              <span> Selected: {selectedTags.length} tags</span>
              <button 
                onClick={() => setSelectedTags([])}
                style={styles.clearButton}
              >
                Clear all
              </button>
            </div>
          )}
          
          <div style={styles.tagsWrapper}>
            <div style={styles.tagsContainer}>
              {filteredTags.length === 0 ? (
                <p style={styles.noTags}>No tags found</p>
              ) : (
                filteredTags.map(tag => (
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
                ))
              )}
            </div>
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
    padding: '20px',
  },
  card: {
    width: '800px',
    maxWidth: '90vw',
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
  searchContainer: {
    marginBottom: '20px',
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px',
    fontFamily: "'IM Fell French Canon', serif",
    border: '2px solid #9EABC3',
    borderRadius: '25px',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
  },
  letterNav: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    justifyContent: 'center',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '1px solid #E0E4F0',
  },
  letterButton: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontFamily: "'IM Fell French Canon', serif",
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    background: 'white',
    border: '2px solid #9EABC3',
    color: '#304069',
  },
  selectedInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    marginBottom: '15px',
    background: '#F0F4FF',
    borderRadius: '20px',
    fontFamily: "'IM Fell French Canon', serif",
    fontSize: '14px',
    color: '#304069',
  },
  clearButton: {
    padding: '4px 12px',
    background: '#FFE6FB',
    border: '1px solid #9EABC3',
    borderRadius: '15px',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: "'IM Fell French Canon', serif",
    color: '#304069',
  },
  tagsWrapper: {
    maxHeight: '400px',
    overflowY: 'auto',
    marginBottom: '30px',
    padding: '5px',
  },
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    justifyContent: 'flex-start',
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
  noTags: {
    textAlign: 'center',
    fontFamily: "'IM Fell French Canon', serif",
    fontSize: '16px',
    color: '#9F9EC3',
    padding: '40px',
  },
};

export default TagSelection;