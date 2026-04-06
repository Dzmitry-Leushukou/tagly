import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, userAPI } from '../services/api';

function Login() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await authAPI.login(login, password);
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
      localStorage.setItem('login', login);
      
      try {
        const userResponse = await userAPI.getUser(login);
        const userData = userResponse.data;
      
        if (userData.first_name) localStorage.setItem('firstName', userData.first_name);
        if (userData.last_name) localStorage.setItem('lastName', userData.last_name);
        if (userData.bio) localStorage.setItem('bio', userData.bio);
      } catch (err) {
        console.error('Could not fetch user data:', err);
        
        if (!localStorage.getItem('firstName')) {
          localStorage.setItem('firstName', login);
          localStorage.setItem('lastName', '');
        }
      }
      
      navigate('/');
    } catch (error) {
      setError('Ошибка входа. Проверьте логин и пароль.');
    }
  };

 
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.blueShape}>
          <span style={styles.loginTitle}>log in to </span>
          <span style={styles.taglyTitle}>Tagly</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.inputWrapper}>
            <input
              type="text"
              placeholder="login"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              style={styles.input}
            />
          </div>
          
          <div style={styles.inputWrapper}>
            <input
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
          </div>
          
          {error && <p style={styles.errorText}>{error}</p>}
          
          <div style={styles.submitWrapper}>
            <button type="submit" style={styles.submitBtn}>submit</button>
          </div>
        </form>
        
        <div style={styles.bottomButtonsContainer}>
          <button style={styles.resetBtn}>reset password</button>
          <button style={styles.signupBtn} onClick={() => navigate('/register')}>sign up</button>
        </div>
      </div>
      
      <div style={styles.monsterContainer}>
        <img 
          src="/images/monster.png"
          alt="Monster"
          style={styles.monster}
        />
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #FFE6FB 5%, #DDE9FF 100%)',
    position: 'relative',
  },
  card: {
    width: '700px',
    height: '450px',
    background: '#FFFFFF',
    borderRadius: '50px',
    border: '2px solid #9EABC3',
    padding: '0',
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
  },
  blueShape: {
    background: '#92A9E0',
    borderRadius: '48px 48px 0 0',
    padding: '30px 20px',
    textAlign: 'center',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '5px',
  },
  loginTitle: {
    fontFamily: "'IM Fell French Canon', serif",
    fontSize: '40px',
    color: '#304069',
    fontWeight: 'bold',
    margin: 0,
  },
  taglyTitle: {
    fontFamily: "'Irish Grover', cursive",
    fontSize: '60px',
    color: '#FFFFFF',
    textShadow: '2px 2px 0 #304069, -2px -2px 0 #304069, 2px -2px 0 #304069, -2px 2px 0 #304069',
    fontWeight: 'normal',
    margin: 0,
  },
  inputWrapper: {
    marginTop: '40px',
    padding: '0 30px',
  },
  input: {
    width: '100%',
    height: '65px',
    padding: '0 40px',
    border: '2px solid #9EABC3',
    borderRadius: '20px',
    fontSize: '26px',
    fontFamily: "'IM Fell French Canon', serif",
    fontStyle: 'italic',
    color: '#304069',
    background: 'rgba(159, 158, 195, 0.05)',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'all 0.3s ease',
  },
  submitWrapper: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '0 30px',
    marginTop: '30px',
  },
  submitBtn: {
    padding: '12px 35px',
    background: '#92A9E0',
    border: '2px solid #9EABC3',
    borderRadius: '20px',
    fontSize: '26px',
    fontFamily: "'IM Fell French Canon', serif",
    fontStyle: 'italic',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  bottomButtonsContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '40px',
    marginTop: '40px',
    marginBottom: '40px',
    padding: '0 30px',
  },
  resetBtn: {
    background: 'none',
    border: 'none',
    fontSize: '26px',
    fontFamily: "'IM Fell French Canon', serif",
    color: '#9F9EC3',
    cursor: 'pointer',
    fontStyle: 'italic',
    textDecoration: 'underline',
    transition: 'all 0.3s ease',
    padding: '0',
  },
  signupBtn: {
    background: 'none',
    border: 'none',
    fontSize: '26px',
    fontFamily: "'IM Fell French Canon', serif",
    color: '#9F9EC3',
    cursor: 'pointer',
    fontStyle: 'italic',
    textDecoration: 'underline',
    transition: 'all 0.3s ease',
    padding: '0',
  },
  monsterContainer: {
    position: 'absolute',
    bottom: '50px',
    right: '50px',
    zIndex: 1,
  },
  monster: {
    width: '400px',
    height: 'auto',
    opacity: 0.9,
  },
  errorText: {
    color: 'red',
    fontSize: '18px',
    marginTop: '10px',
    textAlign: 'center',
  },
};

export default Login;