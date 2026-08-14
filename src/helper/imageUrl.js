/**
 * Resolves a path or full URL to an absolute image URL so images load from the API server.
 * - If pathOrUrl is already http(s) or data:, return as-is.
 * - If it's a path (e.g. /uploads/...), prepend the API origin so the browser loads from the backend.
 */
export function getImageUrl(pathOrUrl) {
  if (!pathOrUrl) return "";
  const s = typeof pathOrUrl === "string" ? pathOrUrl : String(pathOrUrl).trim();
  if (
    s.startsWith("http://") ||
    s.startsWith("https://") ||
    s.startsWith("data:")
  ) {
    return s;
  }
  if (!s.trim()) return "";
  const path = s.trim();
  // Backend origin: strip /api/v1 from NEXT_PUBLIC_API_URL so uploads are at origin + path
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const base = apiUrl.replace(/\/api\/v1\/?$/, "");
  return base ? `${base}${path.startsWith("/") ? "" : "/"}${path}` : path;
}
