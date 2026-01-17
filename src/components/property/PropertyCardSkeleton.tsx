import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PropertyCardSkeletonProps {
  variant?: 'default' | 'compact' | 'swipe';
  className?: string;
}

export function PropertyCardSkeleton({ 
  variant = 'default',
  className 
}: PropertyCardSkeletonProps) {
  if (variant === 'swipe') {
    return (
      <Card className={cn("w-full max-w-md mx-auto overflow-hidden", className)}>
        <Skeleton className="aspect-[4/3] rounded-none" />
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-4 w-10" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <Skeleton className="aspect-[16/10] rounded-none" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

interface PropertyGridSkeletonProps {
  count?: number;
  variant?: 'default' | 'compact' | 'swipe';
  className?: string;
}

export function PropertyGridSkeleton({ 
  count = 6, 
  variant = 'default',
  className 
}: PropertyGridSkeletonProps) {
  return (
    <div className={cn(
      "grid gap-6",
      variant === 'swipe' 
        ? "grid-cols-1 max-w-md mx-auto" 
        : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      className
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <PropertyCardSkeleton key={i} variant={variant} />
      ))}
    </div>
  );
}
