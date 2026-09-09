export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <svg
        className="h-10 w-10 animate-spin text-emerald-600"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
      <p className="mt-4 text-sm font-medium text-slate-600">
        Analyzing parking data…
      </p>
    </div>
  );
}
