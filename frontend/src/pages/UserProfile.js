import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { postsAPI } from '../services/api';

function UserProfile() {
  const { login } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const navigate = useNavigate();

  const loadUserPosts = useCallback(async () => {
    try {
      const response = await postsAPI.getUserPostsByLogin(login);
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('Error loading user posts:', error);
    } finally {
      setLoading(false);
    }
  }, [login]);

  useEffect(() => {
    loadUserPosts();
  }, [loadUserPosts]);

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

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length > 1) {
      const results = posts.filter(post => 
        post.content.toLowerCase().includes(query.toLowerCase()) ||
        post.tags?.some(tag => tag.name.toLowerCase().includes(query.toLowerCase()))
      );
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  };

  const getAvatarUrl = (name) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=92A9E0&color=fff&size=200&bold=true&length=2`;
  };

  const totalLikes = posts.reduce((sum, post) => sum + (post.likes || 0), 0);

  return (
    <div style={styles.container}>
      {/* Навбар как на Home */}
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
        {/* Карточка профиля пользователя */}
        <div style={styles.profileCard}>
          <div style={styles.profileHeader}>
            <div style={styles.profileAvatar}>
              <img 
                src={getAvatarUrl(login)} 
                alt="Profile"
                style={styles.avatarImage}
              />
            </div>
            <div style={styles.profileInfo}>
              <h1 style={styles.profileName}>{login === 'alibaba8_8' ? 'Ivan Ivanov' : login}</h1>
              <p style={styles.profileUsername}>@{login}</p>
              <div style={styles.profileStats}>
                <div style={styles.statItem}>
                  <span style={styles.statNumber}>{posts.length}</span>
                  <span style={styles.statLabel}>posts</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statNumber}>{totalLikes}</span>
                  <span style={styles.statLabel}>likes</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Лента постов пользователя (без возможности создания) */}
        <div style={styles.feed}>
          {loading && <p style={styles.loading}>Loading...</p>}
          
          {posts.map(post => (
            <div key={post.id} id={`post-${post.id}`} style={styles.post}>
              <div style={styles.postHeader}>
                <div style={styles.postAuthorInfo}>
                  <img 
                    src={getAvatarUrl(login)} 
                    alt="Avatar"
                    style={styles.postAvatar}
                  />
                  <span style={styles.postAuthor}>@{login}</span>
                </div>
              </div>
              <p style={styles.postContent}>
                {post.content}
              </p>
              <div style={styles.tags}>
                {post.tags?.map(tag => (
                  <span key={tag.id} style={styles.tag}>- {tag.name}</span>
                ))}
              </div>
              <div style={styles.postFooter}>
                <button 
                  onClick={() => handleLike(post.id)} 
                  style={{
                    ...styles.likeButton,
                    color: post.user_liked ? '#ff4444' : '#9F9EC3'
                  }}
                >
                  ❤️ {post.likes || 0}
                </button>
                <button 
                  onClick={() => handleDislike(post.id)} 
                  style={{
                    ...styles.dislikeButton,
                    color: post.user_disliked ? '#ff4444' : '#9F9EC3'
                  }}
                >
                  💔 {post.dislikes || 0}
                </button>
              </div>
            </div>
          ))}
          
          {!loading && posts.length === 0 && (
            <p style={styles.noPosts}>No posts yet.</p>
          )}
        </div>
      </div>
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
  profileCard: {
    background: 'white',
    borderRadius: '39px',
    border: '2px solid #9EABC3',
    padding: '49px',
    marginBottom: '39px',
  },
  profileHeader: {
    display: 'flex',
    gap: '49px',
    alignItems: 'center',
  },
  profileAvatar: {
    width: '180px',
    height: '180px',
    borderRadius: '90px',
    overflow: 'hidden',
    border: '3px solid #9EABC3',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: "'IM Fell French Canon', serif",
    fontSize: '47px',
    color: '#304069',
    margin: 0,
    marginBottom: '10px',
  },
  profileUsername: {
    fontFamily: "'IM Fell French Canon', serif",
    fontSize: '31px',
    color: '#92A9E0',
    marginBottom: '25px',
  },
  profileStats: {
    display: 'flex',
    gap: '59px',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: "'IM Fell French Canon', serif",
    fontSize: '39px',
    color: '#92A9E0',
    fontWeight: 'bold',
  },
  statLabel: {
    fontFamily: "'IM Fell French Canon', serif",
    fontSize: '21px',
    color: '#9F9EC3',
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
    marginBottom: '19px',
  },
  postAuthorInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  postAvatar: {
    width: '60px',
    height: '60px',
    borderRadius: '30px',
    objectFit: 'cover',
    border: '2px solid #9EABC3',
  },
  postAuthor: {
    fontFamily: "'IM Fell French Canon', serif",
    fontSize: '31px',
    color: '#92A9E0',
    fontWeight: 'bold',
  },
  postContent: {
    fontFamily: "'IM Fell French Canon', serif",
    fontSize: '27px',
    color: '#304069',
    lineHeight: '1.5',
    marginBottom: '19px',
  },
  tags: {
    display: 'flex',
    gap: '19px',
    flexWrap: 'wrap',
    marginBottom: '19px',
  },
  tag: {
    fontSize: '23px',
    fontFamily: "'IM Fell French Canon', serif",
    color: '#92A9E0',
  },
  postFooter: {
    display: 'flex',
    gap: '39px',
    paddingTop: '19px',
    borderTop: '1px solid #9EABC3',
  },
  likeButton: {
    background: 'none',
    border: 'none',
    fontSize: '27px',
    fontFamily: "'IM Fell French Canon', serif",
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  dislikeButton: {
    background: 'none',
    border: 'none',
    fontSize: '27px',
    fontFamily: "'IM Fell French Canon', serif",
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  loading: {
    textAlign: 'center',
    padding: '59px',
    fontFamily: "'IM Fell French Canon', serif",
    fontSize: '29px',
    color: '#9F9EC3',
  },
  noPosts: {
    textAlign: 'center',
    padding: '59px',
    fontFamily: "'IM Fell French Canon', serif",
    fontSize: '29px',
    color: '#9F9EC3',
  },
};

export default UserProfile;