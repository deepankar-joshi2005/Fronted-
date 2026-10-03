export const BRAND_NAME = "Ledgerly";

export function LogoMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16 3 27 7V16C27 23 22 28 16 29 10 28 5 23 5 16V7Z"
        fill="currentColor"
      />
      <path
        d="M10.5 16.2 14.5 20.2 21.5 11.8"
        stroke="#0d9488"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
