export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-ink-text/5 ${className ?? ""}`} />;
}
