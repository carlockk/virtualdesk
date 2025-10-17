'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthPanel } from '@/components/AuthPanelProvider';

export default function RegisterPage() {
  const router = useRouter();
  const { show } = useAuthPanel();

  useEffect(() => {
    show('register');
    const timer = setTimeout(() => {
      router.replace('/');
    }, 0);
    return () => clearTimeout(timer);
  }, [show, router]);

  return null;
}
