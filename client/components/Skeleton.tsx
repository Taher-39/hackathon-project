export function ProductCardSkeleton() {
  return (
    <div className="border rounded-lg overflow-hidden bg-white animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-3 w-1/3 bg-gray-200 rounded" />
        <div className="h-4 w-4/5 bg-gray-200 rounded" />
        <div className="h-4 w-1/2 bg-gray-200 rounded mt-2" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="border rounded-xl bg-white shadow-sm divide-y animate-pulse overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-3 flex items-center gap-4">
          <div className="h-4 w-1/5 bg-gray-200 rounded" />
          <div className="h-4 w-1/4 bg-gray-200 rounded" />
          <div className="h-4 w-1/6 bg-gray-200 rounded" />
          <div className="h-4 w-1/6 bg-gray-200 rounded ml-auto" />
        </div>
      ))}
    </div>
  );
}
