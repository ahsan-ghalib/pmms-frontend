"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { MoreHorizontal, Edit, Trash, ShieldCheck, ShieldAlert, Power, PowerOff } from "lucide-react";
import Link from "next/link";

export const getDriversColumns = ({ onStatusChange, onVerificationChange, onDelete, t }) => [
  {
    accessorKey: "user.name",
    header: t("Driver", { defaultMessage: "Driver" }),
    cell: ({ row }) => {
      const driver = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={driver.user?.avatar} alt={driver.user?.name} />
            <AvatarFallback>{driver.user?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{driver.user?.name}</span>
            <span className="text-xs text-muted-foreground">{driver.driver_type || "Standard"}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "user.email",
    header: t("Contact", { defaultMessage: "Contact" }),
    cell: ({ row }) => {
      const user = row.original.user;
      return (
        <div className="flex flex-col">
          <span className="text-sm">{user?.email}</span>
          <span className="text-xs text-muted-foreground">{user?.phone}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "active_status",
    header: t("Status", { defaultMessage: "Status" }),
    cell: ({ row }) => {
      const status = row.getValue("active_status");
      return (
        <Badge variant={status === "active" ? "success" : "secondary"}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "verified",
    header: t("Verification", { defaultMessage: "Verification" }),
    cell: ({ row }) => {
      const verified = row.getValue("verified");
      return (
        <Badge variant={verified ? "success" : "destructive"}>
          {verified ? t("Verified", { defaultMessage: "Verified" }) : t("Unverified", { defaultMessage: "Unverified" })}
        </Badge>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: t("Registered_On", { defaultMessage: "Registered On" }),
    cell: ({ row }) => new Date(row.getValue("created_at")).toLocaleDateString(),
  },
  {
    id: "actions",
    header: t("Actions", { defaultMessage: "Actions" }),
    cell: ({ row }) => {
      const driver = row.original;
      const isActive = driver.active_status === "active";
      const isVerified = driver.verified;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/drivers/${driver.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => onStatusChange(driver.id, isActive ? 'inactive' : 'active')}>
              {isActive ? (
                <><PowerOff className="mr-2 h-4 w-4" /> Mark Inactive</>
              ) : (
                <><Power className="mr-2 h-4 w-4" /> Mark Active</>
              )}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => onVerificationChange(driver.id, !isVerified)}>
              {isVerified ? (
                <><ShieldAlert className="mr-2 h-4 w-4" /> Mark Unverified</>
              ) : (
                <><ShieldCheck className="mr-2 h-4 w-4" /> Mark Verified</>
              )}
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(driver.id)}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
