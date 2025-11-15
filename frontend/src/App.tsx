import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PackageListPage from './pages/PackageListPage';
import PackageDetailPage from './pages/PackageDetailPage';
import ReleaseDetailPage from './pages/ReleaseDetailPage';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { User } from './types';
import './App.css';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(true);

  useEffect(() => {
    // Check for saved user
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="container">
            <div className="header-content">
              <div className="header-left">
                <Link to="/" className="logo">
                  <h1>Flo Package Registry</h1>
                </Link>
                <nav className="main-nav">
                  <Link to="/packages">Packages</Link>
                  {user?.isAdmin && <Link to="/admin">Admin</Link>}
                </nav>
              </div>
              <div className="header-right">
                <button 
                  className="theme-toggle" 
                  onClick={() => setDarkMode(!darkMode)}
                  aria-label="Toggle theme"
                >
                  {darkMode ? '☀️' : '🌙'}
                </button>
                {user ? (
                  <div className="user-menu">
                    <span className="username">{user.username}</span>
                    <button onClick={handleLogout} className="btn btn-secondary">
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="auth-links">
                    <Link to="/login" className="btn btn-secondary">Login</Link>
                    <Link to="/register" className="btn btn-primary">Register</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/packages" element={<PackageListPage />} />
            <Route path="/packages/:owner/:name" element={<PackageDetailPage />} />
            <Route path="/packages/:owner/:name/releases/:version" element={<ReleaseDetailPage />} />
            <Route path="/admin/*" element={<AdminDashboard user={user} />} />
            <Route path="/login" element={<LoginPage setUser={setUser} />} />
            <Route path="/register" element={<RegisterPage setUser={setUser} />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <div className="container">
            <p>&copy; 2025 Flo Package Registry. Open source package management made simple.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
