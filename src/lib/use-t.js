"use client";

import { useTranslations } from "next-intl";

function interpolate(template, values) {
  if (!template || !values) return template;
  return String(template).replace(/\{(\w+)\}/g, (_, key) => (
    values[key] == null ? `{${key}}` : String(values[key])
  ));
}

export function useT(namespace = "common") {
  const t = useTranslations(namespace);

  return (key, opts = {}) => {
    const { defaultMessage, ...values } = opts;
    try {
      if (typeof t.has === "function") {
        if (!t.has(key)) return interpolate(defaultMessage || key, values);
        return t(key, values);
      }

      const result = t(key, values);
      if (result === key || result === `${namespace}.${key}`) {
        return interpolate(defaultMessage || key, values);
      }
      return result;
    } catch {
      return interpolate(defaultMessage || key, values);
    }
  };
}
