import React, { useState } from 'react';
import LoginPage from '@/components/LoginPage';
import ProductStudio from '@/components/ProductStudio';

const HomePage: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {isLoggedIn ? <ProductStudio /> : <LoginPage onLogin={handleLogin} />}
    </div>
  );
};

export default HomePage;
