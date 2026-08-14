"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LoadingSpinner } from "@/helper/Loader";

export function DeleteDialogBox({
  open,
  onClose,
  onConfirm,
  isLoading = false,
  title = "Are you absolutely sure?",
  description = "",
  confirmText = "Delete",
  cancelText = "Cancel",
}) {
  const isDeleting = isLoading;

  const handleConfirm = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    onConfirm?.();
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(val) => {
        if (!isLoading) onClose?.(val);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner className="h-4 w-4 animate-spin text-white" />
                Deleting...
              </span>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
          <AlertDialogCancel onClick={onClose} disabled={isDeleting}>
            {cancelText}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
