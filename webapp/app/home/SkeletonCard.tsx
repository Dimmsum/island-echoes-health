export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-3 rounded-full bg-[#E9EEE9]" style={{ width: `${60 + (i % 3) * 15}%` }} />
          <div className="h-3 rounded-full bg-[#F0F4F0]" style={{ width: `${40 + (i % 2) * 20}%` }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonPills({ count = 3 }: { count?: number }) {
  return (
    <div className="flex items-center gap-2 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-9 rounded-full bg-[#E9EEE9]" style={{ width: 80 + i * 12 }} />
      ))}
    </div>
  );
}
