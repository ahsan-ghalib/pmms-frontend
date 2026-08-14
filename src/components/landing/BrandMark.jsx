export default function BrandMark({ className = "h-9 w-9" }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl bg-[linear-gradient(135deg,#7C3AED,#A855F7)] shadow-[0_8px_24px_rgba(124,58,237,0.35)] ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" className="h-[58%] w-[58%] text-white" fill="none">
        <path
          d="M7 14.5 16 8l9 6.5V24a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 7 24V14.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M13 25.5v-6h6v6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M20.8 11.2 22 10a2.2 2.2 0 1 0-3.1-3.1l-1.2 1.2 3.1 3.1Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}
