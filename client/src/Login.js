import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login({ setIsLoggedIn }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/login', { identifier, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setIsLoggedIn(true);
      setError('');
      navigate('/dashboard');
    } catch (err) {
      setError('شناسه یا رمز عبور اشتباهه!');
      console.error('خطا در ورود:', err.response?.data || err.message);
    }
  };

  const handleForgotPasswordRequest = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/forgot-password', {
        identifier: resetIdentifier
      });
      setResetToken(response.data.resetToken);
      setError('');
      console.log('Reset request sent:', response.data);
    } catch (err) {
      setError(err.response?.data.message || 'خطا در ارسال درخواست!');
      console.error('خطا در درخواست ریست:', err.response?.data || err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/reset-password', {
        identifier: resetIdentifier,
        newPassword,
        resetToken
      });
      setForgotPassword(false);
      setError('');
      setResetIdentifier('');
      setNewPassword('');
      setResetToken('');
      console.log('Password reset successful:', response.data);
      alert('رمزت با موفقیت تغییر کرد، حالا وارد شو!');
    } catch (err) {
      setError(err.response?.data.message || 'خطا در ریست رمز!');
      console.error('خطا در ریست رمز:', err.response?.data || err.message);
    }
  };

  return (
    <div className="form-card">
      {!forgotPassword ? (
        <>
          <h2>ورود</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>شناسه (نام کاربری، ایمیل یا شماره تلفن)</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="شناسه‌ات رو وارد کن"
                required
              />
            </div>
            <div className="form-group">
              <label>رمز عبور</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="رمز عبورت رو وارد کن"
                required
              />
            </div>
            <button type="submit">ورود</button>
          </form>
          {error && <p className="error">{error}</p>}
          <span className="forgot-password" onClick={() => setForgotPassword(true)}>
            رمزت رو فراموش کردی؟
          </span>
        </>
      ) : (
        <>
          <h2>بازیابی رمز عبور</h2>
          <form onSubmit={resetToken ? handleResetPassword : handleForgotPasswordRequest}>
            <div className="form-group">
              <label>ایمیل یا شماره تلفن</label>
              <input
                type="text"
                value={resetIdentifier}
                onChange={(e) => setResetIdentifier(e.target.value)}
                placeholder="ایمیل یا شماره تلفنت رو وارد کن"
                required
              />
            </div>
            {resetToken && (
              <div className="form-group">
                <label>رمز عبور جدید</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="رمز جدیدت رو وارد کن"
                  required
                />
              </div>
            )}
            <button type="submit">{resetToken ? 'تغییر رمز' : 'ارسال درخواست'}</button>
          </form>
          {error && <p className="error">{error}</p>}
          <span className="forgot-password" onClick={() => setForgotPassword(false)}>
            برگشت به ورود
          </span>
        </>
      )}
    </div>
  );
}

export default Login;