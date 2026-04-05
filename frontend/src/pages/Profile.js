import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { postsAPI } from '../services/api';

function Profile() {
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserPosts();
  }, []);

  const loadUserPosts = async () => {
    try {
      const response = await postsAPI.getUserPosts();
      setUserPosts(response.data.posts || []);
    } catch (error) {
      console.error('Error loading user posts:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await postsAPI.deletePost(postId);
        loadUserPosts();
      } catch (error) {
        alert('Error deleting post');
      }
    }
  };

  const handleEditPost = async (postId, oldContent) => {
    const newContent = prompt('Edit your post:', oldContent);
    if (newContent && newContent.trim()) {
      try {
        await postsAPI.updatePost(postId, newContent);
        loadUserPosts();
      } catch (error) {
        alert('Error updating post');
      }
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length > 1) {
      const results = userPosts.filter(post => 
        post.content.toLowerCase().includes(query.toLowerCase()) ||
        post.tags?.some(tag => tag.name.toLowerCase().includes(query.toLowerCase()))
      );
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  };

  const login = localStorage.getItem('login') || 'user';
  const totalLikes = userPosts.reduce((sum, post) => sum + (post.likes || 0), 0);

  const getAvatarUrl = (name) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=92A9E0&color=fff&size=200&bold=true&length=2`;
  };

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
        {/* Карточка профиля с фото */}
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
              <h1 style={styles.profileName}>Ivan Ivanov</h1>
              <p style={styles.profileUsername}>@{login}</p>
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

        {/* Поле для создания поста */}
        <div style={styles.createPostCard}>
          <div style={styles.createPostHeader}>
            <div style={styles.createPostAvatar}>
              <img 
                src={getAvatarUrl(login)} 
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

        {/* Лента постов пользователя */}
        <div style={styles.feed}>
          {loading && <p style={styles.loading}>Loading...</p>}
          
          {userPosts.map(post => (
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
                <div style={styles.postActions}>
                  <button onClick={() => handleEditPost(post.id, post.content)} style={styles.editButton}>
                    ✏️ Edit
                  </button>
                  <button onClick={() => handleDeletePost(post.id)} style={styles.deleteButton}>
                    🗑️ Delete
                  </button>
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
                <button style={styles.likeButton}>❤️ {post.likes || 0}</button>
              </div>
            </div>
          ))}
          
          {!loading && userPosts.length === 0 && (
            <p style={styles.noPosts}>No posts yet. Create your first post!</p>
          )}
        </div>
      </div>

      {/* Модальное окно создания поста */}
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
    paddingTop: '19px',
    borderTop: '1px solid #9EABC3',
  },
  likeButton: {
    background: 'none',
    border: 'none',
    fontSize: '27px',
    fontFamily: "'IM Fell French Canon', serif",
    color: '#9F9EC3',
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