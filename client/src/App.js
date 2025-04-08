import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import Terms from './Terms';
import Dashboard from './Dashboard';
import Landing from './Landing';
import '@fortawesome/fontawesome-free/css/all.min.css'; // خط اضافه‌شده برای Font Awesome
import './App.css';

function App() {
  const [showLogin, setShowLogin] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    if (initialCheckDone) {
      return;
    }

    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
    setInitialCheckDone(true);
  }, [initialCheckDone]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setInitialCheckDone(false);
    setShowLogin(true);
  };

  return (
    <div className="App" dir="rtl">
      <div className="app-container">
        <div className="container">
          <Routes>
            {/* صفحه لندینگ به عنوان صفحه پیش‌فرض */}
            <Route path="/" element={<Landing isLoggedIn={isLoggedIn} />} />

            <Route
              path="/login"
              element={
                isLoggedIn ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <>
                    <Login setIsLoggedIn={setIsLoggedIn} />
                    <p className="switch-text">
                      حساب نداری؟{' '}
                      <span className="switch" onClick={() => setShowLogin(false)}>
                        ثبت‌نام کن
                      </span>
                    </p>
                  </>
                )
              }
            />

            <Route
              path="/register"
              element={
                isLoggedIn ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <>
                    <Register setShowLogin={setShowLogin} />
                    <p className="switch-text">
                      حساب داری؟{' '}
                      <span className="switch" onClick={() => setShowLogin(true)}>
                        وارد شو
                      </span>
                    </p>
                  </>
                )
              }
            />

            <Route path="/terms" element={<Terms />} />

            <Route
              path="/dashboard"
              element={
                isLoggedIn ? (
                  <Dashboard handleLogout={handleLogout} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}