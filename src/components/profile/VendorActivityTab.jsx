import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { Loader2 } from "lucide-react";
import { UniversalComboBoxInput } from "@/components/form-fields/universal-combobox-field";

export default function VendorActivityTab({ vendor }) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    store_name: "",
    account_type_id: "",
    activity_type_id: "",
    is_food_vendor: false,
    has_table_booking: false,
    terms_accepted: true,
  });

  useEffect(() => {
    if (vendor) {
      setFormData({
        store_name: vendor.store_name || vendor.name || "",
        account_type_id: vendor.account_type_id || "",
        activity_type_id: vendor.activity_type_id || "",
        is_food_vendor: vendor.is_food_vendor || false,
        has_table_booking: vendor.has_table_booking || false,
        terms_accepted: vendor.terms_accepted || true,
      });
    }
  }, [vendor]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleToggle = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const payload = {
        store_name: formData.store_name,
        account_type_id: formData.account_type_id,
        activity_type_id: formData.activity_type_id,
        is_food_vendor: formData.is_food_vendor ? 1 : 0,
        has_table_booking: formData.has_table_booking ? 1 : 0,
        terms_accepted: formData.terms_accepted ? 1 : 0,
      };

      const res = await axiosInstance.post("/vendor/profile/activity-information", payload);
      toast.success(res.data.message || "Activity information updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update activity information");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6">
        <CardHeader>
          <CardTitle>Activity Information</CardTitle>
          <CardDescription>Update your store's activity details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Store Name</Label>
            <Input name="store_name" value={formData.store_name} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Account Type</Label>
              <UniversalComboBoxInput
                apiEndpoint="/settings/account-types"
                searchParam="name"
                valueKey="id"
                labelKey="name"
                value={formData.account_type_id}
                onChange={(val) => handleSelectChange("account_type_id", val)}
                placeholder="Select account type"
              />
            </div>

            <div className="space-y-2">
              <Label>Activity Type</Label>
              <UniversalComboBoxInput
                apiEndpoint="/settings/activity-types"
                searchParam="name"
                valueKey="id"
                labelKey="name"
                value={formData.activity_type_id}
                onChange={(val) => handleSelectChange("activity_type_id", val)}
                placeholder="Select activity type"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Food Vendor</Label>
              <div className="text-sm text-muted-foreground">Is this a food or restaurant vendor?</div>
            </div>
            <Switch checked={formData.is_food_vendor} onCheckedChange={(val) => handleToggle("is_food_vendor", val)} />
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="space-y-0.5">
              <Label>Table Booking</Label>
              <div className="text-sm text-muted-foreground">Does this vendor allow table booking?</div>
            </div>
            <Switch checked={formData.has_table_booking} onCheckedChange={(val) => handleToggle("has_table_booking", val)} />
          </div>

          <Button onClick={handleSave} disabled={isLoading} className="mt-4">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
