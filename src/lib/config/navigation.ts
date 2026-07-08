export type NavItem = {
  href: string;
  label: string;
  match: (path: string) => boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Inicio', match: (path) => path === '/' },
  { href: '/encuestas', label: 'Encuestas', match: (path) => path.startsWith('/encuestas') },
  { href: '/encuestadoras', label: 'Encuestadoras', match: (path) => path.startsWith('/encuestadoras') },
  { href: '/house-effects', label: 'House effects', match: (path) => path.startsWith('/house-effects') },
  { href: '/metodologia', label: 'Metodologia', match: (path) => path.startsWith('/metodologia') }
];
