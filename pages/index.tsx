import React, { useState } from 'react';
import LoginPage from '../components/LoginPage';
import ProductStudio from '../components/ProductStudio';
import Dashboard from '../components/Dashboard';

type AppView = 'login' | 'dashboard' | 'studio';

const HomePage: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('login');

  const handleLogin = () => {
    setCurrentView('dashboard');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'login':
        return <LoginPage onLogin={handleLogin} />;
      case 'dashboard':
        return <Dashboard />;
      case 'studio':
        return <ProductStudio />;
      default:
        return <LoginPage onLogin={handleLogin} />;
    }
  };

  const renderNavigation = () => {
    if (currentView === 'login') return null;

    return (
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-white">Fabricator</h1>
              <div className="flex space-x-4">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'dashboard'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setCurrentView('studio')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'studio'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  Product Studio
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentView('login')}
                className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {renderNavigation()}
      {renderCurrentView()}
    </div>
  );
};

export default HomePage;
