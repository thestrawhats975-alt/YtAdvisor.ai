import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import PricingPage from './components/PricingPage';
import SignupPage from './components/SignupPage';
import LandingPage from './components/LandingPage';
import InputPage from './components/InputPage';
import DashboardLayout from './layouts/DashboardLayout';
import VerdictDashboard from './components/tabs/VerdictDashboard';
import MarketDashboard from './components/tabs/MarketDashboard';
import CreativeDashboard from './components/tabs/CreativeDashboard';
import ExecutionDashboard from './components/tabs/ExecutionDashboard';
import GrowthDashboard from './components/tabs/GrowthDashboard';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App dark">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/" element={<LandingPage />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/analyze" element={<InputPage />} />
              
              <Route path="/results" element={<DashboardLayout />}>
                <Route index element={<Navigate to="verdict" replace />} />
                <Route path="verdict" element={<VerdictDashboard />} />
                <Route path="market" element={<MarketDashboard />} />
                <Route path="creative" element={<CreativeDashboard />} />
                <Route path="execution" element={<ExecutionDashboard />} />
                <Route path="growth" element={<GrowthDashboard />} />
              </Route>
            </Route>
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
