import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const boxes = [
    { id: 1, color: '#8B5CF6', text: 'استوری‌های اینستاگرام', link: '/instagram-story' },
    { id: 2, color: '#10B981', text: 'پست‌های اینستاگرام', link: '/instagram-post' },
    { id: 3, color: '#3B82F6', text: 'پست‌های لینکدین', link: '/linkedin-post' },
    { id: 4, color: '#F59E0B', text: 'پرزنتیشن', link: '/presentation' },
    { id: 5, color: '#EF4444', text: 'تقدیرنامه', link: '/appreciation' },
    { id: 6, color: '#6366F1', text: 'نامه‌های اداری', link: '/official-letters' },
    { id: 7, color: '#34D399', text: 'طرح‌های تجاری', link: '/business-plan' },
    { id: 8, color: '#F87171', text: 'پوستر', link: '/poster' }, // تغییر نام از "پیچ‌دک" به "پوستر"
    { id: 9, color: '#60A5FA', text: 'بیزینس‌مدل', link: '/business-model' },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNextSlide = () => {
    if (currentSlide + 6 < boxes.length) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const visibleBoxes = boxes.slice(currentSlide, currentSlide + 6);

  const handleProfileClick = () => {
    navigate('/login'); // انتقال به صفحه لاگین
  };

  return (
    <div className="landing-container">
      <div className="header">
        <img
          src={user?.profile_picture_url || 'https://via.placeholder.com/48'}
          alt="Profile"
          className="profile-image"
          onClick={handleProfileClick} // رویداد کلیک برای انتقال به صفحه لاگین
        />
      </div>

      <div className="title">
        <p>امروز میخوای</p>
        <p>چی طراحی کنی؟</p>
      </div>

      <div className="slider">
        {/* فلش سمت چپ */}
        <button
          className="slider-arrow left"
          onClick={handlePrevSlide}
          disabled={currentSlide === 0}
        >
          <i className="fas fa-chevron-left"></i>
        </button>

        <div className="box-container">
          {visibleBoxes.map((box) => (
            <div
              key={box.id}
              className="box"
              style={{ backgroundColor: box.color, cursor: 'pointer' }}
              onClick={() => navigate(box.link)}
            >
              <p className="box-text">{box.text}</p>
            </div>
          ))}
        </div>

        {/* فلش سمت راست */}
        <button
          className="slider-arrow right"
          onClick={handleNextSlide}
          disabled={currentSlide + 6 >= boxes.length}
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  );
};

export default Landing;
