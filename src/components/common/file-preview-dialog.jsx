"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  RefreshCcw,
  Download,
  ExternalLink,
  FileWarning,
} from "lucide-react";
import {
  canPreviewFile,
  getFileType,
  generateDownloadFileName,
  formatFileNameForDisplay,
} from "@/helper/previewHelper";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

const FilePreviewDialog = ({
  open,
  onClose,
  fileUrl,
  fileName = "Preview",
  downloadFileName,
}) => {
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!open) {
      setRotation(0);
      setZoom(1);
    }
  }, [open]);

  const fileType = useMemo(() => getFileType(fileUrl), [fileUrl]);
  const previewable = canPreviewFile(fileUrl);
  const displayName = formatFileNameForDisplay(fileName, 40);
  const urlExtension = useMemo(() => {
    if (!fileUrl) return "";
    const clean = fileUrl.split("?")[0].split("#")[0];
    return clean.split(".").pop() || "";
  }, [fileUrl]);
  const downloadName =
    downloadFileName ||
    generateDownloadFileName(fileName.replace(/\s+/g, "-"), Date.now(), urlExtension);

  const handleRotate = (direction) => {
    setRotation((prev) => prev + (direction === "left" ? -90 : 90));
  };

  const handleZoom = (direction) => {
    setZoom((prev) => {
      const next =
        direction === "in" ? prev + ZOOM_STEP : Math.max(MIN_ZOOM, prev - ZOOM_STEP);
      return Math.min(MAX_ZOOM, next);
    });
  };

  const handleReset = () => {
    setRotation(0);
    setZoom(1);
  };

  const handleDownload = () => {
    if (!fileUrl) return;
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = downloadName || fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenNewTab = () => {
    if (!fileUrl) return;
    window.open(fileUrl, "_blank", "noopener,noreferrer");
  };

  const renderPreview = () => {
    if (!fileUrl || !previewable) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <FileWarning className="h-10 w-10 mb-4" />
          <p>Preview not available for this file type.</p>
          {fileUrl && (
            <Button variant="outline" size="sm" className="mt-4" onClick={handleOpenNewTab}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open File
            </Button>
          )}
        </div>
      );
    }

    if (fileType === "pdf") {
      return (
        <iframe
          src={fileUrl}
          title={displayName}
          className="w-full h-[55vh] sm:h-[70vh] rounded-lg border"
        />
      );
    }

    return (
      <div className="flex items-center justify-center min-h-[50vh] sm:min-h-[60vh]">
        <img
          src={fileUrl}
          alt={displayName}
          className="max-h-[60vh] sm:max-h-[75vh] max-w-full object-contain"
          style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
        />
      </div>
    );
  };

  const handleDialogChange = (nextOpen) => {
    if (!nextOpen && onClose) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="w-[95vw] max-w-5xl sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>{displayName}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2 border rounded-lg p-3 bg-muted/30">
          <span className="text-sm font-medium text-muted-foreground mr-auto">
            File Type: {fileType.toUpperCase()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRotate("left")}
            disabled={fileType !== "image"}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRotate("right")}
            disabled={fileType !== "image"}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleZoom("out")}
            disabled={fileType !== "image"}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleZoom("in")}
            disabled={fileType !== "image"}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={fileType !== "image"}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleOpenNewTab}>
            <ExternalLink className="h-4 w-4 mr-2" />
            New Tab
          </Button>
          <Button size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>

        {renderPreview()}
      </DialogContent>
    </Dialog>
  );
};

export default FilePreviewDialog;

