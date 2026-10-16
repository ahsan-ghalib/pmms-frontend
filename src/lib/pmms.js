export function unwrapData(payload) {
  const data = payload?.data ?? payload;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return data ?? null;
}

export function apiError(error, fallback = "Something went wrong") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.errors?.[Object.keys(error?.response?.data?.errors || {})[0]]?.[0] ||
    fallback
  );
}

export function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

export function formatDay(value) {
  if (!value) return "—";
  return String(value).slice(0, 10);
}

export const BILLING_CURRENCIES = ["QAR", "AED", "SAR", "KWD", "BHD", "OMR"];
export const BILLING_CYCLES = ["monthly", "annual"];
export const PAYMENT_METHODS = ["bank_transfer", "cash", "cheque", "card", "other"];

export function currencyDecimals(currency) {
  return ["KWD", "BHD", "OMR"].includes(currency) ? 3 : 2;
}

export function formatMoney(value, currency = "QAR") {
  if (value == null || value === "") return "—";
  const decimals = currencyDecimals(currency);
  const amount = Number(value).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${currency} ${amount}`;
}

export function labelize(value) {
  if (!value) return "—";
  return String(value).replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
