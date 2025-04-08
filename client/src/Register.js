import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function Register({ setShowLogin }) { // prop برای هدایت به لاگین
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone_number: '',
    termsAccepted: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // فقط برای username: فقط حروف کوچک انگلیسی و اعداد 0-9
    if (name === 'username') {
      const validUsername = value.replace(/[^a-z0-9]/g, '');
      setFormData({
        ...formData,
        [name]: validUsername,
      });
    } else if (name === 'phone_number' && value.length > 11) {
      return; // بیشتر از ۱۱ رقم قبول نکن
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value,
      });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); // پاک کردن خطای قبلی
    setSuccess(''); // پاک کردن پیام موفقیت قبلی

    if (formData.password !== formData.confirmPassword) {
      setError('رمز عبور و تأیید رمز عبور باید یکسان باشند');
      return;
    }
    if (!formData.termsAccepted) {
      setError('باید شرایط استفاده رو بپذیری');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          phone_number: formData.phone_number,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('ثبت‌نام با موفقیت انجام شد! در حال انتقال به صفحه ورود...');
        setFormData({
          first_name: '',
          last_name: '',
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          phone_number: '',
          termsAccepted: false,
        });
        setTimeout(() => {
          setShowLogin(true); // هدایت به لاگین بعد از 2 ثانیه
        }, 2000);
      } else {
        setError(data.message || 'ثبت‌نام ناموفق بود');
      }
    } catch (err) {
      setError('خطایی رخ داد! لطفاً دوباره تلاش کن');
    }
  };

  return (
    <div className="form-card">
      <h2>ثبت‌نام</h2>
      <form onSubmit={handleRegister}>
        <div className="form-group">
          <label>نام</label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            placeholder="مثلاً: علی"
            required
          />
        </div>
        <div className="form-group">
          <label>نام خانوادگی</label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            placeholder="مثلاً: رضایی"
            required
          />
        </div>
        <div className="form-group">
          <label>نام کاربری</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="مثلاً: ali123 (فقط حروف کوچک و اعداد)"
            required
          />
        </div>
        <div className="form-group">
          <label>ایمیل (اختیاری)</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="مثلاً: ali@example.com"
          />
        </div>
        <div className="form-group">
          <label>رمز عبور</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="حداقل ۸ کاراکتر"
            required
          />
        </div>
        <div className="form-group">
          <label>تأیید رمز عبور</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="دوباره رمز عبور را وارد کنید"
            required
          />
        </div>
        <div className="form-group">
          <label>شماره تلفن</label>
          <input
            type="text"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            placeholder="مثلاً: 09123456789"
            maxLength="11" // محدودیت در HTML
            required
          />
        </div>
        <div className="terms">
          <input
            type="checkbox"
            name="termsAccepted"
            checked={formData.termsAccepted}
            onChange={handleChange}
          />
          <span>
            <Link to="/terms" className="terms-link">شرایط استفاده</Link> رو می‌پذیرم
          </span>
        </div>
        <button type="submit">ثبت‌نام</button>
      </form>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
    </div>
  );
}

export default Register;