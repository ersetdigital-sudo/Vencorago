export default function Logo({ className, lwClass }: { className: string; lwClass: string }) {
  return (
    <>
      <svg className={className} viewBox="0 0 40 40" aria-hidden="true">
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1a7a72"></stop>
            <stop offset="1" stopColor="#0b4744"></stop>
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="12" fill="url(#lg)"></rect>
        <path
          d="M11 12l9 17 9-17"
          fill="none"
          stroke="#fff"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></path>
        <circle cx="29" cy="12" r="3.2" fill="#e4c9a2"></circle>
      </svg>
      <span className={lwClass}>
        vencorago<i>.</i>
      </span>
    </>
  );
}
