import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function RouteProtection({ children }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session?.user?.role === "vendor") {
    // Both boolean false and 0 should be treated as incomplete
    if (!session?.user?.profile_completed) {
      redirect("/register/vendor/setup");
    }
    
    // Status checking
    if (session?.user?.vendor_status !== "approved") {
      redirect("/pending-verification");
    }
  }

  return <div>{children}</div>;
}
