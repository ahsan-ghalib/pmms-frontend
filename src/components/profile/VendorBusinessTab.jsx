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

export default function VendorBusinessTab({ vendor }) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    commercial_registration_number: "",
    is_vat_registered: false,
    vat_number: "",
    bank_id: "",
    iban_number: "",
    account_title: "",
    account_number: "",
  });

  useEffect(() => {
    if (vendor) {
      setFormData({
        commercial_registration_number: vendor.commercial_details?.commercial_registration_number || "",
        is_vat_registered: vendor.commercial_details?.is_vat_registered || false,
        vat_number: vendor.commercial_details?.vat_number || "",
        bank_id: vendor.bank_details?.bank_id || "",
        iban_number: vendor.bank_details?.iban_number || "",
        account_title: vendor.bank_details?.account_title || "",
        account_number: vendor.bank_details?.account_number || "",
      });
    }
  }, [vendor]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleToggle = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const payload = {
        commercial_registration_number: formData.commercial_registration_number,
        is_vat_registered: formData.is_vat_registered ? 1 : 0,
        vat_number: formData.vat_number,
        bank_id: formData.bank_id,
        iban_number: formData.iban_number,
        account_title: formData.account_title,
        account_number: formData.account_number,
      };

      const res = await axiosInstance.post("/vendor/profile/business-information", payload);
      toast.success(res.data.message || "Business information updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update business information");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6">
        <CardHeader>
          <CardTitle>Commercial Details</CardTitle>
          <CardDescription>Update your commercial registration and VAT information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Commercial Registration Number</Label>
            <Input name="commercial_registration_number" value={formData.commercial_registration_number} onChange={handleChange} />
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Switch checked={formData.is_vat_registered} onCheckedChange={(val) => handleToggle("is_vat_registered", val)} />
            <Label>Is VAT Registered?</Label>
          </div>

          {formData.is_vat_registered && (
            <div className="space-y-2">
              <Label>VAT Number</Label>
              <Input name="vat_number" value={formData.vat_number} onChange={handleChange} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6">
        <CardHeader>
          <CardTitle>Bank Details</CardTitle>
          <CardDescription>Update your banking information for payouts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bank</Label>
              <UniversalComboBoxInput
                apiEndpoint="/settings/banks"
                searchParam="name"
                valueKey="id"
                labelKey="name"
                value={formData.bank_id}
                onChange={(val) => handleSelectChange("bank_id", val)}
                placeholder="Select bank"
              />
            </div>

            <div className="space-y-2">
              <Label>IBAN Number</Label>
              <Input name="iban_number" value={formData.iban_number} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label>Account Title</Label>
              <Input name="account_title" value={formData.account_title} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input name="account_number" value={formData.account_number} onChange={handleChange} />
            </div>
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
