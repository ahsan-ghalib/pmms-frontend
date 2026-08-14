"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Loader2,
  Upload,
  User,
  Mail,
  Phone,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import { usersApi } from "@/services/users/users-api";

const userSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .regex(/^03\d{9}$/, "Phone must start with 03 and be 11 digits"),
  password: z
    .union([
      z.literal(""),
      z.string().min(6, "Password must be at least 6 characters"),
    ])
    .optional(),
  role: z.string().min(1, "Please select a role"),
  isActive: z.boolean().default(true),
});

export default function UserForm({ userId = null, mode = "create" }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "user",
      isActive: true,
    },
  });

  const watchedRole = watch("role");
  const watchedName = watch("name");

  // Load available roles from API
  useEffect(() => {
    let cancelled = false;
    async function fetchRoles() {
      setRolesLoading(true);
      try {
        const response = await usersApi.getAvailableRoles();
        const list = response?.data?.roles ?? response?.roles ?? [];
        if (!cancelled) setRoles(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setRoles([]);
      } finally {
        if (!cancelled) setRolesLoading(false);
      }
    }
    fetchRoles();
    return () => {
      cancelled = true;
    };
  }, []);

  // Default role when roles load in create mode
  useEffect(() => {
    if (rolesLoading || roles.length === 0 || mode !== "create") return;
    const roleNames = roles.map((r) => r.name);
    const current = watch("role");
    if (current && roleNames.includes(current)) return;
    setValue("role", roles[0]?.name || "");
  }, [roles, rolesLoading, mode]);

  // Load user data for edit mode
  useEffect(() => {
    if (mode === "edit" && userId) {
      loadUserData();
    }
  }, [userId, mode]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const response = await usersApi.getUserById(userId);
      const userData = response.data;

      reset({
        name: userData.name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        role: userData.role?.name || "user",
        isActive: userData.isActive ?? true,
      });

      setAvatarUrl(userData.avatar || "");
    } catch (error) {
      console.error("Error loading user:", error);
      toast.error("Failed to load user data");
      router.push("/users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    try {
      setIsUploading(true);
      const response = await usersApi.uploadAvatar(file);
      setAvatarUrl(response.url);
      toast.success("Avatar uploaded successfully");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);

      const userData = {
        ...data,
        avatar: avatarUrl || null,
      };

      // Remove password if empty in edit mode
      if (mode === "edit" && !data.password) {
        delete userData.password;
      }

      let response;
      if (mode === "create") {
        response = await usersApi.createUser(userData);
        toast.success("User created successfully");
      } else {
        response = await usersApi.updateUser(userId, userData);
        toast.success("User updated successfully");
      }

      router.push("/users");
    } catch (error) {
      console.error("Error saving user:", error);

      // Handle validation errors
      if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors;
        Object.keys(validationErrors).forEach((field) => {
          toast.error(validationErrors[field][0]);
        });
      } else if (error.response?.status === 400) {
        toast.error(error.response.data.message || "Invalid data provided");
      } else {
        toast.error(`Failed to ${mode} user`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "U"
    );
  };

  if (isLoading && mode === "edit") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {mode === "create" ? "Create New User" : "Edit User"}
        </h1>
        <p className="text-muted-foreground">
          {mode === "create"
            ? "Add a new user to the system with appropriate role and permissions"
            : "Update user information and settings"}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Avatar Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Picture
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl} alt={watchedName} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {getInitials(watchedName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <Label htmlFor="avatar" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {isUploading ? "Uploading..." : "Upload Avatar"}
                  </div>
                </Label>
                <input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG or GIF. Max size 5MB.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Enter full name"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="Enter email address"
                  className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="03001234567"
                  className={`pl-10 ${errors.phone ? "border-red-500" : ""}`}
                />
              </div>
              {errors.phone && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password">
                Password{" "}
                {mode === "create" ? "*" : "(leave blank to keep current)"}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder={
                    mode === "create" ? "Enter password" : "Enter new password"
                  }
                  className={errors.password ? "border-red-500" : ""}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Role and Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Role & Permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="role">User Role *</Label>
              <Select
                value={watchedRole}
                onValueChange={(value) => setValue("role", value)}
                disabled={rolesLoading}>
                <SelectTrigger className={errors.role ? "border-red-500" : ""}>
                  <SelectValue
                    placeholder={
                      rolesLoading ? "Loading roles..." : "Select a role"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.name}>
                      {r.display_name || r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.role.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isActive">Account Status</Label>
                <p className="text-sm text-muted-foreground">
                  Enable or disable user account access
                </p>
              </div>
              <Switch
                id="isActive"
                checked={watch("isActive")}
                onCheckedChange={(checked) => setValue("isActive", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/users")}
            disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create User" : "Update User"}
          </Button>
        </div>
      </form>
    </div>
  );
}
