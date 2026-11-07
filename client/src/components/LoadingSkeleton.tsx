/** Placeholder shaped like the results layout while predictions load. */
export default function LoadingSkeleton() {
  return (
    <div className="mt-8 animate-pulse" role="status" aria-live="polite">
      <span className="sr-only">Loading parking predictions</span>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="h-6 w-1/2 rounded-md bg-slate-200" />
          <div className="mt-4 h-2 w-full rounded-full bg-slate-100" />
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 rounded-lg bg-slate-100" />
            ))}
          </div>
          <div className="mt-4 h-4 w-3/4 rounded-md bg-slate-100" />
        </div>
        <div className="h-80 rounded-2xl border border-slate-200 bg-slate-100 lg:h-96" />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-xl border border-slate-200 bg-white" />
        ))}
      </div>
    </div>
  );
}
