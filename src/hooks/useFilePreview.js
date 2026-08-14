"use client";
import { useState } from "react";

/**
 * Custom hook for managing file preview modal state
 * @returns {Object} - Object containing preview state and handlers
 */
export const useFilePreview = () => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState({
    url: null,
    name: "Document",
    downloadName: null,
  });

  /**
   * Open preview modal with file details
   * @param {string} fileUrl - URL of the file to preview
   * @param {string} fileName - Display name of the file (optional)
   * @param {string} downloadFileName - Name for downloaded file (optional)
   */
  const openPreview = (
    fileUrl,
    fileName = "Document",
    downloadFileName = null
  ) => {
    if (!fileUrl) {
      console.warn("No file URL provided to preview");
      return;
    }

    setPreviewFile({
      url: fileUrl,
      name: fileName,
      downloadName: downloadFileName,
    });
    setIsPreviewOpen(true);
  };

  /**
   * Close preview modal and reset state
   */
  const closePreview = () => {
    setIsPreviewOpen(false);
    setPreviewFile({
      url: null,
      name: "Document",
      downloadName: null,
    });
  };

  /**
   * Generate preview props for FilePreviewModal component
   * @returns {Object} - Props object for FilePreviewModal
   */
  const getPreviewProps = () => ({
    open: isPreviewOpen,
    onClose: closePreview,
    fileUrl: previewFile.url,
    fileName: previewFile.name,
    downloadFileName: previewFile.downloadName,
  });

  return {
    isPreviewOpen,
    previewFile,
    openPreview,
    closePreview,
    getPreviewProps,
  };
};

export default useFilePreview;
