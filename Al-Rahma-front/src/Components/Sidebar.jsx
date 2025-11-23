import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext.jsx';
import '../assets/Al-Rahma-Logo.jpg';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [openSubmenus, setOpenSubmenus] = useState({
    dons: location.pathname.includes('/dons') || 
          location.pathname.includes('/aid') ||
          location.pathname.includes('/donations') ||
          location.pathname.includes('/gift') ||
          location.pathname.includes('/testament'),
    projects: location.pathname.includes('/finished-projects') ||
              location.pathname.includes('/ongoing-projects') ||
              location.pathname.includes('/suggested-programs')
  });

  const toggleSubmenu = (menu) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  // Option 1: Force refresh navigation (use this if CSS isn't loading)
  const handleNavigation = (path, e) => {
    e.preventDefault();
    if (location.pathname === path) {
      // If already on the page, force reload
      window.location.reload();
    } else {
      // Navigate to new page with refresh
      window.location.href = path;
    }
  };

  // Option 2: Navigate with key change to force remount
  const handleNavigationRemount = (path, e) => {
    e.preventDefault();
    if (location.pathname === path) {
      // Force component remount
      navigate(path, { replace: true, state: { refresh: Date.now() } });
      setTimeout(() => window.location.reload(), 10);
    } else {
      navigate(path);
    }
  };

  return (
    <div
      className="offcanvas offcanvas-start sidebar"
      tabIndex="-1"
      id="offcanvasSidebar"
      aria-labelledby="offcanvasSidebarLabel"
    >
      <div className="sidebar-header">
        <div className="logo-container">
          <img src="Al-Rahma-Logo.jpg" alt="Logo" className="sidebar-logo" />
        </div>
      </div>
      <div className="offcanvas-body">
        <nav className="nav flex-column">
          {['SuperAdmin', 'Admin', 'User' ].includes(user?.Role) && (
            <NavLink 
              className="nav-link" 
              to="/" 
              onClick={(e) => handleNavigation('/', e)}
            >
              <span className="nav-icon">🏠</span>
              الرئيسية
            </NavLink>
          )}

          {['SuperAdmin'].includes(user?.Role) && (
            <NavLink 
              className="nav-link" 
              to="/users"
              onClick={(e) => handleNavigation('/users', e)}
            >
              <span className="nav-icon">🖥️</span>
              قائمة المستخدمين
            </NavLink>
          )}

          {['SuperAdmin', 'Admin'].includes(user?.Role) && (
            <NavLink 
              className="nav-link" 
              to="/member"
              onClick={(e) => handleNavigation('/member', e)}
            >
              <span className="nav-icon">👤</span>
              قائمة الأعضاء
            </NavLink>
          )}

          {['SuperAdmin', 'Admin'].includes(user?.Role) && (
            <NavLink 
              className="nav-link" 
              to="/waiting-list"
              onClick={(e) => handleNavigation('/waiting-list', e)}
            >
              <span className="nav-icon">⏳</span>
              قائمة الانتظار
            </NavLink>
          )}

          {['SuperAdmin', 'Admin', 'User'].includes(user?.Role) && (
            <div className="nav-item">
              <div 
                className={`nav-link ${openSubmenus.projects ? 'active' : ''}`}
                onClick={() => toggleSubmenu('projects')}
              >
                <span className="nav-icon">🏗️</span>
                المشاريع والبرامج
                <span className="submenu-toggle">
                  {openSubmenus.projects ? <FaChevronDown /> : <FaChevronRight />}
                </span>
              </div>
              <div className={`sub-list ${openSubmenus.projects ? 'open' : ''}`}>
                {['SuperAdmin', 'Admin'].includes(user?.Role) && (
                  <>
                    <NavLink 
                      className="nav-link sub-link" 
                      to="/finished-projects"
                      onClick={(e) => handleNavigation('/finished-projects', e)}
                    >
                      <span className="nav-icon">✅</span>
                      المشاريع المنجزة
                    </NavLink>
                    <NavLink 
                      className="nav-link sub-link" 
                      to="/ongoing-projects"
                      onClick={(e) => handleNavigation('/ongoing-projects', e)}
                    >
                      <span className="nav-icon">🔄</span>
                      المشاريع الجارية
                    </NavLink>
                  </>
                )}
                <NavLink 
                  className="nav-link sub-link" 
                  to="/suggested-programs"
                  onClick={(e) => handleNavigation('/suggested-programs', e)}
                >
                  <span className="nav-icon">📝</span>
                  البرامج المقترحة
                </NavLink>
              </div>
            </div>
          )}

          {['SuperAdmin', 'Admin', 'User'].includes(user?.Role) && (
            <NavLink 
              className="nav-link" 
              to="/pv"
              onClick={(e) => handleNavigation('/pv', e)}
            >
              <span className="nav-icon">📋</span>
              المداولات و القرارات          
            </NavLink>
          )}

          {['SuperAdmin', 'Admin'].includes(user?.Role) && (
            <div className="nav-item">
              <div 
                className={`nav-link ${openSubmenus.dons ? 'active' : ''}`}
                onClick={() => toggleSubmenu('dons')}
              >
                <span className="nav-icon">💝</span>
                التبرعات و المساعدات
                <span className="submenu-toggle">
                  {openSubmenus.dons ? <FaChevronDown /> : <FaChevronRight />}
                </span>
              </div>
              <div className={`sub-list ${openSubmenus.dons ? 'open' : ''}`}>
                <NavLink 
                  className="nav-link sub-link" 
                  to="/donations"
                  onClick={(e) => handleNavigation('/donations', e)}
                >
                  <span className="nav-icon">💰</span>
                  التبرعات
                </NavLink>
                <NavLink 
                  className="nav-link sub-link" 
                  to="/gift"
                  onClick={(e) => handleNavigation('/gift', e)}
                >
                  <span className="nav-icon">🎁</span>
                  الهبات
                </NavLink>
                <NavLink 
                  className="nav-link sub-link" 
                  to="/testament"
                  onClick={(e) => handleNavigation('/testament', e)}
                >
                  <span className="nav-icon">📜</span>
                  الوصايا
                </NavLink>
                <NavLink 
                  className="nav-link sub-link" 
                  to="/aid"
                  onClick={(e) => handleNavigation('/aid', e)}
                >
                  <span className="nav-icon">🆘</span>
                  المساعدات
                </NavLink>
              </div>
            </div>
          )}

          {['SuperAdmin', 'Admin'].includes(user?.Role) && (
            <NavLink 
              className="nav-link" 
              to="/purchase"
              onClick={(e) => handleNavigation('/purchase', e)}
            >
              <span className="nav-icon">💰</span>
              الشرائات
           </NavLink>
          )}

          {['SuperAdmin', 'Admin'].includes(user?.Role) && (
            <NavLink 
              className="nav-link" 
              to="/stock-management"
              onClick={(e) => handleNavigation('/stock-management', e)}
            >
              <span className="nav-icon">🏬</span>
              إدارة المخزون
           </NavLink>
          )}

          {['SuperAdmin', 'Admin'].includes(user?.Role) && (
            <>
              <NavLink 
                className="nav-link" 
                to="/medicequip"
                onClick={(e) => handleNavigation('/medicequip', e)}
              >
                <span className="nav-icon">🏥</span>
                المعدات الطبية
              </NavLink>
              
              <NavLink 
                className="nav-link" 
                to="/dispatch"
                onClick={(e) => handleNavigation('/dispatch', e)}
              >
                <span className="nav-icon">🔄</span>
                الاعارات            
              </NavLink>
              
              <NavLink 
                className="nav-link" 
                to="/actimm"
                onClick={(e) => handleNavigation('/actimm', e)}
              >
                <span className="nav-icon">🏢</span>
                الأصول الثابتة
              </NavLink>
              
              <NavLink 
                className="nav-link" 
                to="/general-sessions"
                onClick={(e) => handleNavigation('/general-sessions', e)}
              >
                <span className="nav-icon">👥</span>
                الجلسات العامة
              </NavLink>
              
              <NavLink 
                className="nav-link" 
                to="/internal-regulations"
                onClick={(e) => handleNavigation('/internal-regulations', e)}
              >
                <span className="nav-icon">📊</span>
                النظام الداخلي
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;