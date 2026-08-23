export const Roles = {
  SUPER_ADMIN: "super-admin",
  COMPANY_ADMIN: "company-admin",
  PROPERTY_MANAGER: "property-manager",
  SUPERVISOR: "supervisor",
  TECHNICIAN: "technician",
  TENANT: "tenant",
  VENDOR: "vendor",
};

export function normalizeRole(role) {
  if (!role) return null;
  if (typeof role === "object") return role.name || role.slug || null;
  return String(role);
}

export function isManager(role) {
  return [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN, Roles.SUPERVISOR].includes(normalizeRole(role));
}

export function isAdmin(role) {
  return [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN].includes(normalizeRole(role));
}

const MODULE_ROLES = {
  dashboard: Object.values(Roles),
  companies: [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN],
  users: [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN],
  properties: [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN, Roles.PROPERTY_MANAGER, Roles.SUPERVISOR],
  assets: [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN, Roles.PROPERTY_MANAGER, Roles.SUPERVISOR],
  "asset-categories": [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN, Roles.SUPERVISOR],
  inventory: [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN, Roles.PROPERTY_MANAGER, Roles.SUPERVISOR],
  "purchase-requests": [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN, Roles.PROPERTY_MANAGER, Roles.SUPERVISOR],
  "part-categories": [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN, Roles.SUPERVISOR],
  sla: [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN],
  "sla-report": [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN, Roles.PROPERTY_MANAGER, Roles.SUPERVISOR],
  reports: [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN, Roles.PROPERTY_MANAGER, Roles.SUPERVISOR],
  notifications: [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN, Roles.PROPERTY_MANAGER, Roles.SUPERVISOR, Roles.TECHNICIAN, Roles.TENANT, Roles.VENDOR],
  broadcasts: [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN],
  "notification-settings": [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN],
  checklists: [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN, Roles.PROPERTY_MANAGER, Roles.SUPERVISOR, Roles.TECHNICIAN],
  "checklist-settings": [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN],
  complaints: [
    Roles.SUPER_ADMIN,
    Roles.COMPANY_ADMIN,
    Roles.PROPERTY_MANAGER,
    Roles.SUPERVISOR,
    Roles.TECHNICIAN,
    Roles.TENANT,
  ],
  "work-orders": [
    Roles.SUPER_ADMIN,
    Roles.COMPANY_ADMIN,
    Roles.PROPERTY_MANAGER,
    Roles.SUPERVISOR,
    Roles.TECHNICIAN,
    Roles.TENANT,
  ],
  duty: [Roles.TECHNICIAN],
  "live-map": [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN, Roles.PROPERTY_MANAGER, Roles.SUPERVISOR],
  "maintenance-schedules": [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN, Roles.SUPERVISOR],
  categories: [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN],
  services: [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN],
  settings: [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN],
  calendar: [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN],
  roles: [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN],
  languages: [Roles.SUPER_ADMIN],
  "subscription-plans": [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN],
  subscriptions: [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN],
  trials: [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN],
  "platform-settings": [Roles.SUPER_ADMIN],
};

export function canSeeModule(role, module) {
  const normalized = normalizeRole(role);
  if (normalized === Roles.SUPER_ADMIN) return true;
  return (MODULE_ROLES[module] || []).includes(normalized);
}
