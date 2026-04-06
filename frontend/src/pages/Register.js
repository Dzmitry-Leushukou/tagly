import React, { useState, useEffect } from 'react';
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
  const [error, setError] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const navigate = useNavigate();

  const hasMinLength = form.password.length >= 8;
  const hasNumber = /\d/.test(form.password);
  const hasCapital = /[A-Z]/.test(form.password);
  const isPasswordValid = hasMinLength && hasNumber && hasCapital;
  const passwordsMatch = form.password === form.confirmPassword && form.password !== '';

  useEffect(() => {
    const checkUsername = async () => {
      if (form.username.length < 3) {
        setUsernameAvailable(null);
        return;
      }
      setCheckingUsername(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        const takenUsernames = ['admin', 'user', 'test', 'ivan', 'alice'];
        const isTaken = takenUsernames.includes(form.username.toLowerCase());
        setUsernameAvailable(!isTaken);
      } catch (error) {
        setUsernameAvailable(false);
      } finally {
        setCheckingUsername(false);
      }
    };
    checkUsername();
  }, [form.username]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (!isPasswordValid) {
      setError('Password does not meet requirements');
      return;
    }
    
    if (!usernameAvailable) {
      setError('Username is already taken');
      return;
    }
    
    try {
      await authAPI.register(form.username, form.password);
      const response = await authAPI.login(form.username, form.password);
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
      localStorage.setItem('login', form.username);
      localStorage.setItem('firstName', form.firstName);
      localStorage.setItem('lastName', form.lastName);
      localStorage.setItem('bio', '');
      navigate('/tag-selection');
    } catch (error) {
      setError('Registration failed. User may already exist.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.blueShape}>
          <span style={styles.title}>Create your account</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.photoSection}>
            <div style={styles.photoUpload} onClick={() => document.getElementById('photoInput').click()}>
              {photo ? (
                <img src={URL.createObjectURL(photo)} alt="Profile" style={styles.photoPreview} />
              ) : (
                <div style={styles.photoPlaceholder}>📷</div>
              )}
              <input
                type="file"
                id="photoInput"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files[0])}
                style={styles.hiddenInput}
              />
            </div>
            <div style={styles.photoLabel}>Upload a profile photo</div>
          </div>

          <div style={styles.nameContainer}>
            <div style={styles.nameContainerLabel}>Enter your name</div>
            <div style={styles.nameRow}>
              <div style={styles.nameField}>
                <input
                  type="text"
                  placeholder="First name"
                  value={form.firstName}
                  onChange={(e) => setForm({...form, firstName: e.target.value})}
                  style={styles.nameInput}
                />
              </div>
              <div style={styles.nameField}>
                <input
                  type="text"
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={(e) => setForm({...form, lastName: e.target.value})}
                  style={styles.nameInput}
                />
              </div>
            </div>
          </div>

          <div style={styles.rowContainer}>
            <div style={styles.halfField}>
              <div style={styles.fieldLabel}>Date of birth</div>
              <input
                type="text"
                placeholder="YYYY-MM-DD"
                value={form.birthDate}
                onChange={(e) => setForm({...form, birthDate: e.target.value})}
                style={styles.input}
              />
            </div>
            <div style={styles.halfField}>
              <div style={styles.fieldLabel}>Gender</div>
              <div style={styles.genderGroup}>
                <label style={styles.genderLabel}>
                  <input type="radio" name="gender" value="Male" checked={form.gender === 'Male'} onChange={(e) => setForm({...form, gender: e.target.value})} />
                  Male
                </label>
                <label style={styles.genderLabel}>
                  <input type="radio" name="gender" value="Female" checked={form.gender === 'Female'} onChange={(e) => setForm({...form, gender: e.target.value})} />
                  Female
                </label>
              </div>
            </div>
          </div>

          <div style={styles.fieldContainer}>
            <div style={styles.fieldLabel}>Username</div>
            <div style={styles.inputIconWrapper}>
              <input
                type="text"
                placeholder="User_88"
                value={form.username}
                onChange={(e) => setForm({...form, username: e.target.value})}
                style={styles.inputWithIcon}
              />
              {checkingUsername && <span style={styles.checkingIcon}>⏳</span>}
              {!checkingUsername && usernameAvailable === true && form.username.length > 0 && (
                <span style={styles.successIcon}>✓</span>
              )}
              {!checkingUsername && usernameAvailable === false && form.username.length > 0 && (
                <span style={styles.errorIcon}>✘</span>
              )}
            </div>
          </div>

          <div style={styles.passwordContainer}>
            <div style={styles.passwordRow}>
              <div style={styles.passwordField}>
                <div style={styles.fieldLabel}>Password</div>
                <div style={styles.inputIconWrapper}>
                  <input
                    type="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={(e) => setForm({...form, password: e.target.value})}
                    style={styles.passwordInput}
                  />
                </div>
              </div>
              <div style={styles.passwordField}>
                <div style={styles.fieldLabel}>Confirm password</div>
                <div style={styles.inputIconWrapper}>
                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({...form, confirmPassword: e.target.value})}
                    style={styles.passwordInput}
                  />
                  {form.confirmPassword && (
                    <span style={passwordsMatch ? styles.successIcon : styles.errorIcon}>
                      {passwordsMatch ? '✓' : '✘'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div style={styles.passwordHintsLeft}>
              <div style={styles.hintRow}>
                <span style={hasMinLength ? styles.hintSuccess : styles.hintError}>
                  {hasMinLength ? '✓' : '✘'}
                </span>
                <span style={hasMinLength ? styles.hintTextSuccess : styles.hintTextError}>
                  8+ symbols
                </span>
              </div>
              <div style={styles.hintRow}>
                <span style={hasNumber ? styles.hintSuccess : styles.hintError}>
                  {hasNumber ? '✓' : '✘'}
                </span>
                <span style={hasNumber ? styles.hintTextSuccess : styles.hintTextError}>
                  1 number
                </span>
              </div>
              <div style={styles.hintRow}>
                <span style={hasCapital ? styles.hintSuccess : styles.hintError}>
                  {hasCapital ? '✓' : '✘'}
                </span>
                <span style={hasCapital ? styles.hintTextSuccess : styles.hintTextError}>
                  1 capital letter
                </span>
              </div>
            </div>
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <div style={styles.submitWrapper}>
            <button type="submit" style={styles.submitBtn}>submit</button>
          </div>
        </form>
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
  },
  card: {
    width: '1050px',
    background: '#FFFFFF',
    borderRadius: '50px',
    border: '2px solid #9EABC3',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  blueShape: {
    background: '#92A9E0',
    padding: '20px',
    textAlign: 'center',
  },
  title: {
    fontFamily: "'IM Fell French Canon', serif",
    fontSize: '30px',
    color: '#304069',
    fontWeight: 'bold',
    margin: 0,
  },
  photoSection: {
    textAlign: 'center',
    marginTop: '20px',
    marginBottom: '15px',
  },
  photoLabel: {
    fontFamily: "'IM Fell French Canon', serif",
    fontSize: '20px',
    color: '#9F9EC3',
    marginBottom: '8px',
  },
  photoUpload: {
    width: '150px',
    height: '150px',
    borderRadius: '80px',
    background: 'rgba(159, 158, 195, 0.1)',
    border: '2px solid #9EABC3',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
    cursor: 'pointer',
    overflow: 'hidden',
  },
  photoPlaceholder: {
    fontSize: '70px',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  hiddenInput: {
    display: 'none',
  },
  nameContainer: {
    background: 'rgba(159, 158, 195, 0.1)',
    borderRadius: '20px',
    margin: '15px 30px',
    padding: '15px 20px',
    border: '1px solid #9EABC3',
    position: 'relative',
  },
  nameContainerLabel: {
    fontFamily: "'IM Fell French Canon', serif",
    fontSize: '23px',
    color: '#304069',
    textAlign: 'center',
    marginBottom: '15px',
  },
  nameRow: {
    display: 'flex',
    gap: '15px',
  },
  nameField: {
    flex: 1,
  },
  nameInput: {
    width: '100%',
    height: '55px',
    padding: '0 40px',
    border: '2px solid #9EABC3',
    borderRadius: '20px',
    fontSize: '23px',
    fontFamily: "'IM Fell French Canon', serif",
    color: '#304069',
    background: 'white',
    boxSizing: 'border-box',
    outline: 'none',
    fontStyle: 'italic',
  },
  rowContainer: {
    display: 'flex',
    gap: '20px',
    padding: '0 30px',
    marginBottom: '10px',
  },
  halfField: {
    flex: 1,
  },
  fieldLabel: {
    fontFamily: "'IM Fell French Canon', serif",
    fontSize: '23px',
    color: '#304069',
    marginBottom: '5px',
    textAlign: 'left',
  },
  fieldContainer: {
    padding: '0 30px',
    marginBottom: '15px',
  },
  input: {
    width: '100%',
    height: '55px',
    padding: '0 40px',
    border: '2px solid #9EABC3',
    borderRadius: '20px',
    fontSize: '23px',
    fontFamily: "'IM Fell French Canon', serif",
    color: '#304069',
    background: 'rgba(159, 158, 195, 0.1)',
    boxSizing: 'border-box',
    outline: 'none',
    fontStyle: 'italic',
  },
  inputWithIcon: {
    width: '100%',
    height: '55px',
    padding: '0 40px',
    border: '2px solid #9EABC3',
    borderRadius: '20px',
    fontSize: '23px',
    fontFamily: "'IM Fell French Canon', serif",
    color: '#304069',
    background: 'rgba(159, 158, 195, 0.1)',
    boxSizing: 'border-box',
    outline: 'none',
    fontStyle: 'italic',
  },
  inputIconWrapper: {
    position: 'relative',
  },
  successIcon: {
    position: 'absolute',
    right: '15px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#92A9E0',
    fontSize: '16px',
    fontFamily: "'IM Fell French Canon', serif",
    fontWeight: 'normal',
  },
  errorIcon: {
    position: 'absolute',
    right: '15px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#92A9E0',
    fontSize: '16px',
    fontFamily: "'IM Fell French Canon', serif",
    fontWeight: 'normal',
    opacity: 0.5,
  },
  checkingIcon: {
    position: 'absolute',
    right: '15px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#92A9E0',
    fontSize: '14px',
    fontFamily: "'IM Fell French Canon', serif",
    opacity: 0.7,
  },
  genderGroup: {
    display: 'flex',
    gap: '20px',
    marginTop: '5px',
  },
  genderLabel: {
    fontFamily: "'IM Fell French Canon', serif",
    fontSize: '23px',
    color: '#304069',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  passwordContainer: {
    background: 'rgba(159, 158, 195, 0.1)',
    borderRadius: '20px',
    margin: '5px 30px 15px 30px',
    padding: '15px 20px',
    border: '1px solid #9EABC3',
  },
  passwordRow: {
    display: 'flex',
    gap: '15px',
  },
  passwordField: {
    flex: 1,
  },
  passwordHintsLeft: {
    marginTop: '20px',
    paddingLeft: '10px',
    textAlign: 'left',
  },
  hintRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '5px',
  },
  hintSuccess: {
    color: '#4CAF50',
    fontSize: '20px',
    fontWeight: 'bold',
  },
  hintError: {
    color: '#999',
    fontSize: '20px',
  },
  passwordInput: {
    width: '100%',
    height: '55px',
    padding: '0 40px',
    border: '2px solid #9EABC3',
    borderRadius: '20px',
    fontSize: '23px',
    fontFamily: "'IM Fell French Canon', serif",
    color: '#304069',
    background: 'white',
    boxSizing: 'border-box',
    outline: 'none',
    fontStyle: 'italic',
  },
  hintTextSuccess: {
    fontFamily: "'IM Fell French Canon', serif",
    fontSize: '20px',
    color: '#4CAF50',
  },
  hintTextError: {
    fontFamily: "'IM Fell French Canon', serif",
    fontSize: '20px',
    color: '#999',
  },
  submitWrapper: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '10px 30px 25px 30px',
  },
  submitBtn: {
    padding: '10px 35px',
    background: '#92A9E0',
    border: '2px solid #9EABC3',
    borderRadius: '20px',
    fontSize: '20px',
    fontFamily: "'IM Fell French Canon', serif",
    fontStyle: 'italic',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  error: {
    color: 'red',
    fontSize: '14px',
    marginTop: '10px',
    textAlign: 'center',
  },
};

export default Register;