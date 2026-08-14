"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TextField, SelectField, RichTextArea } from "@/components/form-fields";
import { LoadingSpinner } from "@/helper/Loader";
import { toast } from "sonner";

const PAGE_TYPES = [
  { value: "privacy_policy", label: "Privacy Policy" },
  { value: "terms_conditions", label: "Terms & Conditions" },
  { value: "about_us", label: "About Us" },
  { value: "contact_us", label: "Contact Us" },
  { value: "faq", label: "FAQ" },
  { value: "other", label: "Other" },
];

export function PageFormDialog({ open, onClose, page, onSave }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      slug: "",
      content: "",
      type: "privacy_policy",
      is_active: true,
    },
  });

  const title = watch("title");

  useEffect(() => {
    if (page) {
      reset({
        title: page.title || "",
        slug: page.slug || "",
        content: page.content || "",
        type: page.type || "privacy_policy",
        is_active: page.is_active !== undefined ? String(page.is_active) : "true",
      });
    } else {
      reset({
        title: "",
        slug: "",
        content: "",
        type: "privacy_policy",
        is_active: "true",
      });
    }
  }, [page, reset, open]);

  // Auto-generate slug from title when title changes (only for new pages)
  useEffect(() => {
    if (!page && title) {
      const generatedSlug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
      reset({ ...watch(), slug: generatedSlug });
    }
  }, [title, page]);

  const onSubmit = async (data) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Convert is_active from string to boolean
      const submitData = {
        ...data,
        is_active: data.is_active === "true" || data.is_active === true,
      };
      await onSave(submitData, page?.id);
      toast.success(
        page ? "Page updated successfully" : "Page created successfully"
      );
      onClose();
      if (!page) {
        reset();
      }
    } catch (error) {
      toast.error(
        page ? "Failed to update page" : "Failed to create page"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        preventOutsideClose={true} 
        className="sm:max-w-[900px] max-w-[calc(100vw-2rem)] max-h-[95vh] flex flex-col"
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {page ? "Edit Page" : "Add New Page"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-1 -mr-1">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                label="Title"
                name="title"
                register={register}
                errors={errors}
                validation={{ required: "Title is required" }}
                placeholder="e.g., Privacy Policy"
              />

              <SelectField
                label="Type"
                name="type"
                control={control}
                errors={errors}
                options={PAGE_TYPES}
                validation={{ required: "Type is required" }}
              />
            </div>

            <TextField
              label="Slug"
              name="slug"
              register={register}
              errors={errors}
              validation={{ required: "Slug is required" }}
              placeholder="e.g., privacy-policy"
              helperText="URL-friendly identifier (auto-generated from title)"
            />

            <div className="space-y-2">
              <RichTextArea
                label="Content"
                name="content"
                control={control}
                errors={errors}
                validation={{ required: "Content is required" }}
                placeholder="Enter page content..."
                heightClass="min-h-[350px] max-h-[500px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="Status"
                name="is_active"
                control={control}
                errors={errors}
                options={[
                  { value: "true", label: "Active" },
                  { value: "false", label: "Inactive" },
                ]}
                validation={{ required: "Status is required" }}
              />
            </div>

            <DialogFooter className="flex-shrink-0 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <LoadingSpinner className="h-4 w-4 animate-spin" />
                    {page ? "Updating..." : "Creating..."}
                  </span>
                ) : page ? (
                  "Update Page"
                ) : (
                  "Create Page"
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

