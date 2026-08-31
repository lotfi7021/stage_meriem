export type Role = 'admin' | 'agent';

export type Permission =
  | 'dashboard:view'
  | 'clients:view'
  | 'clients:manage'
  | 'factures:view'
  | 'factures:manage'
  | 'paiements:view'
  | 'paiements:manage'
  | 'risques:view'
  | 'rapports:view'
  | 'rapports:manage'
  | 'notifications:view'
  | 'notifications:manage'
  | 'users:manage';

export const rolePermissions: Record<Role, Permission[]> = {
  admin: [
    'dashboard:view',
    'clients:view',
    'factures:view',
    'paiements:view',
    'risques:view',
    'rapports:view',
    'notifications:view',
    'users:manage',
  ],
  agent: [
    'dashboard:view',
    'clients:view',
    'clients:manage',
    'factures:view',
    'factures:manage',
    'paiements:view',
    'paiements:manage',
    'risques:view',
    'rapports:view',
    'rapports:manage',
    'notifications:view',
    'notifications:manage',
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}
