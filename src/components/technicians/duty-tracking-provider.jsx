"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Roles, normalizeRole } from "@/lib/permissions/role-access";
import { useDutyTracking } from "@/hooks/use-duty-tracking";
import { techniciansApi } from "@/services/technicians/technicians-api";

export default function DutyTrackingProvider({ children }) {
  const { data: session } = useSession();
  const role = normalizeRole(session?.user?.role);
  const isTechnician = role === Roles.TECHNICIAN;
  const { duty, setDuty } = useDutyTracking({ enabled: isTechnician });
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isTechnician && duty && !duty.privacy_notice_accepted) {
      setOnboardingOpen(true);
    }
  }, [isTechnician, duty]);

  const acknowledge = async () => {
    setBusy(true);
    try {
      const next = await techniciansApi.acceptPrivacy();
      setDuty(next);
      setOnboardingOpen(false);
    } catch {
      toast.error("Unable to save the location privacy acknowledgement.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {children}
      <Dialog open={onboardingOpen} onOpenChange={() => {}}>
        <DialogContent className="rounded-3xl" showCloseButton={false} preventOutsideClose>
          <DialogHeader>
            <DialogTitle>Location tracking notice</DialogTitle>
          </DialogHeader>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {duty?.privacy_notice || "While Duty is ON, the app records your location at a regular interval so supervisors can see on-duty technicians on the live map. Tracking stops when you turn Duty OFF, log out, or revoke location permission."}
          </p>
          <DialogFooter>
            <Button disabled={busy} className="bg-violet-600 hover:bg-violet-700" onClick={acknowledge}>
              I understand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
