"use client";

import { useMemo, useState } from "react";
import { ZoomIn, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { canPreviewFile, getFileType } from "@/helper/previewHelper";

/**
 * Thumbnail image component that triggers a preview callback when clicked.
 */
const PreviewableImage = ({
  src,
  alt = "Preview image",
  fallbackSrc = "/images/brand.png",
  imgClassName = "w-12 h-12 rounded object-cover border",
  triggerClassName = "",
  previewTitle,
  rounded = true,
  onPreview,
  downloadFileName,
}) => {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);

  const isPreviewable = useMemo(
    () => canPreviewFile(src || fallbackSrc),
    [src, fallbackSrc]
  );

  const fileType = useMemo(
    () => getFileType(src || fallbackSrc),
    [src, fallbackSrc]
  );

  const handleClick = () => {
    if (!onPreview || !isPreviewable) return;
    onPreview(currentSrc || fallbackSrc, previewTitle || alt, downloadFileName);
  };

  const handleError = () => {
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
  };

  const buttonClasses = cn(
    "group relative inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
    isPreviewable && onPreview ? "cursor-zoom-in" : "cursor-default",
    triggerClassName,
    fileType === "pdf" && cn("items-center justify-center bg-muted", imgClassName, rounded && "rounded")
  );

  const overlayClasses =
    "absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white text-[11px] font-medium rounded";

  return (
    <button type="button" onClick={handleClick} className={buttonClasses}>
      {fileType === "pdf" ? (
        <FileText className="h-1/2 w-1/2 text-muted-foreground opacity-50" />
      ) : (
        <img
          src={currentSrc || fallbackSrc}
          alt={alt}
          className={cn(imgClassName, rounded && "rounded")}
          onError={handleError}
        />
      )}
      {isPreviewable && onPreview && (
        <div className={overlayClasses}>
          <ZoomIn className="h-4 w-4 mr-1" />
          Preview
        </div>
      )}
    </button>
  );
};

export default PreviewableImage;

