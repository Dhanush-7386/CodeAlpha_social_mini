export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: { width: 24, border: 3 },
    md: { width: 40, border: 4 },
    lg: { width: 56, border: 5 },
  };

  const s = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        style={{
          width: s.width,
          height: s.width,
          borderRadius: '50%',
          border: `${s.border}px solid var(--bg-tertiary)`,
          borderTopColor: 'var(--accent)',
          animation: 'spin 0.8s linear infinite',
        }}
      />
    </div>
  );
}
