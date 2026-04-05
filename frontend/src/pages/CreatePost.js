import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postsAPI } from '../services/api';

function CreatePost() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    setLoading(true);
    try {
      await postsAPI.createPost(content);
      navigate('/');
    } catch (error) {
      alert('Error creating post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.blueShape}>
          <span style={styles.title}>Create a new post</span>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={styles.textarea}
            rows="6"
          />
          <div style={styles.buttonGroup}>
            <button type="button" onClick={() => navigate('/')} style={styles.cancelBtn}>
              Cancel
            </button>
            <button type="submit" style={styles.submitBtn} disabled={loading}>
              {loading ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </form>
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
    width: '500px',
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
    fontSize: '24px',
    color: '#304069',
    fontWeight: 'bold',
    margin: 0,
  },
  form: {
    padding: '30px',
  },
  textarea: {
    width: '100%',
    padding: '15px',
    border: '2px solid #9EABC3',
    borderRadius: '20px',
    fontSize: '16px',
    fontFamily: "'IM Fell French Canon', serif",
    color: '#304069',
    background: 'white',
    boxSizing: 'border-box',
    outline: 'none',
    resize: 'vertical',
    marginBottom: '20px',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '15px',
  },
  cancelBtn: {
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
  submitBtn: {
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
};

export default CreatePost;