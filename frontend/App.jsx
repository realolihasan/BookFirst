// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './src/AuthContext';
import ProtectedRoute from './src/ProtectedRoute';

// Pages
import Home from './src/Home';
import Dashboard from './src/Dashboard'; 
import ModelDashboard from './src/ModelDashboard';
import PortfolioPage from './src/PortfolioPage';
import PrivacyPolicy from './src/PrivacyPolicy';
import TermsOfService from './src/TermsOfService';
import UserManagementModal from './src/UserManagementModal';
import Footer from './src/Footer';

const App = () => {
  const DashboardComponent = ({ user }) => {
    return user.role === 'model' ? <ModelDashboard /> : <Dashboard />;
  };

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-[#0A0D14] flex flex-col">
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/portfolio/:id" element={<PortfolioPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute allowedRoles={['admin', 'co_admin', 'brand', 'model']}>
                  {(props) => <DashboardComponent {...props} />}
                </ProtectedRoute>
              } />
              <Route path="/users" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UserManagementModal />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;