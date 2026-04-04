import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { postsAPI } from '../services/api';

function Home() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();

  const loadPosts = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const response = await postsAPI.getRecommendations(page, 5);
      const newPosts = response.data.recommendations;
      if (newPosts.length < 5) setHasMore(false);
      setPosts(prev => [...prev, ...newPosts]);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore]);

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        loadPosts();
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadPosts]);

  const handleLike = async (postId) => {
    try {
      await postsAPI.sendFeedback(postId, 'like');
      // Обновляем лайк в UI
      setPosts(posts.map(post => 
        post.id === postId ? {...post, user_liked: true, likes: (post.likes || 0) + 1} : post
      ));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleDislike = async (postId) => {
    try {
      await postsAPI.sendFeedback(postId, 'dislike');
      setPosts(posts.map(post => 
        post.id === postId ? {...post, user_disliked: true} : post
      ));
    } catch (error) {
      console.error('Error disliking post:', error);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h2>Tagly</h2>
        <button onClick={() => navigate('/create-post')} style={styles.menuButton}>
          ✍️ Create post
        </button>
        <button onClick={() => navigate('/profile')} style={styles.menuButton}>
          👤 My profile
        </button>
        <button onClick={() => {
          localStorage.clear();
          navigate('/login');
        }} style={styles.menuButton}>
          🚪 Logout
        </button>
      </div>

      <div style={styles.main}>
        <h1>Feed</h1>
        {posts.map(post => (
          <div key={post.id} style={styles.post}>
            <div style={styles.postHeader}>
              <strong 
                onClick={() => navigate(`/user/${post.author_login}`)}
                style={styles.authorLink}
              >
                @{post.author_login || 'user'}
              </strong>
            </div>
            <p style={styles.postContent}>{post.content}</p>
            <div style={styles.tags}>
              {post.tags?.map(tag => (
                <span key={tag.id} style={styles.tag}>#{tag.name}</span>
              ))}
            </div>
            <div style={styles.actions}>
              <button onClick={() => handleLike(post.id)} style={styles.actionButton}>
                👍 {post.likes || 0}
              </button>
              <button onClick={() => handleDislike(post.id)} style={styles.actionButton}>
                👎
              </button>
            </div>
          </div>
        ))}
        {loading && <p style={styles.loading}>Loading...</p>}
        {!hasMore && <p style={styles.endMessage}>No more posts</p>}
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
    textAlign: 'left',
  },
  main: {
    flex: 1,
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
  },
  post: {
    background: 'white',
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  postHeader: {
    marginBottom: '10px',
  },
  authorLink: {
    cursor: 'pointer',
    color: '#92A9E0',
  },
  postContent: {
    marginBottom: '10px',
    lineHeight: '1.5',
  },
  tags: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '10px',
  },
  tag: {
    background: '#f0f0f0',
    padding: '4px 12px',
    borderRadius: '16px',
    fontSize: '12px',
  },
  actions: {
    display: 'flex',
    gap: '16px',
    paddingTop: '10px',
    borderTop: '1px solid #eee',
  },
  actionButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
  },
  loading: {
    textAlign: 'center',
    padding: '20px',
  },
  endMessage: {
    textAlign: 'center',
    padding: '20px',
    color: '#999',
  },
};

export default Home;