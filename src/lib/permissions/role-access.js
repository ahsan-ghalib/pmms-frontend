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
