import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { postsAPI } from '../services/api';

function Profile() {
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  const username = localStorage.getItem('login') || 'user';

  const loadUserPosts = async () => {
  try {
    const response = await postsAPI.getMyPosts(50, 0);
    setUserPosts(response.data.posts || []);
  } catch (error) {
    console.error('Error loading user posts:', error);
    setUserPosts([]);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    loadUserPosts();
  }, []);

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    try {
      await postsAPI.createPost(newPostContent);
      setNewPostContent('');
      setShowCreateModal(false);
      loadUserPosts();
    } catch (error) {
      alert('Error creating post');
    }
  };

  const handleLike = async (postId) => {
    const post = userPosts.find(p => p.id === postId);
    if (post.user_liked) {
      setUserPosts(userPosts.map(p => 
        p.id === postId ? {...p, user_liked: false, likes: (p.likes || 0) - 1} : p
      ));
      return;
    }
    if (post.user_disliked) {
      setUserPosts(userPosts.map(p => 
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
    setUserPosts(userPosts.map(p => 
      p.id === postId ? {...p, user_liked: true, likes: (p.likes || 0) + 1} : p
    ));
  };

  const handleDislike = async (postId) => {
    const post = userPosts.find(p => p.id === postId);
    if (post.user_disliked) {
      setUserPosts(userPosts.map(p => 
        p.id === postId ? {...p, user_disliked: false, dislikes: (p.dislikes || 0) - 1} : p
      ));
      return;
    }
    if (post.user_liked) {
      setUserPosts(userPosts.map(p => 
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
    setUserPosts(userPosts.map(p => 
      p.id === postId ? {...p, user_disliked: true, dislikes: (p.dislikes || 0) + 1} : p
    ));
  };

  const getAvatarUrl = (name) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=92A9E0&color=fff&size=200&bold=true&length=2`;
  };

  const totalLikes = userPosts.reduce((sum, post) => sum + (post.likes || 0), 0);

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
              <img src={getAvatarUrl(username)} alt="Profile" style={styles.avatarImage} />
            </div>
            <div style={styles.profileInfo}>
              <p style={styles.profileUsername}>@{username}</p>
              <div style={styles.profileStats}>
                <div style={styles.statItem}>
                  <span style={styles.statNumber}>{userPosts.length}</span>
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
        <div style={styles.createPostCard}>
          <div style={styles.createPostHeader}>
            <div style={styles.createPostAvatar}>
              <img src={getAvatarUrl(username)} alt="Avatar" style={styles.createPostAvatarImg} />
            </div>
            <input type="text" placeholder="Create a new post" onClick={() => setShowCreateModal(true)} style={styles.createPostInput} readOnly />
          </div>
        </div>
        <div style={styles.feed}>
          {loading && <p style={styles.loading}>Loading...</p>}
          {userPosts.map((post, index) => (
            <div key={`${post.id}-${index}`} id={`post-${post.id}`} style={styles.post}>
              <div style={styles.postHeader}>
                <div style={styles.postAuthorInfo}>
                  <img src={getAvatarUrl(post.author_login || username)} alt="Avatar" style={styles.postAvatar} />
                  <span style={styles.postAuthor}>@{post.author_login || username}</span>
                </div>
              </div>
              <p style={styles.postContent}>{post.content}</p>
              <div style={styles.tags}>
                {post.tags?.map((tag, tagIndex) => (
                  <span key={`${post.id}-tag-${tagIndex}`} style={styles.tag}>- {tag.name}</span>
                ))}
              </div>
              <div style={styles.postFooter}>
                <button onClick={() => handleLike(post.id)} style={{ ...styles.likeButton, color: post.user_liked ? '#ff4444' : '#9F9EC3' }}>
                  ❤️ {post.likes || 0}
                </button>
                <button onClick={() => handleDislike(post.id)} style={{ ...styles.dislikeButton, color: post.user_disliked ? '#ff4444' : '#9F9EC3' }}>
                  💔 {post.dislikes || 0}
                </button>
              </div>
            </div>
          ))}
          {!loading && userPosts.length === 0 && (
            <p style={styles.noPosts}>No posts yet. Create your first post!</p>
          )}
        </div>
      </div>
      {showCreateModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Create a new post</h3>
              <button onClick={() => setShowCreateModal(false)} style={styles.modalClose}>✕</button>
            </div>
            <textarea placeholder="What's on your mind?" value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} style={styles.modalTextarea} rows="6" autoFocus />
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
    marginBottom: '15px',
  },
  profileBio: {
    fontFamily: "'IM Fell French Canon', serif",
    fontSize: '21px',
    color: '#304069',
    marginBottom: '25px',
    lineHeight: '1.5',
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
    overflow: 'hidden',
    border: '2px solid #9EABC3',
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  postActions: {
    display: 'flex',
    gap: '20px',
  },
  editButton: {
    padding: '10px 20px',
    background: 'white',
    border: '2px solid #9EABC3',
    borderRadius: '30px',
    fontSize: '21px',
    fontFamily: "'IM Fell French Canon', serif",
    color: '#92A9E0',
    cursor: 'pointer',
  },
  deleteButton: {
    padding: '10px 20px',
    background: 'white',
    border: '2px solid #ff4444',
    borderRadius: '30px',
    fontSize: '21px',
    fontFamily: "'IM Fell French Canon', serif",
    color: '#ff4444',
    cursor: 'pointer',
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

export default Profile;