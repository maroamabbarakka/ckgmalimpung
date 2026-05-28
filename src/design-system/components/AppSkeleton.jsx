export default function AppSkeleton({ lines = 3, className = '' }) {
  return (
    <div className={`animate-pulse space-y-3 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-4 rounded-full bg-slate-200"
          style={{ width: `${Math.max(45, 100 - index * 18)}%` }}
        />
      ))}
    </div>
  );
}
