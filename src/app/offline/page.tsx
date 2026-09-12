export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="text-2xl font-bold text-gray-900">You&apos;re Offline</h1>
      <p className="mt-2 text-gray-500">
        Check your internet connection and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 rounded-lg bg-blue-700 px-6 py-3 text-base font-medium text-white
                   hover:bg-blue-800 active:bg-blue-900"
      >
        Retry
      </button>
    </div>
  );
}
