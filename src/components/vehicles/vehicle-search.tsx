'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import { VEHICLE_STATUSES } from '@/types/enums';

export function VehicleSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');

  const updateSearch = useCallback(
    (q: string, status?: string) => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (status) params.set('status', status);
      router.push(`/vehicles?${params.toString()}`);
    },
    [router],
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search vehicles..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            updateSearch(e.target.value, searchParams.get('status') ?? undefined);
          }}
          className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-base
                     focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <select
        value={searchParams.get('status') ?? ''}
        onChange={(e) => updateSearch(query, e.target.value || undefined)}
        className="rounded-lg border border-gray-300 px-4 py-3 text-base
                   focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        <option value="">All statuses</option>
        {VEHICLE_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </option>
        ))}
      </select>
    </div>
  );
}
