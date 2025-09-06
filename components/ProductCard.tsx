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
          {product.image_url ? (
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
            {product.current_votes}
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

          {/* Supplier Info - Vercel style */}
          <div className="flex items-center space-x-3">
            <div className="h-6 w-6 rounded bg-gray-100 border border-gray-200 flex items-center justify-center">
              {product.supplier?.logo_url ? (
                <img
                  src={product.supplier.logo_url}
                  alt={product.supplier.name}
                  className="h-6 w-6 rounded object-cover"
                />
              ) : (
                <Building2 className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-black">{product.supplier?.name || 'TBD'}</p>
              <p className="text-xs text-gray-500 truncate">
                {product.supplier?.location || 'Location TBD'}
              </p>
            </div>
          </div>

          {/* Min Order Quantity - Vercel style */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Min Order</span>
              <span className="text-sm font-semibold bg-black text-white px-2 py-1 rounded">
                {product.min_order_quantity}
              </span>
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
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Vote for {product.title}</DialogTitle>
                <DialogDescription>
                  How many units would you like to order? This helps us gauge demand for production.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setVoteQuantity(Math.max(1, voteQuantity - 1))}
                    >
                      -
                    </Button>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={voteQuantity}
                      onChange={(e) => setVoteQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setVoteQuantity(voteQuantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Your vote:</span>
                    <span className="font-semibold">{voteQuantity} units</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Min order needed:</span>
                    <Badge variant="secondary">{product.min_order_quantity}</Badge>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowVoteModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleVoteSubmit}
                  disabled={isVoting}
                  className="flex-1"
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
