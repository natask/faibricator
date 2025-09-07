import React, { useState } from 'react';
import { Product } from '../types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../src/components/components/ui/card';
import { Button } from '../src/components/components/ui/button';
import { Badge } from '../src/components/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../src/components/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../src/components/components/ui/dialog';
import { Input } from '../src/components/components/ui/input';
import { Label } from '../src/components/components/ui/label';
import { ThumbsUp, Calendar, Building2, Package, Loader2 } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onVote: (productId: string, quantity: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onVote }) => {
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [voteQuantity, setVoteQuantity] = useState(1);
  const [isVoting, setIsVoting] = useState(false);

  const handleVoteClick = () => {
    setShowVoteModal(true);
  };

  const handleVoteSubmit = async () => {
    if (voteQuantity < 1) return;
    
    setIsVoting(true);
    try {
      await onVote(product.id, voteQuantity);
      setShowVoteModal(false);
      setVoteQuantity(1);
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      <div className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200">
        {/* Product Image - Vercel style */}
        <div className="relative h-48 bg-gray-100 overflow-hidden">
          {product.product_image ? (
            <img
              src={product.product_image}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : product.image_url ? (
            <img
              src={product.image_url}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Package className="w-12 h-12" />
            </div>
          )}
          <div className="absolute top-3 right-3 bg-black text-white text-xs px-2 py-1 rounded-md flex items-center">
            <ThumbsUp className="w-3 h-3 mr-1" />
            {product.current_votes || 0}
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-lg font-semibold text-black mb-2 line-clamp-2">{product.title}</h3>
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>

          <div className="space-y-3">
          {/* Creator Info - Vercel style */}
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8 border border-gray-200">
              <AvatarImage src={product.creator?.avatar_url} alt={product.creator?.name} />
              <AvatarFallback className="text-xs bg-gray-100 text-gray-600">
                {product.creator?.name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-black">{product.creator?.name || 'Unknown'}</p>
              <div className="flex items-center text-xs text-gray-500">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDate(product.created_at)}
              </div>
            </div>
          </div>

          {/* Order Stats - Vercel style */}
          <div className="flex items-center space-x-3">
            <div className="h-6 w-6 rounded bg-gray-100 border border-gray-200 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-black">
                {product.supplier_list && product.supplier_list.length > 0 
                  ? `${product.supplier_list.length} Suppliers Available`
                  : 'Suppliers TBD'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {product.products_ordered || 0} units ordered
              </p>
            </div>
          </div>

          {/* Min Order Quantity with Progress - Vercel style */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Min Order</span>
                <span className="text-sm font-semibold bg-black text-white px-2 py-1 rounded">
                  {product.min_order_quantity || 100} units
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Products Ordered</span>
                <span className="text-sm font-semibold text-green-600">
                  {product.products_ordered || 0} / {product.min_order_quantity || 100}
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(100, ((product.products_ordered || 0) / (product.min_order_quantity || 100)) * 100)}%` 
                  }}
                />
              </div>
            </div>
          </div>
          </div>

          <div className="mt-4">
            <Dialog open={showVoteModal} onOpenChange={setShowVoteModal}>
              <DialogTrigger asChild>
                <button className="w-full bg-black text-white hover:bg-gray-800 text-sm font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center" onClick={handleVoteClick}>
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Vote
                </button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-md font-sans">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-black font-sans">
                  Vote for {product.title}
                </DialogTitle>
                <DialogDescription className="text-gray-700 font-medium">
                  How many units would you like to order? This helps us gauge demand for production.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-sm font-semibold text-black font-sans">
                    Quantity
                  </Label>
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setVoteQuantity(Math.max(1, voteQuantity - 1))}
                      className="font-bold text-lg text-black border-gray-300 hover:bg-gray-50"
                    >
                      -
                    </Button>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={voteQuantity}
                      onChange={(e) => setVoteQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center font-semibold text-lg text-black"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setVoteQuantity(voteQuantity + 1)}
                      className="font-bold text-lg text-black border-gray-300 hover:bg-gray-50"
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600 font-sans">Your vote:</span>
                    <span className="text-lg font-bold text-gray-900 font-sans">{voteQuantity} units</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600 font-sans">Progress to min order:</span>
                      <span className="text-sm font-bold text-gray-900 font-sans">
                        {product.current_votes || 0} / {product.min_order_quantity || 100}
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min(100, ((product.current_votes || 0) / (product.min_order_quantity || 100)) * 100)}%` 
                        }}
                      ></div>
                    </div>
                    
                    <div className="text-xs text-gray-600 text-center">
                      {(product.current_votes || 0) >= (product.min_order_quantity || 100) ? (
                        <span className="text-green-600 font-semibold">✓ Minimum order reached!</span>
                      ) : (
                        <span>{(product.min_order_quantity || 100) - (product.current_votes || 0)} more units needed</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowVoteModal(false)}
                  className="flex-1 font-semibold text-black border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleVoteSubmit}
                  disabled={isVoting}
                  className="flex-1 font-semibold bg-black hover:bg-gray-800 text-white"
                >
                  {isVoting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Voting...
                    </>
                  ) : (
                    'Submit Vote'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </div>

    </>
  );
};

export default ProductCard;