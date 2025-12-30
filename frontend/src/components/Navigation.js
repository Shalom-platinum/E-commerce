import React, { useState } from 'react';

export default function Navigation({ currentPage, setCurrentPage, user, onLogout, cartItems }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <button 
            className="logo-btn"
            onClick={() => setCurrentPage('home')}
          >
            🛍️ E-Commerce Store
          </button>
        </div>

        <button 
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          ☰
        </button>

        <ul className={`navbar-menu ${mobileMenuOpen ? 'active' : ''}`}>
          <li>
            <button 
              className={currentPage === 'home' ? 'nav-link active' : 'nav-link'}
              onClick={() => { setCurrentPage('home'); setMobileMenuOpen(false); }}
            >
              Home
            </button>
          </li>
          
          <li>
            <button 
              className={currentPage === 'cart' ? 'nav-link active' : 'nav-link'}
              onClick={() => { setCurrentPage('cart'); setMobileMenuOpen(false); }}
            >
              🛒 Cart {cartItems > 0 && `(${cartItems})`}
            </button>
          </li>

          {user ? (
            <>
              <li>
                <button 
                  className={currentPage === 'orders' ? 'nav-link active' : 'nav-link'}
                  onClick={() => { setCurrentPage('orders'); setMobileMenuOpen(false); }}
                >
                  My Orders
                </button>
              </li>

              <li>
                <button 
                  className={currentPage === 'profile' ? 'nav-link active' : 'nav-link'}
                  onClick={() => { setCurrentPage('profile'); setMobileMenuOpen(false); }}
                >
                  Profile
                </button>
              </li>

              {user.is_staff && (
                <li>
                  <button 
                    className={currentPage === 'admin' ? 'nav-link active admin-link' : 'nav-link admin-link'}
                    onClick={() => { setCurrentPage('admin'); setMobileMenuOpen(false); }}
                  >
                    Admin Dashboard
                  </button>
                </li>
              )}

              <li>
                <span className="user-welcome">
                  👤 {user.username}
                </span>
              </li>

              <li>
                <button 
                  className="nav-link logout-btn"
                  onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <button 
                  className={currentPage === 'login' ? 'nav-link active' : 'nav-link'}
                  onClick={() => { setCurrentPage('login'); setMobileMenuOpen(false); }}
                >
                  Login
                </button>
              </li>
              <li>
                <button 
                  className={currentPage === 'register' ? 'nav-link active' : 'nav-link'}
                  onClick={() => { setCurrentPage('register'); setMobileMenuOpen(false); }}
                >
                  Register
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}
