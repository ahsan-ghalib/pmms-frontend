function words(value) {
  return String(value || "").trim().toUpperCase().match(/[A-Z0-9]+/g) || [];
}

export function companyCode(name) {
  return words(name).map((word) => word[0]).join("").slice(0, 6);
}

export function nameCode(name) {
  const parts = words(name);
  if (!parts.length) return "";
  const numeric = parts.find((part) => /^\d+$/.test(part));
  if (numeric) return numeric;
  return parts.map((part) => part[0]).join("").slice(0, 6);
}

export function childCode(parent, name) {
  const child = nameCode(name);
  return child ? [parent, child].filter(Boolean).join("-") : parent;
}
