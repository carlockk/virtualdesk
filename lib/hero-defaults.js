export const DEFAULT_HERO = {
  visible: true,
  height: 80,
  title: {
    text: 'Soluciones Integrales de Software',
    visible: true,
  },
  subtitle: {
    text: 'Transformamos ideas en productos digitales escalables y robustos.',
    visible: true,
  },
  heroImage: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=1920&auto=format&fit=crop',
  slides: [
    {
      id: 'slide-1',
      imageUrl: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=1920&auto=format&fit=crop',
    },
    {
      id: 'slide-2',
      imageUrl: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=1920&auto=format&fit=crop',
    },
    {
      id: 'slide-3',
      imageUrl: 'https://images.unsplash.com/photo-1551836022-4c4c79ecde51?q=80&w=1920&auto=format&fit=crop',
    },
  ],
  buttons: [
    {
      id: 'primary',
      label: 'Explorar servicios',
      href: '/services',
      icon: 'briefcase',
      visible: true,
    },
    {
      id: 'secondary',
      label: 'Contacto',
      href: '/contact',
      icon: 'mail',
      visible: true,
    },
  ],
};
