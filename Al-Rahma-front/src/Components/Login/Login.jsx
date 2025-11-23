import React, { useState } from 'react';
import './Login.css';
import logo from '../../assets/Al-Rahma-Logo.jpg';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent default form submission that causes page refresh
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    
    setErrorMessage(''); // Clear previous errors
    setLoading(true);

    try {
      // Basic validation
      if (!email || !password) {
        throw new Error('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
      }

      const userData = await login(email, password);
     
     
      const userRole = userData?.Role || userData?.role;
     
      // Navigate based on role
      if (userRole === 'SuperAdmin') {
        navigate('/');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error object:', error);
     
      // Translate English error messages to Arabic
      let displayMessage = 'فشل تسجيل الدخول. الرجاء المحاولة مرة أخرى';
     
      // Check for specific error messages
      const errorMsg = error.message || '';
      
      if (errorMsg.toLowerCase().includes('invalid credentials') || 
          errorMsg.toLowerCase().includes('invalid email or password')) {
        displayMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
      } else if (errorMsg.toLowerCase().includes('account disabled') || 
                 errorMsg.toLowerCase().includes('not active')) {
        displayMessage = 'تم تعطيل هذا الحساب. الرجاء التواصل مع الإدارة';
      } else if (errorMsg.toLowerCase().includes('network error')) {
        displayMessage = 'خطأ في الاتصال بالخادم. الرجاء التحقق من الإنترنت';
      } else if (errorMsg && !errorMsg.includes('status code') && !errorMsg.includes('Network Error')) {
        // Use the original message if it's meaningful and in Arabic
        displayMessage = errorMsg;
      }
     
      setErrorMessage(displayMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <img src={logo} alt="Logo" className="logo" />
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {errorMessage && (
            <div className="error-alert" role="alert">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{errorMessage}</span>
            </div>
          )}
         
          <div className="form-group">
            <label htmlFor="email">البريد الإلكتروني أو اسم المستخدم</label>
            <input
              type="text"
              id="email"
              name="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMessage(''); // Clear error when user types
              }}
              required
              disabled={loading}
              className={errorMessage ? 'input-error' : ''}
              autoComplete="email"
            />
          </div>
         
          <div className="form-group">
            <label htmlFor="password">كلمة المرور</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMessage(''); // Clear error when user types
              }}
              required
              disabled={loading}
              className={errorMessage ? 'input-error' : ''}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" disabled={loading || !email || !password}>
            {loading ? (
              <>
                <span className="spinner-border"></span>
                جاري تسجيل الدخول...
              </>
            ) : (
              'تسجيل الدخول'
            )}
          </button>


        </form>
      </div>
    </div>
  );
};

export default Login;