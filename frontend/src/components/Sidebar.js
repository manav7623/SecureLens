'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/store/authSlice';
import {
  LayoutDashboard, Megaphone, Users, MessageSquare,
  BarChart3, Settings, LogOut, Shield, Star, Briefcase,
  UserCheck, CreditCard, Upload, Sun, Moon
} from 'lucide-react';

const creatorLinks = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/campaigns', icon: Megaphone, label: 'Find Campaigns' },
  { href: '/dashboard/applications', icon: UserCheck, label: 'My Applications' },
  { href: '/dashboard/content', icon: Upload, label: 'My Submissions' },
  { href: '/dashboard/earnings', icon: CreditCard, label: 'Earnings' },
  { href: '/messages', icon: MessageSquare, label: 'Messages' },
  { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/dashboard/profile', icon: Settings, label: 'Profile' },
];

const brandLinks = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/campaigns/manage', icon: Megaphone, label: 'My Campaigns' },
  { href: '/campaigns/create', icon: Briefcase, label: 'Create Campaign' },
  { href: '/creators', icon: Users, label: 'Find Creators' },
  { href: '/dashboard/content-review', icon: Upload, label: 'Review Content' },
  { href: '/dashboard/payments', icon: CreditCard, label: 'Payments' },
  { href: '/messages', icon: MessageSquare, label: 'Messages' },
  { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/dashboard/profile', icon: Settings, label: 'Profile' },
];

const adminLinks = [
  { href: '/admin', icon: LayoutDashboard, label: 'Overview' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/campaigns', icon: Megaphone, label: 'Campaigns' },
  { href: '/admin/payments', icon: CreditCard, label: 'Payments' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  const links = user?.role === 'admin' ? adminLinks :
    user?.role === 'brand' ? brandLinks : creatorLinks;

  const handleLogout = () => {
    dispatch(logout());
    router.push('/');
  };

  const getAvatar = () => {
    if (user?.avatar) return user.avatar;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=4F63FF&color=fff&size=80`;
  };

  return (
    <aside className="w-64 min-h-screen glass border-r border-dark-600 flex flex-col fixed left-0 top-0 z-40">
      {/* Logo - Fixed with inline SVG so it never collapses */}
      <div className="p-6 border-b border-dark-600">
        <Link href="/" className="flex items-center gap-3">
          <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 26, background: 'linear-gradient(135deg, #4F63FF, #FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            CreatorLens
          </span>
        </Link>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-dark-600">
        <div className="flex items-center gap-3">
          <img
            src={getAvatar()}
            alt={user?.name}
            className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{user?.name}</div>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                user?.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                user?.role === 'brand' ? 'bg-blue-500/20 text-blue-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                {user?.role}
              </span>
              {user?.isVerified && (
                <Shield size={12} className="text-green-400" title="Verified" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-dark-700'
              }`}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Theme & Logout */}
      <div className="p-4 border-t border-dark-600">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-dark-700/50 transition-all w-full mb-2"
        >
          {theme === 'dark' ? <Sun size={18} style={{ flexShrink: 0 }} /> : <Moon size={18} style={{ flexShrink: 0 }} />}
          <span className="text-sm font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
