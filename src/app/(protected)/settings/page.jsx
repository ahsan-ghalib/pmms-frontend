"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axiosInstance.get("/vendor/settings");
      setSettings(response.data.data || []);
    } catch (error) {
      toast.error("Failed to load settings.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key, checked) => {
    setSettings((prev) =>
      prev.map((s) => {
        if (s.key === key) {
          const options = s.options ? JSON.parse(s.options) : ["enabled", "disabled"];
          return { ...s, value: checked ? options[0] : options[1] };
        }
        return s;
      })
    );
  };

  const handleChangeText = (key, val) => {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value: val } : s))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        settings: settings.map((s) => ({
          key: s.key,
          value: s.value,
        })),
      };
      await axiosInstance.post("/vendor/settings", payload);
      toast.success("Settings have been updated successfully.");
    } catch (error) {
      toast.error("Failed to save settings.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Group settings
  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.group]) acc[setting.group] = [];
    acc[setting.group].push(setting);
    return acc;
  }, {});

  return (
    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6 space-y-6">
      <div>
        <h3 className="text-lg font-medium">Store Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your store preferences, notifications, and features.
        </p>
      </div>

      <div className="space-y-6">
        {Object.keys(groupedSettings).map((group) => (
          <Card className="border-0" key={group}>
            <CardHeader>
              <CardTitle className="uppercase text-sm tracking-widest text-muted-foreground">
                {group}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {groupedSettings[group].map((setting) => (
                <div
                  key={setting.key}
                  className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="mb-2 sm:mb-0">
                    <p className="font-medium">{setting.display_name}</p>
                    {setting.description && (
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    )}
                  </div>
                  <div className="sm:ml-4 sm:w-1/3 flex justify-end">
                    {setting.type === "switch" ? (
                      <Switch
                        checked={setting.value === "enabled" || setting.value === "auto"}
                        onCheckedChange={(checked) => handleToggle(setting.key, checked)}
                      />
                    ) : setting.type === "select" ? (
                      <Select 
                        value={setting.value || ""} 
                        onValueChange={(val) => handleChangeText(setting.key, val)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          {(setting.options ? JSON.parse(setting.options) : []).map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={setting.type === "number" ? "number" : "text"}
                        value={setting.value || ""}
                        onChange={(e) => handleChangeText(setting.key, e.target.value)}
                        placeholder={setting.display_name}
                      />
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}
