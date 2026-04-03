import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { postsAPI } from '../services/api';

function Home() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const res = await postsAPI.getRecommendations();
      setPosts(res.data.recommendations);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim()) return;
    await postsAPI.createPost(newPost);
    setNewPost('');
    loadPosts();
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div >
      <div >
        <h2>Tagly</h2>
        <button onClick={() => document.getElementById('postInput').focus()} > Create a new post</button>
        <button onClick={handleLogout} >🚪 Logout</button>
      </div>
      <div s>
        <div >
          <textarea
            id="postInput"
            placeholder="What's on your mind?"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
           
          />
          <button onClick={handleCreatePost} >Post</button>
        </div>
        <div >
          {posts.map(post => (
            <div key={post.id} >
              <p><strong>@{post.author_id}</strong></p>
              <p>{post.content}</p>
              <div >{post.tags?.map(t => <span key={t.id} >#{t.name}</span>)}</div>
              <div >
                <button onClick={() => postsAPI.sendFeedback(post.id, 'like')}>👍 Like</button>
                <button onClick={() => postsAPI.sendFeedback(post.id, 'dislike')}>👎 Dislike</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;