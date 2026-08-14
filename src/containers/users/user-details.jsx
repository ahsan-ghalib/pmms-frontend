"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Shield, 
  Calendar, 
  CheckCircle, 
  XCircle,
  User,
  Clock,
  Loader2
} from "lucide-react";
import { usersApi } from "@/services/users/users-api";
import { formatDistanceToNow, format } from "date-fns";
import { DeleteDialogBox } from "@/components/common/delete-dialog-box";
import { hasPermissionSync, Permissions } from "@/lib/permissions";

export default function UserDetails({ userId }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletePopupOpen, setDeletePopupOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const response = await usersApi.getUserById(userId);
      setUser(response.data);
    } catch (error) {
      console.error("Error loading user:", error);
      toast.error("Failed to load user details");
      router.push("/users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/users/edit/${userId}`);
  };

  const handleDelete = () => {
    setDeletePopupOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      await usersApi.deleteUser(userId);
      toast.success("User deleted successfully");
      router.push("/users");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    } finally {
      setIsDeleting(false);
      setDeletePopupOpen(false);
    }
  };

  const getRoleBadgeVariant = (roleName) => {
    switch (roleName) {
      case "super-admin":
        return "destructive";
      case "admin":
        return "default";
      case "user":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getInitials = (name) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">User not found</p>
        <Button onClick={() => router.push("/users")} className="mt-4">
          Back to Users
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/users")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
          <div>
            <h1 className="text-2xl font-bold">User Details</h1>
            <p className="text-muted-foreground">
              View and manage user information
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasPermissionSync(Permissions.EDIT_USERS) && (
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit User
            </Button>
          )}
          {hasPermissionSync(Permissions.DELETE_USERS) && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete User
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <Avatar className="h-24 w-24 mx-auto mb-4">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-xl">{user.name}</CardTitle>
            <div className="flex justify-center">
              {user.role ? (
                <Badge variant={getRoleBadgeVariant(user.role.name)} className="gap-1">
                  <Shield className="h-3 w-3" />
                  {user.role.display_name || user.role.name}
                </Badge>
              ) : (
                <Badge variant="outline">
                  <User className="h-3 w-3 mr-1" />
                  No Role
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              {user.isActive ? (
                <Badge variant="success" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  Inactive
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Verified</span>
              {user.isVerified ? (
                <Badge variant="success">Verified</Badge>
              ) : (
                <Badge variant="outline">Unverified</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </div>
                  <p className="text-sm">{user.email}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </div>
                  <p className="text-sm">{user.phone}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    Created At
                  </div>
                  <p className="text-sm">
                    {user.created_at ? format(new Date(user.created_at), "PPP") : "N/A"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user.created_at ? formatDistanceToNow(new Date(user.created_at), { addSuffix: true }) : ""}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                    <Clock className="h-4 w-4" />
                    Last Updated
                  </div>
                  <p className="text-sm">
                    {user.updated_at ? format(new Date(user.updated_at), "PPP") : "Never"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user.updated_at ? formatDistanceToNow(new Date(user.updated_at), { addSuffix: true }) : ""}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Account Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">User ID:</span> {user.id}
                </div>
                <div>
                  <span className="font-medium">Email Verified:</span>{" "}
                  {user.emailVerifiedAt ? (
                    <span className="text-green-600">
                      {format(new Date(user.emailVerifiedAt), "PPP")}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Not verified</span>
                  )}
                </div>
              </div>
            </div>

            {user.role && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Role Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Role Name:</span>
                      <Badge variant={getRoleBadgeVariant(user.role.name)}>
                        {user.role.display_name || user.role.name}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.role.name === "super-admin" && "Full system access with all permissions"}
                      {user.role.name === "admin" && "Administrative access to manage users and content"}
                      {user.role.name === "user" && "Standard user access with limited permissions"}
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <DeleteDialogBox
        open={deletePopupOpen}
        onClose={() => setDeletePopupOpen(false)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="Delete User"
        description={`Are you sure you want to delete "${user.name}"? This action cannot be undone and will permanently remove all user data.`}
      />
    </div>
  );
}