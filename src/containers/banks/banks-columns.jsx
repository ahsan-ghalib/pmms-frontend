import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

export const columns = ({ onEdit, onDelete, t }) => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: t("Name", { defaultMessage: "Name" }),
    cell: ({ row }) => <div className="text-sm font-medium">{row.original.name}</div>,
  },
  {
    accessorKey: "name_ar",
    header: t("name_ar") || "Name (Arabic)",
    cell: ({ row }) => <div className="text-sm font-medium">{row.original.name_ar}</div>,
  },
  {
    accessorKey: "is_active",
    header: t("Active", { defaultMessage: "Active" }),
    cell: ({ row }) => (
      <div className="text-sm font-medium">{row.original.is_active ? "Yes" : "No"}</div>
    ),
  },
  {
    id: "actions",
    header: () => <div className="text-right w-[120px]">{t("Actions", { defaultMessage: "Actions" })}</div>,
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="flex justify-end gap-2 w-[120px]">
          <Button variant="outline" size="icon" onClick={() => onEdit(item)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDelete(item)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];
