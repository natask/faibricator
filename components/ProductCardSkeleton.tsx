import React from 'react';
import { Card, CardContent, CardHeader } from '../src/components/components/ui/card';

const ProductCardSkeleton: React.FC = () => {
  return (
    <Card className="overflow-hidden animate-pulse border-border/40 hover:border-border/60 transition-colors">
      {/* Image Skeleton */}
      <div className="h-48 bg-muted/50 relative">
        <div className="absolute top-3 right-3 w-16 h-6 bg-muted rounded-full"></div>
      </div>

      <CardHeader className="pb-4">
        <div className="h-6 bg-muted/70 rounded mb-2"></div>
        <div className="h-4 bg-muted/50 rounded w-3/4"></div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description Skeleton */}
        <div className="space-y-2">
          <div className="h-3 bg-muted/50 rounded"></div>
          <div className="h-3 bg-muted/50 rounded w-5/6"></div>
          <div className="h-3 bg-muted/50 rounded w-4/6"></div>
        </div>

        {/* Creator Info Skeleton */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-muted/70 rounded-full border border-border/40"></div>
          <div className="flex-1">
            <div className="h-4 bg-muted/70 rounded w-24 mb-1"></div>
            <div className="h-3 bg-muted/50 rounded w-16"></div>
          </div>
        </div>

        {/* Supplier Info Skeleton */}
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-muted/70 rounded border border-border/40"></div>
          <div className="flex-1">
            <div className="h-4 bg-muted/70 rounded w-20 mb-1"></div>
            <div className="h-3 bg-muted/50 rounded w-16"></div>
          </div>
        </div>

        {/* Min Order Quantity Skeleton */}
        <div className="bg-muted/30 border border-border/40 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <div className="h-4 bg-muted/70 rounded w-32"></div>
            <div className="h-6 bg-muted/70 rounded w-8"></div>
          </div>
        </div>

        {/* Button Skeleton */}
        <div className="h-10 bg-muted/70 rounded-lg"></div>
      </CardContent>
    </Card>
  );
};

export default ProductCardSkeleton;
