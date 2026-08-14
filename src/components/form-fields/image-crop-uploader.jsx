"use client";

import React, { useState, useCallback, useRef, useMemo } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, ZoomIn, ZoomOut, RotateCcw, Check, X } from "lucide-react";
import { getImageDimensions } from "@/config/image-dimensions";

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0) => {
  const image = await createImage(imageSrc);

  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d");

  if (!croppedCtx) {
    return null;
  }

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  croppedCtx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // If rotation is needed, rotate the cropped image
  if (rotation === 0) {
    return new Promise((resolve) => {
      croppedCanvas.toBlob(resolve, "image/jpeg", 0.9);
    });
  }

  // Apply rotation to the cropped image
  const rotatedCanvas = document.createElement("canvas");
  const rotatedCtx = rotatedCanvas.getContext("2d");

  if (!rotatedCtx) {
    return new Promise((resolve) => {
      croppedCanvas.toBlob(resolve, "image/jpeg", 0.9);
    });
  }

  const rotRad = (rotation * Math.PI) / 180;
  const { width: rotatedWidth, height: rotatedHeight } = rotateSize(
    pixelCrop.width,
    pixelCrop.height,
    rotation
  );

  rotatedCanvas.width = rotatedWidth;
  rotatedCanvas.height = rotatedHeight;

  rotatedCtx.translate(rotatedWidth / 2, rotatedHeight / 2);
  rotatedCtx.rotate(rotRad);
  rotatedCtx.drawImage(
    croppedCanvas,
    -pixelCrop.width / 2,
    -pixelCrop.height / 2
  );

  return new Promise((resolve) => {
    rotatedCanvas.toBlob(resolve, "image/jpeg", 0.9);
  });
};

const rotateSize = (width, height, rotation) => {
  const rotRad = (rotation * Math.PI) / 180;
  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
};

const ImageCropUploader = ({
  onImageCropped,
  dimensionKey = null,
  cropWidth = 1080,
  cropHeight = 1080,
  aspectRatio = null,
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  acceptedTypes = ["image/jpeg", "image/png", "image/webp"],
  className = "",
  disabled = false,
  placeholder = "Click to upload an image or drag and drop",
}) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  const dimensions = useMemo(() => {
    if (dimensionKey) {
      const configDimensions = getImageDimensions(dimensionKey);
      return {
        width: configDimensions.width,
        height: configDimensions.height,
        aspectRatio: configDimensions.aspectRatio,
      };
    }
    return {
      width: cropWidth,
      height: cropHeight,
      aspectRatio: aspectRatio,
    };
  }, [dimensionKey, cropWidth, cropHeight, aspectRatio]);

  const finalAspectRatio =
    dimensions.aspectRatio || dimensions.width / dimensions.height;

  const handleFileSelect = useCallback(
    (file) => {
      if (!file) return;

      if (!acceptedTypes.includes(file.type)) {
        setError(
          `Please select a valid image file (${acceptedTypes.join(", ")})`
        );
        return;
      }

      if (file.size > maxFileSize) {
        setError(
          `File size must be less than ${Math.round(
            maxFileSize / (1024 * 1024)
          )}MB`
        );
        return;
      }

      setError("");
      setIsUploading(true);

      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result?.toString() || null);
        setIsCropping(true);
        setIsUploading(false);
      });
      reader.addEventListener("error", () => {
        setError("Failed to read the image file. Please try again.");
        setIsUploading(false);
      });
      reader.readAsDataURL(file);
    },
    [acceptedTypes, maxFileSize]
  );

  const handleFileChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropConfirm = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setIsUploading(true);
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation
      );

      if (croppedImage && onImageCropped) {
        const file = new File([croppedImage], "cropped-image.jpg", {
          type: "image/jpeg",
        });

        const reader = new FileReader();
        reader.onload = () => {
          onImageCropped({
            blob: croppedImage,
            file: file,
            base64: reader.result,
            width: dimensions.width,
            height: dimensions.height,
          });
        };
        reader.readAsDataURL(croppedImage);
      }

      setIsCropping(false);
      setImageSrc(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setCroppedAreaPixels(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error cropping image:", error);
      setError("Failed to crop image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }, [imageSrc, croppedAreaPixels, rotation, onImageCropped, dimensions]);

  const handleCropCancel = useCallback(() => {
    setIsCropping(false);
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 1));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  return (
    <>
      <Card
        className={`${className} p-1   ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}>
        <CardContent className="p-6">
          <div
            className={`
              border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg p-6 text-center cursor-pointer
              transition-colors hover:border-gray-400 dark:hover:border-slate-500 hover:bg-gray-50 dark:bg-slate-800 dark:hover:bg-slate-800/50
              ${
                disabled
                  ? "cursor-not-allowed hover:border-gray-300 dark:hover:border-slate-700 hover:bg-transparent"
                  : ""
              }
              ${error ? "border-red-300 dark:border-red-500/50 bg-red-50 dark:bg-red-900/20" : ""}
            `}
            onClick={() => !disabled && fileInputRef.current?.click()}
            onDrop={!disabled ? handleDrop : undefined}
            onDragOver={!disabled ? handleDragOver : undefined}>
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedTypes.join(",")}
              onChange={handleFileChange}
              className="hidden"
              disabled={disabled}
            />

            <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-500 mb-4" />

            <p className="text-sm text-gray-600 dark:text-slate-300 mb-2">
              {isUploading ? "Processing..." : placeholder}
            </p>

            <p className="text-xs text-gray-400 dark:text-slate-500">
              Supported formats: {acceptedTypes.join(", ")} • Max size:{" "}
              {Math.round(maxFileSize / (1024 * 1024))}MB
              <br />
              Final size: {dimensions.width} × {dimensions.height}px
            </p>

            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={isCropping}
        onOpenChange={() => !isUploading && handleCropCancel()}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Crop Your Image</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative h-96 bg-gray-100 dark:bg-slate-900 rounded-lg overflow-hidden">
              {imageSrc && (
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  rotation={rotation}
                  zoom={zoom}
                  aspect={finalAspectRatio}
                  onCropChange={setCrop}
                  onRotationChange={setRotation}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              )}
            </div>

            <div className="flex items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= 1}>
                  <ZoomOut className="h-4 w-4" />
                </Button>

                <span className="text-sm text-gray-600 dark:text-slate-300 min-w-16 text-center">
                  {Math.round(zoom * 100)}%
                </span>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRotate}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Rotate
              </Button>
            </div>

            <div className="text-center text-sm text-gray-600 dark:text-slate-300">
              <p>
                Drag to reposition • Scroll to zoom • Final size:{" "}
                {dimensions.width} × {dimensions.height}px
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCropCancel}
              disabled={isUploading}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCropConfirm}
              disabled={isUploading || !croppedAreaPixels}>
              {isUploading ? (
                <>Processing...</>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Crop & Save
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageCropUploader;
