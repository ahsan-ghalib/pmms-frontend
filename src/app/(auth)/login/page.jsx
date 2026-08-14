 "use client";

import { useEffect } from "react";
import LoginForm from "@/containers/auth/login/page";

export default function DeliveryPartnersPage() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem("soouqlive_permissions");
      localStorage.removeItem("soouqlive_impersonate_token");
      localStorage.removeItem("soouqlive_impersonate_user");
    } catch {
      // ignore
    }
  }, []);

  return <LoginForm />;
}
