// Моковые данные для разработки, пока бэкенд не готов

let mockPosts = [
    {
      id: 1,
      content: "Just launched my new project! 🚀 Really excited about this one. #coding #development",
      author_login: "alice",
      author_id: 1,
      tags: [{ id: 1, name: "coding" }, { id: 2, name: "development" }],
      likes: 15,
      created_at: "2024-04-01T10:00:00Z"
    },
    {
      id: 2,
      content: "Beautiful sunset today! 🌅 Nature is amazing. #photography #nature",
      author_login: "bob",
      author_id: 2,
      tags: [{ id: 3, name: "photography" }, { id: 4, name: "nature" }],
      likes: 8,
      created_at: "2024-04-02T15:30:00Z"
    },
    {
      id: 3,
      content: "Just finished reading a great book. Highly recommend! 📚 #books #reading",
      author_login: "carol",
      author_id: 3,
      tags: [{ id: 5, name: "books" }, { id: 6, name: "reading" }],
      likes: 12,
      created_at: "2024-04-03T09:15:00Z"
    },
    {
      id: 4,
      content: "Working on a new AI project. Machine learning is fascinating! 🤖 #ai #machinelearning",
      author_login: "alice",
      author_id: 1,
      tags: [{ id: 7, name: "ai" }, { id: 8, name: "machinelearning" }],
      likes: 24,
      created_at: "2024-04-03T14:20:00Z"
    },
    {
      id: 5,
      content: "Delicious homemade pizza tonight! 🍕 #cooking #food",
      author_login: "dave",
      author_id: 4,
      tags: [{ id: 9, name: "cooking" }, { id: 10, name: "food" }],
      likes: 6,
      created_at: "2024-04-03T19:45:00Z"
    }
  ];
  
  let nextPostId = 6;
  let currentUser = null;
  
  // Симуляция задержки сети
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  export const mockAPI = {
    // Auth
    register: async (login, password) => {
      await delay(500);
      // Простая валидация
      if (login === 'testuser') {
        throw { response: { status: 409, data: { status: "Error: User already exists" } } };
      }
      return { data: { status: "Success" } };
    },
  
    login: async (login, password) => {
      await delay(500);
      if (login === 'testuser' && password === 'test123') {
        currentUser = { login };
        return {
          data: {
            status: "Success",
            access_token: "mock_access_token_" + Date.now(),
            refresh_token: "mock_refresh_token_" + Date.now()
          }
        };
      }
      throw { response: { status: 401, data: { status: "Error: Invalid credentials" } } };
    },
  
    // Posts
    getRecommendations: async (page = 1, limit = 5) => {
      await delay(300);
      const start = (page - 1) * limit;
      const end = start + limit;
      return {
        data: {
          recommendations: mockPosts.slice(start, end),
          has_more: end < mockPosts.length
        }
      };
    },
  
    createPost: async (content) => {
      await delay(800);
      const newPost = {
        id: nextPostId++,
        content: content,
        author_login: currentUser?.login || "current_user",
        author_id: 999,
        tags: [{ id: 99, name: "new" }],
        likes: 0,
        created_at: new Date().toISOString()
      };
      mockPosts.unshift(newPost);
      return { data: { post_id: newPost.id, tags: ["new"] } };
    },
  
    sendFeedback: async (post_id, feedback_type) => {
      await delay(300);
      const post = mockPosts.find(p => p.id === post_id);
      if (post) {
        if (feedback_type === 'like') {
          post.likes += 1;
        } else if (feedback_type === 'dislike') {
          post.likes -= 1;
        }
      }
      return { data: { status: "ok", updated_vector: {} } };
    },
  
    getUserPosts: async () => {
      await delay(300);
      const userPosts = mockPosts.filter(p => p.author_login === currentUser?.login);
      return { data: { posts: userPosts } };
    },
  
    getUserPostsByLogin: async (login) => {
      await delay(300);
      const userPosts = mockPosts.filter(p => p.author_login === login);
      return { data: { posts: userPosts } };
    },
  
    getAllTags: async () => {
      await delay(200);
      return {
        data: {
          tags: [
            { id: 1, name: "coding" },
            { id: 2, name: "development" },
            { id: 3, name: "photography" },
            { id: 4, name: "nature" },
            { id: 5, name: "books" },
            { id: 6, name: "reading" },
            { id: 7, name: "ai" },
            { id: 8, name: "machinelearning" },
            { id: 9, name: "cooking" },
            { id: 10, name: "food" },
          ]
        }
      };
    },
  
    saveUserTags: async (tagIds) => {
      await delay(300);
      console.log('Saved tags:', tagIds);
      return { data: { status: "ok" } };
    }
  };