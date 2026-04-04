import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { postsAPI } from '../services/api';

function UserProfile() {
  const { login } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserPosts();
  }, [login]);

  const loadUserPosts = async () => {
    try {
      // TODO: когда бэкендер сделает ручку для постов пользователя по login
      const response = await postsAPI.getUserPostsByLogin(login);
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('Error loading user posts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h2>Tagly</h2>
        <button onClick={() => navigate('/')} style={styles.menuButton}>🏠 Home</button>
        <button onClick={() => navigate('/profile')} style={styles.menuButton}>👤 My profile</button>
        <button onClick={() => navigate('/create-post')} style={styles.menuButton}>✍️ Create post</button>
      </div>

      <div style={styles.main}>
        <div style={styles.profileHeader}>
          <div style={styles.avatar}>👤</div>
          <div style={styles.profileInfo}>
            <h1>@{login}</h1>
          </div>
        </div>

        <h2>Posts</h2>
        {loading && <p>Loading...</p>}
        {posts.map(post => (
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

export default UserProfile;