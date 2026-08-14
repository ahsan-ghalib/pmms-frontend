import UnderMaintenance from "@/components/common/under-maintenance";

export default function NotFound() {
  return (
    <UnderMaintenance
      variant="not-found"
      title="404 - Page Not Found"
      description="This page doesn't exist. Use the buttons below to go back or return to the dashboard."
      showStats={false}
      showProgressBar={false}
    />
  );
}
