import React from 'react';
import { FaBars, FaUserCircle, FaSignOutAlt, FaBell, FaUserEdit, FaKey } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

const Header = () => {
  const { logout, user } = useAuth(); 

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  // Get the user's display name
  const getUserDisplayName = () => {
    if (!user) return 'المستخدم';
    
    // Check if we have both first and last name
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    
    // Check if we have just first name
    if (user.firstName) {
      return user.firstName;
    }
    
    // Check if we have just last name
    if (user.lastName) {
      return user.lastName;
    }
    
    // Fallback to name property or default
    return user.name || 'المستخدم';
  };


  return (
    <header className="header">
      <div className="header-left">
        <button
          className="sidebar-toggle-button"
          data-bs-toggle="offcanvas"
          data-bs-target="#offcanvasSidebar"
          aria-controls="offcanvasSidebar"
          aria-label="Toggle Sidebar"
        >
          <FaBars className="toggle-icon" />
        </button>
        <h1 className="header-title">
          <span className="org-name">جمعية الرحمة</span>
          <span className="dashboard-title">: فضاء الإدارة</span>
        </h1>
      </div>

      <div className="header-right">
        <div className="header-right-content">

          <div className="user-dropdown">
            <button
              className="user-profile-btn"
              type="button"
              id="dropdownMenuButton"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <FaUserCircle className="user-icon" />
              <span className="username">{getUserDisplayName()}</span>
            </button>
            <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="dropdownMenuButton">
              <li>
                <Link className="dropdown-item" to="/profile">
                  <FaUserEdit className="me-2" />
                  تعديل الملف الشخصي
                </Link>
              </li>
              <li>
                <Link className="dropdown-item" to="/update-password">
                  <FaKey className="me-2" />
                  تغيير كلمة المرور
                </Link>
              </li>
              <li>
                <button className="dropdown-item" onClick={handleLogout}>
                  <FaSignOutAlt className="me-2" />
                  تسجيل الخروج
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;


