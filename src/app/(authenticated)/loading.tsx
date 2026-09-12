export default function AuthenticatedLoading() {
  return (
    <div className="space-y-4 p-6">
      {/* Skeleton stat cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl border border-gray-200 bg-white p-4 animate-pulse">
            <div className="h-3 w-20 rounded bg-gray-200" />
            <div className="mt-4 h-6 w-12 rounded bg-gray-200" />
          </div>
        ))}
      </div>

      {/* Skeleton content */}
      <div className="h-64 rounded-xl border border-gray-200 bg-white p-4 animate-pulse">
        <div className="h-4 w-32 rounded bg-gray-200" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
