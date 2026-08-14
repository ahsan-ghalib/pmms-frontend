"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { LoadingSpinner } from "@/helper/Loader";
import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import { Settings2, Search } from "lucide-react";

// Normalize options from API (array of strings or array of { value, label })
function getSelectOptions(options) {
  if (!options) return [];
  const arr = Array.isArray(options) ? options : Object.entries(options).map(([k, v]) => ({ value: k, label: String(v) }));
  return arr.map((item) =>
    typeof item === "string"
      ? { value: item, label: item }
      : { value: String(item.value ?? item.id ?? item.key), label: String(item.label ?? item.name ?? item.value ?? item) }
  );
}

function SettingControl({ setting, value, isActive, onValueChange, onActiveChange }) {
  const type = setting.type?.toLowerCase?.() || "input";
  const options = getSelectOptions(setting.options);
  const displayName = setting.display_name || setting.name;

  const handleChange = (v) => {
    onValueChange(setting.id, v);
  };

  const handleActiveChange = (checked) => {
    onActiveChange(setting.id, checked);
  };

  // Text-like value for inputs
  const strValue = value ?? setting.values ?? setting.default_value ?? "";

  if (type === "textarea") {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <Label className="shrink-0">{displayName}</Label>
          <Switch checked={!!isActive} onCheckedChange={handleActiveChange} />
        </div>
        {setting.description && (
          <p className="text-sm text-muted-foreground">{setting.description}</p>
        )}
        <Textarea
          value={strValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={setting.default_value}
          rows={3}
        />
      </div>
    );
  }

  if (type === "toggle" || type === "checkbox") {
    const checked = strValue === "true" || strValue === "1" || !!isActive;
    return (
      <div className="flex flex-row items-center justify-between gap-4">
        <div>
          <Label className="font-medium">{displayName}</Label>
          {setting.description && (
            <p className="text-sm text-muted-foreground">{setting.description}</p>
          )}
        </div>
        <Switch
          checked={checked}
          onCheckedChange={(checked) => {
            handleChange(checked ? "true" : "false");
            handleActiveChange(checked);
          }}
        />
      </div>
    );
  }

  if (type === "select" || type === "dropdown") {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <Label className="shrink-0">{displayName}</Label>
          <Switch checked={!!isActive} onCheckedChange={handleActiveChange} />
        </div>
        {setting.description && (
          <p className="text-sm text-muted-foreground">{setting.description}</p>
        )}
        <Select value={strValue || undefined} onValueChange={handleChange}>
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (type === "number") {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <Label className="shrink-0">{displayName}</Label>
          <Switch checked={!!isActive} onCheckedChange={handleActiveChange} />
        </div>
        {setting.description && (
          <p className="text-sm text-muted-foreground">{setting.description}</p>
        )}
        <Input
          type="number"
          value={strValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={setting.default_value}
          className="max-w-xs"
        />
      </div>
    );
  }

  if (type === "date" || type === "datetime" || type === "time") {
    const inputType =
      type === "datetime"
        ? "datetime-local"
        : type === "time"
          ? "time"
          : "date";
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <Label className="shrink-0">{displayName}</Label>
          <Switch checked={!!isActive} onCheckedChange={handleActiveChange} />
        </div>
        {setting.description && (
          <p className="text-sm text-muted-foreground">{setting.description}</p>
        )}
        <Input
          type={inputType}
          value={strValue}
          onChange={(e) => handleChange(e.target.value)}
          className="max-w-xs"
        />
      </div>
    );
  }

  if (type === "color") {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <Label className="shrink-0">{displayName}</Label>
          <Switch checked={!!isActive} onCheckedChange={handleActiveChange} />
        </div>
        {setting.description && (
          <p className="text-sm text-muted-foreground">{setting.description}</p>
        )}
        <div className="flex items-center gap-2">
          <Input
            type="color"
            value={strValue || "#000000"}
            onChange={(e) => handleChange(e.target.value)}
            className="h-9 w-14 p-1 cursor-pointer"
          />
          <Input
            type="text"
            value={strValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="#hex"
            className="max-w-[8rem]"
          />
        </div>
      </div>
    );
  }

  if (type === "range") {
    const num = parseFloat(strValue) || 0;
    const min = options[0]?.value != null ? Number(options[0].value) : 0;
    const max = options[1]?.value != null ? Number(options[1].value) : 100;
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <Label className="shrink-0">{displayName}</Label>
          <Switch checked={!!isActive} onCheckedChange={handleActiveChange} />
        </div>
        {setting.description && (
          <p className="text-sm text-muted-foreground">{setting.description}</p>
        )}
        <div className="flex items-center gap-2">
          <Input
            type="range"
            min={min}
            max={max}
            value={num}
            onChange={(e) => handleChange(e.target.value)}
            className="max-w-xs"
          />
          <span className="text-sm tabular-nums">{num}</span>
        </div>
      </div>
    );
  }

  // input, email, url, password, default
  const inputType =
    type === "email"
      ? "email"
      : type === "url"
        ? "url"
        : type === "password"
          ? "password"
          : "text";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <Label className="shrink-0">{displayName}</Label>
        <Switch checked={!!isActive} onCheckedChange={handleActiveChange} />
      </div>
      {setting.description && (
        <p className="text-sm text-muted-foreground">{setting.description}</p>
      )}
      <Input
        type={inputType}
        value={strValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={setting.default_value}
        className="max-w-md"
      />
    </div>
  );
}

