// Footer.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import AddPortfolioModal from './AddPortfolioModal';

const FooterLink = ({ to, children, onClick }) => (
  <Link 
    to={to}
    onClick={onClick}
    className="text-gray-400 hover:text-white transition-colors duration-200"
  >
    {children}
  </Link>
);

const Footer = () => {
  const { user, login, logout } = useAuth();
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-6 py-8">
        {/* Grid with 3 columns and 2 rows */}
        <div className="grid grid-cols-3 grid-rows-2 gap-8">
          {/* Row 1, Column 1: Brand */}
          <div>
            <h1 className="text-5xl sm:text-4xl font-bold bg-gradient-to-r from-white to-[#f8f9fa] bg-clip-text text-transparent">
              BOOKFIRST
            </h1>
            <p className="text-gray-400 mt-2 tracking-[0.67em]">M  O  D  E  L  S</p>
          </div>
          
          {/* Row 1, Column 2: (Empty) */}
          <div></div>
          
          {/* Row 1, Column 3: User's Name (bottom aligned) */}
          <div className="flex items-end h-full">
            {user && <span className="text-gray-400">{user.name}</span>}
          </div>
          
          {/* Row 2, Column 1: Policy Links */}
          <div className="flex flex-col space-y-2">
            <FooterLink to="/privacy-policy">Privacy Policy</FooterLink>
            <FooterLink to="/terms-of-service">Terms of Service</FooterLink>
          </div>
          
          {/* Row 2, Column 2: Navigation Links */}
          <div className="flex flex-col space-y-4">
            <FooterLink to="/">Home</FooterLink>
            <a 
              href="mailto:booking@bookfirstmodels.com" 
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              booking@bookfirstmodels.com
            </a>
          </div>
          
          {/* Row 2, Column 3: Navigation Links (replacing buttons) */}
          <div className="flex flex-col space-y-4">
            {user ? (
              <>
                <FooterLink to="#" onClick={logout}>Sign Out</FooterLink>
                {(user.role === 'admin' || user.role === 'co_admin') && (
                  <>
                    <FooterLink to="#" onClick={() => setIsPortfolioModalOpen(true)}>
                      Add Portfolio
                    </FooterLink>
                    <FooterLink to="/dashboard">Dashboard</FooterLink>
                  </>
                )}
                {user.role === 'model' && (
                  <FooterLink to="/dashboard">Dashboard</FooterLink>
                )}
              </>
            ) : (
              <FooterLink to="#" onClick={login}>Sign In</FooterLink>
            )}
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <p className="text-gray-400 text-sm text-center">
            © {new Date().getFullYear()} BOOKFIRST Models. All rights reserved.
          </p>
        </div>
      </div>

      <AddPortfolioModal
        isOpen={isPortfolioModalOpen}
        onClose={() => setIsPortfolioModalOpen(false)}
      />
    </footer>
  );
};

export default Footer;