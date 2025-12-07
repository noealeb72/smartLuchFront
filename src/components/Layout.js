import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import './Layout.css';

const Layout = ({ children }) => {
  const location = useLocation();
  const isIndex = location.pathname === '/' || location.pathname === '/index';
  
  return (
    <div className="layout-container">
      <Navbar />
      <div className="layout-content">
        {children}
      </div>
      <Footer variant={isIndex ? 'full' : 'simple'} />
    </div>
  );
};

export default Layout;

