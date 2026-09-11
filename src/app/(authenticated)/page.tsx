export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-gray-500">Fleet overview — coming in Phase 6.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {['Total Vehicles', 'Overdue', 'Due Soon', 'Low Stock'].map((title) => (
          <div key={title} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">{title}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">—</p>
          </div>
        ))}
      </div>
    </div>
  );
}
