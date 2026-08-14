"use client";

import { useState, useCallback } from "react";
import axiosInstance from "@/lib/axios";

const DEFAULT_OPTIONS = {
  maxSize: 16 * 1024 * 1024, // 16MB
  allowedTypes: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/3gpp",
    "video/quicktime",
    "audio/mpeg",
    "audio/ogg",
    "audio/amr",
    "audio/wav",
    "audio/mp4",
    "application/pdf",
    "text/plain",
  ],
};

const ALLOWED_TYPE_PREFIXES = ["image/", "video/", "audio/"];

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const formatFileSize = useCallback((bytes) => {
    if (bytes == null) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }, []);

  const validateFile = useCallback((file, opts = {}) => {
    const { maxSize = DEFAULT_OPTIONS.maxSize, allowedTypes = DEFAULT_OPTIONS.allowedTypes } = opts;
    const errors = [];
    if (!file || !file.name) {
      errors.push("No file selected");
      return { isValid: false, errors };
    }
    if (file.size > maxSize) {
      errors.push(`File size must be under ${formatFileSize(maxSize)}`);
    }
    const allowed =
      allowedTypes.includes(file.type) ||
      ALLOWED_TYPE_PREFIXES.some((p) => file.type && file.type.startsWith(p));
    if (!allowed) {
      errors.push(
        "File type not allowed. Use image, video, audio, or document (e.g. PDF)."
      );
    }
    return {
      isValid: errors.length === 0,
      errors: errors.length ? errors : null,
    };
  }, [formatFileSize]);

  const uploadFile = useCallback(async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    setIsUploading(true);
    try {
      const { data } = await axiosInstance.post("/whatsapp/upload-media", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (!data?.url) {
        throw new Error("Upload response missing url");
      }
      return { url: data.url, filename: data.filename };
    } finally {
      setIsUploading(false);
    }
  }, []);

  return {
    uploadFile,
    validateFile,
    formatFileSize,
    isUploading,
  };
}
