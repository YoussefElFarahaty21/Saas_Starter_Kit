import './Skeleton.css';

export function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton-line skeleton-line--icon" />
      <div className="skeleton-line skeleton-line--lg" />
      <div className="skeleton-line skeleton-line--sm" />
    </div>
  );
}
