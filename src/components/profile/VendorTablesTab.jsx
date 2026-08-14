import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { Loader2, Plus, Trash2, Edit2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

export default function VendorTablesTab() {
  const [tables, setTables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [formData, setFormData] = useState({
    table_name: "",
    capacity: 1,
    is_available: true,
  });

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get("/vendor/tables");
      setTables(res.data.data);
    } catch (error) {
      toast.error("Failed to fetch tables");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === "capacity" ? parseInt(value) : value });
  };

  const handleToggle = (val) => {
    setFormData({ ...formData, is_available: val });
  };

  const handleOpenDialog = (table = null) => {
    if (table) {
      setEditId(table.id);
      setFormData({
        table_name: table.table_name,
        capacity: table.capacity,
        is_available: table.is_available,
      });
    } else {
      setEditId(null);
      setFormData({
        table_name: "",
        capacity: 1,
        is_available: true,
      });
    }
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!formData.table_name || formData.capacity < 1) {
      toast.error("Please fill required fields properly.");
      return;
    }

    try {
      setIsSaving(true);
      if (editId) {
        await axiosInstance.put(`/vendor/tables/${editId}`, formData);
        toast.success("Table updated successfully");
      } else {
        await axiosInstance.post("/vendor/tables", formData);
        toast.success("Table created successfully");
      }
      setIsOpen(false);
      fetchTables();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save table");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this table?")) return;
    try {
      await axiosInstance.delete(`/vendor/tables/${id}`);
      toast.success("Table deleted successfully");
      fetchTables();
    } catch (error) {
      toast.error("Failed to delete table");
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Manage Tables</CardTitle>
          <CardDescription>Manage your store's table bookings</CardDescription>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" /> Add Table
        </Button>
      </CardHeader>
      <CardContent>
        {tables.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No tables added yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table Name/No</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.map((table) => (
                <TableRow key={table.id}>
                  <TableCell className="font-medium">{table.table_name}</TableCell>
                  <TableCell>{table.capacity} persons</TableCell>
                  <TableCell>
                    {table.is_available ? (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">Available</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">Unavailable</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(table)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(table.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Table" : "Add Table"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Table Name / Number</Label>
                <Input name="table_name" value={formData.table_name} onChange={handleChange} placeholder="e.g. Table 1, Window Seat" />
              </div>
              <div className="space-y-2">
                <Label>Capacity (Persons)</Label>
                <Input name="capacity" type="number" min="1" value={formData.capacity} onChange={handleChange} />
              </div>
              <div className="flex items-center justify-between mt-4">
                <Label>Is Available?</Label>
                <Switch checked={formData.is_available} onCheckedChange={handleToggle} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
