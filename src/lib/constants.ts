/** Default percentage threshold for "due soon" alerts */
export const DEFAULT_DUE_SOON_PCT = 10;

/** Minimum touch target size in pixels (WCAG) */
export const MIN_TOUCH_TARGET = 44;

/** Part categories used across the app */
export const PART_CATEGORIES = [
  'Filter',
  'Oil',
  'Brake',
  'Tire',
  'Battery',
  'Belt',
  'Electrical',
  'Suspension',
  'Cooling',
  'Transmission',
  'Other',
] as const;

/** Navigation items for the app shell */
export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
  { label: 'Vehicles', href: '/vehicles', icon: 'Truck' },
  { label: 'Maintenance', href: '/maintenance', icon: 'Wrench' },
  { label: 'Parts', href: '/parts', icon: 'Package' },
  { label: 'Settings', href: '/settings', icon: 'Settings' },
] as const;

/** Bottom nav items (subset for mobile) */
export const MOBILE_NAV_ITEMS = [
  { label: 'Home', href: '/', icon: 'LayoutDashboard' },
  { label: 'Vehicles', href: '/vehicles', icon: 'Truck' },
  { label: 'Service', href: '/maintenance', icon: 'Wrench' },
  { label: 'Parts', href: '/parts', icon: 'Package' },
] as const;
