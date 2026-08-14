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

export const statesColumns = (onEdit, onDelete) => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 p-0 hover:bg-transparent"
      >
        State
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  { accessorKey: "country.name", header: "Country" },
  {
    id: "actions",
    cell: ({ row }) => {
      const state = row.original;
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
            {hasPermissionSync(Permissions.EDIT_STATES) && (
              <DropdownMenuItem onClick={() => onEdit(state)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit State
              </DropdownMenuItem>
            )}
            {hasPermissionSync(Permissions.DELETE_STATES) && (
              <>
                {hasPermissionSync(Permissions.EDIT_STATES) && (
                  <DropdownMenuSeparator />
                )}
                <DropdownMenuItem
                  onClick={() => onDelete(state)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete State
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
