import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import TagSelection from './pages/TagSelection';
import Home from './pages/Home';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import CreatePost from './pages/CreatePost';

function App() {
  const isAuthenticated = !!localStorage.getItem('access_token');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/tag-selection" element={isAuthenticated ? <TagSelection /> : <Navigate to="/login" />} />
        <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/login" />} />
        <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/user/:login" element={isAuthenticated ? <UserProfile /> : <Navigate to="/login" />} />
        <Route path="/create-post" element={isAuthenticated ? <CreatePost /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;