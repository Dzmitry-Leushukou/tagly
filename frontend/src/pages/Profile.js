import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { postsAPI } from '../services/api';

function Profile() {
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserPosts();
  }, []);

  const loadUserPosts = async () => {
    try {
      // TODO: когда бэкендер сделает ручку для постов пользователя
      const response = await postsAPI.getUserPosts();
      setUserPosts(response.data.posts || []);
    } catch (error) {
      console.error('Error loading user posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = localStorage.getItem('login') || 'user';

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h2>Tagly</h2>
        <button onClick={() => navigate('/')} style={styles.menuButton}>🏠 Home</button>
        <button onClick={() => navigate('/create-post')} style={styles.menuButton}>✍️ Create post</button>
        <button onClick={() => {
          localStorage.clear();
          navigate('/login');
        }} style={styles.menuButton}>🚪 Logout</button>
      </div>

      <div style={styles.main}>
        <div style={styles.profileHeader}>
          <div style={styles.avatar}>👤</div>
          <div style={styles.profileInfo}>
            <h1>{login}</h1>
            <p>Member since 2024</p>
          </div>
        </div>

        <div style={styles.stats}>
          <div style={styles.stat}>
            <h3>{userPosts.length}</h3>
            <p>posts</p>
          </div>
        </div>

        <h2>My posts</h2>
        {loading && <p>Loading...</p>}
        {userPosts.map(post => (
          <div key={post.id} style={styles.post}>
            <p>{post.content}</p>
            <div style={styles.tags}>
              {post.tags?.map(tag => <span key={tag.id} style={styles.tag}>#{tag.name}</span>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f5f5f5',
  },
  sidebar: {
    width: '250px',
    background: 'white',
    padding: '20px',
    borderRight: '1px solid #ddd',
  },
  menuButton: {
    display: 'block',
    width: '100%',
    padding: '10px',
    margin: '10px 0',
    background: '#f0f0f0',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  main: {
    flex: 1,
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
  },
  profileHeader: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    display: 'flex',
    gap: '20px',
    marginBottom: '20px',
  },
  avatar: {
    fontSize: '60px',
  },
  profileInfo: {
    flex: 1,
  },
  stats: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '20px',
  },
  stat: {
    textAlign: 'center',
  },
  post: {
    background: 'white',
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '16px',
  },
  tags: {
    display: 'flex',
    gap: '8px',
    marginTop: '10px',
  },
  tag: {
    background: '#f0f0f0',
    padding: '4px 12px',
    borderRadius: '16px',
    fontSize: '12px',
  },
};

export default Profile;