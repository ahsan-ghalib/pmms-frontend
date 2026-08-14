"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  Shield, 
  ShieldCheck, 
  User,
  Mail,
  Phone,
  LogIn
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { hasPermissionSync, Permissions } from "@/lib/permissions";

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

const getRoleIcon = (roleName) => {
  switch (roleName) {
    case "super-admin":
      return <ShieldCheck className="h-3 w-3" />;
    case "admin":
      return <Shield className="h-3 w-3" />;
    case "user":
      return <User className="h-3 w-3" />;
    default:
      return <User className="h-3 w-3" />;
  }
};

export const usersColumns = (
  t,
  handleEdit,
  handleDelete,
  handleViewDetails,
  handleToggleStatus,
  currentUserId,
  handleLoginAs
) => [
  {
    accessorKey: "avatar",
    header: "",
    cell: ({ row }) => {
      const user = row.original;
      const initials = user.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "U";

      return (
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
      );
    },
  },
  {
    accessorKey: "name",
    header: t("Admin_User", { defaultMessage: "User" }),
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex flex-col">
          <div className="font-medium">{user.name}</div>
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Mail className="h-3 w-3" />
            {user.email}
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {user.phone}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: t("Admin_Role", { defaultMessage: "Role" }),
    cell: ({ row }) => {
      const user = row.original;
      const role = user.role;
      
      if (!role) {
        return (
          <Badge variant="outline">
            <User className="h-3 w-3 mr-1" />
            No Role
          </Badge>
        );
      }

      return (
        <Badge variant={getRoleBadgeVariant(role.name)} className="gap-1">
          {getRoleIcon(role.name)}
          {role.display_name || role.name}
        </Badge>
      );
    },
  },
  {
    accessorKey: "isActive",
    header: t("Admin_Status", { defaultMessage: "Status" }),
    cell: ({ row }) => {
      const user = row.original;
      const canEdit = hasPermissionSync(Permissions.EDIT_USERS);
      
      return (
        <div className="flex items-center space-x-2">
          <Switch
            checked={user.isActive}
            onCheckedChange={(checked) => handleToggleStatus(user, checked)}
            size="sm"
            disabled={!canEdit}
          />
          <span className="text-sm">
            {user.isActive ? (
              <Badge variant="success">Active</Badge>
            ) : (
              <Badge variant="secondary">Inactive</Badge>
            )}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "isVerified",
    header: t("Verified", { defaultMessage: "Verified" }),
    cell: ({ row }) => {
      const user = row.original;
      return user.isVerified ? (
        <Badge variant="success">{t("Verified", { defaultMessage: "Verified" })}</Badge>
      ) : (
        <Badge variant="outline">{t("Unverified", { defaultMessage: "Unverified" })}</Badge>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: t("Created", { defaultMessage: "Created" }),
    cell: ({ row }) => {
      const user = row.original;
      if (!user.created_at) return "N/A";
      
      try {
        return (
          <div className="text-sm">
            {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
          </div>
        );
      } catch (error) {
        return "Invalid date";
      }
    },
  },
  {
    id: "actions",
    header: t("Actions", { defaultMessage: "Actions" }),
    cell: ({ row }) => {
      const user = row.original;
      const isSuperAdmin = user.role?.name === "super-admin";
      const isSelf = currentUserId && user.id === currentUserId;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">{t("Open_menu", { defaultMessage: "Open menu" })}</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t("Admin_Actions", { defaultMessage: "Actions" })}</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(user.id.toString())}
            >
              Copy user ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {hasPermissionSync(Permissions.LOGIN_AS_USER) && !isSelf && typeof handleLoginAs === "function" && (
              <DropdownMenuItem onClick={() => handleLoginAs(user)}>
                <LogIn className="mr-2 h-4 w-4" />
                Login as user
              </DropdownMenuItem>
            )}
            {hasPermissionSync(Permissions.SHOW_USERS) && (
              <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                <Eye className="mr-2 h-4 w-4" />
                View details
              </DropdownMenuItem>
            )}
            {hasPermissionSync(Permissions.EDIT_USERS) && !isSuperAdmin && !isSelf && (
              <DropdownMenuItem onClick={() => handleEdit(user)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit user
              </DropdownMenuItem>
            )}
            {hasPermissionSync(Permissions.DELETE_USERS) && !isSuperAdmin && !isSelf && (
              <>
                {(hasPermissionSync(Permissions.SHOW_USERS) || hasPermissionSync(Permissions.EDIT_USERS)) && (
                  <DropdownMenuSeparator />
                )}
                <DropdownMenuItem
                  onClick={() => handleDelete(user)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete user
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];