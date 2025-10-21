'use client';

import { useAdmin } from '@/components/admin/AdminContext';
import { Loader2, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const INITIAL_FORM = {
  name: '',
  email: '',
  password: '',
  role: 'user',
  personType: 'natural',
  phone: '',
  address: '',
  rut: '',
  businessName: '',
  avatarUrl: '',
};

function Dialog({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
}

export default function UsersManager() {
  const { isSuperAdmin } = useAdmin();
  const [users, setUsers] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) => {
      return (
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        (user.rut || '').toLowerCase().includes(term)
      );
    });
  }, [users, search]);

  const loadUsers = async () => {
    try {
      setFetching(true);
      setError('');
      const res = await fetch('/api/admin/users', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'No se pudo cargar el listado.');
      }
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (err) {
      setError(err.message || 'Error inesperado.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openCreate = () => {
    setFormMode('create');
    setEditingId(null);
    setFormData({ ...INITIAL_FORM, role: isSuperAdmin ? 'admin' : 'user' });
    setDialogOpen(true);
  };

  const openEdit = (user) => {
    setFormMode('edit');
    setEditingId(user.id);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'user',
      personType: user.personType || 'natural',
      phone: user.phone || '',
      address: user.address || '',
      rut: user.rut || '',
      businessName: user.businessName || '',
      avatarUrl: user.avatarUrl || '',
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setFormData(INITIAL_FORM);
    setEditingId(null);
  };

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        personType: formData.personType,
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        rut: formData.rut.trim(),
        businessName: formData.businessName.trim(),
        avatarUrl: formData.avatarUrl.trim(),
      };

      if (formMode === 'create') {
        payload.password = formData.password;
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || 'No se pudo crear el usuario.');
        }
      } else if (editingId) {
        if (formData.password.trim()) {
          payload.password = formData.password.trim();
        }
        const res = await fetch(`/api/admin/users/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || 'No se pudo actualizar el usuario.');
        }
      }

      closeDialog();
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    const confirmed = window.confirm(`Seguro que deseas eliminar a ${user.name}?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'No se pudo eliminar.');
      }
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Error al eliminar.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Gestion de usuarios</h1>
          <p className="text-sm text-slate-600">
            Crea y administra cuentas de clientes o administradores del sistema.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadUsers}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Actualizar
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            <Plus size={16} />
            Crear usuario
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Total: {users.length}</span>
        </div>
        <div className="w-full sm:w-64">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre, email o RUT"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Nombre</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Rol</th>
              <th className="px-4 py-3 text-left font-medium">Telefono</th>
              <th className="px-4 py-3 text-left font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fetching ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Cargando usuarios...
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  No se encontraron usuarios.
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 font-medium text-slate-800">{user.name}</td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        user.role === 'admin'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{user.phone || 'N/D'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                      >
                        <Pencil size={14} />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(user)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        title={formMode === 'create' ? 'Crear usuario' : 'Editar usuario'}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Nombre</span>
              <input
                required
                type="text"
                value={formData.name}
                onChange={handleChange('name')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Email</span>
              <input
                required
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">
                {formMode === 'create' ? 'Contrasena' : 'Contrasena (opcional)'}
              </span>
              <input
                type="password"
                required={formMode === 'create'}
                value={formData.password}
                onChange={handleChange('password')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                minLength={6}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Rol</span>
              <select
                value={formData.role}
                onChange={handleChange('role')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                disabled={!isSuperAdmin && formMode === 'create'}
              >
                <option value="user">Usuario</option>
                <option value="admin" disabled={!isSuperAdmin}>
                  Administrador
                </option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Tipo de persona</span>
              <select
                value={formData.personType}
                onChange={handleChange('personType')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="natural">Persona natural</option>
                <option value="empresa">Empresa</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Telefono</span>
              <input
                type="text"
                value={formData.phone}
                onChange={handleChange('phone')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Direccion</span>
              <input
                type="text"
                value={formData.address}
                onChange={handleChange('address')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">RUT / Identificador</span>
              <input
                type="text"
                value={formData.rut}
                onChange={handleChange('rut')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Razon social / Empresa</span>
              <input
                type="text"
                value={formData.businessName}
                onChange={handleChange('businessName')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="font-medium text-slate-700">Avatar (URL)</span>
              <input
                type="url"
                value={formData.avatarUrl}
                onChange={handleChange('avatarUrl')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeDialog}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {formMode === 'create' ? 'Crear usuario' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}


