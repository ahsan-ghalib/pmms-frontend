"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import ComplaintOverview from "./components/ComplaintOverview";
import ComplaintItemsList from "./components/ComplaintItemsList";
import ComplaintStatusHistory from "./components/ComplaintStatusHistory";
import AdminUpdateForm from "./components/AdminUpdateForm";
import DisputeManagementPanel from "./components/DisputeManagementPanel";

export default function ComplaintDetails() {
  const t = useTranslations("common");
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchComplaint = async () => {
    try {
      const res = await axiosInstance.get(`/complaints/${id}`);
      setComplaint(res.data?.data ?? res.data);
    } catch (error) {
      toast.error(t("failed_to_load_complaint") || "Failed to load complaint details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchComplaint();
    }
  }, [id]);

  // Polling for chat messages if chat is active
  useEffect(() => {
    if (!complaint || complaint.chat_closed_at) return;
    
    const interval = setInterval(() => {
      fetchComplaint();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [complaint]);

  const handleUpdateComplaint = async (data) => {
    try {
      await axiosInstance.put(`/complaints/${id}`, data);
      toast.success(t("complaint_updated") || "Complaint updated successfully");
      fetchComplaint();
    } catch (error) {
      toast.error(t("failed_to_update") || "Failed to update complaint");
    }
  };

  const handleSendMessage = async (message) => {
    try {
      await axiosInstance.post(`/complaints/${id}/chat`, { message });
      fetchComplaint();
    } catch (error) {
      toast.error(t("failed_to_send_message") || "Failed to send message");
    }
  };

  const handleWorkflowAction = async (action) => {
    try {
      await axiosInstance.post(`/complaints/${id}/workflow`, { action });
      toast.success(t("workflow_updated") || "Workflow updated successfully");
      fetchComplaint();
    } catch (error) {
      toast.error(t("failed_to_update_workflow") || "Failed to update workflow");
    }
  };

  const handleFinalDecision = async (data) => {
    try {
      await axiosInstance.post(`/complaints/${id}/decision`, data);
      toast.success(t("decision_submitted") || "Final decision submitted successfully");
      fetchComplaint();
    } catch (error) {
      toast.error(t("failed_to_submit_decision") || "Failed to submit final decision");
    }
  };

  if (loading) {
    return <div className="p-8 text-center">{t("loading") || "Loading..."}</div>;
  }

  if (!complaint) {
    return <div className="p-8 text-center text-red-500">{t("complaint_not_found") || "Complaint not found"}</div>;
  }

  const breadcrumbData = [
    { name: t("complaints") || "Complaints", url: "/complaints" },
    { name: `#${id}`, url: `/complaints/${id}` },
  ];

  return (
    <>
      <BreadcrumbComponent data={breadcrumbData} />
      
      <div className="flex items-center gap-4 my-4">
        <Button variant="outline" size="icon" onClick={() => router.push("/complaints")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{t("complaint_details") || "Complaint Details"}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ComplaintOverview complaint={complaint} />
          
          <DisputeManagementPanel 
            complaint={complaint}
            onSendMessage={handleSendMessage}
            onWorkflowAction={handleWorkflowAction}
            onFinalDecision={handleFinalDecision}
          />

          <ComplaintItemsList items={complaint.items} />
          <ComplaintStatusHistory logs={complaint.statusLogs} />
        </div>

        <div className="lg:col-span-1">
          <AdminUpdateForm complaint={complaint} onUpdate={handleUpdateComplaint} />
        </div>
      </div>
    </>
  );
}
