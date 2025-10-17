'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthPanel } from '@/components/AuthPanelProvider';

export default function LoginPage() {
  const router = useRouter();
  const { show } = useAuthPanel();

  useEffect(() => {
    show('login');
    const timer = setTimeout(() => {
      router.replace('/');
    }, 0);
    return () => clearTimeout(timer);
  }, [show, router]);

  return null;
}
