import { dbConnect } from '@/lib/mongodb';
import Message from '@/models/Message';
import Service from '@/models/Service';
import User from '@/models/User';
import Work from '@/models/Work';

async function getMetrics() {
  await dbConnect();

  const [userCount, adminCount, serviceCount, workCount, messageCount] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: 'admin' }),
    Service.countDocuments({}),
    Work.countDocuments({}),
    Message.countDocuments({}),
  ]);

  return {
    userCount,
    adminCount,
    serviceCount,
    workCount,
    messageCount,
  };
}

export default async function AdminDashboardPage() {
  const metrics = await getMetrics();

  const cards = [
    {
      label: 'Usuarios totales',
      value: metrics.userCount,
      accent: 'bg-indigo-100 text-indigo-700',
    },
    {
      label: 'Administradores',
      value: metrics.adminCount,
      accent: 'bg-emerald-100 text-emerald-700',
    },
    {
      label: 'Servicios publicados',
      value: metrics.serviceCount,
      accent: 'bg-sky-100 text-sky-700',
    },
    {
      label: 'Trabajos cargados',
      value: metrics.workCount,
      accent: 'bg-purple-100 text-purple-700',
    },
    {
      label: 'Mensajes recibidos',
      value: metrics.messageCount,
      accent: 'bg-amber-100 text-amber-700',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Bienvenido al panel</h1>
        <p className="mt-1 text-sm text-slate-600">
          Gestiona usuarios, servicios, trabajos y responde mensajes desde un solo lugar.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${card.accent}`}>
              {card.label}
            </div>
            <p className="mt-4 text-3xl font-bold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Siguientes pasos recomendados</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          <li>• Crea o actualiza los servicios que ofreces desde la seccion Servicios.</li>
          <li>• Administra el equipo con cuentas de administrador adicionales.</li>
          <li>• Carga los trabajos mas recientes para mostrarlos en la web.</li>
          <li>• Revisa el centro de mensajes para responder solicitudes de clientes.</li>
        </ul>
      </div>
    </div>
  );
}
