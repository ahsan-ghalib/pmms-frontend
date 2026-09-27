export const FEATURE_LOCKED_MESSAGE =
  "This feature is not included in your current plan. Please upgrade your plan to access it.";

export const MODULE_FEATURES = {
  "work-orders": "work-orders",
  duty: "duty-tracking",
  "live-map": "live-map",
  complaints: "complaints",
  "maintenance-schedules": "preventive-maintenance",
  reports: "reports",
  "sla-report": "sla",
  notifications: "notifications",
  broadcasts: "notifications",
  checklists: "checklists",
  inventory: "inventory",
  "purchase-requests": "purchase-requests",
  properties: "properties",
  assets: "assets",
  users: "users-roles",
  tenants: "tenants-portal",
  "asset-categories": "assets",
  "part-categories": "inventory",
  sla: "sla",
  "notification-settings": "notifications",
  "checklist-settings": "checklists",
  categories: "complaints",
  services: "complaints",
  settings: "complaints",
  calendar: "complaints",
  roles: "users-roles",
};

const PATH_FEATURES = [
  ["/work-orders", "work-orders"],
  ["/duty", "duty-tracking"],
  ["/live-map", "live-map"],
  ["/complaints", "complaints"],
  ["/maintenance-schedules", "preventive-maintenance"],
  ["/reports/sla", "sla"],
  ["/reports", "reports"],
  ["/notifications", "notifications"],
  ["/broadcasts", "notifications"],
  ["/checklists", "checklists"],
  ["/inventory/purchase-requests", "purchase-requests"],
  ["/inventory", "inventory"],
  ["/properties", "properties"],
  ["/assets", "assets"],
  ["/users", "users-roles"],
  ["/tenants", "tenants-portal"],
  ["/settings/asset-categories", "assets"],
  ["/settings/part-categories", "inventory"],
  ["/settings/sla", "sla"],
  ["/settings/notifications", "notifications"],
  ["/settings/checklists", "checklists"],
  ["/settings/categories", "complaints"],
  ["/settings/services", "complaints"],
  ["/settings/complaint-settings", "complaints"],
  ["/settings/working-calendar", "complaints"],
  ["/settings/roles-permissions", "users-roles"],
];

export function featureForModule(module) {
  return MODULE_FEATURES[module] || null;
}

export function featureForPath(pathname) {
  if (!pathname) return null;
  const match = PATH_FEATURES.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  return match?.[1] || null;
}

export function hasPlanFeature(entitlements, feature) {
  if (!feature) return true;
  if (!entitlements) return true;
  if (entitlements.scope === "platform" || entitlements.all_features) return true;
  return (entitlements.features || []).includes(feature);
}

export function lockedMessage(entitlements) {
  return entitlements?.locked_message || FEATURE_LOCKED_MESSAGE;
}
