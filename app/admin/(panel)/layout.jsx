import AdminShell from '@/components/admin/AdminShell';
import { ensureAdmin } from '@/lib/admin-auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Panel administrativo | VirtualDesk',
  description: 'Gestor integral de VirtualDesk para super administradores y administradores.',
};

export default async function AdminPanelLayout({ children }) {
  try {
    const { user, isSuperAdmin } = await ensureAdmin();
    const safeUser = {
      name: user?.name || 'Admin',
      email: user?.email || '',
      avatarUrl: user?.avatarUrl || '',
    };
    return <AdminShell user={safeUser} isSuperAdmin={isSuperAdmin}>{children}</AdminShell>;
  } catch (err) {
    if (err?.status === 401) {
      redirect('/?modal=login');
    }
    redirect('/');
  }
}
