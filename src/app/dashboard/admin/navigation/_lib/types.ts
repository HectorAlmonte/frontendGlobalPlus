export type NavRole = {
  id: string;
  key: string;
  name: string;
};

export type NavItemRole = {
  navItemId: string;
  roleId: string;
  role: NavRole;
};

export type NavItem = {
  id: string;
  title: string;
  url: string;
  icon: string | null;
  order: number;
  roles: NavItemRole[];
};

export type NavSection = {
  id: string;
  title: string;
  icon: string | null;
  order: number;
  items: NavItem[];
};

export type SectionInput = {
  title: string;
  icon?: string;
  order?: number;
};

export type ItemInput = {
  sectionId: string;
  title: string;
  url: string;
  icon?: string;
  order?: number;
  roleIds?: string[];
};

export type ItemUpdateInput = {
  title?: string;
  url?: string;
  icon?: string;
  order?: number;
  sectionId?: string;
};
