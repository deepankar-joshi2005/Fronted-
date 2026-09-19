interface SpinnerProps {
  size?: number;
  className?: string;
}

export default function Spinner({ size = 20, className = "" }: SpinnerProps) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-border border-t-brand ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
