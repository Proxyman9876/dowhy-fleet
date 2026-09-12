import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-bold text-gray-900">404</h1>
      <p className="mt-2 text-gray-500">Page not found.</p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-blue-700 px-6 py-3 text-base font-medium text-white
                   hover:bg-blue-800 active:bg-blue-900"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
