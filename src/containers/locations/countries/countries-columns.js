"use client";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { hasPermissionSync, Permissions } from "@/lib/permissions";

export const countriesColumns = (onEdit, onDelete) => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 p-0 hover:bg-transparent"
      >
        Country
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  { accessorKey: "code", header: "Code" },
  { accessorKey: "phone_code", header: "Phone Code" },
  {
    id: "actions",
    cell: ({ row }) => {
      const country = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 text-secondary hover:text-secondary"
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {hasPermissionSync(Permissions.EDIT_COUNTRIES) && (
              <DropdownMenuItem onClick={() => onEdit(country)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Country
              </DropdownMenuItem>
            )}
            {hasPermissionSync(Permissions.DELETE_COUNTRIES) && (
              <>
                {hasPermissionSync(Permissions.EDIT_COUNTRIES) && (
                  <DropdownMenuSeparator />
                )}
                <DropdownMenuItem
                  onClick={() => onDelete(country)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Country
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
