import axiosInstance from "@/lib/axios";

const PATH_MODULES = [
  ["/dashboard", "dashboard"],
  ["/work-orders", "work-orders"],
  ["/duty", "duty"],
  ["/live-map", "live-map"],
  ["/technicians", "live-map"],
  ["/complaints", "complaints"],
  ["/maintenance-schedules", "maintenance-schedules"],
  ["/reports/sla", "sla-report"],
  ["/reports", "reports"],
  ["/notifications", "notifications"],
  ["/broadcasts", "broadcasts"],
  ["/checklists", "checklists"],
  ["/inventory/purchase-requests", "purchase-requests"],
  ["/inventory", "inventory"],
  ["/properties", "properties"],
  ["/locations", "properties"],
  ["/assets", "assets"],
  ["/companies", "companies"],
  ["/users", "users"],
  ["/tenants", "tenants"],
  ["/languages", "languages"],
  ["/subscription-plans", "subscription-plans"],
  ["/subscriptions", "subscriptions"],
  ["/billing", "billing"],
  ["/plan-features", "plan-features"],
  ["/trials", "trials"],
  ["/platform-settings", "platform-settings"],
  ["/property-types", "property-types"],
  ["/settings/modules", "platform-settings"],
  ["/settings/categories", "categories"],
  ["/settings/asset-categories", "asset-categories"],
  ["/settings/part-categories", "part-categories"],
  ["/settings/stock-locations", "stock-locations"],
  ["/settings/sla", "sla"],
  ["/settings/notifications", "notification-settings"],
  ["/settings/checklists", "checklist-settings"],
  ["/settings/services", "services"],
  ["/settings/complaint-settings", "settings"],
  ["/settings/working-calendar", "calendar"],
  ["/settings/roles-permissions", "roles"],
].sort((a, b) => b[0].length - a[0].length);

const OPEN_PATHS = ["/profile", "/not-allowed"];

const LANDING_ORDER = [
  ["dashboard", "/dashboard"],
  ["work-orders", "/work-orders"],
  ["complaints", "/complaints"],
  ["duty", "/duty"],
  ["reports", "/reports"],
  ["sla-report", "/reports/sla"],
  ["inventory", "/inventory"],
  ["purchase-requests", "/inventory/purchase-requests"],
  ["properties", "/properties"],
  ["assets", "/assets"],
  ["checklists", "/checklists"],
  ["notifications", "/notifications"],
  ["users", "/users"],
  ["tenants", "/tenants"],
];

function matches(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Menu key guarding a portal path; `null` for pages every signed-in user may open, `undefined` when unknown. */
export function moduleForPath(pathname) {
  if (!pathname) return null;
  if (OPEN_PATHS.some((path) => matches(pathname, path))) return null;
  return PATH_MODULES.find(([prefix]) => matches(pathname, prefix))?.[1];
}

const ACTION_MODULES = [
  ["/inventory/purchase-requests", "Purchase Requests"],
  ["/inventory/parts", "Inventory"],
  ["/properties", "Properties"],
  ["/assets", "Assets"],
  ["/work-orders", "Work Orders"],
  ["/complaints", "Complaints"],
  ["/tenants", "Tenants"],
  ["/users", "Users"],
  ["/companies", "Companies"],
  ["/subscriptions", "Subscriptions"],
  ["/settings/categories", "Categories"],
  ["/settings/services", "Services"],
];

/** Permission a create/edit page needs, e.g. "Add Assets" for /assets/create; `null` for other pages. */
export function actionPermissionForPath(pathname) {
  const segments = (pathname || "").split("/").filter(Boolean);
  const action = segments.includes("create") ? "Add" : segments.includes("edit") ? "Edit" : null;
  if (!action) return null;
  const entry = ACTION_MODULES.find(([prefix]) => matches(pathname, prefix));
  return entry ? `${action} ${entry[1]}` : null;
}

export function landingPathFor(modules = []) {
  return LANDING_ORDER.find(([key]) => modules.includes(key))?.[1] || null;
}

const STALE_AFTER_MS = 60 * 1000;

let snapshot = null;
let loadedAt = 0;
let pending = null;
const listeners = new Set();

function publish(next) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

export function subscribeModuleAccess(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** `{ token, modules, permissions }` of the last load, so a previous session's modules are never reused. */
export function getModuleAccessSnapshot() {
  return snapshot;
}

/** Reloads the signed-in user's visible modules; role permissions can change during a session. */
export function refreshModuleAccess(token) {
  if (pending) return pending;
  const owner = token ?? snapshot?.token ?? null;
  pending = axiosInstance
    .get("/permissions")
    .then((response) => {
      loadedAt = Date.now();
      const data = response.data?.data || {};
      publish({ token: owner, modules: data.modules || [], permissions: data.permissions || [] });
      return snapshot.modules;
    })
    .finally(() => {
      pending = null;
    });
  return pending;
}

export function ensureModuleAccess(token) {
  const fresh = snapshot?.token === token && Date.now() - loadedAt < STALE_AFTER_MS;
  if (!token || fresh) return Promise.resolve(snapshot?.modules ?? null);
  return refreshModuleAccess(token);
}

export function clearModuleAccess() {
  publish(null);
}
