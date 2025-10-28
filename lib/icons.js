import {
  ListTree,
  Home,
  Briefcase,
  Mail,
  Phone,
  Grid2x2,
  ClipboardList,
  MessageCircle,
  User,
  Settings,
  LayoutDashboard,
  Layers,
  Globe,
  Rocket,
  ShieldCheck,
  Star,
  ShoppingBag,
  Monitor,
  Code2,
  BookOpen,
  Heart,
} from 'lucide-react';

export const ICON_LIBRARY = [
  { value: '', label: 'Sin icono', icon: null },
  { value: 'home', label: 'Inicio', icon: Home },
  { value: 'layout-dashboard', label: 'Panel', icon: LayoutDashboard },
  { value: 'briefcase', label: 'Servicios', icon: Briefcase },
  { value: 'layers', label: 'Capas', icon: Layers },
  { value: 'grid-2x2', label: 'Dashboard', icon: Grid2x2 },
  { value: 'globe', label: 'Global', icon: Globe },
  { value: 'rocket', label: 'Lanzamiento', icon: Rocket },
  { value: 'shield-check', label: 'Seguridad', icon: ShieldCheck },
  { value: 'star', label: 'Destacado', icon: Star },
  { value: 'shopping-bag', label: 'Tienda', icon: ShoppingBag },
  { value: 'clipboard-list', label: 'Pedidos', icon: ClipboardList },
  { value: 'mail', label: 'Correo', icon: Mail },
  { value: 'phone', label: 'Telefono', icon: Phone },
  { value: 'message-circle', label: 'Mensajes', icon: MessageCircle },
  { value: 'user', label: 'Perfil', icon: User },
  { value: 'settings', label: 'Ajustes', icon: Settings },
  { value: 'monitor', label: 'Monitor', icon: Monitor },
  { value: 'code', label: 'Codigo', icon: Code2 },
  { value: 'book-open', label: 'Documentacion', icon: BookOpen },
  { value: 'heart', label: 'Favorito', icon: Heart },
];

const ICON_MAP = {
  listtree: ListTree,
  home: Home,
  inicio: Home,
  briefcase: Briefcase,
  services: Briefcase,
  servicio: Briefcase,
  servicios: Briefcase,
  mail: Mail,
  email: Mail,
  contact: Mail,
  contacto: Mail,
  phone: Phone,
  telefono: Phone,
  grid: Grid2x2,
  grid2x2: Grid2x2,
  dashboard: Grid2x2,
  clipboard: ClipboardList,
  clipboardlist: ClipboardList,
  pedidos: ClipboardList,
  orders: ClipboardList,
  message: MessageCircle,
  mensajes: MessageCircle,
  messagecircle: MessageCircle,
  user: User,
  perfil: User,
  settings: Settings,
  ajustes: Settings,
  layoutdashboard: LayoutDashboard,
  panel: LayoutDashboard,
  layers: Layers,
  monitor: Monitor,
  globe: Globe,
  rocket: Rocket,
  shieldcheck: ShieldCheck,
  security: ShieldCheck,
  star: Star,
  shoppingbag: ShoppingBag,
  tienda: ShoppingBag,
  code: Code2,
  code2: Code2,
  bookopen: BookOpen,
  documentacion: BookOpen,
  heart: Heart,
};

export function normalizeIconKey(iconName = '') {
  return iconName.trim().replace(/[\s_-]+/g, '').toLowerCase();
}

export function getIconComponent(iconName) {
  if (!iconName) return null;
  const key = normalizeIconKey(iconName);
  return ICON_MAP[key] || null;
}

export function filterIconOptions(library, term = '') {
  const value = term.trim().toLowerCase();
  if (!value) return library;
  return library.filter((option) => {
    const label = option.label.toLowerCase();
    const iconValue = (option.value || '').toLowerCase();
    return label.includes(value) || iconValue.includes(value);
  });
}
