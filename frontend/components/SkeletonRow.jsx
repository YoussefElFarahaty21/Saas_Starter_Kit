import './Skeleton.css';

export function SkeletonRow({ columns = 4 }) {
  return (
    <tr className="skeleton-row" aria-hidden="true">
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index}>
          <div className="skeleton-line skeleton-line--row" />
        </td>
      ))}
    </tr>
  );
}
