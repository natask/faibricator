import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Zap } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const router = useRouter();

  const handleLogout = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans">
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
                <Link
                  href="/dashboard"
                  className="px-3 py-2 text-sm font-medium rounded-md transition-colors bg-gray-100 text-black"
                >
                  Dashboard
                </Link>
                <Link
                  href="/studio"
                  className="px-3 py-2 text-sm font-medium rounded-md transition-colors text-gray-600 hover:text-black hover:bg-gray-50"
                >
                  Product Studio
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleLogout}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-black transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Welcome to Fabricator
              </h3>
              <p className="text-gray-600 mb-6">
                Transform your product ideas into reality with our AI-powered design studio.
              </p>
              <Link
                href="/studio"
                className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Product Studio
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
