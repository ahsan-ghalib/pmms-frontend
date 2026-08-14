import { Badge } from "@/components/ui/badge";

export const getAddressesColumns = (t) => [
  {
    accessorKey: "user.name",
    header: t("user") || "User",
    cell: ({ row }) => {
      const user = row.original.user;
      return user ? user.name : "N/A";
    },
  },
  {
    accessorKey: "full_name",
    header: t("contact_name") || "Contact Name",
  },
  {
    accessorKey: "phone",
    header: t("phone") || "Phone",
    cell: ({ row }) => {
      const { dial_code, phone } = row.original;
      return dial_code && phone ? `${dial_code}${phone}` : phone || "N/A";
    }
  },
  {
    accessorKey: "city.name",
    header: t("city") || "City",
    cell: ({ row }) => {
      const city = row.original.city;
      return city ? city.name : "N/A";
    },
  },
  {
    accessorKey: "address",
    header: t("address") || "Address",
    cell: ({ row }) => {
      const address = row.original.address;
      return <span className="line-clamp-2 max-w-[200px]" title={address}>{address}</span>;
    },
  },
  {
    accessorKey: "address_type",
    header: t("address_type") || "Type",
    cell: ({ row }) => {
      const type = row.getValue("address_type");
      return type ? <span className="capitalize">{type}</span> : "N/A";
    }
  },
  {
    accessorKey: "is_default",
    header: t("default") || "Default",
    cell: ({ row }) => (
      <Badge variant={row.getValue("is_default") ? "success" : "secondary"}>
        {row.getValue("is_default") ? "Yes" : "No"}
      </Badge>
    ),
  },
];