export default function SystemSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [savingGroup, setSavingGroup] = useState(null);
  const [settings, setSettings] = useState([]);
  const [groupFilter, setGroupFilter] = useState("");
  const [search, setSearch] = useState("");
  const [valuesById, setValuesById] = useState({});
  const [activeById, setActiveById] = useState({});

  const fetchSettings = useCallback(() => {
    setLoading(true);
    const params = { pageSize: 200 };
    if (groupFilter) params.group = groupFilter;
    if (search.trim()) params.search = search.trim();
    axiosInstance
      .get("/settings/system-settings", { params })
      .then((res) => {
        const list = res.data?.data ?? [];
        setSettings(list);
        const values = {};
        const active = {};
        list.forEach((s) => {
          values[s.id] = s.values ?? s.default_value ?? "";
          active[s.id] = s.is_active ?? true;
        });
        setValuesById(values);
        setActiveById(active);
      })
      .catch(() => {
        toast.error("Failed to load settings");
      })
      .finally(() => setLoading(false));
  }, [groupFilter, search]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleValueChange = (id, value) => {
    setValuesById((prev) => ({ ...prev, [id]: value }));
  };

  const handleActiveChange = (id, isActive) => {
    setActiveById((prev) => ({ ...prev, [id]: isActive }));
  };

  const saveGroup = (groupKey) => {
    const groupSettings = settings.filter((s) => (s.group || "general") === groupKey);
    if (!groupSettings.length) return;
    setSavingGroup(groupKey);
    const promises = groupSettings.map((s) =>
      axiosInstance.patch(`/settings/system-settings/${s.id}`, {
        values: String(valuesById[s.id] ?? s.values ?? ""),
        is_active: !!activeById[s.id],
      })
    );
    Promise.all(promises)
      .then(() => {
        toast.success(`Saved ${groupKey || "general"} settings`);
        fetchSettings();
      })
      .catch(() => {
        toast.error("Failed to save some settings");
      })
      .finally(() => setSavingGroup(null));
  };

  const groups = [...new Set(settings.map((s) => s.group || "general"))].sort();
  const grouped =
    groupFilter && !groups.includes(groupFilter)
      ? []
      : groups
          .filter((g) => !groupFilter || g === groupFilter)
          .map((groupKey) => ({
            key: groupKey,
            label: groupKey.charAt(0).toUpperCase() + groupKey.slice(1),
            items: settings
              .filter((s) => (s.group || "general") === groupKey)
              .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
          }));

  const breadcrumbData = [
    { name: "Settings", url: "/settings" },
    { name: "System Settings", url: "/settings/system-settings" },
  ];

  return (
    <>
      <BreadcrumbComponent data={breadcrumbData} />
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings2 className="h-6 w-6" />
              System Settings
            </h1>
            <p className="text-muted-foreground">
              Manage all system settings by group. Edit values and toggle active state, then save per group.
            </p>
          </div>
        </div>

        {!loading && (
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search settings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={groupFilter || "all"} onValueChange={(v) => setGroupFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All groups</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner className="h-8 w-8 text-primary" />
          </div>
        ) : grouped.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No settings found. Adjust filters or add settings from the backend.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {grouped.map(({ key: groupKey, label, items }) => (
              <Card key={groupKey}>
                <CardHeader>
                  <CardTitle>{label.replace("_", " ")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {items.map((setting) => (
                    <SettingControl
                      key={setting.id}
                      setting={setting}
                      value={valuesById[setting.id]}
                      isActive={activeById[setting.id]}
                      onValueChange={handleValueChange}
                      onActiveChange={handleActiveChange}
                    />
                  ))}
                  <Button
                    onClick={() => saveGroup(groupKey)}
                    disabled={savingGroup === groupKey}
                  >
                    {savingGroup === groupKey ? (
                      <>
                        <LoadingSpinner className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save " + label.replace("_", " ")
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
