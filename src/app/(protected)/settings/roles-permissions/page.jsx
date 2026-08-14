"use client";

import { useEffect, useState, useMemo } from "react";
import { rolesPermissionsApi } from "@/services/roles-permissions/roles-permissions-api";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

// Helper function to format permission names for display
// Converts "add-users" to "Add Users"
const formatPermissionName = (name) => {
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export default function RolesPermissionsPage() {
  const t = useTranslations("admin");
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [modules, setModules] = useState([]);
  const [originalModules, setOriginalModules] = useState([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setIsLoadingRoles(true);
        const data = await rolesPermissionsApi.getRoles();
        setRoles(data || []);
        if (!selectedRoleId && data && data.length > 0) {
          setSelectedRoleId(data[0].id);
        }
      } catch (error) {
        console.error("Failed to load roles", error);
        toast.error("Failed to load roles");
      } finally {
        setIsLoadingRoles(false);
      }
    };

    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedRoleId) return;

    const fetchPermissions = async () => {
      try {
        setIsLoadingPermissions(true);
        const data = await rolesPermissionsApi.getRolePermissions(selectedRoleId);
        // Deep clone to store original state
        const clonedData = JSON.parse(JSON.stringify(data || []));
        setModules(data || []);
        setOriginalModules(clonedData);
      } catch (error) {
        console.error("Failed to load permissions for role", error);
        toast.error("Failed to load permissions");
      } finally {
        setIsLoadingPermissions(false);
      }
    };

    fetchPermissions();
  }, [selectedRoleId]);

  // Filter modules and permissions based on search query
  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return modules;

    const query = searchQuery.toLowerCase();
    return modules
      .map((module) => {
        // Filter permissions within each module
        const filteredPermissions = module.permissions.filter((perm) =>
          perm.name.toLowerCase().includes(query)
        );
        const filteredCustomPermissions = module.custom_permissions.filter((perm) =>
          perm.name.toLowerCase().includes(query)
        );

        // Only include module if it has matching permissions or module name matches
        const moduleNameMatches = module.name.toLowerCase().includes(query);
        const hasMatchingPermissions =
          filteredPermissions.length > 0 || filteredCustomPermissions.length > 0;

        if (moduleNameMatches || hasMatchingPermissions) {
          return {
            ...module,
            permissions: moduleNameMatches ? module.permissions : filteredPermissions,
            custom_permissions: moduleNameMatches
              ? module.custom_permissions
              : filteredCustomPermissions,
          };
        }
        return null;
      })
      .filter((module) => module !== null);
  }, [modules, searchQuery]);

  // Check if there are any changes compared to original state
  const hasChanges = useMemo(() => {
    if (originalModules.length === 0 || modules.length === 0) return false;

    // Compare each module's permissions
    for (let i = 0; i < modules.length; i++) {
      const currentModule = modules[i];
      const originalModule = originalModules.find((m) => m.id === currentModule.id);
      
      if (!originalModule) return true;

      // Compare standard permissions
      if (currentModule.permissions.length !== originalModule.permissions.length) {
        return true;
      }
      
      for (const perm of currentModule.permissions) {
        const originalPerm = originalModule.permissions.find((p) => p.id === perm.id);
        if (!originalPerm || originalPerm.has_permission !== perm.has_permission) {
          return true;
        }
      }

      // Compare custom permissions
      if (currentModule.custom_permissions.length !== originalModule.custom_permissions.length) {
        return true;
      }

      for (const perm of currentModule.custom_permissions) {
        const originalPerm = originalModule.custom_permissions.find((p) => p.id === perm.id);
        if (!originalPerm || originalPerm.has_permission !== perm.has_permission) {
          return true;
        }
      }
    }

    return false;
  }, [modules, originalModules]);

  const handleTogglePermission = (moduleId, permissionId, isCustom) => {
    setModules((prev) =>
      prev.map((m) => {
        if (m.id !== moduleId) return m;
        const key = isCustom ? "custom_permissions" : "permissions";
        return {
          ...m,
          [key]: m[key].map((p) =>
            p.id === permissionId ? { ...p, has_permission: !p.has_permission } : p
          ),
        };
      })
    );
  };

  const handleSave = async () => {
    if (!selectedRoleId) return;
    try {
      setIsSaving(true);
      const permissionIds = modules.flatMap((m) => [
        ...m.permissions.filter((p) => p.has_permission).map((p) => p.id),
        ...m.custom_permissions.filter((p) => p.has_permission).map((p) => p.id),
      ]);
      await rolesPermissionsApi.updateRolePermissions(selectedRoleId, permissionIds);
      
      // Update original state after successful save
      const clonedData = JSON.parse(JSON.stringify(modules));
      setOriginalModules(clonedData);
      
      toast.success("Permissions updated successfully");
    } catch (error) {
      console.error("Failed to update permissions", error);
      toast.error("Failed to update permissions");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("Roles_Permissions", { defaultMessage: "Roles & Permissions" })}</h1>
          <p className="text-sm text-muted-foreground">
            {t("Manage_permissions_desc", { defaultMessage: "Manage which permissions are granted to each role across the system." })}
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!selectedRoleId || isSaving || !hasChanges}
          className="min-w-[120px]"
        >
          {isSaving ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("Saving", { defaultMessage: "Saving..." })}
            </span>
          ) : (
            t("Save_changes", { defaultMessage: "Save changes" })
          )}
        </Button>
      </div>

      <div className="flex gap-6">
        <div className="w-64 shrink-0 sticky top-4 self-start">
          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl">
            <div className="border-b px-4 py-3">
              <h2 className="text-sm font-medium">{t("Roles", { defaultMessage: "Roles" })}</h2>
            </div>
            <div className="max-h-[480px] overflow-y-auto">
              {isLoadingRoles ? (
                <div className="flex items-center justify-center px-4 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t("Loading_roles", { defaultMessage: "Loading roles..." })}
                </div>
              ) : roles.length === 0 ? (
                <div className="px-4 py-6 text-sm text-muted-foreground">
                  {t("No_roles_found", { defaultMessage: "No roles found." })}
                </div>
              ) : (
                roles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-sm border-b last:border-b-0 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors",
                      selectedRoleId === role.id && "bg-white/60 dark:bg-slate-800/60 font-medium"
                    )}
                    onClick={() => setSelectedRoleId(role.id)}
                  >
                    {role.display_name || role.name}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-4 md:p-5">
            {isLoadingPermissions ? (
              <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                {t("Loading_permissions", { defaultMessage: "Loading permissions..." })}
              </div>
            ) : !selectedRoleId ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                {t("Select_role_desc", { defaultMessage: "Select a role to view and edit its permissions." })}
              </div>
            ) : modules.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                {t("No_permissions_configured", { defaultMessage: "No permissions configured yet." })}
              </div>
            ) : (
              <>
                {/* Search Input */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t("Search_permissions", { defaultMessage: "Search permissions..." })}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Permissions List */}
                {filteredModules.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    {t("No_permissions_matching", { defaultMessage: 'No permissions found matching "{searchQuery}".', searchQuery })}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredModules.map((module) => (
                  <div key={module.id} className="border border-white/40 dark:border-white/10 rounded-xl overflow-hidden">
                    <div className="border-b border-white/40 dark:border-white/10 px-4 py-2.5 bg-white/50 dark:bg-slate-800/50 flex items-center justify-between">
                      <h3 className="text-sm font-semibold">{module.name}</h3>
                    </div>
                    <div className="divide-y divide-white/40 dark:divide-white/10">
                      {module.permissions.map((perm) => (
                        <div
                          key={perm.id}
                          className="flex items-center justify-between px-4 py-2 text-sm"
                        >
                          <span>{formatPermissionName(perm.name)}</span>
                          <Switch
                            checked={perm.has_permission}
                            onCheckedChange={() =>
                              handleTogglePermission(module.id, perm.id, false)
                            }
                          />
                        </div>
                      ))}
                      {module.custom_permissions.length > 0 && (
                        <div className="bg-white/30 dark:bg-slate-800/30 px-4 py-2 text-xs font-medium text-muted-foreground">
                          {t("Custom_permissions", { defaultMessage: "Custom permissions" })}
                        </div>
                      )}
                      {module.custom_permissions.map((perm) => (
                        <div
                          key={perm.id}
                          className="flex items-center justify-between px-4 py-2 text-sm"
                        >
                          <span>{formatPermissionName(perm.name)}</span>
                          <Switch
                            checked={perm.has_permission}
                            onCheckedChange={() =>
                              handleTogglePermission(module.id, perm.id, true)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

