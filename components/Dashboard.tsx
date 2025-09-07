import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Product, User, Supplier, Vote } from '../types';
import ProductCard from './ProductCard';
import ProductCardSkeleton from './ProductCardSkeleton';
import { ProductService } from '../services/productService';
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
        // Try to load from Supabase first
        const supabaseProducts = await ProductService.getProducts();
        
        if (supabaseProducts && supabaseProducts.length > 0) {
          setProducts(supabaseProducts);
        } else {
          // Fallback to fake data if no data in Supabase
          console.log('No data in Supabase, using fake data for demo');
          const fakeProducts = generateFakeProducts();
          setProducts(fakeProducts);
        }
      } catch (err) {
        console.error('Error loading products from Supabase:', err);
        // Fallback to fake data on error
        console.log('Falling back to fake data due to error');
        const fakeProducts = generateFakeProducts();
        setProducts(fakeProducts);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const generateFakeProducts = (): Product[] => {
    const fakeUsers: User[] = [
      { id: '1', email: 'john@example.com', name: 'John Smith', avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', created_at: '2024-01-01T00:00:00Z' },
      { id: '2', email: 'sarah@example.com', name: 'Sarah Johnson', avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', created_at: '2024-01-02T00:00:00Z' },
      { id: '3', email: 'mike@example.com', name: 'Mike Chen', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', created_at: '2024-01-03T00:00:00Z' },
    ];

    const fakeSuppliers: Supplier[] = [
      { id: '1', name: 'TechFab Solutions', location: 'San Francisco, CA', logo_url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop', created_at: '2024-01-01T00:00:00Z' },
      { id: '2', name: 'Precision Manufacturing', location: 'Austin, TX', logo_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=100&h=100&fit=crop', created_at: '2024-01-02T00:00:00Z' },
      { id: '3', name: 'Innovation Labs', location: 'Seattle, WA', logo_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=100&h=100&fit=crop', created_at: '2024-01-03T00:00:00Z' },
    ];

    const productTemplates = [
      {
        title: 'Smart Home Hub',
        description: 'A centralized control system for all your smart home devices with voice control and mobile app integration.',
        technical_package: '{"components": ["Raspberry Pi 4", "Zigbee Module", "WiFi 6", "Bluetooth 5.0"], "dimensions": "120x80x25mm", "power": "5V/3A"}',
        image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
        min_order_quantity: 50,
        current_votes: 127,
        products_ordered: 45
      },
      {
        title: 'IoT Weather Station',
        description: 'Compact weather monitoring device with sensors for temperature, humidity, pressure, and air quality.',
        technical_package: '{"components": ["BME280 Sensor", "PMS5003 Air Quality", "ESP32", "Solar Panel"], "dimensions": "80x60x40mm", "power": "Solar + Battery"}',
        image_url: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=400&h=300&fit=crop',
        min_order_quantity: 25,
        current_votes: 203,
        products_ordered: 156
      },
      {
        title: 'Portable Bluetooth Speaker',
        description: 'Waterproof portable speaker with 360-degree sound and 12-hour battery life.',
        technical_package: '{"components": ["40mm Drivers", "Bluetooth 5.0", "Li-ion Battery", "Waterproof Housing"], "dimensions": "150x80x80mm", "power": "20W"}',
        image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=300&fit=crop',
        min_order_quantity: 200,
        current_votes: 156,
        products_ordered: 89
      },
      {
        title: 'Smart Plant Monitor',
        description: 'Automated plant care device that monitors soil moisture, light levels, and nutrients.',
        technical_package: '{"components": ["Soil Moisture Sensor", "Light Sensor", "Pump", "ESP32"], "dimensions": "120x80x60mm", "power": "USB + Solar"}',
        image_url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop',
        min_order_quantity: 75,
        current_votes: 94,
        products_ordered: 34
      },
      {
        title: 'LED Desk Lamp',
        description: 'Adjustable LED desk lamp with color temperature control and USB charging port.',
        technical_package: '{"components": ["LED Strip", "Touch Controls", "USB Port", "Adjustable Arm"], "dimensions": "300x200x50mm", "power": "USB-C 20W"}',
        image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
        min_order_quantity: 150,
        current_votes: 78,
        products_ordered: 23
      }
    ];

    return productTemplates.map((template, index) => ({
      id: `product-${index + 1}`,
      ...template,
      creator_id: fakeUsers[index % fakeUsers.length].id,
      products_ordered: template.products_ordered || 0,
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      creator: fakeUsers[index % fakeUsers.length]
    }));
  };

  const handleVote = async (productId: string, quantity: number) => {
    try {
      // For now, we'll use a mock user ID since we don't have authentication set up yet
      const mockUserId = '550e8400-e29b-41d4-a716-446655440000';
      
      // Try to vote using Supabase
      await ProductService.voteForProduct(productId, mockUserId, quantity);
      
      // Reload products to get updated vote counts
      const updatedProducts = await ProductService.getProducts();
      if (updatedProducts && updatedProducts.length > 0) {
        setProducts(updatedProducts);
      } else {
        // Fallback: update local state
        setProducts(prevProducts => 
          prevProducts.map(product => 
            product.id === productId 
              ? { ...product, current_votes: product.current_votes + quantity }
              : product
          )
        );
      }
      
      console.log(`Successfully voted for product ${productId} with quantity ${quantity}`);
    } catch (error) {
      console.error('Error voting for product:', error);
      // Fallback: update local state even if Supabase fails
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === productId 
            ? { ...product, current_votes: product.current_votes + quantity }
            : product
        )
      );
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
  const topProduct = products.reduce((top, product) => 
    product.current_votes > top.current_votes ? product : top, 
    products[0] || { current_votes: 0 }
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Votes</h3>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-black mb-1">{totalVotes}</div>
            <p className="text-sm text-gray-500">
              Community engagement
            </p>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Top Product</h3>
              <Sparkles className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-black mb-1">{topProduct.current_votes || 0}</div>
            <p className="text-sm text-gray-500 truncate">
              {topProduct.title || 'No products yet'}
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
