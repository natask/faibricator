import React, { useState } from 'react';
import LoginPageSupabase from './components/LoginPageSupabase';
import ProductStudio from './components/ProductStudio';
import Dashboard from './components/Dashboard';
import { Button } from './src/components/components/ui/button';
import { Badge } from './src/components/components/ui/badge';
import { LogOut, LayoutDashboard, Sparkles, Zap } from 'lucide-react';

type AppView = 'login' | 'dashboard' | 'studio';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('login');

  const handleLogin = () => {
    setCurrentView('dashboard');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'login':
        return <LoginPageSupabase onLogin={handleLogin} />;
      case 'dashboard':
        return <Dashboard />;
      case 'studio':
        return <ProductStudio />;
      default:
        return <LoginPageSupabase onLogin={handleLogin} />;
    }
  };

  const renderNavigation = () => {
    if (currentView === 'login') return null;

    return (
      <nav className="sticky top-0 z-30 w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-black rounded-sm flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-lg font-semibold text-black">
                  Fabricator
                </h1>
              </div>
              <div className="hidden md:flex space-x-1">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    currentView === 'dashboard'
                      ? 'bg-gray-100 text-black'
                      : 'text-gray-600 hover:text-black hover:bg-gray-50'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setCurrentView('studio')}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    currentView === 'studio'
                      ? 'bg-gray-100 text-black'
                      : 'text-gray-600 hover:text-black hover:bg-gray-50'
                  }`}
                >
                  Product Studio
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setCurrentView('login')}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-black transition-colors"
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
    <div className="min-h-screen bg-white text-black font-sans">
      {renderNavigation()}
      <main className="flex-1">
        {renderCurrentView()}
      </main>
    </div>
  );
};

export default App;