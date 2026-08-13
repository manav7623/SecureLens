'use client';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { restoreAuth } from '@/store/authSlice';

function AuthLoader({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    store.dispatch(restoreAuth());
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return children;
}

export default function Providers({ children }) {
  return (
    <Provider store={store}>
      <AuthLoader>
        {children}
      </AuthLoader>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1A1A26',
            color: '#fff',
            border: '1px solid #22223A',
            fontFamily: 'var(--font-syne)',
          },
          success: { iconTheme: { primary: '#4F63FF', secondary: '#fff' } },
        }}
      />
    </Provider>
  );
}
