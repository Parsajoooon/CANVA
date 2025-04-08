import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Header.css';

const Header = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleEditProfile = () => {
    navigate('/edit-profile');
  };

  const handleHome = () => {
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-left">
        <h1 onClick={handleHome} style={{ cursor: 'pointer' }}>سامانه مدیریت داکیومنت</h1>
      </div>
      <nav className="header-right">
        {user && (
          <>
            <span>خوش آمدید، {user.first_name} {user.last_name}</span>
            <button onClick={handleEditProfile}>ویرایش پروفایل</button>
            <button onClick={handleHome}>خانه</button>
            <button onClick={onLogout}>خروج</button>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;