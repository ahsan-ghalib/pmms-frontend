import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreVertical, PenSquare, Trash2 } from "lucide-react";

export const getEmployeesColumns = (onEdit, onDelete, t) => [
  {
    accessorKey: "name",
    header: t("Name", { defaultMessage: "Name" }),
  },
  {
    accessorKey: "email",
    header: t("Email", { defaultMessage: "Email" }),
  },
  {
    accessorKey: "designation",
    header: t("Designation", { defaultMessage: "Designation" }),
  },
  {
    accessorKey: "store_name",
    header: t("Store", { defaultMessage: "Store" }),
  },
  {
    accessorKey: "is_active",
    header: t("Status", { defaultMessage: "Status" }),
    cell: ({ row }) => (
      <Badge variant={row.original.is_active ? "success" : "secondary"}>
        {row.original.is_active ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    accessorKey: "created_at",
    header: t("Joined_On", { defaultMessage: "Joined On" }),
    cell: ({ row }) => (
      <span className="text-muted-foreground whitespace-nowrap">
        {format(new Date(row.original.created_at), "MMM dd, yyyy")}
      </span>
    ),
  },
  {
    id: "actions",
    header: t("Actions", { defaultMessage: "Actions" }),
    cell: ({ row }) => {
      const employee = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">{t("Open_menu", { defaultMessage: "Open menu" })}</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem onClick={() => onEdit(employee)}>
              <PenSquare className="mr-2 h-4 w-4" />
              Edit Employee
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(employee)}
              className="text-red-600 focus:bg-red-50 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
