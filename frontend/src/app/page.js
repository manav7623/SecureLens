'use client';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user } = useSelector(state => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') router.push('/admin');
      else router.push('/dashboard');
    } else {
      router.push('/auth/login');
    }
  }, [user]);

  return null;
}
