import Link from 'next/link';

export function EmptyState() {
  return (
    <div className="surface flex flex-col items-center text-center px-6 py-16 sm:py-24">
      <Illustration />
      <h2 className="mt-6 text-lg font-semibold text-ink-900">No assignments yet</h2>
      <p className="mt-1 max-w-md text-sm text-ink-500">
        Create your first assignment to start collecting and grading student
        submissions. You can set up rubrics, define marking criteria, and let AI assist with grading.
      </p>
      <Link href="/create" className="btn-dark mt-6">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Create Your First Assignment
      </Link>
    </div>
  );
}

function Illustration() {
  return (
    <svg
      viewBox="0 0 240 180"
      className="w-48 h-36"
      role="img"
      aria-label="No assignments illustration"
    >
      <defs>
        <linearGradient id="paperGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FAFAFA" />
          <stop offset="100%" stopColor="#E5E5E5" />
        </linearGradient>
      </defs>
      {/* paper */}
      <rect x="58" y="28" width="110" height="130" rx="6" fill="url(#paperGrad)" stroke="#D4D4D4" />
      <line x1="74" y1="56" x2="152" y2="56" stroke="#D4D4D4" strokeWidth="2" strokeLinecap="round" />
      <line x1="74" y1="72" x2="152" y2="72" stroke="#D4D4D4" strokeWidth="2" strokeLinecap="round" />
      <line x1="74" y1="88" x2="130" y2="88" stroke="#D4D4D4" strokeWidth="2" strokeLinecap="round" />
      <line x1="74" y1="104" x2="146" y2="104" stroke="#D4D4D4" strokeWidth="2" strokeLinecap="round" />
      <line x1="74" y1="120" x2="118" y2="120" stroke="#D4D4D4" strokeWidth="2" strokeLinecap="round" />
      {/* magnifier */}
      <circle cx="155" cy="118" r="32" fill="white" stroke="#404040" strokeWidth="3" />
      <line x1="178" y1="142" x2="200" y2="164" stroke="#404040" strokeWidth="6" strokeLinecap="round" />
      {/* X */}
      <line x1="143" y1="106" x2="167" y2="130" stroke="#FF6B35" strokeWidth="4" strokeLinecap="round" />
      <line x1="167" y1="106" x2="143" y2="130" stroke="#FF6B35" strokeWidth="4" strokeLinecap="round" />
      {/* chat bubbles */}
      <rect x="168" y="36" width="46" height="22" rx="11" fill="#F4F4F4" stroke="#D4D4D4" />
      <circle cx="179" cy="47" r="2" fill="#A3A3A3" />
      <circle cx="187" cy="47" r="2" fill="#A3A3A3" />
      <circle cx="195" cy="47" r="2" fill="#A3A3A3" />
    </svg>
  );
}
