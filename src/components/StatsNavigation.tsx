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
    <nav style={{ 
      marginBottom: '20px', 
      padding: '10px 0', 
      borderBottom: '1px solid #eee' 
    }}>
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        flexWrap: 'wrap' 
      }}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              textDecoration: 'none',
              backgroundColor: isActive(item.href, item.exact) ? '#007acc' : '#f5f5f5',
              color: isActive(item.href, item.exact) ? 'white' : '#333',
              border: '1px solid #ddd',
              transition: 'all 0.2s ease'
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default StatsNavigation;
