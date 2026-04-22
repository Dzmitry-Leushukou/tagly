import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { postsAPI } from '../services/api';

function UserProfile() {
  const { login } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPosts, setExpandedPosts] = useState({});
  const navigate = useNavigate();

  const loadUserPosts = useCallback(async () => {
    try {
      const response = await postsAPI.getUserPostsByLogin(login, 50, 0);
      let postsData = response.data.posts || [];
      
      const savedReactions = JSON.parse(localStorage.getItem('user_reactions') || '{}');
      const postsWithReactions = postsData.map(post => ({
        ...post,
        user_liked: savedReactions[post.id] === 'like',
        user_disliked: savedReactions[post.id] === 'dislike'
      }));
      
      setPosts(postsWithReactions);
    } catch (error) {
      console.error('Error loading user posts:', error);
    } finally {
      setLoading(false);
    }
  }, [login]);

  useEffect(() => {
    loadUserPosts();
  }, [loadUserPosts]);

  const updateReaction = (postId, reactionType) => {
    const savedReactions = JSON.parse(localStorage.getItem('user_reactions') || '{}');
    
    if (reactionType === null) {
      delete savedReactions[postId];
    } else {
      savedReactions[postId] = reactionType;
    }
    localStorage.setItem('user_reactions', JSON.stringify(savedReactions));
    
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          user_liked: reactionType === 'like',
          user_disliked: reactionType === 'dislike'
        };
      }
      return post;
    }));
  };

  const handleLike = async (postId) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    if (post.user_liked) {
      updateReaction(postId, null);
      await postsAPI.sendFeedback(postId, 'like').catch(e => console.error(e));
    } else {
      updateReaction(postId, 'like');
      await postsAPI.sendFeedback(postId, 'like').catch(e => console.error(e));
    }
  };

  const handleDislike = async (postId) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    if (post.user_disliked) {
      updateReaction(postId, null);
      await postsAPI.sendFeedback(postId, 'dislike').catch(e => console.error(e));
    } else {
      updateReaction(postId, 'dislike');
      await postsAPI.sendFeedback(postId, 'dislike').catch(e => console.error(e));
    }
  };

  const toggleReadMore = (postId) => {
    setExpandedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const getTruncatedContent = (content, postId) => {
    if (expandedPosts[postId]) return content;
    const maxLength = 225;
    if (content.length > maxLength) {
      return content.slice(0, maxLength) + '...';
    }
    return content;
  };

  const getAvatarUrl = (name) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=92A9E0&color=fff&size=200&bold=true&length=2`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.navbar}>
        <div style={styles.navbarContent}>
          <div style={styles.logoContainer}>
            <span style={styles.logoText}>Tagly</span>
            <img src="/images/monster.png" alt="Monster" style={styles.logoMonster} />
          </div>
          <div style={styles.navLinks}>
            <button onClick={() => navigate('/')} style={styles.navLink}>Home</button>
            <button onClick={() => navigate('/profile')} style={styles.navLink}>Profile</button>
            <button onClick={() => navigate('/tag-selection')} style={styles.navLink}>Edit Tags</button>
            <button onClick={() => { localStorage.clear(); navigate('/login'); }} style={styles.navLink}>Logout</button>
          </div>
        </div>
      </div>
      <div style={styles.navbarSpacer}></div>
      <div style={styles.main}>
        <div style={styles.profileCard}>
          <div style={styles.profileHeader}>
            <div style={styles.profileAvatar}>
              <img src={getAvatarUrl(login)} alt="Profile" style={styles.avatarImage} />
            </div>
            <div style={styles.profileInfo}>
              <p style={styles.profileUsername}>@{login}</p>
              <div style={styles.profileStats}>
                <div style={styles.statItem}>
                  <span style={styles.statNumber}>{posts.length}</span>
                  <span style={styles.statLabel}>posts</span>
                </div>
                
              </div>
            </div>
          </div>
        </div>
        <div style={styles.feed}>
          {loading && <p style={styles.loading}>Loading...</p>}
          {posts.map((post, index) => (
            <div key={`${post.id}-${index}`} id={`post-${post.id}`} style={styles.post}>
              <div style={styles.postHeader}>
                <div style={styles.postAuthorInfo}>
                  <img src={getAvatarUrl(post.author_login || login)} alt="Avatar" style={styles.postAvatar} />
                  <span style={styles.postAuthor}>@{post.author_login || login}</span>
                </div>
              </div>
              <p style={styles.postContent}>{getTruncatedContent(post.content, post.id)}</p>
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
              <div style={styles.postFooter}>
                <button 
                  onClick={() => handleLike(post.id)} 
                  style={{
                    ...styles.actionButton,
                    opacity: post.user_liked ? 1 : 0.2
                  }}
                >
                  ❤️
                </button>
                <button 
                  onClick={() => handleDislike(post.id)} 
                  style={{
                    ...styles.actionButton,
                    opacity: post.user_disliked ? 1 : 0.2
                  }}
                >
                  💔
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
  actionButton: {
    background: 'none',
    border: 'none',
    fontSize: '29px',
    fontFamily: "'IM Fell French Canon', serif",
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    transition: 'all 0.2s ease',
    color: '#9F9EC3'
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