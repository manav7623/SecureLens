'use client';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

export default function CampaignsLayout({ children }) {
  const { user } = useSelector(state => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (!user) router.push('/auth/login');
  }, [user]);

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-dark-900">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-8 page-enter">
          {children}
        </div>
      </main>
    </div>
  );
}
