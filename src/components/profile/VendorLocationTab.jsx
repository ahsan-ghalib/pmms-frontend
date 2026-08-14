import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { Loader2 } from "lucide-react";
import { UniversalComboBoxInput } from "@/components/form-fields/universal-combobox-field";

export default function VendorLocationTab({ vendor }) {
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    country_id: "",
    state_id: "",
    city_id: "",
    formatted_address: "",
    latitude: "",
    longitude: "",
  });

  useEffect(() => {
    if (vendor && vendor.location) {
      setFormData({
        country_id: vendor.location.country_id || "",
        state_id: vendor.location.state_id || "",
        city_id: vendor.location.city_id || "",
        formatted_address: vendor.location.formatted_address || "",
        latitude: vendor.location.latitude || "",
        longitude: vendor.location.longitude || "",
      });
    }
  }, [vendor]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCountryChange = (val) => {
    setFormData({ ...formData, country_id: val, state_id: "", city_id: "" });
  };

  const handleStateChange = (val) => {
    setFormData({ ...formData, state_id: val, city_id: "" });
  };

  const handleCityChange = (val) => {
    setFormData({ ...formData, city_id: val });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const payload = {
        country_id: formData.country_id,
        state_id: formData.state_id,
        city_id: formData.city_id,
        formatted_address: formData.formatted_address,
        latitude: formData.latitude,
        longitude: formData.longitude,
      };

      const res = await axiosInstance.post("/vendor/profile/location-information", payload);
      toast.success(res.data.message || "Location information updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update location information");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6">
        <CardHeader>
          <CardTitle>Location Details</CardTitle>
          <CardDescription>Update your store's address and map coordinates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Country</Label>
              <UniversalComboBoxInput
                apiEndpoint="/settings/countries"
                searchParam="name"
                valueKey="id"
                labelKey="name"
                value={formData.country_id}
                onChange={handleCountryChange}
                placeholder="Select country"
              />
            </div>

            <div className="space-y-2">
              <Label>State</Label>
              <UniversalComboBoxInput
                apiEndpoint="/settings/states"
                searchParam="name"
                params={{ country_id: formData.country_id }}
                valueKey="id"
                labelKey="name"
                value={formData.state_id}
                onChange={handleStateChange}
                placeholder="Select state"
                disabled={!formData.country_id}
              />
            </div>

            <div className="space-y-2">
              <Label>City</Label>
              <UniversalComboBoxInput
                apiEndpoint="/settings/cities"
                searchParam="name"
                params={{ state_id: formData.state_id }}
                valueKey="id"
                labelKey="name"
                value={formData.city_id}
                onChange={handleCityChange}
                placeholder="Select city"
                disabled={!formData.state_id}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Formatted Address</Label>
            <Input name="formatted_address" value={formData.formatted_address} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Latitude</Label>
              <Input name="latitude" value={formData.latitude} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Longitude</Label>
              <Input name="longitude" value={formData.longitude} onChange={handleChange} />
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
