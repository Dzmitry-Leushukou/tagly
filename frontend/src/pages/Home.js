import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { postsAPI } from '../services/api';

function Home() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const navigate = useNavigate();

  // временный костыль
  const usersMap = {
    1: "testuser",
    5: "space_explorer", 
    7: "auto_expert",
    9: "code_ninja",
    11: "bio_researcher",
    13: "alice_12" 
  };

  const getAvatarUrl = (login) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(login)}&background=92A9E0&color=fff&size=80&bold=true&length=2`;
  };

  const loadPosts = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const response = await postsAPI.getRecommendations();
      let newPosts = response.data?.recommendations || [];
      
      // Добавляем author_login, если его нет
      newPosts = newPosts.map(post => ({
        ...post,
        author_login: post.author_login || usersMap[post.author_id] || `user_${post.author_id}`
      }));
      
      if (newPosts.length < 5) setHasMore(false);
      setPosts(prev => [...prev, ...newPosts]);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        loadPosts();
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadPosts]);

  const handleCreatePost = async () => {
    console.log('=== START handleCreatePost ===');
    console.log('1. newPostContent:', newPostContent);
    
    if (!newPostContent.trim()) {
      console.log('2. Content empty, returning');
      return;
    }
    
    try {
      console.log('3. Getting token from localStorage...');
      const token = localStorage.getItem('access_token');
      console.log('4. Token exists:', !!token);
      console.log('5. Token value:', token ? token.substring(0, 50) + '...' : 'null');
      
      console.log('6. Calling postsAPI.createPost...');
      const response = await postsAPI.createPost(newPostContent);
      console.log('7. Response:', response);
      console.log('8. Response data:', response.data);
      
      console.log('9. Clearing state...');
      setNewPostContent('');
      setShowCreateModal(false);
      setPosts([]);
      setPage(1);
      setHasMore(true);
      
      console.log('10. Reloading posts...');
      await loadPosts();
      console.log('=== SUCCESS ===');
    } catch (error) {
      console.error('=== ERROR ===');
      console.error('Error object:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      alert('Error creating post: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleLike = async (postId) => {
    const post = posts.find(p => p.id === postId);
    if (post.user_liked) {
      setPosts(posts.map(p => 
        p.id === postId ? {...p, user_liked: false, likes: (p.likes || 0) - 1} : p
      ));
      return;
    }
    if (post.user_disliked) {
      setPosts(posts.map(p => 
        p.id === postId ? {
          ...p, 
          user_liked: true, 
          user_disliked: false, 
          likes: (p.likes || 0) + 1, 
          dislikes: (p.dislikes || 0) - 1
        } : p
      ));
      return;
    }
    setPosts(posts.map(p => 
      p.id === postId ? {...p, user_liked: true, likes: (p.likes || 0) + 1} : p
    ));
  };

  const handleDislike = async (postId) => {
    const post = posts.find(p => p.id === postId);
    if (post.user_disliked) {
      setPosts(posts.map(p => 
        p.id === postId ? {...p, user_disliked: false, dislikes: (p.dislikes || 0) - 1} : p
      ));
      return;
    }
    if (post.user_liked) {
      setPosts(posts.map(p => 
        p.id === postId ? {
          ...p, 
          user_liked: false, 
          user_disliked: true, 
          likes: (p.likes || 0) - 1, 
          dislikes: (p.dislikes || 0) + 1
        } : p
      ));
      return;
    }
    setPosts(posts.map(p => 
      p.id === postId ? {...p, user_disliked: true, dislikes: (p.dislikes || 0) + 1} : p
    ));
  };

  const toggleReadMore = (postId) => {
    setExpandedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const getTruncatedContent = (content, postId) => {
    if (expandedPosts[postId]) return content;
    const maxLength = 225;
    if (content.length > maxLength) {
      return content.slice(0, maxLength) + '...';
    }
    return content;
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length > 1) {
      const results = posts.filter(post => 
        post.content.toLowerCase().includes(query.toLowerCase()) ||
        post.tags?.some(tag => tag.name.toLowerCase().includes(query.toLowerCase())) ||
        post.author_login?.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.navbar}>
        <div style={styles.navbarContent}>
          <div style={styles.logoContainer}>
            <span style={styles.logoText}>Tagly</span>
            <img src="/images/monster.png" alt="Monster" style={styles.logoMonster} />
          </div>
          
          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search users or #hashtags..."
              value={searchQuery}
              onChange={handleSearch}
              style={styles.searchInput}
            />
            {showSearchResults && searchResults.length > 0 && (
              <div style={styles.searchResults}>
                {searchResults.slice(0, 5).map(result => (
                  <div key={result.id} style={styles.searchResultItem} onClick={() => {
                    setShowSearchResults(false);
                    setSearchQuery('');
                    document.getElementById(`post-${result.id}`)?.scrollIntoView({ behavior: 'smooth' });
                  }}>
                    <span style={styles.searchResultAuthor}>@{result.author_login}</span>
                    <span style={styles.searchResultContent}>{result.content.slice(0, 75)}...</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={styles.navLinks}>
            <button onClick={() => navigate('/')} style={styles.navLink}>Home</button>
            <button onClick={() => navigate('/profile')} style={styles.navLink}>Profile</button>
            <button onClick={() => navigate('/tag-selection')} style={styles.navLink}>Edit Tags</button>
            <button onClick={() => {
              localStorage.clear();
              navigate('/login');
            }} style={styles.navLink}>Logout</button>
          </div>
        </div>
      </div>

      <div style={styles.navbarSpacer}></div>

      <div style={styles.main}>
        <div style={styles.createPostCard}>
          <div style={styles.createPostHeader}>
            <div style={styles.createPostAvatar}>
              <img 
                src={getAvatarUrl(localStorage.getItem('login') || 'user')} 
                alt="Avatar"
                style={styles.createPostAvatarImg}
              />
            </div>
            <input
              type="text"
              placeholder="Create a new post"
              onClick={() => setShowCreateModal(true)}
              style={styles.createPostInput}
              readOnly
            />
          </div>
        </div>

        <div style={styles.feed}>
          {posts.map((post, index) => (
            <div key={`${post.id}-${index}`} id={`post-${post.id}`} style={styles.post}>
              <div style={styles.postHeader}>
                <img 
                  src={getAvatarUrl(post.author_login || 'user')}
                  alt="Avatar"
                  style={styles.avatar}
                />
                <div style={styles.postInfo}>
                  <span 
                    onClick={() => navigate(`/user/${post.author_login}`)}
                    style={styles.authorName}
                  >
                    {post.author_login || 'user'}
                  </span>
                  <p style={styles.postContent}>
                    {getTruncatedContent(post.content, post.id)}
                  </p>
                  {post.content && post.content.length > 225 && (
                    <button onClick={() => toggleReadMore(post.id)} style={styles.readMore}>
                      {expandedPosts[post.id] ? 'Show less' : 'Read more'}
                    </button>
                  )}
                  <div style={styles.tags}>
                    {post.tags?.map((tag, tagIndex) => (
                      <span key={`${post.id}-tag-${tagIndex}`} style={styles.tag}>- {tag.name}</span>
                    ))}
                  </div>
                  <div style={styles.actions}>
                    <button 
                      onClick={() => handleLike(post.id)} 
                      style={{
                        ...styles.actionButton,
                        color: post.user_liked ? '#ff4444' : '#9F9EC3'
                      }}
                    >
                      ❤️ {post.likes || 0}
                    </button>
                    <button 
                      onClick={() => handleDislike(post.id)} 
                      style={{
                        ...styles.actionButton,
                        color: post.user_disliked ? '#ff4444' : '#9F9EC3'
                      }}
                    >
                      💔 {post.dislikes || 0}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {loading && <p style={styles.loading}>Loading...</p>}
        {!hasMore && <p style={styles.endMessage}>No more posts</p>}
      </div>

      {showCreateModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Create a new post</h3>
              <button onClick={() => setShowCreateModal(false)} style={styles.modalClose}>✕</button>
            </div>
            <textarea
              placeholder="What's on your mind?"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              style={styles.modalTextarea}
              rows="6"
              autoFocus
            />
            <div style={styles.modalActions}>
              <button onClick={() => setShowCreateModal(false)} style={styles.cancelBtn}>Cancel</button>
              <button onClick={handleCreatePost} style={styles.submitPostBtn}>Post</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #FFE6FB 30%, #DDE9FF 100%)',
  },
  navbar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    background: '#92A9E0',
    padding: '23px 39px',
    borderBottom: '2px solid #9EABC3',
    zIndex: 1000,
  },
  navbarSpacer: {
    height: '136px',
  },
  navbarContent: {
    maxWidth: '1755px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '39px',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  logoText: {
    fontFamily: "'Irish Grover', cursive",
    fontSize: '47px',
    color: '#FFFFFF',
    textShadow: '4px 4px 0 #304069',
  },
  logoMonster: {
    width: '58px',
    height: '58px',
    objectFit: 'contain',
  },
  searchContainer: {
    position: 'relative',
    flex: 1,
    maxWidth: '585px',
  },
  searchInput: {
    width: '100%',
    height: '70px',
    padding: '0 29px',
    border: '2px solid #9EABC3',
    borderRadius: '39px',
    fontSize: '27px',
    fontFamily: "'IM Fell French Canon', serif",
    color: '#304069',
    background: 'white',
    outline: 'none',
  },
  searchResults: {
    position: 'absolute',
    top: '78px',
    left: 0,
    right: 0,
    background: 'white',
    border: '2px solid #9EABC3',
    borderRadius: '23px',
    maxHeight: '487px',
    overflowY: 'auto',
    zIndex: 1001,
  },
  searchResultItem: {
    padding: '19px 23px',
    borderBottom: '1px solid #eee',
    cursor: 'pointer',
  },
  searchResultAuthor: {
    fontFamily: "'IM Fell French Canon', serif",
    fontSize: '25px',
    color: '#92A9E0',
    fontWeight: 'bold',
    display: 'block',
    marginBottom: '8px',
  },
  searchResultContent: {
    fontFamily: "'IM Fell French Canon', serif",
    fontSize: '21px',
    color: '#304069',
  },
  navLinks: {
    display: 'flex',
    gap: '39px',
  },
  navLink: {
    background: 'none',
    border: 'none',
    fontSize: '31px',
    fontFamily: "'IM Fell French Canon', serif",
    color: '#304069',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  main: {
    maxWidth: '1170px',
    margin: '0 auto',
    padding: '29px 39px',
  },
  createPostCard: {
    background: 'white',
    borderRadius: '39px',
    border: '2px solid #9EABC3',
    padding: '23px 39px',
    marginBottom: '39px',
  },
  createPostHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '23px',
  },
  createPostAvatar: {
    width: '78px',
    height: '78px',
    borderRadius: '39px',
    background: 'rgba(159, 158, 195, 0.1)',
    border: '2px solid #9EABC3',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  createPostAvatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  createPostInput: {
    flex: 1,
    height: '86px',
    padding: '0 29px',
    border: '2px solid #9EABC3',
    borderRadius: '58px',
    fontSize: '29px',
    fontFamily: "'IM Fell French Canon', serif",
    color: '#304069',
    background: '#f9f9f9',
    cursor: 'pointer',
  },
  feed: {
    display: 'flex',
    flexDirection: 'column',
    gap: '39px',
  },
  post: {
    background: 'white',
    padding: '29px',
    borderRadius: '39px',
    border: '2px solid #9EABC3',
  },
  postHeader: {
    display: 'flex',
    gap: '23px',
  },
  avatar: {
    width: '94px',
    height: '94px',
    borderRadius: '47px',
    objectFit: 'cover',
    border: '2px solid #9EABC3',
  },
  postInfo: {
    flex: 1,
  },
  authorName: {
    fontFamily: "'IM Fell French Canon', serif",
    fontSize: '31px',
    color: '#92A9E0',
    cursor: 'pointer',
    fontWeight: 'bold',
    display: 'block',
    marginBottom: '12px',
  },
  postContent: {
    fontFamily: "'IM Fell French Canon', serif",
    fontSize: '29px',
    color: '#304069',
    lineHeight: '1.5',
    marginBottom: '12px',
  },
  readMore: {
    background: 'none',
    border: 'none',
    fontSize: '25px',
    fontFamily: "'IM Fell French Canon', serif",
    color: '#92A9E0',
    cursor: 'pointer',
    marginBottom: '16px',
    padding: 0,
  },
  tags: {
    display: 'flex',
    gap: '19px',
    flexWrap: 'wrap',
    marginBottom: '19px',
  },
  tag: {
    fontSize: '25px',
    fontFamily: "'IM Fell French Canon', serif",
    color: '#92A9E0',
  },
  actions: {
    display: 'flex',
    gap: '39px',
    paddingTop: '16px',
    borderTop: '1px solid #9EABC3',
  },
  actionButton: {
    background: 'none',
    border: 'none',
    fontSize: '29px',
    fontFamily: "'IM Fell French Canon', serif",
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  loading: {
    textAlign: 'center',
    padding: '39px',
    fontFamily: "'IM Fell French Canon', serif",
    fontSize: '29px',
    color: '#9F9EC3',
  },
  endMessage: {
    textAlign: 'center',
    padding: '39px',
    fontFamily: "'IM Fell French Canon', serif",
    fontSize: '29px',
    color: '#9F9EC3',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    background: 'white',
    borderRadius: '58px',
    width: '877px',
    maxWidth: '90%',
    overflow: 'hidden',
    border: '2px solid #9EABC3',
  },
  modalHeader: {
    background: '#92A9E0',
    padding: '29px 39px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: "'IM Fell French Canon', serif",
    fontSize: '35px',
    color: '#304069',
    margin: 0,
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '43px',
    color: '#304069',
    cursor: 'pointer',
  },
  modalTextarea: {
    width: '100%',
    padding: '29px',
    border: 'none',
    fontSize: '29px',
    fontFamily: "'IM Fell French Canon', serif",
    color: '#304069',
    resize: 'vertical',
    boxSizing: 'border-box',
    outline: 'none',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '29px',
    padding: '29px 39px',
    borderTop: '1px solid #9EABC3',
  },
  cancelBtn: {
    padding: '16px 39px',
    background: 'white',
    border: '2px solid #9EABC3',
    borderRadius: '39px',
    fontSize: '25px',
    fontFamily: "'IM Fell French Canon', serif",
    fontStyle: 'italic',
    color: '#9F9EC3',
    cursor: 'pointer',
  },
  submitPostBtn: {
    padding: '16px 39px',
    background: '#92A9E0',
    border: '2px solid #9EABC3',
    borderRadius: '39px',
    fontSize: '25px',
    fontFamily: "'IM Fell French Canon', serif",
    fontStyle: 'italic',
    color: 'white',
    cursor: 'pointer',
  },
};

export default Home;