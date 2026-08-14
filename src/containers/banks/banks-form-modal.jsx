import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/helper/Loader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function BanksFormModal({
  dialogOpen,
  setDialogOpen,
  editingItem,
  name,
  setName,
  nameAr,
  setNameAr,
  isActive,
  setIsActive,
  saving,
  handleSave,
  handleAutoTranslate,
}) {
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingItem ? "Edit Bank" : "Add Bank"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Name</label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              onBlur={(e) => handleAutoTranslate(e.target.value, 'en', 'ar', nameAr, setNameAr)}
              placeholder="Enter bank name" 
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Name (Arabic)</label>
            <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="Enter bank name (arabic)" />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Checkbox id="is_active_bank" checked={isActive} onCheckedChange={(checked) => setIsActive(checked)} />
            <label htmlFor="is_active_bank" className="text-sm font-medium cursor-pointer">Active</label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <LoadingSpinner className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
