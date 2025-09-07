import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Product, User, Supplier, Vote } from '../types';
import ProductCard from './ProductCard';
import ProductCardSkeleton from './ProductCardSkeleton';
import { IndexedDBService } from '../services/indexedDBService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../src/components/components/ui/card';
import { Badge } from '../src/components/components/ui/badge';
import { Button } from '../src/components/components/ui/button';
import { TrendingUp, Package, Users, Sparkles, Zap } from 'lucide-react';

const Dashboard: React.FC = () => {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = () => {
    // Clear any stored authentication data
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    // Redirect to login page
    router.push('/');
  };

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        // Initialize IndexedDB and load products
        await IndexedDBService.init();
        
        // Check if we have any products in IndexedDB
        let indexedProducts = await IndexedDBService.getProducts();
        
        // If no products exist, initialize with mock data
        if (indexedProducts.length === 0) {
          await IndexedDBService.initializeWithMockData();
          indexedProducts = await IndexedDBService.getProducts();
        }
        
        setProducts(indexedProducts || []);
      } catch (err) {
        console.error('Error loading products from IndexedDB:', err);
        setError('Failed to load products. Please refresh the page and try again.');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);



  const handleVote = async (productId: string, quantity: number) => {
    try {
      // For now, we'll use a mock user ID since we don't have authentication set up yet
      const mockUserId = 'user_voter';
      
      // Vote using IndexedDB
      await IndexedDBService.voteForProduct(productId, mockUserId, quantity);
      
      // Reload products to get updated vote counts
      const updatedProducts = await IndexedDBService.getProducts();
      setProducts(updatedProducts || []);
      
    } catch (error) {
      console.error('Error voting for product:', error);
      setError('Failed to vote. Please try again.');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="text-destructive">Error Loading Products</CardTitle>
                <CardDescription>{error}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => window.location.reload()} 
                  className="w-full"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const totalVotes = products.reduce((sum, product) => sum + product.current_votes, 0);
  const totalUnitsOrdered = products.reduce((sum, product) => sum + product.products_ordered, 0);
  const topProduct = products.reduce((top, product) => 
    product.current_votes > top.current_votes ? product : top, 
    products[0] || { current_votes: 0 }
  );
  const topProductByUnits = products.reduce((top, product) => 
    product.products_ordered > top.products_ordered ? product : top, 
    products[0] || { products_ordered: 0 }
  );

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Navigation Header */}
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

      {/* Hero Section - Vercel style */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-black mb-4">
              Product Dashboard
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover and vote for innovative products. Help bring the next generation of products to life.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section - Vercel style */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Products</h3>
              <Package className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-black mb-1">{products.length}</div>
            <p className="text-sm text-gray-500">
              Active product ideas
            </p>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Commitments</h3>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-black mb-1">{totalVotes}</div>
            <p className="text-sm text-gray-500">
              Community engagement
            </p>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Units Committed</h3>
              <Users className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-black mb-1">{totalUnitsOrdered}</div>
            <p className="text-sm text-gray-500">
              Total units committed
            </p>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Top Product</h3>
              <Sparkles className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-black mb-1">{topProductByUnits.products_ordered || 0}</div>
            <p className="text-sm text-gray-500 truncate">
              {topProductByUnits.title || 'No products yet'}
            </p>
          </div>
        </div>

        {/* Products Grid - Vercel style */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-black">Featured Products</h2>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {products.length} products
            </span>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                  <ProductCardSkeleton />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product, index) => (
                <div key={product.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                  <ProductCard
                    product={product}
                    onVote={handleVote}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
