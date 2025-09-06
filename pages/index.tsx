import React from 'react';
import { useRouter } from 'next/router';
import LoginPageSupabase from '../components/LoginPageSupabase';

const HomePage: React.FC = () => {
  const router = useRouter();

  const handleLogin = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <main className="flex-1">
        <LoginPageSupabase onLogin={handleLogin} />
      </main>
    </div>
  );
};

export default HomePage;
