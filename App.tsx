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
      <nav className="sticky top-0 z-30 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-background" />
                </div>
                <h1 className="text-xl font-semibold text-foreground">
                  Fabricator
                </h1>
              </div>
              <div className="hidden md:flex space-x-1">
                <Button
                  variant={currentView === 'dashboard' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView('dashboard')}
                  className="flex items-center space-x-2 h-9 px-3"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Button>
                <Button
                  variant={currentView === 'studio' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView('studio')}
                  className="flex items-center space-x-2 h-9 px-3"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Product Studio</span>
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentView('login')}
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground h-9 px-3"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative">
      {/* Subtle gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-muted/5 pointer-events-none z-0" />
      {renderNavigation()}
      <main className="flex-1 relative z-20">
        {renderCurrentView()}
      </main>
    </div>
  );
};

export default App;