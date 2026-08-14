"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { clearUserPermissions } from "@/lib/permissions/permission-utils";
import { useT } from "@/lib/use-t";

export default function LogOutButton({ className }) {
  const router = useRouter();
  const t = useT("common");

  const handleLogout = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Clear permissions from Redux and localStorage
    clearUserPermissions();
    if (typeof window !== "undefined") {
      localStorage.removeItem("soouqlive_impersonate_token");
      localStorage.removeItem("soouqlive_impersonate_user");
      localStorage.removeItem("persist:auth");
      localStorage.removeItem("authUser");
      localStorage.removeItem("soouqlive_permissions");
    }
    
    try {
      const { default: axiosInstance } = await import("@/lib/axios");
      // Call backend to revoke sanctum token
      await axiosInstance.post("/logout").catch((err) => {
        console.warn("Backend logout failed or token already revoked", err);
      });

      const { signOut } = await import("next-auth/react");
      await signOut({ 
        callbackUrl: "/login",
        redirect: true 
      });
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback: redirect manually if signOut fails
      router.push("/login");
    }
  };

  return (
    <button 
      onClick={handleLogout} 
      className={className}
      type="button"
    >
      <LogOut className="w-4 h-4" />
      <span className="text-sm font-medium">{t("Logout")}</span>
    </button>
  );
}
