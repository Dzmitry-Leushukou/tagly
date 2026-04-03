import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

function Register() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: 'Male',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [photo, setPhoto] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    try {
      await authAPI.register(form.username, form.password);
      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (error) {
      alert('Registration failed');
    }
  };

  return (
    <div >
      <div >
       
        <h1 >Create your account</h1>

        <form onSubmit={handleSubmit}>
          
          <div >
            <div >Upload a profile photo</div>
            <div  onClick={() => document.getElementById('photoInput').click()}>
              {photo ? (
                <img src={URL.createObjectURL(photo)} alt="Profile"  />
              ) : (
                <div >
                  <span>📷</span>
                </div>
              )}
              <input
                type="file"
                id="photoInput"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files[0])}
               
              />
            </div>
          </div>

          <div >Enter your name</div>
          <div >
            <div s>
              <input
                placeholder="First name"
                value={form.firstName}
                onChange={(e) => setForm({...form, firstName: e.target.value})}
               
              />
              <div >Ivan</div>
            </div>
            <div >
              <input
                placeholder="Last name"
                value={form.lastName}
                onChange={(e) => setForm({...form, lastName: e.target.value})}
                
              />
              <div >Ivanov</div>
            </div>
          </div>

          <div >Date of birth</div>
          <div s>
            <input
              type="text"
              placeholder="MM-DD-YYYY"
              value={form.birthDate}
              onChange={(e) => setForm({...form, birthDate: e.target.value})}
              
            />
            <div >MM-DD-YYYY</div>
          </div>

          <div >
            <label >
              <input type="radio" name="gender" value="Male" checked={form.gender === 'Male'} onChange={(e) => setForm({...form, gender: e.target.value})} />
              Male
            </label>
            <label >
              <input type="radio" name="gender" value="Female" checked={form.gender === 'Female'} onChange={(e) => setForm({...form, gender: e.target.value})} />
              Female
            </label>
          </div>

          <div >Username</div>
          <div >
            <input
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm({...form, username: e.target.value})}
             
            />
            <div >user_88</div>
          </div>

          <div >Password</div>
          <div >
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({...form, password: e.target.value})}
              
            />
            <div >
              8+ symbols <span >•</span> 1 number <span >•</span> 1 capital letter
            </div>
          </div>

          <div >
            <input
              type="password"
              placeholder="Confirm password"
              value={form.confirmPassword}
              onChange={(e) => setForm({...form, confirmPassword: e.target.value})}
              
            />
          </div>

          <button type="submit" >submit</button>
        </form>
      </div>
    </div>
  );
}

export default Register;