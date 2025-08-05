"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const StatsNavigation = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/stats', label: 'Summary', exact: true },
    { href: '/stats/daily', label: 'Daily Stats' },
    { href: '/stats/games', label: 'Game Stats' },
    { href: '/stats/day-of-week', label: 'Day of Week' },
    { href: '/stats/subscribers', label: 'Subscribers' }
  ];

  const isActive = (href: string, exact = false) => {
    if (!pathname) return false;
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="mb-6 pb-4 border-b border-gray-200">
      <div className="flex flex-wrap gap-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isActive(item.href, item.exact)
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
            }`}
          >
            {item.label}
          </Link>
        ))}
        <Link
          href="/mod-analytics"
          className="px-4 py-2 rounded-lg font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
        >
          ← Back to Analytics
        </Link>
      </div>
    </nav>
  );
};

export default StatsNavigation;
