import Link from 'next/link';
import Image from 'next/image';

const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/services', label: 'Servicios' },
  { href: '/portfolio', label: 'Portafolio' },
  { href: '/contact', label: 'Contacto' },
  { href: '/orders', label: 'Mis pedidos' },
  { href: '/messages', label: 'Mis mensajes' },
];

const LEGAL_LINKS = [
  { href: '/#politicas', label: 'Política de privacidad' },
  { href: '/#terminos', label: 'Términos y condiciones' },
  { href: '/contact', label: 'Garantías y soporte' },
];

export default function Footer() {
  return (
    <footer className="mt-auto bg-gray-950 text-gray-300">
      <div className="container py-12">
        <div className="grid gap-10 md:grid-cols-[1.2fr,1fr,1fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-full border border-indigo-500/60 bg-indigo-500/10">
                <Image src="/virt.jpg" alt="VirtualDesk" fill className="object-cover" sizes="48px" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">VirtualDesk</p>
                <p className="text-xs uppercase tracking-widest text-indigo-200/80">Soluciones digitales</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              Creamos software a la medida para personas y empresas. Integramos tecnología, diseño y soporte continuo
              para que tu negocio avance sin fricciones.
            </p>
            <div className="space-y-2 text-sm">
              <p className="text-white font-semibold uppercase tracking-wide text-xs">Contacto directo</p>
              <p className="text-gray-400">+56 9 9988 7766</p>
              <p className="text-gray-400">hola@virtualdesk.cl</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-200/90">Navegación</p>
            <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-400 transition hover:text-white hover:underline hover:underline-offset-4"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4" id="quienes-somos">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-indigo-200/90">Nosotros</p>
              <p className="mt-3 text-sm text-gray-400 leading-relaxed">
                Somos un equipo multidisciplinario con experiencia en automatización, desarrollo web y operaciones
                cloud. Podemos acompañarte desde la ideación hasta la mantención de tu plataforma.
              </p>
            </div>
            <div>
              <p id="politicas" className="text-sm font-semibold uppercase tracking-wide text-indigo-200/90">
                Políticas
              </p>
              <div id="terminos" className="mt-3 flex flex-col gap-2 text-sm">
                {LEGAL_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-gray-400 transition hover:text-white hover:underline hover:underline-offset-4"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} VirtualDesk. Todos los derechos reservados.
      </div>
    </footer>
  );
}
