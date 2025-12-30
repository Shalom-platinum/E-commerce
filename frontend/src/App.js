import React, { useState, useEffect } from 'react';
import './App.css';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import UserProfile from './pages/UserProfile';
import MyOrders from './pages/MyOrders';
import AdminPortal from './pages/AdminPortal';
import Login from './pages/Login';
import Register from './pages/Register';
import Navigation from './components/Navigation';
import { userAPI } from './services';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState(0);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const response = await userAPI.getProfile();
          setUser(response.data);
        } catch (error) {
          localStorage.removeItem('auth_token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setCurrentPage('home');
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentPage('home');
  };

  if (loading) {
    return <div className="app-loading">Loading...</div>;
  }

  return (
    <div className="App">
      <Navigation 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage}
        user={user}
        onLogout={handleLogout}
        cartItems={cartItems}
      />
      
      <main className="app-main">
        {currentPage === 'home' && <ProductList />}
        {currentPage === 'product' && <ProductDetail />}
        {currentPage === 'cart' && <Cart setCartItems={setCartItems} />}
        {currentPage === 'checkout' && <Checkout setCurrentPage={setCurrentPage} />}
        {currentPage === 'profile' && user && <UserProfile user={user} setUser={setUser} />}
        {currentPage === 'orders' && user && <MyOrders />}
        {currentPage === 'admin' && user?.is_staff && <AdminPortal user={user} />}
        {currentPage === 'login' && <Login onLogin={handleLogin} setCurrentPage={setCurrentPage} />}
        {currentPage === 'register' && <Register setCurrentPage={setCurrentPage} />}
      </main>
    </div>
  );
}

export default App;
